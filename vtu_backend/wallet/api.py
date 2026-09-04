from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Wallet, WalletTransaction
from .serializers import WalletSerializer, WalletTransactionSerializer

class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

class WalletTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            wallet = Wallet.objects.get(user=self.request.user)
            return WalletTransaction.objects.filter(wallet=wallet)
        except Wallet.DoesNotExist:
            return WalletTransaction.objects.none()