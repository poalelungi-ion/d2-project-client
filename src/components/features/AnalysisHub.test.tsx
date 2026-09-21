import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { AnalysisHub } from './AnalysisHub';
import { useAuthStore } from '../../stores';
import { getGlassTheme } from '../../styles/theme';
import type { AuthenticatedUser } from '../../types';

const account = (name: string): AuthenticatedUser => ({
  user_id: 1,
  email: 'a.musterfrau@uni-hildesheim.de',
  name,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  // The dashboard fetches stats on mount; the greeting does not depend on them.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ kpis: {}, toughest_courses: [], atRisk: [] }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// The charts read theme.app.*, which only the app's own theme defines.
const renderHub = () =>
  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <MemoryRouter>
        <AnalysisHub />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('AnalysisHub greeting', () => {
  it('greets the signed-in user by first name', () => {
    useAuthStore.setState({ user: account('Anna Musterfrau') });
    renderHub();
    expect(screen.getByText(/welcome back, anna!/i)).toBeInTheDocument();
  });

  it('uses the account name rather than a hardcoded one', () => {
    useAuthStore.setState({ user: account('Lukas Schmidt') });
    renderHub();
    expect(screen.getByText(/welcome back, lukas!/i)).toBeInTheDocument();
    expect(screen.queryByText(/professor/i)).not.toBeInTheDocument();
  });

  it('drops the name rather than greeting an empty string', () => {
    useAuthStore.setState({ user: account('   ') });
    renderHub();
    expect(screen.getByText(/^welcome back! /i)).toBeInTheDocument();
  });
});
