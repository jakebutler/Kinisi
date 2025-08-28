import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '@/lib/v2/contexts/UserContext';

// Mock Supabase client
jest.mock('@/utils/supabaseClient', () => ({
  createSupabaseClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null }
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      signOut: jest.fn().mockResolvedValue({})
    }
  })
}));

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
