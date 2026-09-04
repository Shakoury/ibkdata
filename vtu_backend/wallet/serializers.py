"""
Wallet Serializers
File: wallet/serializers.py
"""
from rest_framework import serializers
from .models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    available_balance = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )

    class Meta:
        model = Wallet
        fields = [
            'id',
            'user',
            'user_email',
            'balance',
            'locked_balance',
            'available_balance',
            'currency',
            'is_active',
            'bank_name',
            'account_number',
            'account_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'user',
            'balance',
            'locked_balance',
            'available_balance',
            'bank_name',
            'account_number',
            'account_name',
            'created_at',
            'updated_at'
        ]


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            'id',
            'wallet',
            'transaction_type',
            'amount',
            'balance_before',
            'balance_after',
            'description',
            'reference',
            'created_at'
        ]
        read_only_fields = [
            'id',
            'wallet',
            'transaction_type',
            'amount',
            'balance_before',
            'balance_after',
            'description',
            'reference',
            'created_at'
        ]