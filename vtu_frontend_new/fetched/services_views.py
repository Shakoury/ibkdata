"""
Services views for payment processing, automated bank transfers, platform monitoring, and catalog queries
File: services/views.py
"""
import uuid
import requests
import json
import hashlib
import hmac
import logging
from decimal import Decimal
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.db import transaction as db_transaction
from django.db.models import Sum  # Added for dashboard stats calculations
from rest_framework import status  # Added for HTTP response codes
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import WalletFunding, ElectricityProvider, CableTVProvider, CableTVPackage, DataPlan, Provider
from .provider_service import ProviderService  # Added to access validation logic
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

logger = logging.getLogger(__name__)


@extend_schema(
    summary="Initialize Wallet Funding via Paystack",
    description="Generates a Paystack checkout transaction URL for standard wallet funding.",
    request=OpenApiTypes.OBJECT,
    responses={200: OpenApiTypes.OBJECT},
    tags=["Payments"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    amount = request.data.get("amount")
    if not amount:
        return Response({"error": "Amount is required"}, status=400)

    try:
        # Use Decimal instead of float to avoid IEEE 754 floating-point rounding errors
        amount = Decimal(str(amount))
    except (ValueError, TypeError):
        return Response({"error": "Invalid amount"}, status=400)

    # Paystack expects amounts in kobo (multiplied by 100)
    paystack_amount = int(amount * 100)
    
    reference = uuid.uuid4().hex[:20]

    WalletFunding.objects.create(
        user=request.user,
        amount=amount,
        reference=reference,
        status="pending"
    )

    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "email": request.user.email,
        "amount": paystack_amount,
        "reference": reference
    }

    url = "https://api.paystack.co/transaction/initialize"
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return Response(response.json())
    except requests.RequestException as e:
        logger.error(f"Failed to initialize Paystack payment: {str(e)}")
        return Response({"error": "Failed to initialize payment gateway"}, status=502)


@extend_schema(
    summary="Verify Wallet Funding",
    description="Queries Paystack to confirm payment success and securely credits the user's wallet.",
    parameters=[
        OpenApiParameter(name="reference", type=OpenApiTypes.STR, location=OpenApiParameter.PATH, description="The unique Paystack transaction reference to verify", required=True),
    ],
    responses={200: OpenApiTypes.OBJECT},
    tags=["Payments"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_payment(request, reference):
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        response_data = response.json()
    except requests.RequestException as e:
        logger.error(f"Paystack verification connection failed: {str(e)}")
        return Response({"error": "Failed to connect to payment gateway"}, status=502)

    # Secure verification
    if response_data.get("data") and response_data["data"]["status"] == "success":
        
        # Wrap in an atomic block and use select_for_update to block concurrent threads [1.2.2]
        with db_transaction.atomic():
            funding = WalletFunding.objects.select_for_update().filter(reference=reference).first()
            
            if not funding:
                return Response({"error": "Transaction record not found"}, status=404)
                
            if funding.status != "success":
                # SECURITY CHECK: Verify the actual paid amount matches expected amount [1.2.3]
                paystack_paid_amount = int(response_data["data"]["amount"]) # In kobo
                expected_amount_in_kobo = int(funding.amount * 100)
                
                if paystack_paid_amount != expected_amount_in_kobo:
                    logger.critical(
                        f"ALERT: Paystack amount mismatch on ref {reference}. "
                        f"Expected {expected_amount_in_kobo} kobo, got {paystack_paid_amount} kobo."
                    )
                    return Response({"error": "Fraud warning: Payment amount mismatch"}, status=400)
                
                # Mark funding record as success
                funding.status = "success"
                funding.save()

                # Credit user wallet using your audited, thread-safe, ledger-creating method!
                wallet = funding.user.wallet
                wallet.credit(
                    amount=funding.amount, 
                    description=f"Wallet funding via Paystack (Ref: {reference})"
                )

        return Response({"message": "Wallet funded successfully"})
        
    return Response({"error": "Payment not successful"}, status=400)


@extend_schema(exclude=True)  # Secure: Webhooks are internal and excluded from public API docs
@csrf_exempt
def paystack_webhook(request):
    """
    Unified webhook handler for Card checkouts and Automated Bank Transfers (Virtual Accounts) [1.2.1].
    """
    paystack_signature = request.headers.get('x-paystack-signature')
    computed_signature = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode(),
        request.body,
        hashlib.sha512
    ).hexdigest()

    if computed_signature != paystack_signature:
        return HttpResponse("Invalid signature", status=401)

    try:
        event = json.loads(request.body)
    except json.JSONDecodeError:
        return HttpResponse("Invalid JSON", status=400)

    # We process successful charge events
    if event.get("event") == "charge.success":
        reference = event["data"]["reference"]
        paystack_paid_amount = int(event["data"]["amount"])  # in kobo
        amount_decimal = Decimal(paystack_paid_amount) / Decimal('100.00')  # Secure Decimal division
        customer_email = event["data"]["customer"]["email"]

        # Secure concurrent handling inside webhook using select_for_update [1.2.2]
        with db_transaction.atomic():
            # 1. Attempt to locate a pre-created Card/Checkout record [1.2.2]
            funding = WalletFunding.objects.select_for_update().filter(reference=reference).first()
            
            if funding:
                # SCENARIO A: Standard Card Checkout Verification
                if funding.status != "success":
                    # SECURITY CHECK: Verify webhook amount matches database record [1.2.3]
                    expected_amount_in_kobo = int(funding.amount * 100)
                    
                    if paystack_paid_amount != expected_amount_in_kobo:
                        logger.critical(
                            f"ALERT: Webhook amount mismatch on card ref {reference}. "
                            f"Expected {expected_amount_in_kobo} kobo, got {paystack_paid_amount} kobo."
                        )
                        return HttpResponse("Amount mismatch", status=400)
                    
                    # Mark record as success
                    funding.status = "success"
                    funding.save()

                    # Credit wallet using the secure ledger method
                    wallet = funding.user.wallet
                    wallet.credit(
                        amount=funding.amount, 
                        description=f"Wallet funding via Paystack Webhook (Ref: {reference})"
                    )
            else:
                # SCENARIO B: Automated Bank Transfer to Dedicated Virtual Account
                # No pre-created WalletFunding record exists, so we create it dynamically on-the-fly [1.2.5].
                from users.models import User
                try:
                    user = User.objects.select_for_update().get(email=customer_email)
                except User.DoesNotExist:
                    logger.critical(
                        f"ALERT: Received bank transfer webhook, but user with email "
                        f"{customer_email} does not exist in our database."
                    )
                    return HttpResponse("User not found", status=404)

                # Create the WalletFunding record on the fly for audit history
                funding = WalletFunding.objects.create(
                    user=user,
                    amount=amount_decimal,
                    reference=reference,
                    status="success"
                )

                # Credit the user's wallet securely
                wallet = user.wallet
                wallet.credit(
                    amount=amount_decimal, 
                    description=f"Automated Bank Transfer Funding (Ref: {reference})"
                )
                logger.info(f"Wallet auto-funded successfully via Bank Transfer: {customer_email} - ₦{amount_decimal}")

    return HttpResponse(status=200)


@extend_schema(
    summary="List electricity providers",
    description="Returns all active electricity DISCOs with supported meter types",
    responses={200: OpenApiTypes.OBJECT},
    tags=["Service Catalog"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_electricity_providers(request):
    """Return list of all active electricity providers (DISCOs)"""
    providers = ElectricityProvider.objects.filter(is_active=True).values(
        'id', 'name', 'code', 'meter_types'
    )
    return Response(list(providers))


@extend_schema(
    summary="List Cable TV providers and packages",
    description="Returns DSTV, GOTV, Startimes with all active subscription packages",
    responses={200: OpenApiTypes.OBJECT},
    tags=["Service Catalog"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cable_tv_providers(request):
    """Return list of Cable TV providers with their packages"""
    providers = CableTVProvider.objects.filter(is_active=True).prefetch_related('packages')
    data = []
    for provider in providers:
        packages = provider.packages.filter(is_active=True).values(
            'id', 'name', 'code', 'amount'
        )
        data.append({
            'id': provider.id,
            'name': provider.name,
            'code': provider.code,
            'packages': list(packages)
        })
    return Response(data)


@extend_schema(
    summary="List data plans",
    description="Returns data plans, optionally filtered by network (MTN, GLO, AIRTEL, 9MOBILE)",
    parameters=[
        OpenApiParameter(
            name="network",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Filter by network: MTN, GLO, AIRTEL, 9MOBILE",
            required=False
        )
    ],
    responses={200: OpenApiTypes.OBJECT},
    tags=["Service Catalog"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_data_plans(request):
    """Return data plans, optionally filtered by network"""
    network = request.query_params.get('network')
    plans = DataPlan.objects.filter(is_active=True)
    if network:
        plans = plans.filter(network=network.upper())
    return Response(list(plans.values(
        'id', 'network', 'name', 'code',
        'data_volume', 'validity', 'amount'
    )))


@extend_schema(
    summary="Validate Meter or Cable Smartcard (IUC)",
    description="Pre-validates an electricity meter or cable IUC number and returns the customer's registered name.",
    parameters=[
        OpenApiParameter(name="type", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="CABLE_TV or ELECTRICITY", required=True),
        OpenApiParameter(name="code", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="DSTV, GOTV, IKEDC, EKEDC, etc.", required=True),
        OpenApiParameter(name="number", type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, description="The Meter or Smartcard number to validate", required=True),
    ],
    responses={200: OpenApiTypes.OBJECT},
    tags=["Service Catalog"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_customer_account_view(request):
    """
    Validate a customer utility account number before payment.
    """
    provider_type = request.query_params.get('type')
    provider_code = request.query_params.get('code')
    account_number = request.query_params.get('number')
    
    if not all([provider_type, provider_code, account_number]):
        return Response(
            {"error": "Missing required query parameters: type, code, number"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if provider_type.upper() not in ['CABLE_TV', 'ELECTRICITY']:
        return Response(
            {"error": "Invalid validation type. Must be CABLE_TV or ELECTRICITY"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Call the provider validation logic
    provider_service = ProviderService()
    result = provider_service.validate_customer_account(
        provider_type=provider_type.upper(),
        provider_code=provider_code.upper(),
        account_number=account_number
    )
    
    if result['success']:
        return Response({
            "status": "success",
            "customer_name": result['customer_name']
        }, status=status.HTTP_200_OK)
        
    return Response({
        "status": "failed",
        "message": result.get('message', 'Validation failed')
    }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Get active providers status",
    description="Returns the real-time health and response metrics of all active VTU providers.",
    responses={200: OpenApiTypes.OBJECT},
    tags=["Platform Monitoring"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def provider_status_view(request):
    """
    Returns the real-time online/offline status of platform providers.
    """
    # Pulls directly from the existing fields on our updated Provider model
    providers = Provider.objects.filter(is_active=True).values(
        'name', 'is_healthy', 'avg_response_time'
    )
    return Response(list(providers))


@extend_schema(
    summary="Get user dashboard statistics",
    description="Returns wallet balance, total spent, and counts of successful vs failed transactions for the user.",
    responses={200: OpenApiTypes.OBJECT},
    tags=["User Dashboard"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats_view(request):
    """
    Returns dashboard statistics for the logged-in user.
    """
    user = request.user
    wallet = user.wallet
    
    # Calculate lifetime success spending
    successful_txns = user.transactions.filter(status='SUCCESS')
    total_spent = successful_txns.aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
    
    # Calculate counts
    total_count = user.transactions.count()
    failed_count = user.transactions.filter(status='FAILED').count()
    success_count = successful_txns.count()
    
    return Response({
        "wallet_balance": wallet.balance,
        "total_spent": total_spent,
        "transaction_count": total_count,
        "successful_transactions": success_count,
        "failed_transactions": failed_count,
        "is_verified": user.is_verified
    })