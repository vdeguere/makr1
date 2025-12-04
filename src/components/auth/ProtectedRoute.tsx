import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole, UserRole } from '@/contexts/RoleContext';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { activeRole, loading: roleLoading } = useRole();

  // Debug current route guard evaluation in development
  logger.debug('[ProtectedRoute]', {
    path: location.pathname,
    activeRole,
    requiredRole,
    allowed: (() => {
      if (!requiredRole) return true;
      if (activeRole === 'dev') return true;
      if (Array.isArray(requiredRole)) {
        return (requiredRole as UserRole[]).includes(activeRole as UserRole);
      }
      return activeRole === requiredRole;
    })(),
  });

  const isAllowed = () => {
    if (!requiredRole) return true;
    if (activeRole === 'dev') return true;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(activeRole as UserRole);
    }
    return activeRole === requiredRole;
  };
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

useEffect(() => {
  if (
    !authLoading &&
    !roleLoading &&
    user &&
    requiredRole &&
    !isAllowed()
  ) {
    logger.debug('[ProtectedRoute] access denied', { path: location.pathname, activeRole, requiredRole });
    // Intentionally do not redirect; show the 403 fallback UI
  }
}, [user, activeRole, authLoading, roleLoading, requiredRole, location.pathname]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

if (requiredRole && !isAllowed()) {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <p className="text-xl font-semibold mb-2">You don’t have access to this page.</p>
        <p className="text-muted-foreground">
          Your role: {String(activeRole) || 'unknown'}. Required: {Array.isArray(requiredRole) ? (requiredRole as UserRole[]).join(', ') : requiredRole}
        </p>
      </div>
    </div>
  );
}

  return <>{children}</>;
}
