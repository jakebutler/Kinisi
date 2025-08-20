"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        setError(data?.error || "An error occurred during registration.");
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
    <div className="flex min-h-screen items-center justify-center">
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
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-700">{success}</div>}
        <button
          type="submit"
          className="w-full btn-gradient text-white py-2 rounded disabled:opacity-50"
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
