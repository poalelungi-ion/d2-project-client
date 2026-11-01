import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import type { GridApi } from 'ag-grid-community';

import { getGlassTheme } from '../../../styles/theme';
import type { PreviewRecord } from '../../../types';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import { ReviewStep } from './ReviewStep';

const record = (student_id: string, last_name: string): PreviewRecord => ({
  student_id,
  first_name: 'Test',
  last_name,
  name: `Test ${last_name}`,
  program: 'SE Master',
  semester: 'WISE_25',
  grade: '1.7',
  missing_fields: [],
  invalid_fields: [],
  is_valid: true,
});

const renderReview = async () => {
  let api: GridApi<PreviewRecord> | null = null;
  const value = {
    step: 3,
    file: null,
    paste: '',
    sourceLabel: 'Pasted data',
    courseInfo: {
      courseId: 101,
      courseNumber: '101',
      courseName: 'Software Architecture',
      attemptType: 'Exam 1',
      semester: 'WISE_25',
    },
    nameSplitRule: 'Last, First' as const,
    preview: [record('1001', 'Schneider'), record('1002', 'Becker'), record('1003', 'Wagner')],
    setStep: vi.fn(),
    setFile: vi.fn(),
    setPaste: vi.fn(),
    setCourseInfo: vi.fn(),
    setNameSplitRule: vi.fn(),
    setGridApi: vi.fn((next: GridApi<PreviewRecord> | null) => {
      api = next;
    }),
    runPreview: vi.fn(),
    confirmImport: vi.fn(),
    reset: vi.fn(),
  } satisfies UploadWizardValue;

  const view = render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <UploadWizardContext.Provider value={value}>
        <ReviewStep />
      </UploadWizardContext.Provider>
    </ThemeProvider>,
  );
  // Valid rows start selected; that selection is what Complete Import sends.
  await waitFor(() => expect(api?.getSelectedRows()).toHaveLength(3));
  return { ...view, api: api as unknown as GridApi<PreviewRecord> };
};

const selectedIds = (api: GridApi<PreviewRecord>) => api.getSelectedRows().map((r) => r.student_id);

// AG Grid flushes state events on a timer; let it run before jsdom is torn down.
afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 50));
});

describe('ReviewStep selection', () => {
  it('does not let a row click change the selection', async () => {
    // A plain row click would otherwise select that row alone (AG Grid's
    // clearSelection on click), dropping every other row from the import.
    // jsdom clicks don't reach AG Grid's row handler, so assert the option.
    const { api } = await renderReview();

    expect(api.getGridOption('suppressRowClickSelection')).toBe(true);
  });

  it('lets a checkbox deselect one row without touching the others', async () => {
    const { api, container } = await renderReview();
    const checkbox = container.querySelector<HTMLInputElement>('[row-index="1"] .ag-selection-checkbox input');
    expect(checkbox).not.toBeNull();

    fireEvent.click(checkbox!);

    expect(selectedIds(api)).toEqual(['1001', '1003']);
  });
});
