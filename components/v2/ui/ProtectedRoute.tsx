import React from 'react';
import { useUser } from '@/lib/v2/contexts/UserContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActive?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireActive = false,
  fallback 
}) => {
  const { user, loading } = useUser();

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  if (requireActive && user.status !== 'active') {
    if (typeof window !== 'undefined') {
      window.location.href = '/onboarding';
    }
    return null;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
