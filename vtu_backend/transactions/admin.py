"""
Transactions admin configuration
File: transactions/admin.py
"""
from django.contrib import admin
from .models import Transaction, TransactionStatusHistory

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('type', 'network', 'amount', 'status', 'reference', 'user')
    search_fields = ('phone_number', 'reference')
    list_filter = ('status', 'network')

@admin.register(TransactionStatusHistory)
class TransactionStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'from_status', 'to_status', 'reason', 'created_at')
    list_filter = ('from_status', 'to_status', 'created_at')
    search_fields = ('transaction__reference', 'reason')
    readonly_fields = ('created_at',)
