"""
Celery background tasks for VTU and bill payments
File: services/tasks.py
"""
import logging
from celery import shared_task
from django.db import transaction as db_transaction
from services.transaction_service import TransactionService
from transactions.models import Transaction

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=15  # Seconds to wait before retrying on transport/network exceptions
)
def process_vtu_transaction_task(self, transaction_id):
    """
    Background task to process a VTU purchase.
    This runs entirely out of the web request thread, preventing timeouts.
    """
    logger.info(f"Background worker picked up transaction task for ID: {transaction_id}")
    
    try:
        # We execute the process_transaction method we refactored earlier
        TransactionService.process_transaction(transaction_id)
        
    except Exception as exc:
        logger.error(f"Error processing transaction task {transaction_id}: {str(exc)}")
        
        # Check if the transaction is still stuck in PROCESSING status.
        # If it failed due to a temporary network transport error, we retry the celery task.
        try:
            transaction = Transaction.objects.get(id=transaction_id)
            if transaction.status == 'PROCESSING':
                # Retry the task up to 3 times
                raise self.retry(exc=exc)
        except Transaction.DoesNotExist:
            pass
            
        raise exc