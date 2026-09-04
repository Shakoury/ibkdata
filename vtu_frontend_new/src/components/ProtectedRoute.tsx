import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useProfile } from '@/hooks/useAuth';
import { FullScreenLoader } from '@/components/ui/Spinner';
import { tokenStorage } from '@/api/client';

export function ProtectedRoute({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const profile = useProfile();

  // Check token directly in case store hasn't hydrated yet
  const hasToken = !!tokenStorage.getAccess();

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile.isLoading && !user) return <FullScreenLoader />;

  if (admin && !profile.data?.is_staff) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
