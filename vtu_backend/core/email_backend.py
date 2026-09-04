import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings


class ResendEmailBackend(BaseEmailBackend):
    """Custom email backend using Resend HTTP API."""

    def send_messages(self, email_messages):
        api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not api_key:
            return 0

        sent = 0
        for message in email_messages:
            try:
                response = requests.post(
                    'https://api.resend.com/emails',
                    headers={
                        'Authorization': f'Bearer {api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'from': message.from_email or settings.DEFAULT_FROM_EMAIL,
                        'to': message.to,
                        'subject': message.subject,
                        'text': message.body,
                    },
                    timeout=10
                )
                if response.status_code in [200, 201]:
                    sent += 1
            except Exception as e:
                if not self.fail_silently:
                    raise e
        return sent
