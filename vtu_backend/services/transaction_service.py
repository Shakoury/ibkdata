"""
Transaction processing service
File: transactions/services.py
"""
import uuid
import hashlib
import logging
from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone
from django.conf import settings
from transactions.models import Transaction, TransactionStatusHistory
from services.models import Provider
from services.provider_service import ProviderService
from core.utils import normalize_nigerian_phone

logger = logging.getLogger(__name__)


class TransactionService:
    """Service for handling transaction processing"""

    @staticmethod
    def generate_reference():
        """Generate unique transaction reference"""
        return f"TXN-{uuid.uuid4().hex[:12].upper()}"

    @staticmethod
    @db_transaction.atomic
    def create_transaction(user, data):
        """
        Create and initiate transaction.
        Atomic block safely rolls back wallet locked balance if transaction creation fails.
        """
        # --- PIN VERIFICATION: must happen before any funds are locked ---
        if not user.has_pin or not user.transaction_pin:
            raise ValueError("No transaction PIN set. Please set a PIN first.")

        if user.is_pin_locked():
            remaining = int((user.pin_locked_until - timezone.now()).total_seconds() // 60) + 1
            raise ValueError(f"Too many failed PIN attempts. Try again in {remaining} minute(s).")

        pin = data.get('pin')
        if not pin:
            raise ValueError("Transaction PIN is required.")

        hashed_pin = hashlib.sha256(str(pin).encode()).hexdigest()
        if hashed_pin != user.transaction_pin:
            user.register_pin_failure()
            raise ValueError("Incorrect PIN.")

        user.register_pin_success()

        # Check if idempotency key exists to prevent double charge submissions
        idempotency_key = data.get('idempotency_key')
        if idempotency_key:
            existing = Transaction.objects.filter(
                idempotency_key=idempotency_key
            ).first()
            if existing:
                logger.info(f"Duplicate request with idempotency key: {idempotency_key}")
                return existing

        # Balance check is safely double-verified with locks inside lock_funds()
        amount = Decimal(str(data['amount']))

        # Lock funds in user wallet
        user.wallet.lock_funds(
            amount=amount,
            description=f"Lock for {data['type']} transaction"
        )

        # Normalize the phone number to local format (e.g., 0803...)
        # (Change to 'international' if your specific aggregator requires '234...')
        raw_phone = data['phone_number']
        normalized_phone = normalize_nigerian_phone(raw_phone, target_format='local')

        # Create transaction record with clean data
        transaction = Transaction.objects.create(
            user=user,
            type=data['type'],
            network=data.get('network', ''),
            amount=amount,
            phone_number=normalized_phone,
            reference=TransactionService.generate_reference(),
            idempotency_key=idempotency_key,
            metadata=data.get('metadata', {}),
            status='PENDING'
        )

        logger.info(f"Transaction created with normalized phone: {transaction.phone_number} | Ref: {transaction.reference}")
        return transaction

    @staticmethod
    def process_transaction(transaction_id):
        """
        Process transaction through provider.
        Optimized to keep DB locks extremely short and avoid holding DB connections open
        during slow external API requests.
        """
        # --- PHASE 1: Quick DB Lock & Set to PROCESSING ---
        try:
            with db_transaction.atomic():
                transaction = Transaction.objects.select_for_update().get(id=transaction_id)

                if transaction.status != 'PENDING':
                    logger.warning(
                        f"Transaction {transaction.reference} "
                        f"is not in PENDING status: {transaction.status}"
                    )
                    return transaction

                # Update status (locks released immediately after this block ends)
                transaction.update_status('PROCESSING')
        except Transaction.DoesNotExist:
            logger.error(f"Transaction not found: {transaction_id}")
            raise
        except Exception as e:
            logger.error(f"Error locking transaction {transaction_id} for processing: {str(e)}")
            raise

        # --- PHASE 2: External HTTP API Call (NO DB Transaction Active) ---
        provider_service = ProviderService()
        try:
            # Slow network call runs safely here without holding database locks hostage
            result = provider_service.process_transaction(transaction)
        except Exception as e:
            logger.error(f"External API failure on transaction {transaction_id}: {str(e)}")
            result = {
                'success': False,
                'message': f"Provider connection error: {str(e)}",
                'provider': None
            }

        # --- PHASE 3: Handle API Result & Process Wallet (Atomic Block) ---
        try:
            with db_transaction.atomic():
                # Re-fetch transaction and lock the row to finalize
                transaction = Transaction.objects.select_for_update().get(id=transaction_id)

                # Ensure it hasn't been processed by another thread
                if transaction.status != 'PROCESSING':
                    return transaction

                if result.get('provider'):
                    transaction.provider = result['provider']

                if result['success']:
                    transaction.provider_reference = result.get('provider_reference')
                    transaction.update_status('SUCCESS', result.get('message', 'Success'))

                    # Unlock and deduct wallet funds
                    transaction.user.wallet.unlock_funds(
                        amount=transaction.amount,
                        deduct=True,
                        description=f"Payment for {transaction.type} - {transaction.reference}"
                    )
                    logger.info(f"Transaction successful: {transaction.reference}")
                else:
                    transaction.update_status('FAILED', result.get('message', 'Failed'))

                    # Refund locked funds
                    transaction.user.wallet.unlock_funds(
                        amount=transaction.amount,
                        deduct=False,
                        description=f"Refund for failed {transaction.type} - {transaction.reference}"
                    )
                    logger.error(f"Transaction failed: {transaction.reference}")

                # Commit final updates
                transaction.save(update_fields=['provider', 'provider_reference'])
                return transaction

        except Exception as e:
            logger.error(f"Error finalizing transaction status for {transaction_id}: {str(e)}")
            # Fail-safe mechanism
            try:
                with db_transaction.atomic():
                    transaction = Transaction.objects.select_for_update().get(id=transaction_id)
                    if transaction.status == 'PROCESSING':
                        transaction.update_status('FAILED', f"System error during finalization: {str(e)}")
                        transaction.user.wallet.unlock_funds(
                            amount=transaction.amount,
                            deduct=False,
                            description=f"Refund for system error in {transaction.type} - {transaction.reference}"
                        )
            except Exception as rollback_err:
                logger.critical(f"FATAL: Wallet unlock failed during disaster recovery: {str(rollback_err)}")
            raise

    @staticmethod
    @db_transaction.atomic
    def retry_transaction(transaction_id, user=None):
        """
        Retry a failed transaction
        """
        transaction = Transaction.objects.select_for_update().get(id=transaction_id)

        if transaction.status != 'FAILED':
            raise ValueError("Only failed transactions can be retried")

        # Check retry limit
        max_retries = settings.VTU_SETTINGS['MAX_RETRY_ATTEMPTS']

        if transaction.retries >= max_retries:
            raise ValueError(f"Maximum retry attempts ({max_retries}) reached")

        # Increment retry count
        transaction.retries += 1
        transaction.save(update_fields=['retries'])

        # update_status automatically writes to status history safely
        transaction.update_status('PENDING', 'Manual retry', changed_by=user)

        logger.info(f"Transaction retry initiated: {transaction.reference}")

        # Lock funds again
        transaction.user.wallet.lock_funds(
            amount=transaction.amount,
            description=f"Lock for retry of {transaction.type} transaction"
        )

        return transaction

    @staticmethod
    @db_transaction.atomic
    def refund_transaction(transaction_id, reason, user=None):
        """
        Refund a successful transaction
        """
        transaction = Transaction.objects.select_for_update().get(id=transaction_id)

        if transaction.status != 'SUCCESS':
            raise ValueError("Only successful transactions can be refunded")

        # Credit wallet
        transaction.user.wallet.credit(
            amount=transaction.amount,
            description=f"Refund for {transaction.type} - {transaction.reference}"
        )

        # update_status automatically writes to status history safely
        transaction.update_status('REFUNDED', reason, changed_by=user)

        logger.info(f"Transaction refunded: {transaction.reference}")
        return transaction
