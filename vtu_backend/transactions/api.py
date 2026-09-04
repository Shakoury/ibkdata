"""
Secure API ViewSet for transactions
File: transactions/api.py
"""
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from .models import Transaction, TransactionStatusHistory
from .serializers import TransactionSerializer, CreateTransactionSerializer, TransactionStatusHistorySerializer
from services.transaction_service import TransactionService
from services.tasks import process_vtu_transaction_task
from core.permissions import IsOwner


class TransactionViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    Secure ViewSet for transactions.
    Standard users can create, retrieve, and list transactions.
    Updating (PUT/PATCH) and deleting (DELETE) are disabled to protect accounting audit trails.
    """
    queryset = Transaction.objects.all()  # Added to resolve the router assertion error!
    serializer_class = TransactionSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        """
        Defensive-in-depth: Ensure standard users can only view their own transaction records.
        """
        if self.request.user.is_authenticated:
            return Transaction.objects.filter(user=self.request.user)
        return Transaction.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return CreateTransactionSerializer
        return TransactionSerializer

    def create(self, request, *args, **kwargs):
        """
        Initiates a secure VTU purchase asynchronously.
        Overriding this method ensures we explicitly pass request.user into the transaction [5].
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        try:
            # 1. Use the secure TransactionService we audited.
            # It explicitly binds request.user to prevent NotNullViolations in the database [5]!
            txn = TransactionService.create_transaction(
                user=user,
                data=serializer.validated_data
            )

            # 2. Trigger the Celery task asynchronously in the background.
            process_vtu_transaction_task.delay(str(txn.id))

            # 3. Return the transaction object with PROCESSING status
            output_serializer = TransactionSerializer(txn)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            # Safely catch and return errors like "Insufficient balance"
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Fail-safe catching
            return Response(
                {"error": "An error occurred while initiating your purchase."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TransactionStatusHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin/User viewset to view the transaction audit trail.
    Strictly read-only.
    """
    queryset = TransactionStatusHistory.objects.all()
    serializer_class = TransactionStatusHistorySerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        # Users can only see the history of transactions that belong to them
        if self.request.user.is_authenticated:
            return TransactionStatusHistory.objects.filter(transaction__user=self.request.user)
        return TransactionStatusHistory.objects.none()