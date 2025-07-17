// Unit tests for AuthContext component
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../components/context/AuthContext';
import { supabase } from '../../../utils/supabaseClient';
import { getPostLoginRedirect } from '../../../utils/userFlow';
import { mockUser, mockSession } from '../../fixtures/users';

// Mock dependencies
jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

jest.mock('../../../utils/userFlow');

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  usePathname: () => mockUsePathname()
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockGetPostLoginRedirect = getPostLoginRedirect as jest.MockedFunction<typeof getPostLoginRedirect>;

// Test component to access auth context
const TestComponent = () => {
  const { user, session, loading, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <div data-testid="session">{session ? 'has session' : 'no session'}</div>
      <button onClick={signOut} data-testid="signout">Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  let mockOnAuthStateChange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOnAuthStateChange = jest.fn();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockUsePathname.mockReturnValue('/');
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
  });

  describe('initialization', () => {
    it('should start in loading state', () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should load existing session on mount', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
        expect(screen.getByTestId('session')).toHaveTextContent('has session');
      });
    });

    it('should handle no existing session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user')).toHaveTextContent('no user');
        expect(screen.getByTestId('session')).toHaveTextContent('no session');
      });
    });
  });

  describe('authentication state changes', () => {
    it('should handle SIGNED_IN event with post-login redirect', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      mockGetPostLoginRedirect.mockResolvedValue('/dashboard');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Get the callback function passed to onAuthStateChange
      const authStateChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      // Simulate SIGNED_IN event
      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
        expect(screen.getByTestId('session')).toHaveTextContent('has session');
        expect(mockGetPostLoginRedirect).toHaveBeenCalledWith(mockUser.id);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect even when user is on auth pages', async () => {
      // Mock pathname to be login page
      mockUsePathname.mockReturnValue('/login');
      mockGetPostLoginRedirect.mockResolvedValue('/dashboard');

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      const authStateChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Should redirect even from auth page after sign in
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should not redirect if user is already on target pages', async () => {
      // Mock pathname to be dashboard page
      mockUsePathname.mockReturnValue('/dashboard');

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      const authStateChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Should not redirect since user is already on target page
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle SIGNED_OUT event', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      const authStateChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      await act(async () => {
        await authStateChangeCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user');
        expect(screen.getByTestId('session')).toHaveTextContent('no session');
      });
    });
  });

  describe('signOut function', () => {
    it('should call supabase signOut when signOut is called', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });

      const signOutButton = screen.getByTestId('signout');
      
      await act(async () => {
        signOutButton.click();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle getSession errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user')).toHaveTextContent('no user');
      });
    });

    it('should handle post-login redirect errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      mockGetPostLoginRedirect.mockRejectedValue(new Error('Redirect error'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      const authStateChangeCallback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Should still update auth state even if redirect fails
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
