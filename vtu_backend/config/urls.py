"""
Main URL router configuration
File: config/urls.py
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from users.api import UserViewSet
from wallet.api import WalletViewSet, WalletTransactionViewSet
from transactions.api import TransactionViewSet, TransactionStatusHistoryViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import home
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from wallet.views import monnify_webhook_receiver

# Django REST Framework Router registration
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'wallet', WalletViewSet, basename='wallet')
router.register(r'wallet-transactions', WalletTransactionViewSet, basename='wallet-transaction')
router.register(r'transactions', TransactionViewSet)
router.register(r'transaction-status-history', TransactionStatusHistoryViewSet)

urlpatterns = [
    # Administrative Admin Panel
    path("admin/", admin.site.urls),
    
    # Custom users app (RESTORED TO TOP FOR FIRST-MATCHING RESOLUTION) [7]
    path("api/users/", include("users.urls")),
    
    # Generic CRUD ViewSets (Processed second) [7]
    path("api/", include(router.urls)),
    
    # Home landing page
    path('', home),
    
    # Session auth login for testing DRF locally
    path("api-auth/", include("rest_framework.urls")),
    
    # API Documentation Schemas (drf-spectacular)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Services app (payment checkout, pre-validations, catalogs, stats)
    path("api/", include("services.urls")),
    
    # Backward-compatible authentication paths (SimpleJWT legacy endpoints)
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

       
    path('webhook/monnify/', monnify_webhook_receiver),
]
