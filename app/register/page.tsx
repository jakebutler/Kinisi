"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, accessCode }),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const msg = (
          data &&
          typeof data === 'object' &&
          'error' in data &&
          typeof (data as { error?: unknown }).error === 'string'
        ) ? (data as { error: string }).error : "An error occurred during registration.";
        setError(msg);
        return;
      }

      setSuccess("Registration successful! Please check your email for a confirmation link.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
      <form
        className="w-full max-w-sm bg-white p-8 rounded shadow"
        onSubmit={handleRegister}
        aria-label="Register form"
      >
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <label className="block mb-2" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block mb-4" htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
        <label className="block mb-4" htmlFor="accessCode">
          Access Code
          <input
            id="accessCode"
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            required
          />
        </label>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium mb-1">We couldn't complete your registration.</p>
            <p>{error}</p>
            {error.toLowerCase().includes('email service not configured') && (
              <div className="mt-2 text-red-700">
                <p className="font-medium">Developer hint:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Set <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> in your environment.</li>
                  <li>In production, ensure the email provider domain is verified.</li>
                </ul>
              </div>
            )}
            {error.toLowerCase().includes('too many requests') && (
              <p className="mt-2">Please wait a minute and try again.</p>
            )}
            {error.toLowerCase().includes('invalid access code') && (
              <p className="mt-2">If you don't have an access code, please contact support.</p>
            )}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-medium mb-1">{success}</p>
            <p>If you don’t see the email, check your spam folder. Keep this tab open; you’ll be redirected and signed in after confirmation.</p>
          </div>
        )}
        <button
          type="submit"
          className="w-full btn-primary disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <div className="flex justify-between mt-4 text-sm">
          <Link href="/login" className="text-[var(--brand-puce)] hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RegisterPage), { ssr: false });
