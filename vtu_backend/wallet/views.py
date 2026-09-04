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

from .models import Wallet
from .serializers import WalletSerializer
from .monnify import MonnifyService
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
            MonnifyService.get_or_create_reserved_account(wallet)
            wallet.refresh_from_db()

        serializer = self.get_serializer(wallet)
        return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([])  # Must remain public for Monnify servers to access it
def monnify_webhook_receiver(request):
    """
    Secure webhook receiver that validates Monnify's HMAC SHA512 signature
    and automatically credits the user's wallet on successful transfer.
    """
    payload = request.body
    signature = request.META.get('HTTP_MONNIFY_SIGNATURE')

    if not signature:
        logger.warning("Webhook rejected: Missing HTTP_MONNIFY_SIGNATURE")
        return HttpResponse(status=401)

    # Verify signature is genuinely from Monnify
    if not MonnifyService.verify_webhook_signature(payload, signature):
        logger.warning("Webhook rejected: Signature mismatch")
        return HttpResponse(status=401)

    event_data = json.loads(payload)
    event_type = event_data.get('eventType')

    if event_type == 'SUCCESSFUL_TRANSACTION':
        data = event_data.get('eventData', {})

        # Only process reserved account (virtual account) transfers
        if data.get('paymentSourceInformation') or data.get('product', {}).get('type') == 'RESERVED_ACCOUNT':
            customer_email = data.get('customer', {}).get('email')
            amount_naira = Decimal(str(data.get('amountPaid', 0)))
            reference = data.get('transactionReference', '')

            if not customer_email or amount_naira <= 0:
                logger.warning(f"Webhook ignored: Invalid email or amount | Ref: {reference}")
                return HttpResponse(status=200)

            try:
                with db_transaction.atomic():
                    user = User.objects.get(email=customer_email)
                    user.wallet.credit(
                        amount=amount_naira,
                        description=f"Monnify Bank Transfer - Ref: {reference}"
                    )
                logger.info(f"Wallet credited ₦{amount_naira} for {customer_email} | Ref: {reference}")

            except User.DoesNotExist:
                logger.error(f"No user found for email: {customer_email}")
                return HttpResponse(status=200)  # Return 200 so Monnify stops retrying
            except Exception as e:
                logger.error(f"Error crediting wallet: {str(e)}")
                return HttpResponse(status=500)

    return HttpResponse(status=200)