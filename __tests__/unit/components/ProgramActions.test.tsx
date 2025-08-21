import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mocks for next/navigation
const pushMock = jest.fn();
const refreshMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  })
}));

import ProgramActions from '@/components/program/ProgramActions';

describe('ProgramActions component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Override global fetch mock from jest.setup to allow expected calls
    (global.fetch as unknown as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('Generate Schedule triggers POST and router.refresh()', async () => {
    render(<ProgramActions programId="abc-123" />);

    const button = screen.getByRole('button', { name: 'Generate Schedule' });
    fireEvent.click(button);

    // fetch called with schedule endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/api/program/abc-123/schedule');

    // router.refresh called
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });

    // Success message appears
    await screen.findByText('Schedule generated.');
  });

  it('View Calendar navigates to calendar route', async () => {
    render(<ProgramActions programId="abc-123" />);

    const button = screen.getByRole('button', { name: 'View Calendar' });
    fireEvent.click(button);

    expect(pushMock).toHaveBeenCalledWith('/program/abc-123/calendar');
  });
});
