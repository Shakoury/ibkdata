from django.utils import timezone
"""
User views for registration, profile management, and secure authentication
File: users/views.py
"""
import logging
import random
import hashlib
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        verification_code = f"{random.randint(100000, 999999)}"
        user.verification_code = verification_code
        user.save()

        try:
            send_mail(
                subject="Verify Your Email - ABKDATA",
                message=(
                    f"Hello {user.first_name or 'User'},\n\n"
                    f"Your 6-digit email verification code is: {verification_code}\n\n"
                    f"Enter this code in your browser to complete registration."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"\n---------------------------------------------------------")
            logger.info(f"VERIFICATION CODE FOR {user.email}: {verification_code}")
            logger.info(f"---------------------------------------------------------\n")
        except Exception as e:
            logger.error(f"Failed sending registration verification email: {str(e)}")

        return Response(
            {
                "message": "User registered successfully. Verification code sent.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            },
            status=status.HTTP_201_CREATED
        )


class VerifyEmailCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()

        if not email or not code:
            return Response(
                {"detail": "Both email and verification code are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "No account found with this email address."},
                status=status.HTTP_400_BAD_REQUEST
            )

        db_code = getattr(user, 'verification_code', None)

        if db_code and db_code == code:
            user.is_verified = True
            user.is_active = True
            user.verification_code = None
            user.save()
            return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)

        return Response(
            {"detail": "Invalid or expired verification code."},
            status=status.HTTP_400_BAD_REQUEST
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "No account found with this email address."}, status=status.HTTP_404_NOT_FOUND)

        code = f"{random.randint(100000, 999999)}"
        user.password_reset_code = code
        user.save(update_fields=['password_reset_code'])

        try:
            send_mail(
                subject="Password Reset Code - ABKDATA",
                message=(
                    f"Hello {user.first_name or 'User'},\n\n"
                    f"Your 6-digit password reset code is: {code}\n\n"
                    f"This code expires in 10 minutes. Do not share it with anyone."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"\n---------------------------------------------------------")
            logger.info(f"PASSWORD RESET CODE FOR {user.email}: {code}")
            logger.info(f"---------------------------------------------------------\n")
        except Exception as e:
            logger.error(f"Failed sending reset email: {str(e)}")

        return Response({"message": "Reset code sent to your email."}, status=status.HTTP_200_OK)


class PasswordResetWithCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '')

        if not email or not code or not new_password:
            return Response({'error': 'Email, code and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.password_reset_code != code:
            return Response({'error': 'Invalid or expired reset code.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.password_reset_code = None
        user.save(update_fields=['password', 'password_reset_code'])
        return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '')

        if not email or not code or not new_password:
            return Response({"detail": "Email, code, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

        if not user.password_reset_code or user.password_reset_code != code:
            return Response({"detail": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.password_reset_code = None
        user.save(update_fields=['password', 'password_reset_code'])
        return Response({"message": "Password reset successfully. Please sign in."}, status=status.HTTP_200_OK)


class SetTransactionPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin', '')
        if not pin or len(str(pin)) != 4 or not str(pin).isdigit():
            return Response({'error': 'PIN must be exactly 4 digits.'}, status=status.HTTP_400_BAD_REQUEST)

        hashed = hashlib.sha256(str(pin).encode()).hexdigest()
        request.user.transaction_pin = hashed
        request.user.has_pin = True
        request.user.save(update_fields=['transaction_pin', 'has_pin'])
        return Response({'message': 'Transaction PIN set successfully.'}, status=status.HTTP_200_OK)


class ChangeTransactionPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_pin = request.data.get('old_pin', '')
        new_pin = request.data.get('new_pin', '')

        if not old_pin or not new_pin:
            return Response({'error': 'Both old and new PIN are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(str(new_pin)) != 4 or not str(new_pin).isdigit():
            return Response({'error': 'New PIN must be exactly 4 digits.'}, status=status.HTTP_400_BAD_REQUEST)

        hashed_old = hashlib.sha256(str(old_pin).encode()).hexdigest()
        if request.user.transaction_pin != hashed_old:
            return Response({'error': 'Old PIN is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        hashed_new = hashlib.sha256(str(new_pin).encode()).hexdigest()
        request.user.transaction_pin = hashed_new
        request.user.save(update_fields=['transaction_pin'])
        return Response({'message': 'Transaction PIN changed successfully.'}, status=status.HTTP_200_OK)


class VerifyTransactionPinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pin = request.data.get('pin', '')
        if not pin:
            return Response({'error': 'PIN is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_pin_locked():
            remaining = int((request.user.pin_locked_until - timezone.now()).total_seconds() // 60) + 1
            return Response(
                {'error': f'Too many failed PIN attempts. Try again in {remaining} minute(s).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        hashed = hashlib.sha256(str(pin).encode()).hexdigest()
        if request.user.transaction_pin != hashed:
            request.user.register_pin_failure()
            return Response({'error': 'Incorrect PIN.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.register_pin_success()
        return Response({'message': 'PIN verified.'}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not old_password or not new_password:
            return Response({'error': 'Both old and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(old_password):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'message': 'If this email exists, a code has been sent.'}, status=status.HTTP_200_OK)

        if user.is_verified:
            return Response({'detail': 'Email already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        verification_code = f"{random.randint(100000, 999999)}"
        user.verification_code = verification_code
        user.save(update_fields=['verification_code'])

        try:
            send_mail(
                subject="Verify Your Email - IBKDATA",
                message=(
                    f"Hello {user.first_name or 'User'},\n\n"
                    f"Your new 6-digit verification code is: {verification_code}\n\n"
                    f"Enter this code to complete registration."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"RESENT VERIFICATION CODE FOR {user.email}: {verification_code}")
        except Exception as e:
            logger.error(f"Failed resending verification email: {str(e)}")

        return Response({'message': 'Verification code resent.'}, status=status.HTTP_200_OK)
