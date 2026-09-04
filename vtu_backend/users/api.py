"""
API viewsets for administrative user management
File: users/api.py
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    Administrative ViewSet for listing, retrieving, and managing users.
    Strictly restricted to staff/admin users to prevent data leaks and IDORs.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    # IsAdminUser ensures only users with is_staff=True can access this ViewSet
    permission_classes = [IsAdminUser]

    # Optional: You can override get_queryset to prevent admins from 
    # accidentally deleting themselves or listing sensitive superuser accounts.
    def get_queryset(self):
        # Admins can see all users, sorted by creation date
        return User.objects.all().order_by('-created_at')