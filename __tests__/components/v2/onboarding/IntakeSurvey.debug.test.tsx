import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeSurvey from '../../../../components/v2/onboarding/IntakeSurvey';
import { SurveyResponseData } from '../../../types/survey';

const mockOnNext = jest.fn();

describe('IntakeSurvey Debug Tests', () => {
  beforeEach(() => {
    mockOnNext.mockClear();
    jest.clearAllMocks();
  });

  it('debug survey structure', async () => {
    const user = userEvent.setup();
    console.log('=== Starting Survey Debug Test ===');

    render(<IntakeSurvey onNext={mockOnNext} />);

    // Debug initial state
    console.log('Initial screen content:');
    const allText = screen.getByRole('main')?.textContent || screen.getByText(/Intake Survey/).parentElement?.textContent;
    console.log('Screen text:', allText);

    const buttons = screen.getAllByRole('button');
    console.log('All buttons found:', buttons.map(btn => btn.textContent));

    // Try to find answer buttons
    const answerButtons = buttons.filter(btn => {
      const text = btn.textContent;
      return text &&
             !text.includes('Next') &&
             !text.includes('Previous') &&
             !text.includes('Submit Survey') &&
             !btn.disabled;
    });
    console.log('Answer buttons found:', answerButtons.map(btn => btn.textContent));

    // Try to click first answer button
    if (answerButtons.length > 0) {
      console.log('Clicking first answer button:', answerButtons[0].textContent);
      await user.click(answerButtons[0]);

      // Check state after click
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next|Submit Survey/ });
        console.log('Next/Submit button found:', nextButton.textContent);
        console.log('Next/Submit button disabled:', nextButton.disabled);
      }, { timeout: 2000 });
    }

    console.log('=== Survey Debug Test Complete ===');
  }, 10000);

  it('debug step-by-step survey completion', async () => {
    const user = userEvent.setup();
    console.log('=== Step-by-Step Survey Completion Debug ===');

    render(<IntakeSurvey onNext={mockOnNext} />);

    let stepCount = 0;
    const maxSteps = 20; // Prevent infinite loop

    while (stepCount < maxSteps) {
      stepCount++;
      console.log(`\n=== Step ${stepCount} ===`);

      try {
        // Wait for question to load
        await waitFor(() => {
          const questionElement = screen.getByText(/Question \d+ of \d+/);
          expect(questionElement).toBeInTheDocument();
        }, { timeout: 3000 });

        const questionText = screen.getByText(/Question \d+ of \d+/).textContent;
        console.log('Current question:', questionText);

        // Find all buttons
        const buttons = screen.getAllByRole('button');
        console.log('All buttons:', buttons.map(btn => `${btn.textContent} (disabled: ${btn.disabled})`));

        // Find action button
        const actionButton = buttons.find(btn =>
          btn.textContent?.includes('Next') || btn.textContent?.includes('Submit Survey')
        );
        console.log('Action button:', actionButton?.textContent, 'disabled:', actionButton?.disabled);

        // Check if this is the submit button
        if (actionButton?.textContent?.includes('Submit Survey')) {
          console.log('Found submit button! Submitting survey...');
          if (!actionButton.disabled) {
            await user.click(actionButton);
            break;
          } else {
            console.log('Submit button is disabled, need to answer more questions');
          }
        }

        // Find answer buttons
        const answerButtons = buttons.filter(btn => {
          const text = btn.textContent;
          return text &&
                 !text.includes('Next') &&
                 !text.includes('Previous') &&
                 !text.includes('Submit Survey') &&
                 !btn.disabled;
        });
        console.log('Answer buttons:', answerButtons.map(btn => btn.textContent));

        // Try to answer the question
        if (answerButtons.length > 0) {
          console.log('Clicking answer button:', answerButtons[0].textContent);
          await user.click(answerButtons[0]);
        } else {
          // Try to find other input types
          const numberInput = screen.queryByRole('spinbutton');
          if (numberInput) {
            console.log('Found number input, entering value 5');
            await user.clear(numberInput);
            await user.type(numberInput, '5');
          } else {
            const selectElement = screen.queryByRole('combobox') || screen.queryByRole('listbox');
            if (selectElement) {
              console.log('Found select element, clicking it');
              await user.click(selectElement);
              const firstOption = screen.queryAllByRole('option')[0];
              if (firstOption) {
                console.log('Clicking first option');
                await user.click(firstOption);
              }
            }
          }
        }

        // Try to proceed
        if (actionButton && !actionButton.disabled) {
          console.log('Clicking action button:', actionButton.textContent);
          await user.click(actionButton);
        } else {
          console.log('Action button is disabled or not found');
          break;
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.log('Error in step', stepCount, ':', error);
        break;
      }
    }

    console.log(`=== Completed ${stepCount} steps ===`);

    // Final check for onNext callback
    await waitFor(() => {
      console.log('Checking if onNext was called...');
      console.log('onNext call count:', mockOnNext.mock.calls.length);
      if (mockOnNext.mock.calls.length > 0) {
        console.log('onNext was called with:', mockOnNext.mock.calls[0][0]);
      }
    }, { timeout: 5000 });

    console.log('=== Step-by-Step Survey Completion Debug Complete ===');
  }, 30000);
});