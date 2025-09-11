"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { getPostLoginRedirect } from "@/utils/userFlow";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Track if we've already handled the initial redirect
  const [hasHandledInitialRedirect, setHasHandledInitialRedirect] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      // Handle Supabase auth callback parameters on initial load
      try {
        if (typeof window !== 'undefined') {
          const href = window.location.href;
          const url = new URL(href);
          const params = url.searchParams;
          const hash = window.location.hash || '';

          let didAuthCallback = false;

          // New PKCE code flow
          const code = params.get('code');
          if (code) {
            try {
              await supabase.auth.exchangeCodeForSession(href);
              didAuthCallback = true;
            } catch (e) {
              console.warn('[AuthProvider] exchangeCodeForSession failed', e);
            }
          }

          // Token hash flow (email confirmation)
          const tokenHash = params.get('token_hash');
          const type = params.get('type');
          if (!didAuthCallback && tokenHash && (type === 'signup' || type === 'magiclink' || type === 'recovery')) {
            try {
              await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
              didAuthCallback = true;
            } catch (e) {
              console.warn('[AuthProvider] verifyOtp failed', e);
            }
          }

          // Legacy hash-based tokens in URL fragment
          if (!didAuthCallback && hash.includes('access_token') && hash.includes('refresh_token')) {
            const frag = new URLSearchParams(hash.replace(/^#/, ''));
            const access_token = frag.get('access_token') || undefined;
            const refresh_token = frag.get('refresh_token') || undefined;
            if (access_token && refresh_token) {
              try {
                await supabase.auth.setSession({ access_token, refresh_token });
                didAuthCallback = true;
              } catch (e) {
                console.warn('[AuthProvider] setSession from hash failed', e);
              }
            }
          }

          // Clean auth params from URL after handling
          if (didAuthCallback) {
            try {
              const cleanUrl = `${url.origin}${url.pathname}`;
              window.history.replaceState({}, document.title, cleanUrl);
            } catch {}
          }
        }
      } catch (e) {
        // Non-fatal; proceed to session fetch
      }

      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Handle post-login redirection
      if (event === 'SIGNED_IN' && session?.user && !hasHandledInitialRedirect) {
        setHasHandledInitialRedirect(true);
        
        // Don't redirect if user is already on login/register pages or if they're on the target pages
        const isOnAuthPage = pathname === '/login' || pathname === '/register';
        const isOnTargetPage = pathname === '/survey' || pathname === '/dashboard';
        
        if (isOnAuthPage || !isOnTargetPage) {
          try {
            const redirectPath = await getPostLoginRedirect(session.user.id);
            router.push(redirectPath);
          } catch (error) {
            console.error('Error determining redirect path:', error);
            // Fallback to dashboard if there's an error
            router.push('/dashboard');
          }
        }
      }
      
      // Reset redirect flag when user signs out
      if (event === 'SIGNED_OUT') {
        setHasHandledInitialRedirect(false);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, pathname, hasHandledInitialRedirect]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      router.push('/login');
      // In some test environments, Next.js router may not implement refresh
      // Use optional chaining to avoid throwing in tests
      (router as any)?.refresh?.();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
