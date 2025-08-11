"use client";
import Link from "next/link";
import { useAuth } from "@/components/context/AuthContext";
import Logo from "@/components/ui/Logo";
import { useState } from "react";

export default function NavBar() {
  const { user, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <nav className="w-full sticky top-0 z-40 bg-white/80 dark:bg-black/30 backdrop-blur border-b border-black/10 dark:border-white/15">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Logo />

        {/* Desktop nav */}
        {!loading && (
          user ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
              <button
                className="h-9 px-3 rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-5 text-sm">
              <Link href="/#features" className="text-gray-700 dark:text-gray-200 hover:underline">Features</Link>
              <Link href="/#how-it-works" className="text-gray-700 dark:text-gray-200 hover:underline">How it works</Link>
              <Link href="/#beta" className="text-gray-700 dark:text-gray-200 hover:underline">Beta access</Link>
              <Link href="/login" className="text-gray-700 dark:text-gray-200 hover:underline">Sign in</Link>
              <Link
                href="/access"
                className="h-9 px-4 rounded-md text-white"
                style={{ backgroundColor: "var(--brand-puce)" }}
              >
                Sign up
              </Link>
            </div>
          )
        )}

        {/* Mobile toggle */}
        {!loading && (
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {open && !loading && (
        <div className="md:hidden" id="mobile-menu">
          {/* overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={close}
            aria-hidden
          />
          {/* panel */}
          <div className="fixed top-0 right-0 z-50 h-full w-80 max-w-[80%] bg-white dark:bg-zinc-900 border-l border-black/10 dark:border-white/10 shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
                onClick={close}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {user ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.email}</span>
                <button
                  className="h-10 rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => { close(); signOut(); }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <nav className="flex flex-col gap-3 text-base">
                <Link href="/#features" onClick={close} className="px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10">Features</Link>
                <Link href="/#how-it-works" onClick={close} className="px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10">How it works</Link>
                <Link href="/#beta" onClick={close} className="px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10">Beta access</Link>
                <Link href="/login" onClick={close} className="px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10">Sign in</Link>
                <Link
                  href="/access"
                  onClick={close}
                  className="mt-2 h-10 inline-flex items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: "var(--brand-puce)" }}
                >
                  Sign up
                </Link>
              </nav>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
