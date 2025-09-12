'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { useEffect, useState } from 'react';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [callbackInProgress, setCallbackInProgress] = useState(false);
  // Detect Supabase auth callback params and pause redirects until AuthProvider processes them
  const detectCallbackParams = () => {
    if (typeof window === 'undefined') return false;
    const url = new URL(window.location.href);
    const hasCode = !!url.searchParams.get('code');
    const hasTokenHash = !!url.searchParams.get('token_hash');
    const hash = window.location.hash || '';
    const hasHashTokens = /access_token=|refresh_token=/.test(hash);
    return hasCode || hasTokenHash || hasHashTokens;
  };

  useEffect(() => {
    // Re-evaluate when path or search changes
    const hasParams = detectCallbackParams();
    setCallbackInProgress(hasParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    if (loading || callbackInProgress) return;

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
  }, [user, userStatus, loading, callbackInProgress, router, requireAuth, requireOnboarding, requireActive]);

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

  if (callbackInProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(204,136,153)] mx-auto"></div>
          <p className="mt-2 text-gray-600">Signing you in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
