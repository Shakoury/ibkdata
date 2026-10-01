"""
Wallet ViewSet and Webhook API views
File: wallet/views.py
"""
import json
import logging
from decimal import Decimal
from django.conf import settings
from django.db import transaction as db_transaction
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Wallet, WalletTransaction
from .serializers import WalletSerializer
from .paystack import PaystackService
from core.permissions import IsOwner
from users.models import User

logger = logging.getLogger(__name__)


class WalletViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    ViewSet for viewing wallets.
    Write operations are strictly disabled to prevent unauthorized balance manipulation.
    """
    serializer_class = WalletSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Wallet.objects.filter(user=self.request.user)
        return Wallet.objects.none()

    @action(detail=False, methods=['get'], url_path='me')
    def my_wallet(self, request):
        """
        Retrieve the current user's wallet and virtual account details.
        Accessed via: GET /api/wallets/me/
        """
        wallet, created = Wallet.objects.get_or_create(user=request.user)

        # Provision reserved account if not yet assigned
        if not wallet.account_number:
            PaystackService.get_or_create_reserved_account(wallet)
            wallet.refresh_from_db()

        serializer = self.get_serializer(wallet)
        return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # Must remain public for Paystack servers to access it
def paystack_webhook_receiver(request):
    """
    Validates Paystack's HMAC SHA512 signature, then credits the user's wallet
    when money lands in their dedicated virtual account. Idempotent per reference.
    """
    payload = request.body  # read raw body BEFORE touching request.data
    signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE')

    if not signature:
        logger.warning("Webhook rejected: missing x-paystack-signature")
        return HttpResponse(status=401)

    if not PaystackService.verify_webhook_signature(payload, signature):
        logger.warning("Webhook rejected: signature mismatch")
        return HttpResponse(status=401)

    try:
        event_data = json.loads(payload)
    except ValueError:
        return HttpResponse(status=400)

    event = event_data.get('event')
    data = event_data.get('data') or {}

    # Account was assigned asynchronously
    if event == 'dedicatedaccount.assign.success':
        PaystackService.save_assigned_account(data)
        return HttpResponse(status=200)

    if event != 'charge.success':
        return HttpResponse(status=200)

    reference = data.get('reference', '')
    authorization = data.get('authorization') or {}
    customer_email = (data.get('customer') or {}).get('email')

    # Log the first real payloads you receive so you can confirm these fields
    logger.info(f"Paystack charge.success | ref={reference} channel={data.get('channel')}")

    # Find the wallet: by the virtual account number first, then by email
    account_number = authorization.get('receiver_bank_account_number')
    wallet = None
    if account_number:
        wallet = Wallet.objects.filter(account_number=account_number).first()
    if wallet is None and data.get('channel') == 'dedicated_nuban' and customer_email:
        wallet = Wallet.objects.filter(user__email__iexact=customer_email).first()

    if wallet is None:
        logger.warning(f"Webhook ignored: no wallet matched | Ref: {reference}")
        return HttpResponse(status=200)

    # Confirm with Paystack before moving money
    verified = PaystackService.verify_transaction(reference)
    if verified is None:
        return HttpResponse(status=500)  # Paystack will retry later
    if verified.get('status') != 'success' or verified.get('currency') != 'NGN':
        logger.warning(f"Webhook ignored: verify not successful | Ref: {reference}")
        return HttpResponse(status=200)

    amount_naira = Decimal(str(verified.get('amount', 0))) / Decimal('100')  # kobo -> naira
    if amount_naira <= 0:
        return HttpResponse(status=200)

    try:
        with db_transaction.atomic():
            locked = Wallet.objects.select_for_update().get(pk=wallet.pk)

            # Idempotency: Paystack may deliver the same event more than once
            if WalletTransaction.objects.filter(reference=reference).exists():
                return HttpResponse(status=200)

            locked.credit(
                amount=amount_naira,
                description=f"Paystack Bank Transfer - Ref: {reference}",
                reference=reference,
            )
        logger.info(f"Wallet credited N{amount_naira} for {wallet.user.email} | Ref: {reference}")

    except ValueError as e:
        # e.g. max wallet balance exceeded - retrying will never fix it
        logger.error(f"Could not credit wallet | Ref: {reference} | {e}")
        return HttpResponse(status=200)
    except Exception as e:
        logger.error(f"Error crediting wallet: {e}", exc_info=True)
        return HttpResponse(status=500)

    return HttpResponse(status=200)
