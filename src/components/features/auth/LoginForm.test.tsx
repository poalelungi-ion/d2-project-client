import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LoginForm } from './LoginForm';
import { useAuthStore } from '../../../stores';

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );

const emailField = () => screen.getByLabelText(/university email/i);
const passwordField = () => screen.getByLabelText(/^password$/i);
const submit = () => screen.getByRole('button', { name: /sign in/i });

describe('LoginForm', () => {
  it('offers an email field and a masked password field', () => {
    renderForm();
    expect(emailField()).toHaveAttribute('type', 'email');
    // type=password is what keeps the value off the screen and out of the
    // browser's plain-text autofill history.
    expect(passwordField()).toHaveAttribute('type', 'password');
  });

  it('does not submit an empty form', async () => {
    const login = vi.fn();
    useAuthStore.setState({ login });

    renderForm();
    fireEvent.click(submit());

    expect(login).not.toHaveBeenCalled();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it('submits trimmed credentials', async () => {
    const login = vi.fn().mockResolvedValue(true);
    useAuthStore.setState({ login });

    renderForm();
    fireEvent.change(emailField(), { target: { value: '  a.musterfrau@uni-hildesheim.de  ' } });
    fireEvent.change(passwordField(), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(submit());

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'a.musterfrau@uni-hildesheim.de',
        password: 'correct-horse-battery',
      }),
    );
  });

  it('shows the error the store reports for a rejected sign-in', () => {
    useAuthStore.setState({ error: 'Incorrect email or password' });
    renderForm();
    expect(screen.getByText('Incorrect email or password')).toBeInTheDocument();
  });

  it('disables the button while a sign-in is in flight', () => {
    useAuthStore.setState({ submitting: true });
    renderForm();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});
