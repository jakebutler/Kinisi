import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '@/lib/v2/contexts/UserContext';
import { supabase as mockedSupabase } from '@/utils/supabaseClient';

// Mock Supabase client to match actual export shape: { supabase }
jest.mock('@/utils/supabaseClient', () => {
  const supabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({ select: jest.fn().mockReturnThis() })),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
  return { supabase, default: supabase };
});

// Test component to access context
const TestComponent = () => {
  const { user, userStatus, loading } = useUser();
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="status">{userStatus}</div>
    </div>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    // Re-apply implementations because jest.resetMocks=true clears them before each test
    (mockedSupabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (mockedSupabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    (mockedSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  it('provides initial state', async () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
    
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('status')).toHaveTextContent('onboarding');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUser must be used within a UserProvider');
    
    consoleSpy.mockRestore();
  });
});
