import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { getGlassTheme } from '../../styles/theme';
import { CourseDriveView } from './CourseDriveView';
import { CourseDriveDropZone } from './CourseDriveDropZone';
import { CourseDriveTable } from './CourseDriveTable';
import { useCourseDriveStore, useToastStore } from '../../stores';
import type { Course, CourseDriveFile } from '../../types';

const mockCourse: Course = {
  course_id: 101,
  course_name: 'Software Engineering Principles',
  assigned_professor: 'Prof. Smith',
  semester: 'WiSe25/26',
  study_program: 'SE Master',
  total_attempts: 12,
  pass_rate: 85,
  avg_grade: 2.1,
  is_archived: false,
  version: 1,
  marks: [],
};

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={getGlassTheme('light')}>{ui}</ThemeProvider>);
};

describe('Course Drive UI (US-02 & US-04)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCourseDriveStore.setState({ filesByCourse: {}, uploadingProgress: {} });
    useToastStore.setState({ toast: { open: false, message: '', severity: 'info' } });
    vi.clearAllMocks();
  });

  describe('US-02: Foundation & Layout', () => {
    it('displays friendly empty state when no files exist for the course', () => {
      renderWithTheme(<CourseDriveView course={mockCourse} />);

      expect(screen.getByText(/No files in Course Drive yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upload your first file/i })).toBeInTheDocument();
    });

    it('renders clean data table displaying file name, upload date, and status badge when files exist', () => {
      const mockFiles: CourseDriveFile[] = [
        {
          id: 'file-1',
          course_id: 101,
          name: 'exam_results_wise25.xlsx',
          size_bytes: 45056,
          uploaded_at: '2026-10-12T14:30:00.000Z',
          uploaded_by: 'Dr. Instructor',
          status: 'parsed',
          status_message: 'Parsed Successfully: 42 records processed',
        },
      ];

      renderWithTheme(
        <CourseDriveTable
          files={mockFiles}
          onDelete={vi.fn()}
          onReparse={vi.fn()}
        />,
      );

      expect(screen.getByText('exam_results_wise25.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Dr. Instructor')).toBeInTheDocument();
      expect(screen.getByText('Parsed Successfully')).toBeInTheDocument();
      expect(screen.getByText('44 KB')).toBeInTheDocument();
    });
  });

  describe('US-04: Advanced File Management & Feedback', () => {
    it('rejects invalid file types (.exe, .sh) immediately with error toast before sending to backend', () => {
      const onUploadMock = vi.fn();
      renderWithTheme(<CourseDriveDropZone onUpload={onUploadMock} />);

      const dropzone = screen.getByText(/Drag & drop exam spreadsheet here/i).closest('div');
      expect(dropzone).toBeInTheDocument();

      const invalidFile = new File(['malicious'], 'trojan.exe', { type: 'application/x-msdownload' });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { files: [invalidFile] } });

      // Verification: onUpload is NOT called, error toast is triggered
      expect(onUploadMock).not.toHaveBeenCalled();
      const toastState = useToastStore.getState().toast;
      expect(toastState.open).toBe(true);
      expect(toastState.severity).toBe('error');
      expect(toastState.message).toMatch(/Invalid file type "trojan.exe"/i);
    });

    it('accepts valid spreadsheet files (.xlsx, .csv) and invokes upload handler', () => {
      const onUploadMock = vi.fn().mockResolvedValue(undefined);
      renderWithTheme(<CourseDriveDropZone onUpload={onUploadMock} />);

      const validFile = new File(['grades'], 'exam_marks.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [validFile] } });

      expect(onUploadMock).toHaveBeenCalledWith(validFile);
    });

    it('displays loading spinner and progress indicator when upload is in progress', () => {
      renderWithTheme(
        <CourseDriveDropZone
          onUpload={vi.fn()}
          isUploading={true}
          uploadProgress={45}
          currentFileName="exam_winter.xlsx"
        />,
      );

      expect(screen.getAllByRole('progressbar')).toHaveLength(2);
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('exam_winter.xlsx')).toBeInTheDocument();
      expect(screen.getByText(/Uploading & Parsing File.../i)).toBeInTheDocument();
    });
  });
});
