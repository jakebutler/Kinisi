"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
        </main>
      }
    >
      <AccessForm />
    </Suspense>
  );
}

function AccessForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/register';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Please enter your access code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/access-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        router.replace(next);
      } else if (res.status === 401) {
        setError('Incorrect access code.');
      } else if (res.status === 400) {
        setError(data?.error || 'Access code is required.');
      } else {
        setError('Unable to verify access at this time.');
      }
    } catch {
      setError('Unable to verify access at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-6 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/20 backdrop-blur"
      >
        <h1 className="text-2xl font-semibold mb-4">Enter Access Code</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Kinisi is currently in private beta. Enter your access code to continue.</p>

        {error && (
          <div role="alert" className="mb-3 rounded-md bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 mb-4">
          <label htmlFor="code" className="text-sm font-medium">Access Code</label>
          <input
            id="code"
            name="code"
            type="password"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-11 rounded-md px-3 border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-11 w-full rounded-md bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Verifying…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
