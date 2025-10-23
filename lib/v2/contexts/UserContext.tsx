'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { supabase } from '@/utils/supabaseClient';
import { hasCompletedOnboarding } from '@/utils/userFlow';
import { SupabaseSession } from '@/types/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface UserContextType {
  user: User | null;
  userStatus: UserStatus;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserStatus: (status: UserStatus) => void;
  refreshUserStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>('onboarding');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;

        if (session?.user) {
          // Determine user status based on onboarding completion
          const onboardingCompleted = await hasCompletedOnboarding(session.user.id);
          const status: UserStatus = onboardingCompleted ? 'active' : 'onboarding';

          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            status
          };
          setUser(userData);
          setUserStatus(status);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          // Determine user status based on onboarding completion
          const onboardingCompleted = await hasCompletedOnboarding(session.user.id);
          const status: UserStatus = onboardingCompleted ? 'active' : 'onboarding';

          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            status
          };
          setUser(userData);
          setUserStatus(status);
        } else {
          setUser(null);
          setUserStatus('onboarding');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshUserStatus = async () => {
    if (user?.id) {
      const onboardingCompleted = await hasCompletedOnboarding(user.id);
      setUserStatus(onboardingCompleted ? 'active' : 'onboarding');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserStatus('onboarding');
  };

  return (
    <UserContext.Provider value={{
      user,
      userStatus,
      loading,
      setUser,
      setUserStatus,
      refreshUserStatus,
      signOut
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
