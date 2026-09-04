# Backend Integration Instructions

This document explains exactly what the frontend expects from your Django backend
(github.com/Shakoury/vtu_backend), which endpoints already match, and which
endpoints you need to add or fix.

---

## 1. Environment Setup

Set `VITE_API_URL` in your frontend `.env` to point to your Django backend:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

All frontend API calls are prefixed with `/api/` automatically by the axios client.

---

## 2. Endpoints That Already Match (No Changes Needed)

These endpoints already exist in your backend and the frontend calls them correctly:

| Frontend Call | Method | Backend URL | Status |
|---|---|---|---|
| `authService.login()` | POST | `/api/users/auth/login/` | OK (SimpleJWT TokenObtainPairView) |
| `authService.register()` | POST | `/api/users/register/` | OK (RegisterView) |
| `authService.forgotPassword()` | POST | `/api/users/auth/password-reset/` | OK |
| `authService.resetPassword()` | POST | `/api/users/auth/password-reset/confirm/` | OK |
| `userService.getProfile()` | GET | `/api/users/me/` | OK (UserProfileView) |
| `userService.updateProfile()` | PATCH | `/api/users/me/` | OK |
| `userService.getWallet()` | GET | `/api/wallet/me/` | OK (WalletViewSet @action) |
| `userService.getStats()` | GET | `/api/v1/stats/` | OK (user_stats_view) |
| `walletService.initializePayment()` | POST | `/api/paystack/init/` | OK |
| `transactionService.list()` | GET | `/api/transactions/` | OK (TransactionViewSet) |
| `transactionService.detail()` | GET | `/api/transactions/{id}/` | OK |
| `transactionService.create()` | POST | `/api/transactions/` | OK (CreateTransactionSerializer) |
| `catalogService.getElectricityProviders()` | GET | `/api/catalog/electricity/` | OK |
| `catalogService.getCableTVProviders()` | GET | `/api/catalog/cable-tv/` | OK |
| `catalogService.getDataPlans()` | GET | `/api/catalog/data-plans/` | OK |
| `catalogService.validateCustomerAccount()` | GET | `/api/catalog/validate/` | OK |
| `catalogService.getProviderStatus()` | GET | `/api/v1/providers/status/` | OK |
| `adminService.listUsers()` | GET | `/api/users/` | OK (UserViewSet, IsAdminUser) |
| `adminService.getUser()` | GET | `/api/users/{id}/` | OK |
| `adminService.updateUser()` | PATCH | `/api/users/{id}/` | OK |
| `adminService.suspendUser()` | PATCH | `/api/users/{id}/` with `{is_active: false}` | OK |
| `adminService.activateUser()` | PATCH | `/api/users/{id}/` with `{is_active: true}` | OK |
| `adminService.listTransactions()` | GET | `/api/transactions/` | OK |
| Token refresh | POST | `/api/users/auth/token/refresh/` | OK |

---

## 3. Endpoints You Need to FIX in Your Backend

### 3.1 Paystack Verify URL (typo in services/urls.py)

**Current (broken):**
```python
path("paystack/verify//", verify_payment),
```

**Fix to:**
```python
path("paystack/verify/<str:reference>/", verify_payment),
```

The double slash and missing `<str:reference>` path converter means the
`verify_payment(request, reference)` view never receives the reference parameter.
The frontend calls `GET /api/paystack/verify/{reference}/`.

---

## 4. Endpoints You Need to ADD to Your Backend

The frontend's admin pages call these endpoints that don't exist yet. You need
to add them to your Django backend.

### 4.1 Admin Dashboard Stats

**Frontend calls:** `GET /api/admin/stats/`

**Expected response:**
```json
{
  "total_users": 150,
  "total_transactions": 1200,
  "total_revenue": 450000.00,
  "active_users": 120,
  "pending_fund_requests": 5
}
```

**Add to services/views.py:**
```python
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    from django.db.models import Sum, Count, Q
    from users.models import User
    from transactions.models import Transaction
    from .models import WalletFunding

    return Response({
        "total_users": User.objects.count(),
        "total_transactions": Transaction.objects.count(),
        "total_revenue": Transaction.objects.filter(
            status='SUCCESS'
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        "active_users": User.objects.filter(is_active=True).count(),
        "pending_fund_requests": WalletFunding.objects.filter(status='pending').count(),
    })
```

### 4.2 Admin Daily Volume (for charts)

**Frontend calls:** `GET /api/admin/daily-volume/`

**Expected response:**
```json
[
  {"date": "2026-07-01", "volume": 15000.00, "count": 45},
  {"date": "2026-07-02", "volume": 22000.00, "count": 62}
]
```

**Add to services/views.py:**
```python
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_daily_volume_view(request):
    from django.db.models.functions import TruncDate
    from transactions.models import Transaction

    stats = Transaction.objects.filter(
        status='SUCCESS'
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        volume=Sum('amount'),
        count=Count('id')
    ).order_by('-date')[:30]

    return Response(list(stats))
```

### 4.3 Admin Wallet Adjustment

**Frontend calls:** `POST /api/admin/wallet/adjust/`

**Expected request:**
```json
{
  "user_id": "uuid-string",
  "amount": 5000.00,
  "action": "credit",
  "note": "Manual adjustment"
}
```

**Expected response:**
```json
{"message": "Wallet adjusted successfully"}
```

**Add to services/views.py:**
```python
@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_wallet_adjust_view(request):
    from users.models import User

    user_id = request.data.get('user_id')
    amount = Decimal(str(request.data.get('amount', 0)))
    action = request.data.get('action')
    note = request.data.get('note', 'Admin adjustment')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    wallet = user.wallet
    if action == 'credit':
        wallet.credit(amount, description=f"Admin credit: {note}")
    elif action == 'debit':
        wallet.debit(amount, description=f"Admin debit: {note}")
    else:
        return Response({"error": "Invalid action"}, status=400)

    return Response({"message": "Wallet adjusted successfully"})
```

### 4.4 Admin Fund Requests (list, approve, reject)

**Frontend calls:**
- `GET /api/admin/fund-requests/` — list pending fund requests
- `POST /api/admin/fund-requests/{id}/approve/` — approve
- `POST /api/admin/fund-requests/{id}/reject/` — reject with `{reason: "..."}`

**Add to services/views.py:**
```python
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_fund_requests(request):
    status_filter = request.query_params.get('status', 'pending')
    fundings = WalletFunding.objects.filter(
        status=status_filter
    ).order_by('-created_at')
    return Response(list(fundings.values(
        'id', 'user', 'amount', 'reference', 'status', 'created_at'
    )))

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_fund_request(request, pk):
    try:
        funding = WalletFunding.objects.get(pk=pk, status='pending')
    except WalletFunding.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    with db_transaction.atomic():
        funding.status = 'success'
        funding.save()
        wallet = funding.user.wallet
        wallet.credit(funding.amount, description=f"Admin approved funding: {funding.reference}")

    return Response({"message": "Fund request approved"})

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_fund_request(request, pk):
    try:
        funding = WalletFunding.objects.get(pk=pk, status='pending')
    except WalletFunding.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    funding.status = 'failed'
    funding.save()
    return Response({"message": "Fund request rejected"})
```

### 4.5 Admin Services Management

**Frontend calls:**
- `GET /api/admin/services/` — list all services (electricity providers, cable providers, data plans)
- `PATCH /api/admin/services/{id}/` — toggle active state or update

**Add to services/views.py:**
```python
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_services(request):
    electricity = ElectricityProvider.objects.all().values('id', 'name', 'code', 'is_active')
    cable = CableTVProvider.objects.all().values('id', 'name', 'code', 'is_active')
    data_plans = DataPlan.objects.all().values('id', 'network', 'name', 'code', 'amount', 'is_active')
    return Response({
        "electricity": list(electricity),
        "cable_tv": list(cable),
        "data_plans": list(data_plans),
    })

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_update_service(request, service_type, pk):
    model_map = {
        'electricity': ElectricityProvider,
        'cable_tv': CableTVProvider,
        'data_plans': DataPlan,
    }
    model = model_map.get(service_type)
    if not model:
        return Response({"error": "Invalid service type"}, status=400)

    try:
        obj = model.objects.get(pk=pk)
    except model.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    if 'is_active' in request.data:
        obj.is_active = request.data['is_active']
        obj.save()
    return Response({"message": "Service updated"})
```

### 4.6 Wallet Transactions Endpoint

**Frontend calls:** `GET /api/wallet-transactions/`

This already exists via `WalletTransactionViewSet` in your router, but the
default `ModelViewSet` allows all CRUD operations. Consider restricting to
read-only:

```python
class WalletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WalletTransaction.objects.all()
    serializer_class = WalletTransactionSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return WalletTransaction.objects.filter(wallet__user=self.request.user)
        return WalletTransaction.objects.none()
```

---

## 5. URL Configuration Updates

Add the new admin endpoints to `services/urls.py`:

```python
from .views import (
    # ... existing imports ...
    admin_stats_view,
    admin_daily_volume_view,
    admin_wallet_adjust_view,
    admin_list_fund_requests,
    admin_approve_fund_request,
    admin_reject_fund_request,
    admin_list_services,
    admin_update_service,
)

urlpatterns = [
    # ... existing patterns ...

    # Fix: Paystack verify (remove the double-slash typo)
    path("paystack/verify/<str:reference>/", verify_payment),

    # Admin endpoints
    path("admin/stats/", admin_stats_view),
    path("admin/daily-volume/", admin_daily_volume_view),
    path("admin/wallet/adjust/", admin_wallet_adjust_view),
    path("admin/fund-requests/", admin_list_fund_requests),
    path("admin/fund-requests/<int:pk>/approve/", admin_approve_fund_request),
    path("admin/fund-requests/<int:pk>/reject/", admin_reject_fund_request),
    path("admin/services/", admin_list_services),
    path("admin/services/<str:service_type>/<int:pk>/", admin_update_service),
]
```

---

## 6. CORS Configuration

Make sure your `CORS_ALLOWED_ORIGINS` in `config/settings.py` includes your
frontend URL:

```python
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv()
)
```

---

## 7. Transaction Create Payload

The frontend sends this payload to `POST /api/transactions/`:

**Airtime:**
```json
{
  "type": "AIRTIME",
  "network": "MTN",
  "amount": 500,
  "phone_number": "08012345678"
}
```

**Data:**
```json
{
  "type": "DATA",
  "network": "MTN",
  "amount": 350,
  "phone_number": "08012345678",
  "metadata": {"plan_code": "mtn_1gb"}
}
```

**Electricity:**
```json
{
  "type": "ELECTRICITY",
  "amount": 5000,
  "phone_number": "08012345678",
  "metadata": {
    "disco": "IKEDC",
    "meter_number": "1234567890",
    "meter_type": "PREPAID"
  }
}
```

**Cable TV:**
```json
{
  "type": "CABLE_TV",
  "amount": 12500,
  "phone_number": "08012345678",
  "metadata": {
    "provider_name": "DSTV",
    "smartcard_number": "1234567890",
    "package_code": "compact"
  }
}
```

This matches your `CreateTransactionSerializer` exactly.

---

## 8. JWT Token Format

The frontend expects SimpleJWT's standard response:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

Your `TokenObtainPairView` already returns this. The frontend stores both
tokens and sends `Authorization: Bearer <access>` on every request. When the
access token expires, it automatically refreshes via
`POST /api/users/auth/token/refresh/` with `{refresh: "..."}`.

---

## 9. Summary of Changes

| What | Where | Action |
|---|---|---|
| Fix paystack verify URL | `services/urls.py` | Change `paystack/verify//` to `paystack/verify/<str:reference>/` |
| Add admin stats | `services/views.py` + `services/urls.py` | New `admin_stats_view` |
| Add admin daily volume | `services/views.py` + `services/urls.py` | New `admin_daily_volume_view` |
| Add admin wallet adjust | `services/views.py` + `services/urls.py` | New `admin_wallet_adjust_view` |
| Add admin fund requests | `services/views.py` + `services/urls.py` | 3 new views (list, approve, reject) |
| Add admin services | `services/views.py` + `services/urls.py` | 2 new views (list, update) |
| Restrict WalletTransactionViewSet | `wallet/api.py` | Change to ReadOnlyModelViewSet |
| CORS | `config/settings.py` | Ensure frontend URL is in `CORS_ALLOWED_ORIGINS` |
