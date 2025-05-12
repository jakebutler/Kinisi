"use client";
import ProtectedRoute from "@/components/ui/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-700">This page is protected and only visible to authenticated users.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
