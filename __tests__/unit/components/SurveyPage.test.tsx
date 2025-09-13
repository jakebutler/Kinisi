import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Explicitly mock Supabase client before component import to prevent real ESM deps loading
jest.mock('@/utils/supabaseClient', () => {
  const auth = {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  };
  return { supabase: { auth } };
});

// Mock surveyResponses module per-test with controllable data
jest.mock('@/utils/surveyResponses', () => ({
  getSurveyResponse: jest.fn(async (_userId: string) => ({ data: [], error: null })),
  upsertSurveyResponse: jest.fn(async () => ({ data: [{ id: '1' }], error: null })),
}));

const { getSurveyResponse } = jest.requireMock('@/utils/surveyResponses');
const { supabase } = jest.requireMock('@/utils/supabaseClient');

import SurveyPage from '../../../app/legacy/survey/page';

describe('SurveyPage UI controls and validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure authenticated user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('enables Next when a required radio question is answered via segmented card', async () => {
    // Start with empty response
    (getSurveyResponse as jest.Mock).mockResolvedValueOnce({ data: [], error: null });

    render(<SurveyPage />);

    // Wait for loading to finish
    await screen.findByRole('heading', { name: /Intake Survey/i });

    // First question should be a radiogroup (medical clearance)
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDisabled();

    const yesRadio = screen.getByRole('radio', { name: /Yes/i });
    await userEvent.click(yesRadio);

    expect(nextBtn).toBeEnabled();
  });

  it('treats 0 as a valid answer on 0–10 scale boxes (number) when required', async () => {
    // Prefill answers for first 5 required questions to reach the 0–10 importance slider quickly
    (getSurveyResponse as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          response: {
            medicalClearance: 'No',
            currentPain: 'No',
            activityFrequency: '3-4',
            physicalFunction: 'Good',
            intentToChange: 'Yes',
          },
        },
      ],
      error: null,
    });

    render(<SurveyPage />);
    await screen.findByRole('heading', { name: /Intake Survey/i });

    // Navigate to the 0–10 scale question by clicking Next until the grid appears
    let scale = screen.queryByTestId('scale-0-10');
    let safety = 12;
    while (!scale && safety-- > 0) {
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      if (!nextBtn.hasAttribute('disabled')) {
        await userEvent.click(nextBtn);
      }
      await waitFor(() => expect(screen.getByText(/Question/i)).toBeInTheDocument());
      scale = screen.queryByTestId('scale-0-10');
    }
    expect(scale).toBeTruthy();

    // Click value 0
    const box0 = screen.getByTestId('scale-box-0');
    await userEvent.click(box0);

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await waitFor(() => expect(nextBtn).toBeEnabled());
  });
});
