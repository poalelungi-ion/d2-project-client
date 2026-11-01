import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthSettingsDialog } from './AuthSettingsDialog';
import { AuthLayout } from './AuthLayout';
import { resetApiBaseUrl, setApiBaseUrl, getApiBaseUrl } from '../../../api/client';
import { useToastStore, useThemeStore } from '../../../stores';

describe('AuthSettingsDialog & Login Settings Integration', () => {
  beforeEach(() => {
    resetApiBaseUrl();
    localStorage.clear();
    useToastStore.setState({ toast: { open: false, message: '', severity: 'success' } });
  });

  afterEach(() => {
    resetApiBaseUrl();
    localStorage.clear();
  });

  it('renders a settings button on AuthLayout and opens the dialog', () => {
    render(
      <MemoryRouter>
        <AuthLayout title="Sign In" subtitle="Welcome back" footer={<div>Footer</div>}>
          <div>Form Content</div>
        </AuthLayout>
      </MemoryRouter>,
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();

    fireEvent.click(settingsButton);
    expect(screen.getByText(/settings & connection/i)).toBeInTheDocument();
    expect(screen.getByText(/backend api connection/i)).toBeInTheDocument();
  });

  it('allows toggling dark theme in dialog', () => {
    const initialMode = useThemeStore.getState().mode;
    const onClose = vi.fn();

    render(<AuthSettingsDialog open={true} onClose={onClose} />);

    const themeSwitch = screen.getByRole('checkbox');
    expect(themeSwitch).toBeInTheDocument();

    fireEvent.click(themeSwitch);
    expect(useThemeStore.getState().mode).not.toBe(initialMode);
  });

  it('allows editing, testing, and saving custom backend API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthSettingsDialog open={true} onClose={vi.fn()} />);

    const input = screen.getByLabelText(/backend api base url/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'http://custom-backend:9000/api' } });

    // Test connection
    const testButton = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully reached backend/i)).toBeInTheDocument();
    });

    // Save & Apply
    const saveButton = screen.getByRole('button', { name: /save & apply/i });
    fireEvent.click(saveButton);

    expect(getApiBaseUrl()).toBe('http://custom-backend:9000/api');
    expect(useToastStore.getState().toast.open).toBe(true);

    vi.unstubAllGlobals();
  });

  it('resets custom backend API URL to default', () => {
    setApiBaseUrl('http://custom-backend:9000/api');
    expect(getApiBaseUrl()).toBe('http://custom-backend:9000/api');

    render(<AuthSettingsDialog open={true} onClose={vi.fn()} />);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    expect(getApiBaseUrl()).toBe('http://localhost:8000/api');
    expect(useToastStore.getState().toast.message).toMatch(/reset backend api base url to default/i);
  });
});
