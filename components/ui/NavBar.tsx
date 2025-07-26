"use client";
import Link from "next/link";
import { useAuth } from "@/components/context/AuthContext";

export default function NavBar() {
  const { user, signOut, loading } = useAuth();

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow">
      <Link href="/" className="font-bold text-xl text-blue-700">
        Kinisi
      </Link>
      <div className="flex items-center gap-4">
        {loading ? null : user ? (
          <>
            <span className="text-gray-700">{user.email}</span>
            <button
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
              onClick={signOut}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
