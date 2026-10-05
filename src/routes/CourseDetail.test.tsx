import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { getGlassTheme } from '../styles/theme';
import { CourseDetail } from './CourseDetail';
import * as api from '../api/courses';
import { useToastStore } from '../stores/toastStore';

vi.mock('../components/features/CourseDetail', () => ({
  CourseDetail: ({ course }: { course: { course_name: string; course_id: number; semester: string; study_program: string } }) => (
    <div data-testid="course-detail-view">
      <h1>{course.course_name}</h1>
      <span>ID: {course.course_id}</span>
      <span>{course.semester}</span>
      <span>{course.study_program}</span>
    </div>
  ),
}));

const mockGetCourse = vi.spyOn(api, 'getCourse');

const renderWithRoute = (initialPath: string = '/courses/101') => {
  return render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses" element={<div data-testid="courses-list-view">Courses List</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
};

describe('CourseDetail route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.setState({ toast: { open: false, message: '', severity: 'success' } });
  });

  it('displays visual loading state while fetching payload', async () => {
    // Hangs the promise to verify loading skeleton state
    mockGetCourse.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithRoute('/courses/101');

    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByTestId('course-detail-view')).not.toBeInTheDocument();
  });

  it('displays Course Not Found message with a button to return to the course list when course ID is not found (404)', async () => {
    mockGetCourse.mockResolvedValue(new Response(JSON.stringify({ detail: 'Course not found' }), { status: 404 }));

    renderWithRoute('/courses/99999');

    await waitFor(() => {
      expect(screen.getByText('Course Not Found')).toBeInTheDocument();
    });

    const returnBtn = screen.getByRole('button', { name: /course list/i });
    expect(returnBtn).toBeInTheDocument();

    fireEvent.click(returnBtn);

    await waitFor(() => {
      expect(screen.getByTestId('courses-list-view')).toBeInTheDocument();
    });
  });

  it('triggers a toast notification alerting the user to refresh the page when the backend request times out', async () => {
    // Simulate request timeout via status 408 / 504 or network TimeoutError
    const timeoutError = new Error('The operation was timed out');
    timeoutError.name = 'TimeoutError';
    mockGetCourse.mockRejectedValue(timeoutError);

    renderWithRoute('/courses/101');

    await waitFor(() => {
      const state = useToastStore.getState();
      expect(state.toast.open).toBe(true);
      expect(state.toast.message).toMatch(/refresh the page/i);
      expect(state.toast.severity).toBe('error');
    });
  });

  it('renders course detail view and metadata when course is loaded successfully', async () => {
    const coursePayload = {
      course_id: 101,
      course_name: 'Distributed Systems',
      semester: 'SOSE_26',
      study_program: 'SE Master',
      assigned_professor: 'Prof. Turing',
      total_attempts: 12,
      pass_rate: 85,
      avg_grade: 2.1,
      is_archived: false,
      version: 1,
      marks: [],
    };
    mockGetCourse.mockResolvedValue(new Response(JSON.stringify(coursePayload), { status: 200 }));

    renderWithRoute('/courses/101');

    await waitFor(() => {
      expect(screen.getByTestId('course-detail-view')).toBeInTheDocument();
      expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
      expect(screen.getByText('ID: 101')).toBeInTheDocument();
      expect(screen.getByText('SOSE_26')).toBeInTheDocument();
      expect(screen.getByText('SE Master')).toBeInTheDocument();
    });
  });
});
