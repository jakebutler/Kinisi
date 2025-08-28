import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/v2/ui/Header';

describe('Header Component', () => {
  it('renders with default props', () => {
    render(<Header />);
    expect(screen.getByText('Kinisi')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('renders with custom username', () => {
    render(<Header username="JohnDoe" />);
    expect(screen.getByText('JohnDoe')).toBeInTheDocument();
  });

  it('handles sign out click', () => {
    const handleSignOut = jest.fn();
    render(<Header onSignOut={handleSignOut} />);
    
    fireEvent.click(screen.getByText('Sign out'));
    expect(handleSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders without username when not provided', () => {
    render(<Header username="" />);
    expect(screen.getByText('Kinisi')).toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('applies Kinisi brand gradient to logo', () => {
    render(<Header />);
    const logo = screen.getByText('Kinisi');
    expect(logo).toHaveClass('bg-gradient-to-r');
    expect(logo).toHaveClass('from-[rgb(204,136,153)]');
  });
});
