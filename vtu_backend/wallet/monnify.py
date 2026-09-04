"""
Monnify Reserved Account Service
File: wallet/monnify.py
"""
import hmac
import hashlib
import requests
import logging
from django.conf import settings
from wallet.models import Wallet

logger = logging.getLogger(__name__)


class MonnifyService:
    BASE_URL = "https://api.monnify.com"

    @classmethod
    def get_access_token(cls):
        """
        Authenticate with Monnify and return a Bearer access token.
        Monnify uses Basic Auth (API Key + Secret Key) to get a token.
        """
        import base64
        api_key = getattr(settings, 'MONNIFY_API_KEY', None)
        secret_key = getattr(settings, 'MONNIFY_SECRET_KEY', None)

        if not api_key or not secret_key:
            logger.critical("CRITICAL: MONNIFY_API_KEY or MONNIFY_SECRET_KEY is missing from settings.py!")
            return None

        credentials = f"{api_key}:{secret_key}"
        encoded = base64.b64encode(credentials.encode()).decode()

        try:
            response = requests.post(
                f"{cls.BASE_URL}/api/v1/auth/login",
                headers={
                    "Authorization": f"Basic {encoded}",
                    "Content-Type": "application/json"
                },
                timeout=10
            )
            data = response.json()

            if response.status_code == 200 and data.get('requestSuccessful'):
                return data['responseBody']['accessToken']

            logger.error(f"Monnify auth failed: {data.get('responseMessage')}")
            return None

        except Exception as e:
            logger.error(f"Monnify authentication error: {str(e)}", exc_info=True)
            return None

    @classmethod
    def get_headers(cls):
        """Get authenticated headers with fresh access token."""
        token = cls.get_access_token()
        if not token:
            return None
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @classmethod
    def get_or_create_reserved_account(cls, wallet: Wallet):
        """
        Fetches existing reserved account details from the wallet
        or creates a new Monnify reserved account for the user.
        """
        # Return existing account if already provisioned
        if wallet.account_number and wallet.bank_name:
            return {
                "bank_name": wallet.bank_name,
                "account_number": wallet.account_number,
                "account_name": wallet.account_name
            }

        user = wallet.user
        headers = cls.get_headers()

        if not headers:
            logger.error("Could not get Monnify headers — auth failed.")
            return None

        # Build a unique account reference per user
        account_reference = f"VTU-USER-{user.id}"
        account_name = f"VTU {user.first_name or 'Customer'} {user.last_name or str(user.id)}".upper()

        payload = {
            "accountReference": account_reference,
            "accountName": account_name,
            "currencyCode": "NGN",
            "contractCode": settings.MONNIFY_CONTRACT_CODE,
            "customerEmail": user.email,
            "customerName": account_name,
            "getAllAvailableBanks": False,
            "preferredBanks": ["035"]  # Wema Bank — supports virtual accounts
        }

        try:
            logger.info(f"Creating Monnify reserved account for user: {user.email}")

            response = requests.post(
                f"{cls.BASE_URL}/api/v2/bank-transfer/reserved-accounts",
                json=payload,
                headers=headers,
                timeout=10
            )
            data = response.json()

            if response.status_code == 200 and data.get('requestSuccessful'):
                account_info = data['responseBody']['accounts'][0]

                wallet.bank_name = account_info['bankName']
                wallet.account_number = account_info['accountNumber']
                wallet.account_name = data['responseBody']['accountName']
                wallet.save(update_fields=['bank_name', 'account_number', 'account_name'])

                logger.info(f"Reserved account created: {wallet.account_number} @ {wallet.bank_name}")

                return {
                    "bank_name": wallet.bank_name,
                    "account_number": wallet.account_number,
                    "account_name": wallet.account_name
                }

            logger.error(f"Monnify reserved account creation failed: {data.get('responseMessage')}")
            return None

        except Exception as e:
            logger.error(f"Exception during Monnify account creation: {str(e)}", exc_info=True)
            return None

    @classmethod
    def verify_webhook_signature(cls, payload: bytes, monnify_signature: str) -> bool:
        """
        Verify that the webhook is genuinely from Monnify.
        Monnify signs payloads with HMAC SHA512 using your Secret Key.
        """
        secret_key = getattr(settings, 'MONNIFY_SECRET_KEY', '')
        computed = hmac.new(
            secret_key.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha512
        ).hexdigest()
        return hmac.compare_digest(computed, monnify_signature)