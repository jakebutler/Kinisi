import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabaseServer';

export interface AuthContext {
  user: {
    id: string;
    email?: string;
  };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

/**
 * Middleware to authenticate API requests
 * @param req - Next.js request object
 * @returns Promise<AuthContext> - User and Supabase client
 * @throws {Error} - If user is not authenticated
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized - No user found');
  }

  return {
    user: {
      id: user.id,
      email: user.email
    },
    supabase
  };
}

/**
 * Middleware to optionally authenticate API requests
 * @param req - Next.js request object
 * @returns Promise<AuthContext | null> - User and Supabase client if authenticated, null otherwise
 */
export async function optionalAuth(req: NextRequest): Promise<AuthContext | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email
      },
      supabase
    };
  } catch (error) {
    return null;
  }
}