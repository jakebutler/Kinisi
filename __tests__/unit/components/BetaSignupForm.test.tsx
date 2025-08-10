import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BetaSignupForm from '../../../components/home/BetaSignupForm';

// Mock fetch per-test
const mockFetch = jest.fn();

describe('BetaSignupForm', () => {
  const STORAGE_KEY = 'beta_signup_status';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    // Clear localStorage
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('renders success state from localStorage on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: 'john@example.com', at: new Date().toISOString() })
    );

    render(<BetaSignupForm />);

    expect(
      screen.getByRole('heading', { name: /Thanks — you’re on the early access list/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Email:\s*j\*+@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use a different email/i })).toBeInTheDocument();
  });

  it('submits email, shows success, and persists to localStorage', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      status: 201,
      json: async () => ({ success: true })
    } as Response);

    render(<BetaSignupForm />);

    const emailInput = screen.getByLabelText(/Email/i);
    const submitBtn = screen.getByRole('button', { name: /Request Access/i });

    await user.type(emailInput, 'alice@example.com');
    await user.click(submitBtn);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Thanks — you’re on the early access list/i })
      ).toBeInTheDocument()
    );

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    expect(stored?.email).toBe('alice@example.com');
  });

  it('allows resetting success to use a different email', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ success: true })
    } as Response);

    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText(/Email/i), 'bob@example.com');
    await user.click(screen.getByRole('button', { name: /Request Access/i }));

    await screen.findByRole('heading', { name: /Thanks — you’re on the early access list/i });

    await user.click(screen.getByRole('button', { name: /Use a different email/i }));

    // Form header should reappear
    expect(screen.getByText(/Request Beta Access/i)).toBeInTheDocument();
    // Storage cleared
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('shows error message on server error without crashing', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: async () => ({ error: 'Server misconfiguration: beta signup is temporarily unavailable.' })
    } as Response);

    render(<BetaSignupForm />);

    await user.type(screen.getByLabelText(/Email/i), 'carol@example.com');
    await user.click(screen.getByRole('button', { name: /Request Access/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable|something went wrong|unable to submit/i);
    });
  });
});
