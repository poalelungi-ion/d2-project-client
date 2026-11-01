import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import App from './App';
import { useAuthStore } from '../stores';

describe('application workspace layout (#104095)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        user_id: 1,
        email: 'anna.layout@uni-hildesheim.de',
        name: 'Anna Lecturer',
        is_active: true,
        created_at: '2026-01-01T00:00:00.000Z',
      },
      initializing: false,
    });
  });

  it('wraps main content in a fluid Container with maxWidth={false}', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<div data-testid="workspace">workspace</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const workspace = screen.getByTestId('workspace');
    const container = screen.getByTestId('workspace-container');
    expect(container).toContainElement(workspace);
    expect(container).toHaveClass('MuiContainer-disableGutters');
    expect(container.className).not.toMatch(/MuiContainer-maxWidth(Xs|Sm|Md|Lg|Xl)/);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
