import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  isAuthenticated, 
  redirectPath = '/admin-login',
  children 
}) => {
  // If we're still determining authentication status, don't render anything yet
  if (isAuthenticated === undefined || isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;