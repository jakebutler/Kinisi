'use client';

import React from 'react';
import { UserProvider, useUser } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';
import { OnboardingProvider } from '@/lib/v2/contexts/OnboardingContext';

function OnboardingLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <UIProvider>
      <OnboardingProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="flex-1 flex flex-col items-center px-4 py-6">
            <div className="w-full max-w-3xl">
              {children}
            </div>
          </div>
        </div>
      </OnboardingProvider>
    </UIProvider>
  );
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <OnboardingLayoutInner>
        {children}
      </OnboardingLayoutInner>
    </UserProvider>
  );
}
