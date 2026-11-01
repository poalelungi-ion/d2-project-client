import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { UploadCourseInfo } from '../../../types';
import { useCourseDriveStore } from '../../../stores';
import { UploadWizardContext } from './uploadWizardContext';
import type { UploadWizardValue } from './uploadWizardContext';
import { SelectFileStep } from './SelectFileStep';

const COURSE: UploadCourseInfo = {
  courseId: 101,
  courseNumber: '101',
  courseName: 'Software Architecture',
  attemptType: 'Exam 1',
  semester: 'WiSe 2024/25',
};

const sheet = (name: string, body: string) =>
  new File([body], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

const fileInput = () => document.getElementById('excel-upload-file') as HTMLInputElement;

const renderStep = () => {
  const setFile = vi.fn();

  function Harness() {
    const [file, setFileState] = useState<File | null>(null);
    const value = {
      step: 0,
      file,
      paste: '',
      sourceLabel: file?.name ?? '',
      courseInfo: COURSE,
      nameSplitRule: 'Last, First',
      preview: [],
      setStep: vi.fn(),
      setFile: (next: File | null) => {
        setFile(next);
        setFileState(next);
      },
      setPaste: vi.fn(),
      setCourseInfo: vi.fn(),
      setNameSplitRule: vi.fn(),
      setGridApi: vi.fn(),
      runPreview: vi.fn(),
      confirmImport: vi.fn(),
      reset: vi.fn(),
    } satisfies UploadWizardValue;

    return (
      <ThemeProvider theme={getGlassTheme('light')}>
        <UploadWizardContext.Provider value={value}>
          <SelectFileStep />
        </UploadWizardContext.Provider>
      </ThemeProvider>
    );
  }

  return { ...render(<Harness />), setFile };
};

describe('SelectFileStep', () => {
  beforeEach(() => {
    useCourseDriveStore.setState({ filesByCourse: {}, uploadingProgress: {} });
  });

  it('accepts a second spreadsheet that uses the same file name', () => {
    const { setFile } = renderStep();
    const first = sheet('grades.xlsx', 'first');
    const second = sheet('grades.xlsx', 'second');

    fireEvent.change(fileInput(), { target: { files: [first] } });
    expect(setFile).toHaveBeenCalledWith(first);
    expect(screen.getByText('Selected: grades.xlsx')).toBeInTheDocument();
    expect(fileInput().value).toBe('');

    fireEvent.change(fileInput(), { target: { files: [second] } });
    expect(setFile).toHaveBeenCalledWith(second);
    expect(setFile).toHaveBeenCalledTimes(2);
    expect(fileInput().value).toBe('');
  });

  it('lets the lecturer remove a staged file and resets the dropzone', () => {
    const { setFile } = renderStep();
    fireEvent.change(fileInput(), { target: { files: [sheet('grades.xlsx', 'only')] } });
    expect(screen.getByText('Selected: grades.xlsx')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove file/i }));
    expect(setFile).toHaveBeenLastCalledWith(null);
    expect(screen.queryByText('Selected: grades.xlsx')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse from computer/i })).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop exam spreadsheet here/i)).toBeInTheDocument();
  });
});
