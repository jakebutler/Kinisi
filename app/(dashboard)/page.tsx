'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard page
    router.push('/fitness-program');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-puce)] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
