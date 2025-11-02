import React, { createContext, useContext, useReducer, useState, useCallback, ReactNode, FormEvent } from 'react';
import { supabase } from '@/utils/supabaseClient';

// Types for AuthForm
interface AuthFormState {
  email: string;
  password: string;
  accessCode: string;
  loading: boolean;
  error: string | null;
  isSignUp: boolean;
  success: boolean;
}

type AuthFormAction =
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_ACCESS_CODE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_MODE' }
  | { type: 'SET_SUCCESS'; payload: boolean }
  | { type: 'RESET_FORM' };

interface AuthFormContextValue {
  state: AuthFormState;
  actions: {
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    setAccessCode: (accessCode: string) => void;
    handleSubmit: (e: FormEvent) => Promise<void>;
    toggleMode: () => void;
    resetForm: () => void;
  };
}

const AuthFormContext = createContext<AuthFormContextValue | null>(null);

// Reducer for form state management
const authFormReducer = (state: AuthFormState, action: AuthFormAction): AuthFormState => {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload, error: null };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload, error: null };
    case 'SET_ACCESS_CODE':
      return { ...state, accessCode: action.payload, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'TOGGLE_MODE':
      return {
        ...state,
        isSignUp: !state.isSignUp,
        email: '',
        password: '',
        accessCode: '',
        error: null,
        success: false
      };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, loading: false };
    case 'RESET_FORM':
      return {
        email: '',
        password: '',
        accessCode: '',
        loading: false,
        error: null,
        isSignUp: state.isSignUp,
        success: false
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AuthFormState = {
  email: '',
  password: '',
  accessCode: '',
  loading: false,
  error: null,
  isSignUp: false,
  success: false
};

// Provider Component
interface AuthFormProviderProps {
  children: ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  initialMode?: 'sign-in' | 'sign-up';
}

const AuthFormProvider: React.FC<AuthFormProviderProps> = ({
  children,
  onSuccess,
  onError,
  initialMode = 'sign-in'
}) => {
  const initialStateWithMode = {
    ...initialState,
    isSignUp: initialMode === 'sign-up'
  };
  const [state, dispatch] = useReducer(authFormReducer, initialStateWithMode);

  const setEmail = useCallback((email: string) => {
    dispatch({ type: 'SET_EMAIL', payload: email });
  }, []);

  const setPassword = useCallback((password: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: password });
  }, []);

  const setAccessCode = useCallback((accessCode: string) => {
    dispatch({ type: 'SET_ACCESS_CODE', payload: accessCode });
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!state.email || !state.password) {
      const errorMessage = 'Email and password are required';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
      return;
    }

    if (state.isSignUp && !state.accessCode) {
      const errorMessage = 'Access code is required for registration';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      if (state.isSignUp) {
        // Use our register API which includes access code validation
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: state.email,
            password: state.password,
            accessCode: state.accessCode,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Registration failed');
        }

        const responseData = await response.json();
        dispatch({ type: 'SET_SUCCESS', payload: true });

        // If API returns a redirect URL, handle it
        if (responseData.redirectTo) {
          window.location.href = responseData.redirectTo;
        } else {
          onSuccess?.();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: state.email,
          password: state.password,
        });

        if (error) throw error;
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      onError?.(errorMessage);
    } finally {
      // Always clear loading state, regardless of outcome
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.email, state.password, state.accessCode, state.isSignUp, onSuccess, onError]);

  const toggleMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE' });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const actions = {
    setEmail,
    setPassword,
    setAccessCode,
    handleSubmit,
    toggleMode,
    resetForm,
  };

  return (
    <AuthFormContext.Provider value={{ state, actions }}>
      {children}
    </AuthFormContext.Provider>
  );
};

// Hook for consuming context
const useAuthForm = () => {
  const context = useContext(AuthFormContext);
  if (!context) {
    throw new Error('useAuthForm must be used within an AuthForm component');
  }
  return context;
};

// Compound Components
namespace AuthForm {
  export interface RootProps {
    children: ReactNode;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    className?: string;
    initialMode?: 'sign-in' | 'sign-up';
  }

  export const Root: React.FC<RootProps> = ({
    children,
    onSuccess,
    onError,
    className = '',
    initialMode = 'sign-in'
  }) => {
    return (
      <AuthFormProvider onSuccess={onSuccess} onError={onError} initialMode={initialMode}>
        <RootForm className={className}>
          {children}
        </RootForm>
      </AuthFormProvider>
    );
  };

  const RootForm: React.FC<{ className: string; children: ReactNode }> = ({ className, children }) => {
    const { actions } = useAuthForm();

    return (
      <div className={`auth-form ${className}`}>
        <form onSubmit={actions.handleSubmit} data-testid="auth-form">
          {children}
        </form>
      </div>
    );
  };

  export const Header: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { state } = useAuthForm();

    return (
      <div className={`auth-form-header ${className}`}>
        <h2 className="text-2xl font-bold text-center">
          {state.isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
      </div>
    );
  };

  export const Fields: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { state, actions } = useAuthForm();

    return (
      <div className={`auth-form-fields space-y-4 ${className}`}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => actions.setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your email"
            disabled={state.loading}
            data-testid="email-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={state.password}
            onChange={(e) => actions.setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your password"
            disabled={state.loading}
            data-testid="password-input"
          />
        </div>

        {state.isSignUp && (
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
              Access Code
            </label>
            <input
              id="accessCode"
              type="text"
              value={state.accessCode}
              onChange={(e) => actions.setAccessCode(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter access code"
              disabled={state.loading}
              data-testid="access-code-input"
            />
          </div>
        )}

        {state.error && (
          <div
            className="rounded-md bg-red-50 p-4"
            data-testid="error-message"
          >
            <div className="text-sm text-red-700">{state.error}</div>
          </div>
        )}

        {state.success && (
          <div
            className="rounded-md bg-green-50 p-4"
            data-testid="success-message"
          >
            <div className="text-sm text-green-700">
              Success! Check your email to verify your account.
            </div>
          </div>
        )}
      </div>
    );
  };

  export const SubmitButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { state } = useAuthForm();

    return (
      <button
        type="submit"
        disabled={state.loading || !state.email || !state.password || (state.isSignUp && !state.accessCode)}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
        data-testid={state.isSignUp ? "register-button" : "submit-button"}
      >
        {state.loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <span>{state.isSignUp ? 'Sign Up' : 'Sign In'}</span>
        )}
      </button>
    );
  };

  export const ToggleButton: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { state, actions } = useAuthForm();

    return (
      <button
        type="button"
        onClick={actions.toggleMode}
        className={`w-full text-center text-sm text-indigo-600 hover:text-indigo-500 ${className}`}
        data-testid="toggle-button"
      >
        {state.isSignUp
          ? 'Already have an account? Sign in'
          : "Don't have an account? Sign up"
        }
      </button>
    );
  };
}

export default AuthForm;