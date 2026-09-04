"""
User models for authentication and authorization
File: users/models.py
"""
import uuid
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class Permission(models.Model):
    """System permissions"""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    codename = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'permissions'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Role(models.Model):
    """User roles with associated permissions"""
    name = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'roles'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def has_permission(self, permission_codename):
        """
        Check if role has specific permission.
        Safely strips the app_label prefix if Django checks 'app_label.codename' (e.g. 'users.add_user').
        """
        if '.' in permission_codename:
            permission_codename = permission_codename.split('.')[-1]
            
        return self.permissions.filter(codename=permission_codename).exists()


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Email address is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    
    # 6-Digit Verification Token Field for custom API matching
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    password_reset_code = models.CharField(max_length=6, blank=True, null=True)
    transaction_pin = models.CharField(max_length=128, blank=True, null=True)
    has_pin = models.BooleanField(default=False)

    # PIN brute-force protection
    failed_pin_attempts = models.PositiveSmallIntegerField(default=0)
    pin_locked_until = models.DateTimeField(null=True, blank=True)

    # Role and permissions
    role = models.ForeignKey(
        Role, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    
    # Status flags
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    
    # Metadata
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'is_active']),
            models.Index(fields=['phone']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """Return full name of user"""
        return f"{self.first_name} {self.last_name}".strip() or self.email
    
    def has_perm(self, perm, obj=None):
        """
        Check if user has specific permission.
        Optimized to support both custom Roles and standard Django Permissions/Groups.
        """
        if self.is_superuser:
            return True
        
        # Check custom role RBAC first
        if self.role and self.role.has_permission(perm):
            return True
            
        # Fallback to standard Django PermissionsMixin (Direct permissions and Groups)
        return super().has_perm(perm, obj)
    
    def has_module_perms(self, app_label):
        """Check if user has permissions for app"""
        return self.is_superuser or self.is_staff

    def is_pin_locked(self):
        return bool(self.pin_locked_until and self.pin_locked_until > timezone.now())

    def register_pin_failure(self, max_attempts=5, lockout_minutes=20):
        self.failed_pin_attempts += 1
        if self.failed_pin_attempts >= max_attempts:
            self.pin_locked_until = timezone.now() + timezone.timedelta(minutes=lockout_minutes)
        self.save(update_fields=["failed_pin_attempts", "pin_locked_until"])

    def register_pin_success(self):
        if self.failed_pin_attempts or self.pin_locked_until:
            self.failed_pin_attempts = 0
            self.pin_locked_until = None
            self.save(update_fields=["failed_pin_attempts", "pin_locked_until"])


class UserSession(models.Model):
    """Track user sessions for security"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.ip_address}"
    
    def is_expired(self):
        """Check if session is expired"""
        return timezone.now() > self.expires_at


# --- SIGNALS FOR AUTO-CREATING USER WALLETS ---
@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    """
    Automatically creates a Wallet model instance when a User is created.
    """
    if created:
        from wallet.models import Wallet
        Wallet.objects.get_or_create(user=instance)

