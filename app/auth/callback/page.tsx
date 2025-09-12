"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

function parseHashTokens(hash: string): { access_token?: string; refresh_token?: string } {
  const out: Record<string, string> = {};
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const pair of h.split("&")) {
    const [k, v] = pair.split("=");
    if (k && v) out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return { access_token: out.access_token, refresh_token: out.refresh_token };
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let watchdog: number | undefined;

    async function run() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const token_hash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type") as
          | "signup"
          | "magiclink"
          | "recovery"
          | "invite"
          | null;
        const next = url.searchParams.get("next") || "/survey";

        if (code) {
          setMessage("Finishing sign-in...");
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else if (token_hash && type) {
          setMessage("Verifying email...");
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
        } else if (window.location.hash && /access_token=|refresh_token=/.test(window.location.hash)) {
          setMessage("Restoring session...");
          const tokens = parseHashTokens(window.location.hash);
          if (tokens.access_token && tokens.refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            });
            if (error) throw error;
          }
        }

        if (!cancelled) {
          // Clean URL: drop query and hash to avoid route guards thinking callback is still in progress
          window.history.replaceState({}, "", url.pathname);
          // Also clear any lingering hash explicitly
          if (window.location.hash) {
            window.location.hash = "";
          }
          // Slight delay to give providers a tick to observe the new session
          setTimeout(() => {
            if (!cancelled) router.replace(next);
          }, 0);
        }
      } catch (e: any) {
        console.error("[auth/callback] Error:", e);
        if (!cancelled) {
          setError(e?.message || "Unable to complete sign-in");
          setMessage("");
        }
      }
    }

    run();
    // Watchdog: if something stalls, try to push forward after 2s
    watchdog = window.setTimeout(() => {
      if (!cancelled) {
        try {
          const url = new URL(window.location.href);
          const next = url.searchParams.get("next") || "/survey";
          window.history.replaceState({}, "", url.pathname);
          router.replace(next);
        } catch {}
      }
    }, 2000);
    return () => {
      cancelled = true;
      if (watchdog) window.clearTimeout(watchdog);
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">We couldn't finish signing you in</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="px-4 py-2 rounded bg-[rgb(204,136,153)] text-white hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(204,136,153)] mx-auto"></div>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
