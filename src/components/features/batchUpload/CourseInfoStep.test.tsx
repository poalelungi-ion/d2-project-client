import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { UploadCourseInfo } from '../../../types';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import { CourseInfoStep } from './CourseInfoStep';

const COURSE: UploadCourseInfo = {
  courseId: 101,
  courseNumber: '101',
  courseName: 'Software Architecture',
  attemptType: 'Exam 1',
  semester: 'WiSe 2024/25',
};

describe('CourseInfoStep', () => {
  it('does not ask for ECTS credits', () => {
    const value = {
      step: 1,
      file: null,
      paste: '',
      sourceLabel: 'Pasted data',
      courseInfo: COURSE,
      nameSplitRule: 'Last, First',
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

    render(
      <ThemeProvider theme={getGlassTheme('light')}>
        <UploadWizardContext.Provider value={value}>
          <CourseInfoStep />
        </UploadWizardContext.Provider>
      </ThemeProvider>,
    );

    expect(screen.getByText('Software Architecture')).toBeInTheDocument();
    expect(screen.queryByText(/ects/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/credits for this course/i)).not.toBeInTheDocument();
  });
});
