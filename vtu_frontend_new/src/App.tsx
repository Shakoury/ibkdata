import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FullScreenLoader } from '@/components/ui/Spinner';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastStore } from '@/store/toastStore';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/api/services/auth';

// Public pages
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const SetupPinPage = lazy(() => import('@/pages/auth/SetupPinPage').then(m => ({ default: m.SetupPinPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Customer
const CustomerLayout = lazy(() => import('@/layouts/CustomerLayout').then(m => ({ default: m.CustomerLayout })));
const DashboardPage = lazy(() => import('@/pages/customer/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TopUpPage = lazy(() => import('@/pages/customer/TopUpPage').then(m => ({ default: m.TopUpPage })));
const BuyAirtimePage = lazy(() => import('@/pages/customer/BuyAirtimePage').then(m => ({ default: m.BuyAirtimePage })));
const BuyDataPage = lazy(() => import('@/pages/customer/BuyDataPage').then(m => ({ default: m.BuyDataPage })));
const PayElectricityPage = lazy(() => import('@/pages/customer/PayElectricityPage').then(m => ({ default: m.PayElectricityPage })));
const PayCablePage = lazy(() => import('@/pages/customer/PayCablePage').then(m => ({ default: m.PayCablePage })));
const FundWalletPage = lazy(() => import('@/pages/customer/FundWalletPage').then(m => ({ default: m.FundWalletPage })));
const TransactionHistoryPage = lazy(() => import('@/pages/customer/TransactionHistoryPage').then(m => ({ default: m.TransactionHistoryPage })));
const TransactionDetailPage = lazy(() => import('@/pages/customer/TransactionDetailPage').then(m => ({ default: m.TransactionDetailPage })));
const WalletHistoryPage = lazy(() => import('@/pages/customer/WalletHistoryPage').then(m => ({ default: m.WalletHistoryPage })));
const SettingsPage = lazy(() => import('@/pages/customer/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Admin
const AdminLayout = lazy(() => import('@/layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminTransactionsPage = lazy(() => import('@/pages/admin/AdminTransactionsPage').then(m => ({ default: m.AdminTransactionsPage })));
const AdminServicesPage = lazy(() => import('@/pages/admin/AdminServicesPage').then(m => ({ default: m.AdminServicesPage })));
const AdminWalletPage = lazy(() => import('@/pages/admin/AdminWalletPage').then(m => ({ default: m.AdminWalletPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

function AppRoutes() {
  const logout = useAuthStore((s) => s.logout);
  const toast = useToast();

  useSessionTimeout(() => {
    logout();
    toast.warning('Session expired. Please sign in again.');
  });

  // Auto-logout on 401 refresh failure
  useEffect(() => {
    const handler = async () => {
      try {
        await authService.logout();
      } catch {
        // server may already be unreachable
      }
      logout();
      toast.error('Your session has expired.');
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout, toast]);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/setup-pin" element={<SetupPinPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Customer app */}
        <Route path="/app" element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="topup" element={<TopUpPage />} />
          <Route path="airtime" element={<BuyAirtimePage />} />
          <Route path="data" element={<BuyDataPage />} />
          <Route path="electricity" element={<PayElectricityPage />} />
          <Route path="cable" element={<PayCablePage />} />
          <Route path="fund" element={<FundWalletPage />} />
          <Route path="transactions" element={<TransactionHistoryPage />} />
          <Route path="transactions/:id" element={<TransactionDetailPage />} />
          <Route path="history" element={<WalletHistoryPage />} />
          <Route path="profile" element={<SettingsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute admin><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="wallet" element={<AdminWalletPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const { toasts, dismiss } = useToastStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
