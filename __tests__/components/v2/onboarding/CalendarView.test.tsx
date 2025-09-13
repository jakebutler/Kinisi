import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from '@/components/v2/onboarding/CalendarView';
import { ExerciseProgram } from '@/lib/v2/types';

const mockProgram: ExerciseProgram = {
  id: 'test-program-id',
  userId: 'test-user-id',
  approved: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  weeks: [
    {
      weekNumber: 1,
      goal: 'Build foundational strength',
      sessions: [
        {
          id: 'w1s1',
          name: 'Session 1',
          goal: 'Upper body focus',
          exercises: []
        },
        {
          id: 'w1s2',
          name: 'Session 2',
          goal: 'Lower body focus',
          exercises: []
        }
      ]
    }
  ]
};

const mockOnComplete = jest.fn();
const mockOnBack = jest.fn();

describe('CalendarView', () => {
  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnBack.mockClear();
  });

  it('renders calendar title', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    expect(screen.getByText('Schedule Your Program')).toBeInTheDocument();
  });

  it('renders date input field', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    expect(screen.getByText('Select a start date for your program:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('renders current month in calendar header', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const expectedMonth = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it('renders days of the week', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('allows date selection via input field', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const dateInput = screen.getByDisplayValue('');
    const testDate = '2024-12-25';
    
    await user.type(dateInput, testDate);
    
    expect(dateInput).toHaveValue(testDate);
  });

  it('shows program schedule preview when date is selected', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const dateInput = screen.getByDisplayValue('');
    await user.type(dateInput, '2024-12-25');
    
    expect(screen.getByText('Program Schedule Preview')).toBeInTheDocument();
    expect(screen.getByText(/Your 1-week program will start on/)).toBeInTheDocument();
    expect(screen.getByText('Session 1: Upper body focus')).toBeInTheDocument();
    expect(screen.getByText('Session 2: Lower body focus')).toBeInTheDocument();
  });

  it('navigates to previous month when left arrow is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const currentDate = new Date();
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const prevButton = screen.getAllByRole('button')[0]; // First button should be the previous month button
    await user.click(prevButton);
    
    const expectedMonth = `${monthNames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it('navigates to next month when right arrow is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const nextButton = screen.getAllByRole('button')[1]; // Second button should be the next month button
    await user.click(nextButton);
    
    const expectedMonth = `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it('disables Create Program button when no date is selected', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const createButton = screen.getByText('Create My Fitness Program');
    expect(createButton).toBeDisabled();
  });

  it('enables Create Program button when date is selected', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const dateInput = screen.getByDisplayValue('');
    await user.type(dateInput, '2024-12-25');
    
    const createButton = screen.getByText('Create My Fitness Program');
    expect(createButton).not.toBeDisabled();
  });

  it('calls onComplete with selected date when Create Program is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const dateInput = screen.getByDisplayValue('');
    const testDate = '2024-12-25';
    await user.type(dateInput, testDate);
    
    const createButton = screen.getByText('Create My Fitness Program');
    await user.click(createButton);
    
    expect(mockOnComplete).toHaveBeenCalledWith(testDate);
  });

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const backButton = screen.getByText('Back');
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when loading prop is true', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={true}
      />
    );
    
    const createButton = screen.getByText('Creating Program...');
    expect(createButton).toBeInTheDocument();
  });

  it('disables navigation buttons when loading', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons[0];
    const nextButton = buttons[1];
    const backButton = screen.getByText('Back');
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(backButton).toBeDisabled();
  });

  it('sets minimum date to today for date input', () => {
    render(
      <CalendarView
        program={mockProgram}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
        loading={false}
      />
    );
    
    const dateInput = screen.getByDisplayValue('');
    const today = new Date().toISOString().split('T')[0];
    
    expect(dateInput).toHaveAttribute('min', today);
  });
});
