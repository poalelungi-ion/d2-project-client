import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import { NAV_ITEMS, ROUTES } from '../../../app/navigation';
import { StudentsAdmin } from '../StudentsAdmin';
import { StudentDetail } from '../StudentDetail';
import { BatchUploadWizard } from './BatchUploadWizard';
import type { StudentDetails } from '../../../types';

vi.mock('../../../hooks/useApi', () => ({
  useStudents: () => ({
    students: [
      {
        student_id: 101,
        name: 'Jane Doe',
        program: 'SE Master',
        status: 'active',
        total_exams: 3,
        passed_exams: 3,
        avg_grade: 1.7,
        version: 1,
      },
    ],
    refetch: vi.fn(),
  }),
  useApiMutations: () => ({
    updateProgram: vi.fn(),
    saveStudent: vi.fn(),
  }),
}));

const mockStudentDetail: StudentDetails = {
  student_id: 101,
  name: 'Jane Doe',
  program: 'SE Master',
  status: 'active',
  version: 1,
  transcript: [],
};

const renderWithTheme = (ui: React.ReactElement) =>
  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      {ui}
    </ThemeProvider>,
  );

describe('Task #104087: Restrict Data Upload Entry Point Exclusively to Course Detail', () => {
  it('ensures global sidebar (NAV_ITEMS) does not contain any upload or batch import links', () => {
    const paths = NAV_ITEMS.map((item) => item.path);
    const labels = NAV_ITEMS.map((item) => item.label.toLowerCase());

    expect(paths).not.toContain(ROUTES.upload);
    expect(labels).not.toContain('upload');
    expect(labels).not.toContain('batch upload');
    expect(labels).not.toContain('import');
    expect(NAV_ITEMS).toHaveLength(2);
    expect(labels).toEqual(['courses', 'students']);
  });

  it('ensures StudentsAdmin roster view renders without any upload buttons or triggers', () => {
    renderWithTheme(
      <MemoryRouter>
        <StudentsAdmin />
      </MemoryRouter>,
    );

    // Roster management elements exist
    expect(screen.getByText('LSF Student Roster')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add student/i })).toBeInTheDocument();

    // No upload buttons or triggers exist
    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/upload exam data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/drag & drop/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('ensures StudentDetail view renders without any file upload triggers or wizard actions', () => {
    renderWithTheme(
      <MemoryRouter>
        <StudentDetail student={mockStudentDetail} onRefresh={vi.fn()} />
      </MemoryRouter>,
    );

    // Student detail actions exist
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit full record/i })).toBeInTheDocument();

    // No upload buttons, manual exam record forms, wizard triggers, or file inputs exist on student page (#104087)
    expect(screen.queryByRole('button', { name: /add exam record/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add manual exam record/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/upload exam data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/drag & drop/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('redirects to /courses if upload wizard is accessed directly without course handoff', () => {
    renderWithTheme(
      <MemoryRouter initialEntries={['/upload']}>
        <Routes>
          <Route path="/upload" element={<BatchUploadWizard />} />
          <Route path="/courses" element={<div>Redirected to Courses Catalogue</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Direct entry without course context is blocked and redirected to course catalogue
    expect(screen.getByText('Redirected to Courses Catalogue')).toBeInTheDocument();
    expect(screen.queryByText('Import grades')).not.toBeInTheDocument();
  });

  it('allows accessing upload wizard when properly initiated with course handoff state', () => {
    renderWithTheme(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/upload',
            state: { courseId: 101, courseName: 'Software Architecture' },
          },
        ]}
      >
        <Routes>
          <Route path="/upload" element={<BatchUploadWizard />} />
        </Routes>
      </MemoryRouter>,
    );

    // Renders wizard locked into the originating course
    expect(screen.getByText('Import grades')).toBeInTheDocument();
    expect(screen.getByText('Course Drive & Documents')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop exam spreadsheet here')).toBeInTheDocument();
  });
});
