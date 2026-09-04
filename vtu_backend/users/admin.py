"""
Users admin configuration
File: users/admin.py
"""
from django.contrib import admin
from .models import User, Role, Permission, UserSession

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """
    Custom Admin configuration for custom email-based users.
    Handles password hashing automatically on creation and updates.
    """
    list_display = ('email', 'phone', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'role')
    search_fields = ('email', 'phone')
    ordering = ('-created_at',)
    
    # Form layout inside the admin edit page
    fields = (
        'email', 
        'password', 
        'first_name', 
        'last_name', 
        'phone', 
        'role', 
        'is_active', 
        'is_staff', 
        'is_superuser', 
        'is_verified'
    )

    def save_model(self, request, obj, form, change):
        """
        Intercepts the save action in Django Admin to safely hash passwords.
        """
        # If the password is newly set (on creation) or has been modified, hash it correctly
        if not change or 'password' in form.changed_data:
            obj.set_password(obj.password)
            
        super().save_model(request, obj, form, change)


admin.site.register(Role)
admin.site.register(Permission)
admin.site.register(UserSession)
