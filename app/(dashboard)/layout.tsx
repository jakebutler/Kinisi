'use client';

import React from 'react';
import { UserProvider } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <UIProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </div>
        </div>
      </UIProvider>
    </UserProvider>
  );
}
