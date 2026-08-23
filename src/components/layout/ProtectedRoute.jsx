import { Navigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * Route protection wrapper based on active mock session and user roles.
 * 
 * - Unauthenticated users are redirected to /login.
 * - Authenticated users attempting unauthorized role routes are redirected
 *   to their role's appropriate home page.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their role home page
    if (user.role === 'STUDENT' || user.role === 'STAFF') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'TECHNICIAN') {
      return <Navigate to="/technician" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
