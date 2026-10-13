import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getGlassTheme } from '../../styles/theme';
import { SystemLogs } from './SystemLogs';
import { useSystemLogStore, useToastStore } from '../../stores';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={getGlassTheme('light')}>{ui}</ThemeProvider>);
};

describe('SystemLogs and useSystemLogStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSystemLogStore.getState().resetToDefaults();
    useToastStore.setState({ toast: { open: false, message: '', severity: 'info' } });
  });

  it('renders system logs header, KPI metric cards, and initial log records', () => {
    renderWithTheme(<SystemLogs />);

    expect(screen.getByText(/Full System & Audit Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Operational \/ Info/i)).toBeInTheDocument();
    expect(screen.getByText(/Warnings/i)).toBeInTheDocument();
    expect(screen.getByText(/Errors \/ Critical/i)).toBeInTheDocument();

    // Verify some seed records appear
    expect(screen.getAllByText(/Klausur_SE_SoSe25\.xlsx/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Syllabus_2026_Advanced_SE\.pdf/i).length).toBeGreaterThan(0);
  });

  it('filters logs by search query', () => {
    renderWithTheme(<SystemLogs />);

    const searchInput = screen.getByPlaceholderText(/Search logs by message/i);
    fireEvent.change(searchInput, { target: { value: 'PostgreSQL' } });

    // Should only show the boot/DB log
    expect(screen.getByText(/FastAPI backend & PostgreSQL/i)).toBeInTheDocument();
    expect(screen.queryByText(/Klausur_SE_SoSe25\.xlsx/i)).not.toBeInTheDocument();
  });

  it('triggers diagnostic check and adds a diagnostic log entry', () => {
    renderWithTheme(<SystemLogs />);

    const diagBtn = screen.getByRole('button', { name: /Run Diagnostic Check/i });
    fireEvent.click(diagBtn);

    expect(screen.getByText(/System self-diagnostic completed/i)).toBeInTheDocument();
    expect(screen.getByText(/\[DIAG_PASSED\]/i)).toBeInTheDocument();
  });

  it('clears all logs when Clear Logs button is clicked', () => {
    renderWithTheme(<SystemLogs />);

    const clearBtn = screen.getByRole('button', { name: /Clear Logs/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText(/No matching log records found/i)).toBeInTheDocument();
  });

  it('resets logs back to defaults with Reset Seed button', () => {
    renderWithTheme(<SystemLogs />);

    // Clear first
    const clearBtn = screen.getByRole('button', { name: /Clear Logs/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText(/No matching log records found/i)).toBeInTheDocument();

    // Reset seed
    const resetBtn = screen.getByRole('button', { name: /Reset Seed/i });
    fireEvent.click(resetBtn);
    expect(screen.getAllByText(/Klausur_SE_SoSe25\.xlsx/i).length).toBeGreaterThan(0);
  });

  it('copies log entry details to clipboard', () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderWithTheme(<SystemLogs />);

    const copyButtons = screen.getAllByRole('button', { name: /Copy full JSON record/i });
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);

    expect(writeTextMock).toHaveBeenCalled();
  });
});
