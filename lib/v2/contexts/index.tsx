'use client';

import React from 'react';
import { UserProvider } from './UserContext';
import { UIProvider } from './UIContext';

export const V2Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </UserProvider>
  );
};

// Re-export hooks for convenience
export { useUser } from './UserContext';
export { useOnboarding } from './OnboardingContext';
export { useUI } from './UIContext';
