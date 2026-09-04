"""
Services views - Monnify payment gateway, catalog queries, and platform monitoring
File: services/views.py
"""
import logging
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Sum, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import WalletFunding, ElectricityProvider, CableTVProvider, DataPlan, Provider
from .provider_service import ProviderService
from wallet.monnify import MonnifyService
from wallet.models import Wallet
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

logger = logging.getLogger(__name__)


@extend_schema(
    summary="Get or create virtual bank account for wallet funding",
    description="Returns the user dedicated Monnify virtual account for bank transfers.",
    responses={200: OpenApiTypes.OBJECT},
    tags=["Payments"]
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_virtual_account(request):
    wallet, _ = Wallet.objects.get_or_create(user=request.user)
    if not wallet.account_number:
        result = MonnifyService.get_or_create_reserved_account(wallet)
        if not result:
            return Response(
                {"error": "Could not provision virtual account. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY
            )
        wallet.refresh_from_db()
    return Response({
        "bank_name": wallet.bank_name,
        "account_number": wallet.account_number,
        "account_name": wallet.account_name,
        "currency": "NGN",
        "message": "Transfer any amount to this account to fund your wallet instantly."
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_electricity_providers(request):
    providers = ElectricityProvider.objects.filter(is_active=True).values(
        "id", "name", "code", "meter_types"
    )
    return Response(list(providers))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cable_tv_providers(request):
    providers = CableTVProvider.objects.filter(is_active=True).prefetch_related("packages")
    data = []
    for provider in providers:
        packages = provider.packages.filter(is_active=True).values("id", "name", "code", "amount")
        data.append({
            "id": provider.id,
            "name": provider.name,
            "code": provider.code,
            "packages": list(packages)
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_data_plans(request):
    network = request.query_params.get("network")
    plans = DataPlan.objects.filter(is_active=True)
    if network:
        plans = plans.filter(network=network.upper())
    return Response(list(plans.values("id", "network", "name", "code", "data_volume", "validity", "amount")))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def validate_customer_account_view(request):
    provider_type = request.query_params.get("type")
    provider_code = request.query_params.get("code")
    account_number = request.query_params.get("number")
    if not all([provider_type, provider_code, account_number]):
        return Response({"error": "Missing required query parameters: type, code, number"}, status=400)
    if provider_type.upper() not in ["CABLE_TV", "ELECTRICITY"]:
        return Response({"error": "Invalid type. Must be CABLE_TV or ELECTRICITY"}, status=400)
    result = ProviderService().validate_customer_account(
        provider_type=provider_type.upper(),
        provider_code=provider_code.upper(),
        account_number=account_number
    )
    if result["success"]:
        return Response({"status": "success", "customer_name": result["customer_name"]})
    return Response({"status": "failed", "message": result.get("message", "Validation failed")}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def provider_status_view(request):
    providers = Provider.objects.filter(is_active=True).values("name", "is_healthy", "avg_response_time")
    return Response(list(providers))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_stats_view(request):
    user = request.user
    wallet = user.wallet
    successful_txns = user.transactions.filter(status="SUCCESS")
    total_spent = successful_txns.aggregate(Sum("amount"))["amount__sum"] or Decimal("0.00")
    return Response({
        "wallet_balance": wallet.balance,
        "total_spent": total_spent,
        "transaction_count": user.transactions.count(),
        "successful_transactions": successful_txns.count(),
        "failed_transactions": user.transactions.filter(status="FAILED").count(),
        "is_verified": user.is_verified
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    from users.models import User
    from transactions.models import Transaction
    return Response({
        "total_users": User.objects.count(),
        "total_transactions": Transaction.objects.count(),
        "total_revenue": Transaction.objects.filter(status="SUCCESS").aggregate(Sum("amount"))["amount__sum"] or 0,
        "active_users": User.objects.filter(is_active=True).count(),
        "pending_fund_requests": WalletFunding.objects.filter(status="pending").count(),
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_daily_volume_view(request):
    from django.db.models.functions import TruncDate
    from transactions.models import Transaction
    stats = Transaction.objects.filter(status="SUCCESS").annotate(
        date=TruncDate("created_at")
    ).values("date").annotate(volume=Sum("amount"), count=Count("id")).order_by("-date")[:30]
    return Response(list(stats))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_wallet_adjust_view(request):
    from users.models import User
    user_id = request.data.get("user_id")
    amount = Decimal(str(request.data.get("amount", 0)))
    action = request.data.get("action")
    note = request.data.get("note", "Admin adjustment")
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    wallet = user.wallet
    if action == "credit":
        wallet.credit(amount, description=f"Admin credit: {note}")
    elif action == "debit":
        wallet.debit(amount, description=f"Admin debit: {note}")
    else:
        return Response({"error": "Invalid action"}, status=400)
    return Response({"message": "Wallet adjusted successfully"})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_list_fund_requests(request):
    status_filter = request.query_params.get("status", "pending")
    fundings = WalletFunding.objects.filter(status=status_filter).order_by("-created_at")
    return Response(list(fundings.values("id", "user", "amount", "reference", "status", "created_at")))


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_approve_fund_request(request, pk):
    try:
        funding = WalletFunding.objects.get(pk=pk, status="pending")
    except WalletFunding.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    with db_transaction.atomic():
        funding.status = "success"
        funding.save()
        funding.user.wallet.credit(funding.amount, description=f"Admin approved funding: {funding.reference}")
    return Response({"message": "Fund request approved"})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_reject_fund_request(request, pk):
    try:
        funding = WalletFunding.objects.get(pk=pk, status="pending")
    except WalletFunding.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    funding.status = "failed"
    funding.save()
    return Response({"message": "Fund request rejected"})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_list_services(request):
    return Response({
        "electricity": list(ElectricityProvider.objects.all().values("id", "name", "code", "is_active")),
        "cable_tv": list(CableTVProvider.objects.all().values("id", "name", "code", "is_active")),
        "data_plans": list(DataPlan.objects.all().values("id", "network", "name", "code", "amount", "is_active")),
    })


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def admin_update_service(request, service_type, pk):
    model_map = {"electricity": ElectricityProvider, "cable_tv": CableTVProvider, "data_plans": DataPlan}
    model = model_map.get(service_type)
    if not model:
        return Response({"error": "Invalid service type"}, status=400)
    try:
        obj = model.objects.get(pk=pk)
    except model.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    if "is_active" in request.data:
        obj.is_active = request.data["is_active"]
        obj.save()
    return Response({"message": "Service updated"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def user_submit_fund_request(request):
    """User submits a manual fund request after bank transfer."""
    amount = request.data.get("amount")
    phone = request.data.get("phone", "")
    reference = request.data.get("reference", "")

    if not amount:
        return Response({"error": "Amount is required"}, status=400)
    try:
        amount = Decimal(str(amount))
    except Exception:
        return Response({"error": "Invalid amount"}, status=400)

    from uuid import uuid4
    ref = reference or uuid4().hex[:16]

    funding = WalletFunding.objects.create(
        user=request.user,
        amount=amount,
        reference=ref,
        status="pending"
    )
    return Response({
        "message": "Fund request submitted. It will be reviewed shortly.",
        "reference": ref,
        "amount": str(amount),
        "status": "pending"
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_list_fund_requests(request):
    """List the current user fund requests."""
    page = int(request.query_params.get("page", 1))
    page_size = 20
    qs = WalletFunding.objects.filter(user=request.user).order_by("-created_at")
    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    results = list(qs[start:end].values("id", "amount", "reference", "status", "created_at"))
    return Response({
        "count": total,
        "next": None if end >= total else f"?page={page+1}",
        "previous": None if page <= 1 else f"?page={page-1}",
        "results": results
    })
