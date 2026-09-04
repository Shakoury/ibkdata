"""
Wallet models for balance management
File: wallet/models.py
"""
from decimal import Decimal
from django.db import models, transaction
from django.core.validators import MinValueValidator
from django.conf import settings
from users.models import User


class Wallet(models.Model):
    """User wallet for storing balance"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='wallet'
    )
    balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    locked_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Amount locked for pending transactions"
    )
    currency = models.CharField(max_length=3, default='NGN')
    is_active = models.BooleanField(default=True)

    # Dedicated Virtual Account fields for Automated Bank Funding (Nigeria)
    bank_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Name of the assigned virtual bank (e.g., Wema Bank)"
    )
    account_number = models.CharField(
        max_length=30, 
        blank=True, 
        null=True, 
        help_text="Unique NUBAN account number allocated to this user"
    )
    account_name = models.CharField(
        max_length=150, 
        blank=True, 
        null=True, 
        help_text="Constructed virtual account name (e.g. VTU APP - JOHN DOE)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wallets'
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.balance}"
    
    @property
    def available_balance(self):
        """Calculate available balance (excluding locked amount)"""
        return self.balance - self.locked_balance
    
    @transaction.atomic
    def credit(self, amount, description="Credit"):
        """
        Credit wallet with atomic transaction
        Uses SELECT FOR UPDATE to prevent race conditions
        """
        # Ensure amount is a Decimal right at the start to prevent TypeErrors
        amount = Decimal(str(amount))
        
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        
        # Lock the wallet row for update
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        
        # Check maximum balance limit
        max_balance = Decimal(settings.VTU_SETTINGS['MAX_WALLET_BALANCE'])
        if wallet.balance + amount > max_balance:
            raise ValueError(f"Maximum wallet balance ({max_balance}) exceeded")
        
        wallet.balance += amount
        wallet.save(update_fields=['balance', 'updated_at'])
        
        # Create wallet transaction record
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='CREDIT',
            amount=amount,
            balance_before=wallet.balance - amount,
            balance_after=wallet.balance,
            description=description
        )
        
        # Sync the local memory instance to prevent stale data
        self.balance = wallet.balance
        self.updated_at = wallet.updated_at
        
        return self
    
    @transaction.atomic
    def debit(self, amount, description="Debit"):
        """
        Debit wallet with atomic transaction
        Uses SELECT FOR UPDATE to prevent race conditions
        """
        # Ensure amount is a Decimal right at the start
        amount = Decimal(str(amount))
        
        if amount <= 0:
            raise ValueError("Debit amount must be positive")
        
        # Lock the wallet row for update
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        
        # Check sufficient balance
        if wallet.available_balance < amount:
            raise ValueError("Insufficient wallet balance")
        
        wallet.balance -= amount
        wallet.save(update_fields=['balance', 'updated_at'])
        
        # Create wallet transaction record
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='DEBIT',
            amount=amount,
            balance_before=wallet.balance + amount,
            balance_after=wallet.balance,
            description=description
        )
        
        # Sync the local memory instance to prevent stale data
        self.balance = wallet.balance
        self.updated_at = wallet.updated_at
        
        return self
    
    @transaction.atomic
    def lock_funds(self, amount, description="Lock funds"):
        """
        Lock funds for pending transaction
        """
        # Ensure amount is a Decimal right at the start
        amount = Decimal(str(amount))
        
        if amount <= 0:
            raise ValueError("Lock amount must be positive")
        
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        
        if wallet.available_balance < amount:
            raise ValueError("Insufficient balance to lock")
        
        wallet.locked_balance += amount
        wallet.save(update_fields=['locked_balance', 'updated_at'])
        
        # Sync the local memory instance to prevent stale data
        self.locked_balance = wallet.locked_balance
        self.updated_at = wallet.updated_at
        
        return self
    
    @transaction.atomic
    def unlock_funds(self, amount, deduct=False, description="Unlock funds"):
        """
        Unlock funds after transaction completion
        If deduct=True, remove from balance (transaction succeeded)
        If deduct=False, return to available balance (transaction failed)
        """
        # Ensure amount is a Decimal right at the start
        amount = Decimal(str(amount))
        
        if amount <= 0:
            raise ValueError("Unlock amount must be positive")
        
        wallet = Wallet.objects.select_for_update().get(pk=self.pk)
        
        if wallet.locked_balance < amount:
            raise ValueError("Locked balance insufficient")
        
        wallet.locked_balance -= amount
        
        if deduct:
            # Transaction succeeded, deduct from balance
            wallet.balance -= amount
            transaction_type = 'DEBIT'
            balance_before = wallet.balance + amount
        else:
            # Transaction failed, return to available balance
            transaction_type = 'CREDIT'
            balance_before = wallet.balance
        
        wallet.save(update_fields=['balance', 'locked_balance', 'updated_at'])
        
        # Record transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=transaction_type,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=description
        )
        
        # Sync the local memory instance to prevent stale data
        self.balance = wallet.balance
        self.locked_balance = wallet.locked_balance
        self.updated_at = wallet.updated_at
        
        return self


class WalletTransaction(models.Model):
    """Record of all wallet transactions for audit"""
    TRANSACTION_TYPES = [
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    ]
    
    wallet = models.ForeignKey(
        Wallet, 
        on_delete=models.CASCADE, 
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    reference = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'wallet_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', '-created_at']),
            models.Index(fields=['transaction_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.wallet.user.email} - {self.transaction_type} - {self.amount}"