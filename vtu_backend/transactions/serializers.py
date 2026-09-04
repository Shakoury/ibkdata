"""
Serializers for transaction validation and history tracking
File: transactions/serializers.py
"""
import re
from rest_framework import serializers
from .models import Transaction, TransactionStatusHistory


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
        # Secured and updated with all administrative background fields marked as read-only
        read_only_fields = [
            "id", 
            "user", 
            "status", 
            "reference", 
            "provider_reference", 
            "response_message", 
            "retries", 
            "processing_started_at", 
            "completed_at", 
            "provider",
            "created_at", 
            "updated_at"
        ]


class CreateTransactionSerializer(serializers.ModelSerializer):
    # Not a model field — write-only input used purely for PIN verification in TransactionService.
    pin = serializers.CharField(write_only=True, min_length=4, max_length=4)

    class Meta:
        model = Transaction
        fields = ["type", "network", "amount", "phone_number", "metadata", "idempotency_key", "pin"]

    def validate_pin(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("PIN must be numeric.")
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_phone_number(self, value):
        """
        Validates standard 11-digit Nigerian phone numbers starting with 07, 08, or 09 [10].
        """
        # Cleaned regex for valid Nigerian networks
        pattern = r"^0[789]\d{9}$"
        if not re.match(pattern, value):
            raise serializers.ValidationError("Invalid Nigerian phone number format. Must be an 11-digit number starting with 07, 08, or 09 [10].")
        return value

    def validate(self, data):
        idempotency_key = data.get("idempotency_key")
        if idempotency_key and Transaction.objects.filter(idempotency_key=idempotency_key).exists():
            raise serializers.ValidationError({"idempotency_key": "Duplicate transaction"})

        txn_type = data.get("type")
        metadata = data.get("metadata") or {}

        if txn_type in ["AIRTIME", "DATA"]:
            if not data.get("network"):
                raise serializers.ValidationError({"network": "Network is required for Airtime/Data."})

        elif txn_type == "ELECTRICITY":
            if not metadata.get("meter_number"):
                raise serializers.ValidationError({"metadata": "meter_number is required for Electricity."})
            if not metadata.get("disco"):
                raise serializers.ValidationError({"metadata": "disco (e.g. IKEDC, EKEDC) is required for Electricity."})

        elif txn_type == "CABLE_TV":
            if not metadata.get("smartcard_number"):
                raise serializers.ValidationError({"metadata": "smartcard_number is required for Cable TV."})
            if not metadata.get("provider_name"):
                raise serializers.ValidationError({"metadata": "provider_name (e.g. DSTV, GOTV) is required for Cable TV."})

        return data


class TransactionStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionStatusHistory
        fields = "__all__"
        read_only_fields = ["created_at"]
