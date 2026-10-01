"""
Paystack Dedicated Virtual Account (DVA) Service
File: wallet/paystack.py
Replaces wallet/monnify.py
"""
import hmac
import hashlib
import logging

import requests
from django.conf import settings

from wallet.models import Wallet

logger = logging.getLogger(__name__)


class PaystackService:
    BASE_URL = "https://api.paystack.co"

    # ------------------------------------------------------------------
    # Low-level helpers
    # ------------------------------------------------------------------
    @classmethod
    def _headers(cls):
        secret = getattr(settings, "PAYSTACK_SECRET_KEY", None)
        if not secret:
            logger.critical("CRITICAL: PAYSTACK_SECRET_KEY is missing from settings.py!")
            return None
        return {
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
        }

    @classmethod
    def _request(cls, method, path, **kwargs):
        """Returns the parsed JSON dict from Paystack, or None on network/auth-config failure."""
        headers = cls._headers()
        if not headers:
            return None
        try:
            response = requests.request(
                method,
                f"{cls.BASE_URL}{path}",
                headers=headers,
                timeout=15,
                **kwargs,
            )
            data = response.json()
        except Exception as e:
            logger.error(f"Paystack {method} {path} error: {e}", exc_info=True)
            return None

        if not data.get("status"):
            logger.error(f"Paystack {method} {path} failed: {data.get('message')}")
        return data

    # ------------------------------------------------------------------
    # Dedicated virtual account
    # ------------------------------------------------------------------
    @classmethod
    def _save_account(cls, wallet: Wallet, account: dict):
        bank = account.get("bank") or {}
        wallet.bank_name = bank.get("name")
        wallet.account_number = account.get("account_number")
        wallet.account_name = account.get("account_name")
        wallet.save(update_fields=["bank_name", "account_number", "account_name"])
        logger.info(f"Paystack DVA saved: {wallet.account_number} @ {wallet.bank_name}")
        return {
            "bank_name": wallet.bank_name,
            "account_number": wallet.account_number,
            "account_name": wallet.account_name,
        }

    @classmethod
    def get_or_create_reserved_account(cls, wallet: Wallet):
        """
        Returns the wallet's virtual account details, creating one on Paystack if needed.
        Returns None if the account could not be provisioned yet (failed, or still being
        assigned asynchronously - in that case the webhook event
        'dedicatedaccount.assign.success' fills it in later).
        """
        if wallet.account_number and wallet.bank_name:
            return {
                "bank_name": wallet.bank_name,
                "account_number": wallet.account_number,
                "account_name": wallet.account_name,
            }

        user = wallet.user

        # 1. Create (or fetch) the Paystack customer
        customer_payload = {
            "email": user.email,
            "first_name": user.first_name or "Customer",
            "last_name": user.last_name or str(user.id),
        }
        # Adjust the attribute name to match your User model
        phone = getattr(user, "phone_number", None) or getattr(user, "phone", None)
        if phone:
            customer_payload["phone"] = phone

        customer = cls._request("POST", "/customer", json=customer_payload)
        if not customer or not customer.get("status"):
            return None
        customer_code = customer["data"]["customer_code"]

        # 2. Create the dedicated account for that customer
        dva = cls._request(
            "POST",
            "/dedicated_account",
            json={
                "customer": customer_code,
                "preferred_bank": getattr(settings, "PAYSTACK_DVA_BANK", "wema-bank"),
            },
        )
        if dva and dva.get("status") and (dva.get("data") or {}).get("account_number"):
            return cls._save_account(wallet, dva["data"])

        # 3. Maybe the customer already has one (e.g. earlier attempt succeeded)
        existing = cls._request("GET", "/dedicated_account", params={"customer": customer_code})
        if existing and existing.get("status") and existing.get("data"):
            return cls._save_account(wallet, existing["data"][0])

        logger.info(f"Paystack DVA not ready yet for {user.email}; waiting for assign webhook.")
        return None

    @classmethod
    def save_assigned_account(cls, data: dict) -> bool:
        """Handles the 'dedicatedaccount.assign.success' webhook event."""
        account = data.get("dedicated_account") or {}
        email = (data.get("customer") or {}).get("email")
        if not account.get("account_number") or not email:
            logger.warning("assign.success webhook missing account or email")
            return False

        wallet = Wallet.objects.filter(user__email__iexact=email).first()
        if not wallet:
            logger.error(f"assign.success: no wallet for {email}")
            return False

        cls._save_account(wallet, account)
        return True

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------
    @classmethod
    def verify_transaction(cls, reference: str):
        """Returns Paystack's transaction 'data' dict, or None if the call failed."""
        result = cls._request("GET", f"/transaction/verify/{reference}")
        if not result or not result.get("status"):
            return None
        return result.get("data")

    @classmethod
    def verify_webhook_signature(cls, payload: bytes, signature: str) -> bool:
        """Paystack signs the raw body with HMAC SHA512 using your secret key."""
        secret = getattr(settings, "PAYSTACK_SECRET_KEY", "") or ""
        computed = hmac.new(
            secret.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(computed, signature)
