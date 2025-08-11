"use client";
import { useState } from "react";
import Link from "next/link";

interface AuthFormProps {
  formType: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function AuthForm({ formType, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    await onSubmit(email, password);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        className="w-full max-w-sm bg-white p-8 rounded shadow"
        onSubmit={handleSubmit}
        aria-label={`${formType === "login" ? "Login" : "Register"} form`}
      >
        <h1 className="text-2xl font-bold mb-4">
          {formType === "login" ? "Sign In" : "Register"}
        </h1>
        <label className="block mb-2" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={formType === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        {success && <div className="mb-2 text-green-700">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? formType === "login"
              ? "Signing in..."
              : "Registering..."
            : formType === "login"
            ? "Sign In"
            : "Register"}
        </button>
        <div className="flex justify-between mt-4 text-sm">
          {formType === "login" ? (
            <>
              <Link href="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
