// Unit tests for AuthContext component
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
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

// Helper to cast auth methods to jest.Mock for TS
const getSessionMock = mockSupabase.auth.getSession as unknown as jest.Mock;
const onAuthStateChangeMock = mockSupabase.auth.onAuthStateChange as unknown as jest.Mock;
const signOutMock = mockSupabase.auth.signOut as unknown as jest.Mock;
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
    it('should start in loading state', async () => {
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      // Wait for loaded state
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });

    it('should load existing session on mount', async () => {
      getSessionMock.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email ?? '');
        expect(screen.getByTestId('session')).toHaveTextContent('has session');
      });
    });

    it('should handle no existing session', async () => {
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user')).toHaveTextContent('no user');
        expect(screen.getByTestId('session')).toHaveTextContent('no session');
      });
    });
  });

  describe('authentication state changes', () => {
    it('should handle SIGNED_IN event with post-login redirect', async () => {
      getSessionMock.mockResolvedValueOnce({
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
      const authStateChangeCallback = onAuthStateChangeMock.mock.calls[0][0];

      // After SIGNED_IN, session should be present
      getSessionMock.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      });

      // Simulate SIGNED_IN event
      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email ?? '');
        expect(screen.getByTestId('session')).toHaveTextContent('has session');
        expect(mockGetPostLoginRedirect).toHaveBeenCalledWith(mockUser.id);
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect even when user is on auth pages', async () => {
      // Mock pathname to be login page
      mockUsePathname.mockReturnValue('/login');
      mockGetPostLoginRedirect.mockResolvedValue('/dashboard');

      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      const authStateChangeCallback = onAuthStateChangeMock.mock.calls[0][0];

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

      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      const authStateChangeCallback = onAuthStateChangeMock.mock.calls[0][0];

      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Should not redirect since user is already on target page
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle SIGNED_OUT event', async () => {
      getSessionMock.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email ?? '');
      });

      const authStateChangeCallback = onAuthStateChangeMock.mock.calls[0][0];

      // After SIGNED_OUT, session should be null
      getSessionMock.mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

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
      getSessionMock.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      signOutMock.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email ?? '');
      });

      const signOutButton = screen.getByTestId('signout');
      
      await act(async () => {
        signOutButton.click();
      });

      expect(signOutMock).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle getSession errors gracefully', async () => {
      getSessionMock.mockResolvedValue({
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
      // Initial session is null
      getSessionMock.mockResolvedValueOnce({
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

      // Get the callback function passed to onAuthStateChange
      const authStateChangeCallback = onAuthStateChangeMock.mock.calls[0][0];

      // After SIGNED_IN, session should be present
      getSessionMock.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      });

      await act(async () => {
        await authStateChangeCallback('SIGNED_IN', mockSession);
      });

      // Should still update auth state even if redirect fails
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email ?? '');
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
