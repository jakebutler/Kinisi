import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '@/components/v2/dashboard/Navigation';

describe('Navigation Component', () => {
  const mockOnTabChange = jest.fn();
  
  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it('renders all navigation tabs', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    expect(screen.getByText('Fitness Program')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Survey')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<Navigation activeTab="assessment" onTabChange={mockOnTabChange} />);
    
    const assessmentTab = screen.getByText('Assessment').closest('div');
    expect(assessmentTab).toHaveClass('ring-2', 'ring-[var(--brand-puce)]');
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.click(surveyTab!);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('survey');
  });

  it('applies correct styling to inactive tabs', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    const assessmentTab = screen.getByText('Assessment').closest('div');
    expect(assessmentTab).not.toHaveClass('ring-2');
    expect(assessmentTab).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });

  it('renders correct icons for each tab', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    // Check that icons are rendered (Lucide icons render as SVG elements)
    const icons = screen.getAllByRole('img', { hidden: true });
    expect(icons).toHaveLength(3);
  });

  it('handles hover states correctly', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    const assessmentTab = screen.getByText('Assessment').closest('div');
    expect(assessmentTab).toHaveClass('hover:shadow-lg');
  });

  it('supports keyboard navigation', () => {
    render(<Navigation activeTab="program" onTabChange={mockOnTabChange} />);
    
    const surveyTab = screen.getByText('Survey').closest('div');
    fireEvent.keyDown(surveyTab!, { key: 'Enter' });
    
    // Since we're using onClick, Enter key should trigger the click
    expect(mockOnTabChange).toHaveBeenCalledWith('survey');
  });

  describe('Tab States', () => {
    const tabs = [
      { id: 'program', label: 'Fitness Program' },
      { id: 'assessment', label: 'Assessment' },
      { id: 'survey', label: 'Survey' }
    ];

    tabs.forEach(tab => {
      it(`correctly handles ${tab.id} tab as active`, () => {
        render(<Navigation activeTab={tab.id} onTabChange={mockOnTabChange} />);
        
        const activeTab = screen.getByText(tab.label).closest('div');
        expect(activeTab).toHaveClass('ring-2', 'ring-[var(--brand-puce)]');
        
        // Check that other tabs are not active
        const otherTabs = tabs.filter(t => t.id !== tab.id);
        otherTabs.forEach(otherTab => {
          const inactiveTab = screen.getByText(otherTab.label).closest('div');
          expect(inactiveTab).not.toHaveClass('ring-2');
        });
      });
    });
  });
});
