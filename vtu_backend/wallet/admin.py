"""
Wallet admin configuration
File: wallet/admin.py
"""
from django.contrib import admin
from .models import Wallet, WalletTransaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'locked_balance', 'currency', 'is_active', 'updated_at')
    search_fields = ('user__email',)
    list_filter = ('is_active', 'currency')

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'transaction_type', 'amount', 'balance_before', 'balance_after', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('wallet__user__email', 'reference')
    readonly_fields = ('created_at',)