"""
Secure views for transaction history and VTU purchases
File: transactions/views.py
"""
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from .models import Transaction
from .serializers import TransactionSerializer, CreateTransactionSerializer
from services.transaction_service import TransactionService
from services.tasks import process_vtu_transaction_task
from core.permissions import IsOwner

class TransactionViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = TransactionSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
       if not self.request.user.is_authenticated:
           return Transaction.objects.none()
       qs = Transaction.objects.filter(user=self.request.user).order_by('-created_at')
       tx_type = self.request.query_params.get('type', '').strip().upper()
       if tx_type and tx_type != 'ALL':
           qs = qs.filter(type=tx_type)

       status_param = self.request.query_params.get('status', '').strip().upper()
       if status_param and status_param != 'ALL':
           qs = qs.filter(status=status_param)
       
       return qs

    def get_serializer_class(self):
        if self.action == "create":
            return CreateTransactionSerializer
        return TransactionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        try:
            txn = TransactionService.create_transaction(
                user=user,
                data=serializer.validated_data
            )
            process_vtu_transaction_task.delay(str(txn.id))
            output_serializer = TransactionSerializer(txn)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "An error occurred while initiating your purchase."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
