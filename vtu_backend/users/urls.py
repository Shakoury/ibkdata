"""
URL configuration for User registration, profiles, password recovery, and wallet features
File: users/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from wallet.views import WalletViewSet, monnify_webhook_receiver
from .views import ChangePasswordView, ResendVerificationView, PasswordResetWithCodeView, SetTransactionPinView, ChangeTransactionPinView, VerifyTransactionPinView, RegisterView, UserProfileView, PasswordResetRequestView, PasswordResetConfirmView, CustomTokenObtainPairView, VerifyEmailCodeView

# Register the WalletViewSet using a Rest Framework Router
router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')

urlpatterns = [
    # Custom JWT Login (Accepts email payload from React) & Standard Refresh
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration & Profile settings
    path('register/', RegisterView.as_view(), name='user_register'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    
    # Secure Password Recovery
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('verify-email/', VerifyEmailCodeView.as_view(), name='verify_email_code'),
    path('register/resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('auth/password/reset-with-code/', PasswordResetWithCodeView.as_view(), name='password_reset_with_code'),
    path('auth/password/change/', ChangePasswordView.as_view(), name='password_change'),
    path('pin/set/', SetTransactionPinView.as_view(), name='pin_set'),
    path('pin/change/', ChangeTransactionPinView.as_view(), name='pin_change'),
    path('pin/verify/', VerifyTransactionPinView.as_view(), name='pin_verify'),

    # --- WALLET & AUTOMATED PAYMENT ROUTES ---
    # Includes WalletViewSet actions under /api/users/wallets/me/
    path('', include(router.urls)),
    
    # Monnify Automated Bank Transfer Webhook Target
    path('webhook/monnify/', name='monnify-webhook', view=monnify_webhook_receiver),
]