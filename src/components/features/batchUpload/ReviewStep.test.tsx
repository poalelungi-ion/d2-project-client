import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { PreviewRecord, UploadCourseInfo } from '../../../types';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import {
  ReviewStep,
  getCellValidationError,
  recomputePreviewRowValidation,
} from './ReviewStep';

const COURSE: UploadCourseInfo = {
  courseId: 101,
  courseNumber: '101',
  courseName: 'Software Architecture',
  attemptType: 'Exam 1',
  semester: 'WiSe 2024/25',
};

const makeRecord = (overrides: Partial<PreviewRecord> = {}): PreviewRecord => ({
  student_id: '101234',
  first_name: 'Lena',
  last_name: 'Schneider',
  name: 'Schneider, Lena',
  program: 'SE Master',
  semester: 'WiSe 2024/25',
  grade: '1.7',
  missing_fields: [],
  invalid_fields: [],
  is_valid: true,
  outcome: 'passed',
  absence_code: null,
  ...overrides,
});

const renderReviewStep = (preview: PreviewRecord[]) => {
  const confirmImport = vi.fn().mockResolvedValue(undefined);
  const value: UploadWizardValue = {
    step: 3,
    file: null,
    paste: '',
    sourceLabel: 'grades.csv',
    courseInfo: COURSE,
    nameSplitRule: 'Last, First',
    preview,
    setStep: vi.fn(),
    setFile: vi.fn(),
    setPaste: vi.fn(),
    setCourseInfo: vi.fn(),
    setNameSplitRule: vi.fn(),
    setGridApi: vi.fn(),
    runPreview: vi.fn(),
    confirmImport,
    reset: vi.fn(),
  };

  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <UploadWizardContext.Provider value={value}>
        <ReviewStep />
      </UploadWizardContext.Provider>
    </ThemeProvider>,
  );

  return { confirmImport };
};

describe('ReviewStep (#96056: Mirrored Upload Preview)', () => {
  it('identifies invalid cells and returns descriptive tooltip messages (AC2 & AC3)', () => {
    const invalidRow = makeRecord({
      student_id: 'ABC12',
      grade: 'text_in_grade',
      program: 'Unknown Program XYZ',
      invalid_fields: ['Matrikelnummer', 'Study Program', 'Grade'],
      is_valid: false,
    });

    expect(getCellValidationError(invalidRow, 'student_id')).toContain(
      'Invalid Matrikelnummer',
    );
    expect(getCellValidationError(invalidRow, 'grade')).toContain(
      'Invalid Grade "text_in_grade"',
    );
    expect(getCellValidationError(invalidRow, 'program')).toContain(
      'Invalid Study Program',
    );
    expect(getCellValidationError(invalidRow, 'first_name')).toBeNull();
  });

  it('recomputes row validation when a user edits a red cell to fix the error (AC4)', () => {
    const brokenRow = makeRecord({
      grade: 'invalid_text',
      missing_fields: ['Grade'],
      invalid_fields: [],
      is_valid: false,
      outcome: 'invalid',
    });

    recomputePreviewRowValidation(brokenRow);
    expect(brokenRow.is_valid).toBe(false);
    expect(brokenRow.invalid_fields).toContain('Grade');

    // User edits the grade cell in the grid to a valid numeric German grade
    brokenRow.grade = '1.3';
    recomputePreviewRowValidation(brokenRow);

    expect(brokenRow.is_valid).toBe(true);
    expect(brokenRow.missing_fields).toEqual([]);
    expect(brokenRow.invalid_fields).toEqual([]);
    expect(brokenRow.outcome).toBe('passed');
    expect(getCellValidationError(brokenRow, 'grade')).toBeNull();
  });

  it('disables the Complete Import submit button while any red cell errors exist (AC5)', async () => {
    const rowWithInvalidGrade = makeRecord({
      grade: 'bad_grade',
      invalid_fields: ['Grade'],
      is_valid: false,
      outcome: 'invalid',
    });

    renderReviewStep([rowWithInvalidGrade]);

    const submitBtn = screen.getByRole('button', { name: /complete import/i });
    expect(submitBtn).toBeDisabled();

    // Red cell is rendered with descriptive tooltip title
    await waitFor(() => {
      const invalidGradeCell = screen.getByTestId('invalid-cell-grade');
      expect(invalidGradeCell).toBeInTheDocument();
      expect(invalidGradeCell.getAttribute('aria-label')).toContain('Invalid Grade "bad_grade"');
    });
  });

  it('enables the Complete Import submit button when all rows and cells are valid (AC1 & AC5)', () => {
    const validRow = makeRecord();
    renderReviewStep([validRow]);

    const submitBtn = screen.getByRole('button', { name: /complete import/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
