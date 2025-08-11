import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AuthForm from '@/components/AuthForm';

describe('AuthForm', () => {
  it('should render a login form', () => {
    render(<AuthForm formType="login" onSubmit={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Login form')).toBeInTheDocument();
  });

  it('should render a register form', () => {
    render(<AuthForm formType="register" onSubmit={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText('Register form')).toBeInTheDocument();
  });

  it('should call onSubmit with the email and password when the form is submitted', async () => {
    const onSubmit = jest.fn();
    render(<AuthForm formType="login" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });
    expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'password');
  });
});
