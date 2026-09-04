"""
Database models for service providers, billing catalogs, and audit logs
File: services/models.py
"""
from django.db import models
from django.conf import settings


class Provider(models.Model):
    """
    Service providers (e.g. telecom aggregators, electricity vendors)
    """
    name = models.CharField(max_length=100)
    api_base_url = models.URLField(blank=True, null=True, help_text="Base URL for provider integration")
    api_key = models.CharField(max_length=255, blank=True, null=True, help_text="Secret key for authentication")
    is_active = models.BooleanField(default=True)
    is_healthy = models.BooleanField(default=True, help_text="Flag indicating if the provider is currently online")
    priority = models.IntegerField(default=1, help_text="Routing priority (lower priority is tried first)")

    # Performance and health metrics tracking
    total_requests = models.IntegerField(default=0)
    successful_requests = models.IntegerField(default=0)
    avg_response_time = models.FloatField(default=0.0)

    def __str__(self):
        return self.name

    def mark_unhealthy(self):
        """Mark provider as unhealthy due to consecutive failures"""
        self.is_healthy = False
        self.save(update_fields=['is_healthy'])

    def mark_healthy(self):
        """Restore provider health flag after successful checks"""
        self.is_healthy = True
        self.save(update_fields=['is_healthy'])

    def update_metrics(self, success: bool, response_time: float):
        """
        Record response time metrics and calculate running average
        """
        self.total_requests += 1
        if success:
            self.successful_requests += 1

        # Calculate a simple rolling average for response times
        if self.avg_response_time == 0.0:
            self.avg_response_time = response_time
        else:
            self.avg_response_time = (
                (self.avg_response_time * (self.total_requests - 1)) + response_time
            ) / self.total_requests

        self.save(update_fields=['total_requests', 'successful_requests', 'avg_response_time'])


class ProviderLog(models.Model):
    """
    Log of all provider API interactions for transaction auditing
    """
    provider = models.ForeignKey(
        Provider, 
        on_delete=models.CASCADE, 
        related_name='logs'
    )
    # Lazy import to prevent circular dependency with transactions app
    transaction = models.ForeignKey(
        'transactions.Transaction', 
        on_delete=models.CASCADE, 
        related_name='provider_logs',
        null=True,
        blank=True
    )
    log_type = models.CharField(max_length=20, help_text="e.g. RESPONSE, ERROR")
    endpoint = models.CharField(max_length=255)
    request_data = models.JSONField(default=dict, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    response_time = models.FloatField(help_text="Time taken for request in seconds")
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'provider_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.provider.name} - {self.endpoint} - {self.log_type}"


class WalletFunding(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email if self.user.email else self.user.username} - {self.reference} - {self.status}"


class ElectricityProvider(models.Model):
    METER_TYPE_CHOICES = [
        ('PREPAID', 'Prepaid'),
        ('POSTPAID', 'Postpaid'),
    ]
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    meter_types = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class CableTVProvider(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class CableTVPackage(models.Model):
    provider = models.ForeignKey(
        CableTVProvider,
        on_delete=models.CASCADE,
        related_name='packages'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.provider.name} - {self.name} - ₦{self.amount}"


class DataPlan(models.Model):
    NETWORK_CHOICES = [
        ('MTN', 'MTN'),
        ('GLO', 'Glo'),
        ('AIRTEL', 'Airtel'),
        ('9MOBILE', '9Mobile'),
    ]
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    data_volume = models.CharField(max_length=50)
    validity = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.network} - {self.name} - ₦{self.amount}"