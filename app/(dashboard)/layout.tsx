import React from 'react';
import DashboardProviders from './providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProviders>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </DashboardProviders>
  );
}
