import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute component
 * STRICTLY requires authentication - NO EXCEPTIONS
 * Dashboard and other protected pages MUST have valid authentication
 * Redirects to login immediately if user is not authenticated
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // While authentication is being verified, show loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        fontSize: '14px'
      }}>
        Verifying authentication...
      </div>
    );
  }

  // STRICT CHECK: No user = No access
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected component
  return children;
}

/**
 * PublicRoute component
 * Wraps routes that should only be accessible when NOT authenticated (login, signup)
 * Redirects to dashboard if user is already authenticated
 */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // While authentication is being verified, show loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        fontSize: '14px'
      }}>
        Loading...
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is not authenticated, render the public page (login/signup)
  return children;
}
