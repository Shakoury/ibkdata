"""
Services admin configuration
File: services/admin.py
"""
from django.contrib import admin
from .models import (
    Provider, ProviderLog, WalletFunding, 
    ElectricityProvider, CableTVProvider, 
    CableTVPackage, DataPlan
)

@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'is_healthy', 'priority', 'avg_response_time')
    list_filter = ('is_active', 'is_healthy')
    search_fields = ('name',)

@admin.register(ProviderLog)
class ProviderLogAdmin(admin.ModelAdmin):
    list_display = ('provider', 'endpoint', 'log_type', 'status_code', 'response_time', 'created_at')
    list_filter = ('log_type', 'status_code', 'provider')
    search_fields = ('endpoint', 'error_message')
    readonly_fields = ('created_at',)

@admin.register(WalletFunding)
class WalletFundingAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'reference', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('reference', 'user__email')

admin.site.register(ElectricityProvider)
admin.site.register(CableTVProvider)
admin.site.register(CableTVPackage)
admin.site.register(DataPlan)