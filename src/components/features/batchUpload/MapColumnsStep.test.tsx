import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { UploadCourseInfo } from '../../../types';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import { MapColumnsStep } from './MapColumnsStep';

const COURSE: UploadCourseInfo = {
  courseId: 101,
  courseNumber: '101',
  courseName: 'Software Architecture',
  attemptType: 'Exam 1',
  semester: 'WiSe 2024/25',
};

const renderMap = (paste: string) => {
  const value = {
    step: 2,
    file: null,
    paste,
    sourceLabel: 'Pasted data',
    courseInfo: COURSE,
    nameSplitRule: 'Last, First' as const,
    preview: [],
    setStep: vi.fn(),
    setFile: vi.fn(),
    setPaste: vi.fn(),
    setCourseInfo: vi.fn(),
    setNameSplitRule: vi.fn(),
    setGridApi: vi.fn(),
    runPreview: vi.fn(),
    confirmImport: vi.fn(),
    reset: vi.fn(),
  } satisfies UploadWizardValue;

  return render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <UploadWizardContext.Provider value={value}>
        <MapColumnsStep />
      </UploadWizardContext.Provider>
    </ThemeProvider>,
  );
};

describe('MapColumnsStep', () => {
  it('maps a pasted FlexNow header row and keeps Standardise enabled without displaying a row counter (#104088)', () => {
    renderMap('Matrikelnr\tName\tNote\n101\tSchneider, Lena\t1.7\n');
    expect(screen.getByText('Matrikelnr')).toBeInTheDocument();
    expect(screen.getAllByText('Mapped').length).toBeGreaterThan(0);
    expect(screen.getByText('3 columns in the file')).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s+rows/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /standardise & review/i })).toBeEnabled();
  });

  it('blocks Standardise when a header is not in the closed list', () => {
    renderMap('Matrikelnr\tName\tNote\tEmail\n101\tAda\t1.7\ta@uni.de\n');
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Unrecognized')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /standardise & review/i })).toBeDisabled();
  });

  it('blocks Standardise when two headers standardise to Name', () => {
    renderMap('Matrikelnr\tName\tFull Name\tNote\n101\tAda\tAda Lovelace\t1.7\n');
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /standardise & review/i })).toBeDisabled();
  });
});
