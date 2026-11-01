import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import type { CourseDriveFile, UploadCourseInfo } from '../../../types';
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

const renderStep = (initialPaste = '') => {
  const setFile = vi.fn();
  const setPaste = vi.fn();

  function Harness() {
    const [file, setFileState] = useState<File | null>(null);
    const [paste, setPasteState] = useState(initialPaste);
    const value = {
      step: 0,
      file,
      paste,
      sourceLabel: file?.name ?? (paste.trim() ? 'Pasted data' : ''),
      courseInfo: COURSE,
      nameSplitRule: 'Last, First',
      preview: [],
      setStep: vi.fn(),
      setFile: (next: File | null) => {
        setFile(next);
        setFileState(next);
      },
      setPaste: (next: string) => {
        setPaste(next);
        setPasteState(next);
        setFileState(null);
      },
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

  return { ...render(<Harness />), setFile, setPaste };
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

  it('decouples Course Drive and does not display or embed file management elements (#104090)', () => {
    renderStep();

    expect(screen.queryByText(/Course Documents Repository/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No files in Course Drive yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Course Documents Repository/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upload your first file/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not embed Course Drive stored files table even when files exist for course (#104090)', () => {
    const mockFile: CourseDriveFile = {
      id: 'stored-1',
      course_id: 101,
      name: 'stored_exam_grades.xlsx',
      size_bytes: 32768,
      uploaded_at: '2026-10-15T10:00:00.000Z',
      uploaded_by: 'Dr. Instructor',
      status: 'parsed',
    };
    useCourseDriveStore.setState({
      filesByCourse: { '101': [mockFile] },
      uploadingProgress: {},
    });

    renderStep();

    expect(screen.queryByText('stored_exam_grades.xlsx')).not.toBeInTheDocument();
    expect(screen.queryByText(/Course Documents Repository/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select for ingestion/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not display an identified rows counter badge when tabular data is pasted (#104088)', () => {
    renderStep('Matrikelnr\tName\tNote\n1001001\tSchneider, Lena\t1.3\n1001002\tWeber, Max\t2.0');

    expect(screen.queryByText(/rows detected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s+rows?/i)).not.toBeInTheDocument();
  });

  it('dynamically synchronizes wizard state when pasted tabular data is modified in Step 1 (#104089)', () => {
    const { setPaste, setFile } = renderStep('Matrikelnr\tName\tNote\n1001001\tSchneider, Lena\t1.3');
    const pasteInput = screen.getByLabelText('Paste tabular grade data') as HTMLTextAreaElement;

    const updatedPaste = 'Matrikelnr\tName\tNote\n1001001\tSchneider, Lena\t1.0\n1001002\tWeber, Max\t2.3';
    fireEvent.change(pasteInput, { target: { value: updatedPaste } });

    expect(setPaste).toHaveBeenCalledWith(updatedPaste);
    expect(setFile).toHaveBeenCalledWith(null);
    expect(pasteInput.value).toBe(updatedPaste);
  });
});
