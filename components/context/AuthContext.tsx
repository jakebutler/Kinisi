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
      const { data, error } = await supabase.auth.getSession();
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
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
