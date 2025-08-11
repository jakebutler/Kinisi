"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage("Password reset email sent. Check your inbox.");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        className="w-full max-w-sm bg-white p-8 rounded shadow"
        onSubmit={handleReset}
        aria-label="Forgot password form"
      >
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <label className="block mb-4" htmlFor="email">
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
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {message && <div className="mb-2 text-green-700">{message}</div>}
        <button
          type="submit"
          className="w-full btn-gradient text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
        <div className="flex justify-between mt-4 text-sm">
          <Link href="/login" className="text-[var(--brand-puce)] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
