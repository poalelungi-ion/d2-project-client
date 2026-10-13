import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import { getGlassTheme } from '../../../styles/theme';
import { SettingsDialog } from './SettingsDialog';
import { useStudyProgramStore, useToastStore } from '../../../stores';
import { normalizeStudyProgram } from '../../../utils/studyProgram';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={getGlassTheme('light')}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('SettingsDialog and Study Program Alias Mapping', () => {
  beforeEach(() => {
    localStorage.clear();
    useStudyProgramStore.getState().resetDefaults();
    useToastStore.setState({ toast: { open: false, message: '', severity: 'info' } });
  });

  it('renders settings dialog with appearance and study program mappings', () => {
    renderWithTheme(<SettingsDialog open={true} onClose={vi.fn()} />);

    expect(screen.getByText(/System Settings & Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Study Program Name Mappings & Aliases/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark Theme/i)).toBeInTheDocument();
  });

  it('allows adding a custom alias for a study program and normalizes it immediately', () => {
    renderWithTheme(<SettingsDialog open={true} onClose={vi.fn()} />);

    // Expand SE Master accordion
    const seSummary = screen.getAllByText('SE Master')[0];
    fireEvent.click(seSummary);

    // Find input for adding alias
    const input = screen.getByPlaceholderText(/Add new alias for SE Master/i);
    fireEvent.change(input, { target: { value: 'M.Sc. SE WS26' } });

    // Click Add Alias button inside that accordion
    const addButtons = screen.getAllByRole('button', { name: /Add Alias/i });
    // The enabled one is the one with input value
    const enabledButton = addButtons.find((b) => !b.hasAttribute('disabled'));
    expect(enabledButton).toBeDefined();
    fireEvent.click(enabledButton!);

    // Verify toast notification
    const toastState = useToastStore.getState().toast;
    expect(toastState.open).toBe(true);
    expect(toastState.message).toContain('Added alias "M.Sc. SE WS26" for SE Master');

    // Verify normalizeStudyProgram immediately resolves it
    expect(normalizeStudyProgram('M.Sc. SE WS26')).toBe('SE Master');
  });

  it('allows removing an alias and updates mapping', () => {
    // Add alias first
    useStudyProgramStore.getState().addAlias('SE Master', 'se-special-alias');
    expect(normalizeStudyProgram('se-special-alias')).toBe('SE Master');

    useStudyProgramStore.getState().removeAlias('se-special-alias');
    // Now it should return raw or unassigned, not SE Master
    expect(normalizeStudyProgram('se-special-alias')).toBe('se-special-alias');
  });

  it('keeps Teacher Break Dino game hidden by default until 10 clicks unlock developer options', () => {
    renderWithTheme(<SettingsDialog open={true} onClose={vi.fn()} />);

    // Dino Game should NOT be present initially
    expect(screen.queryByText(/Teacher Break \(Dino Run Mini-Game\)/i)).not.toBeInTheDocument();

    // Find the System Information card
    const sysInfo = screen.getByText(/Software Systems Engineering \(SSE\) · SPA System v2.0/i);

    // Click 9 times -> still hidden, progressive toast shown
    for (let i = 1; i <= 9; i++) {
      fireEvent.click(sysInfo);
    }
    expect(screen.queryByText(/Teacher Break \(Dino Run Mini-Game\)/i)).not.toBeInTheDocument();

    // 10th click -> Developer mode unlocks and game appears!
    fireEvent.click(sysInfo);
    expect(screen.getByText(/Teacher Break \(Dino Run Mini-Game\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Developer Mode/i)).toBeInTheDocument();

    const toastState = useToastStore.getState().toast;
    expect(toastState.open).toBe(true);
    expect(toastState.message).toContain('You are now a developer');
  });
});
