import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import type { GridApi } from 'ag-grid-community';

import { getGlassTheme } from '../../../styles/theme';
import type { PreviewRecord } from '../../../types';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import { ReviewStep, revalidatePreviewRow } from './ReviewStep';

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

describe('ReviewStep inline editing & revalidation (#104089)', () => {
  it('revalidates all editable fields (student_id, first_name, last_name, program, semester, grade) when edited inline', () => {
    const row: PreviewRecord = {
      id: 0,
      student_id: '',
      name: '',
      first_name: '',
      last_name: '',
      program: 'M.Sc. WINF',
      semester: '2',
      grade: '9.9',
      outcome: 'invalid',
      absence_code: null,
      is_valid: false,
      missing_fields: ['Matrikelnr', 'Name'],
      invalid_fields: ['Study Program', 'Grade'],
    };

    row.student_id = '1001001';
    row.first_name = 'Lena';
    row.last_name = 'Schneider';
    row.program = 'M.Sc. WINF';
    row.semester = '3';
    row.grade = '1.3';

    revalidatePreviewRow(row);

    expect(row.student_id).toBe('1001001');
    expect(row.first_name).toBe('Lena');
    expect(row.last_name).toBe('Schneider');
    expect(row.name).toBe('Lena Schneider');
    expect(row.program).toBe('Wirtschaftsinformatik Master');
    expect(row.semester).toBe('3');
    expect(row.grade).toBe('1.3');
    expect(row.outcome).toBe('passed');
    expect(row.missing_fields).toEqual([]);
    expect(row.invalid_fields).toEqual([]);
    expect(row.is_valid).toBe(true);
  });

  it('flags missing or invalid fields when a valid pasted row is edited to an invalid grade', () => {
    const row: PreviewRecord = {
      id: 1,
      student_id: '1001002',
      name: 'Max Weber',
      first_name: 'Max',
      last_name: 'Weber',
      program: 'Data Science Master',
      semester: '1',
      grade: '2.0',
      outcome: 'passed',
      absence_code: null,
      is_valid: true,
      missing_fields: [],
      invalid_fields: [],
    };

    row.grade = '5.0';
    revalidatePreviewRow(row);
    expect(row.outcome).toBe('failed');
    expect(row.is_valid).toBe(true);

    row.grade = 'invalid_grade';
    revalidatePreviewRow(row);
    expect(row.outcome).toBe('invalid');
    expect(row.invalid_fields).toContain('Grade');
    expect(row.is_valid).toBe(false);
  });
});
