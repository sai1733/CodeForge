import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Route guard to check user login status and roles
 * @param {string[]} allowedRoles - List of allowed roles for this route
 * @param {React.ReactNode} children - Children components to render if allowed
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Session...</h2>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but role is not allowed, redirect to correct default page
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'intern') {
      return <Navigate to="/intern/dashboard" replace />;
    } else if (user?.role === 'manager') {
      return <Navigate to="/manager/dashboard" replace />;
    } else if (user?.role === 'superadmin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Unknown role fallback
    return <Navigate to="/login" replace />;
  }

  // Render children or Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
