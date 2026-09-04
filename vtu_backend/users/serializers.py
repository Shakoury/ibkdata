"""
User serializers for secure authentication and profile management
File: users/serializers.py
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.tokens import default_token_generator  # Added for secure reset tokens
from django.utils.http import urlsafe_base64_decode  # Added for safe ID decoding
from django.utils.encoding import force_str  # Added for safe string conversion
from .models import User, Role
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user profiles safely.
    Admin flags, roles, and wallet details are strictly marked as read-only [1].
    """
    role_name = serializers.CharField(source='role.name', read_only=True)

    # Pulling wallet fields directly from the OneToOne Wallet relationship securely [1]
    balance = serializers.DecimalField(source='wallet.balance', max_digits=12, decimal_places=2, read_only=True)
    locked_balance = serializers.DecimalField(source='wallet.locked_balance', max_digits=12, decimal_places=2, read_only=True)
    bank_name = serializers.CharField(source='wallet.bank_name', read_only=True)
    account_number = serializers.CharField(source='wallet.account_number', read_only=True)
    account_name = serializers.CharField(source='wallet.account_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'phone', 
            'first_name', 
            'last_name', 
            'role', 
            'role_name',
            'balance',          
            'locked_balance',   
            'bank_name',        
            'account_number',   
            'account_name',     
            'is_verified', 
            'is_active', 
            'is_staff', 
            'created_at',
            'has_pin'
        ]
        # Ensure these are strictly read-only to prevent user modifications
        read_only_fields = [
            'id', 
            'email', 
            'role', 
            'balance',
            'locked_balance',
            'bank_name',
            'account_number',
            'account_name',
            'is_verified', 
            'is_active', 
            'is_staff', 
            'created_at',
            'has_pin'
        ]

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer dedicated strictly to user registration.
    Enforces strong password validation and hashes passwords securely.
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'phone', 'first_name', 'last_name']

    def validate_password(self, value):
        """
        Enforce Django's password strength validators configured in settings.py.
        By default, DRF ignores these unless explicitly called here.
        """
        try:
            # Runs all password validation checks from settings.py
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        """
        Safely create the user and hash the password using UserManager.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer to request a password reset email.
    """
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Normalize the email input
        email = value.lower().strip()
        # Security Best Practice: We don't raise a visible error here if the email 
        # doesn't exist. This prevents attackers from scanning your database for registered emails.
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer to validate the reset token and save the new password.
    """
    uidb64 = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        try:
            # Enforces all password strength rules from your settings.py
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, data):
        try:
            # Decode the user's primary key from Base64 [8]
            uid = force_str(urlsafe_base64_decode(data['uidb64']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"error": "Invalid token or user ID."})

        # Cryptographically check if the token belongs to this user and has not expired [8]
        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({"error": "Token has expired or is invalid."})

        # Attach the user instance to validated data [8]
        data['user'] = user
        return data

    def save(self, **kwargs):
        user = self.validated_data['user']
        # Securely set and hash the new password
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that explicitly enforces fields named 'email' and 'password'
    regardless of base user model default field settings.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Dynamically remove the default 'username' field if it was generated
        self.fields.pop(self.username_field, None)
        # Explicitly declare our fields
        self.fields['email'] = serializers.EmailField(required=True)
        self.fields['password'] = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        # Normalize email input
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        # SimpleJWT expects the identifying value inside the username_field key during authentication
        attrs[self.username_field] = email
        attrs['password'] = password

        data = super().validate(attrs)
        if not self.user.is_verified:
            from rest_framework import serializers as s
            raise s.ValidationError({"detail": "Email not verified. Please verify your email first."})
        return data