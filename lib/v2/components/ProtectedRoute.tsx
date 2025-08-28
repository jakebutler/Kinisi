'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  requireActive?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
  requireActive = false
}) => {
  const { user, userStatus, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect to login if authentication required but user not logged in
    if (requireAuth && !user) {
      router.push('/login');
      return;
    }

    // Redirect to onboarding if user is authenticated but hasn't completed onboarding
    if (requireActive && user && userStatus === 'onboarding') {
      router.push('/survey');
      return;
    }

    // Redirect to dashboard if user is active but trying to access onboarding
    if (requireOnboarding && user && userStatus === 'active') {
      router.push('/fitness-program');
      return;
    }
  }, [user, userStatus, loading, router, requireAuth, requireOnboarding, requireActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(204,136,153)] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
