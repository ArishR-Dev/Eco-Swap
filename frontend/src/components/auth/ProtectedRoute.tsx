import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useRoleRedirect } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { AuthLoader } from './AuthLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const roleRedirect = useRoleRedirect();

  if (loading) return <AuthLoader />;

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
}

// Component for public routes that should redirect if already logged in
interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const roleRedirect = useRoleRedirect();

  if (loading) return <AuthLoader />;

  if (isAuthenticated) {
    return <Navigate to={roleRedirect} replace />;
  }

  return <>{children}</>;
}
