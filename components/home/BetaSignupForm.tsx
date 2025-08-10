"use client";

import React, { useEffect, useRef, useState } from 'react';

type State = {
  email: string;
  name: string;
  referral_source: string;
};

export default function BetaSignupForm() {
  const [state, setState] = useState<State>({ email: '', name: '', referral_source: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const STORAGE_KEY = 'beta_signup_status';

  const obfuscateEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visible = local.slice(0, 1);
    return `${visible}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
  };

  // Load persisted success state on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; at?: string };
        if (parsed?.email) {
          setSignedUpEmail(parsed.email);
          setMessage("Thanks — you’re on the early access list");
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: value }));
  };

  const isValidEmail = (email: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!isValidEmail(state.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/beta-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email.trim(),
          name: state.name.trim() || undefined,
          referral_source: state.referral_source.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 || (res.status === 200 && data?.success)) {
        const approvedCopy = "Thanks — you’re on the early access list";
        setMessage(approvedCopy);
        setSignedUpEmail(state.email.trim());
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ email: state.email.trim(), at: new Date().toISOString() })
          );
        } catch {}
        // Keep name/referral but clear email to avoid accidental resubmits
        setState((s) => ({ ...s, email: '' }));
      } else if (res.status === 400) {
        setError(data?.error || 'Please check your input and try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } catch {
      setError('Unable to submit at this time. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Focus management: when success appears, move focus to heading
  useEffect(() => {
    if (message && successHeadingRef.current) {
      successHeadingRef.current.focus();
    }
  }, [message]);

  const resetSignup = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSignedUpEmail(null);
    setMessage(null);
    setError(null);
    setState({ email: '', name: '', referral_source: '' });
    // Return focus to email input for convenience
    setTimeout(() => emailInputRef.current?.focus(), 0);
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md p-4 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/20 backdrop-blur">
      {!message ? (
        <>
          <h2 className="text-xl font-semibold mb-3">Request Beta Access</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Join the early access list and be the first to try Kinisi.</p>

          {error && (
            <div role="alert" className="mb-3 rounded-md bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={state.email}
                onChange={onChange}
                className="h-10 rounded-md px-3 border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium">Name (optional)</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={state.name}
                onChange={onChange}
                className="h-10 rounded-md px-3 border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="referral_source" className="text-sm font-medium">How did you hear about us? (optional)</label>
              <input
                id="referral_source"
                name="referral_source"
                type="text"
                value={state.referral_source}
                onChange={onChange}
                className="h-10 rounded-md px-3 border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 mt-2 rounded-md bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Request Access'}
            </button>
          </div>
        </>
      ) : (
        <div role="status" className="rounded-md">
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="text-xl font-semibold mb-2"
            aria-live="polite"
          >
            {message}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">We’ll email you when your invite is ready.</p>
          {signedUpEmail && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Email: {obfuscateEmail(signedUpEmail)}</p>
          )}
          <button
            type="button"
            onClick={resetSignup}
            className="h-10 px-4 rounded-md border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
          >
            Use a different email
          </button>
        </div>
      )}
    </form>
  );
}
