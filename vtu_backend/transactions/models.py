import uuid
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.utils import timezone
from users.models import User


class Transaction(models.Model):
    """Main transaction model with state machine"""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    TYPE_CHOICES = [
        ('AIRTIME', 'Airtime'),
        ('DATA', 'Data'),
        ('ELECTRICITY', 'Electricity'),
        ('CABLE_TV', 'Cable TV'),
    ]

    NETWORK_CHOICES = [
        ('MTN', 'MTN'),
        ('GLO', 'Glo'),
        ('AIRTEL', 'Airtel'),
        ('9MOBILE', '9Mobile'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='transactions'
    )

    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    network = models.CharField(
        max_length=20,
        choices=NETWORK_CHOICES,
        blank=True,
        null=True
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    phone_number = models.CharField(max_length=20)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )

    # Reference is unique and generated on save
    reference = models.CharField(max_length=100, unique=True, db_index=True, blank=True)
    
    # Removed uuid.uuid4 default so it remains Null until the aggregator responds
    provider_reference = models.CharField(
        max_length=100,
        blank=True,
        unique=True,
        null=True,
        db_index=True
    )
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        db_index=True
    )

    provider = models.ForeignKey(
        'services.Provider',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )

    metadata = models.JSONField(null=True, blank=True, default=dict)
    response_message = models.TextField(blank=True)
    retries = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['reference']),
            models.Index(fields=['provider_reference']),
        ]

    # Moved to the correct class (Transaction)
    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    # Moved to the correct class (Transaction)
    def __str__(self):
        return f"{self.reference} - {self.type} - {self.status}"

    def can_transition_to(self, new_status):
        valid_transitions = {
            'PENDING': ['PROCESSING', 'FAILED'],
            'PROCESSING': ['SUCCESS', 'FAILED'],
            'SUCCESS': ['REFUNDED'],
            'FAILED': ['PENDING'],
            'REFUNDED': [],
        }
        return new_status in valid_transitions.get(self.status, [])

    @transaction.atomic
    def update_status(self, new_status, response_message='', changed_by=None):
        """
        Updates the transaction status and automatically records the change in history.
        """
        if not self.can_transition_to(new_status):
            raise ValueError(
                f"Invalid status transition from {self.status} to {new_status}"
            )

        old_status = self.status
        self.status = new_status
        self.response_message = response_message

        if new_status == 'PROCESSING' and not self.processing_started_at:
            self.processing_started_at = timezone.now()

        if new_status in ['SUCCESS', 'FAILED', 'REFUNDED']:
            self.completed_at = timezone.now()

        # Save specific updated fields
        self.save(update_fields=[
            'status', 'response_message',
            'processing_started_at', 'completed_at', 'updated_at'
        ])

        # Automatically log transition to status history
        TransactionStatusHistory.objects.create(
            transaction=self,
            from_status=old_status,
            to_status=new_status,
            reason=response_message,
            changed_by=changed_by
        )

    @property
    def is_terminal(self):
        return self.status in ['SUCCESS', 'REFUNDED']

    @property
    def is_pending_or_processing(self):
        return self.status in ['PENDING', 'PROCESSING']

    @property
    def processing_time(self):
        if self.completed_at and self.processing_started_at:
            return (self.completed_at - self.processing_started_at).total_seconds()
        return None


class TransactionStatusHistory(models.Model):
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    reason = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transaction_status_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['transaction', '-created_at']),
        ]

    # Added safe string representation for the history records
    def __str__(self):
        return f"{self.transaction.reference}: {self.from_status} -> {self.to_status}"