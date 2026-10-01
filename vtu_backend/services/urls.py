"""
URL configuration for services
File: services/urls.py
"""
from django.urls import path
from .views import (
    get_virtual_account,
    get_electricity_providers,
    get_cable_tv_providers,
    get_data_plans,
    validate_customer_account_view,
    provider_status_view,
    user_stats_view,
    admin_stats_view,
    admin_daily_volume_view,
    admin_wallet_adjust_view,
    admin_list_services,
    admin_update_service,
)

urlpatterns = [
    # Paystack virtual account funding
    path("paystack/virtual-account/", get_virtual_account),

    # Service catalog & pre-validation
    path("catalog/electricity/", get_electricity_providers),
    path("catalog/cable-tv/", get_cable_tv_providers),
    path("catalog/data-plans/", get_data_plans),
    path("catalog/validate/", validate_customer_account_view),
    path("v1/providers/status/", provider_status_view),
    path("v1/stats/", user_stats_view),


    # Admin endpoints
    path("admin/stats/", admin_stats_view),
    path("admin/daily-volume/", admin_daily_volume_view),
    path("admin/wallet/adjust/", admin_wallet_adjust_view),
    path("admin/services/", admin_list_services),
    path("admin/services/<str:service_type>/<int:pk>/", admin_update_service),
]
