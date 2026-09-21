import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { CourseDetail } from './CourseDetail';
import { getGlassTheme } from '../../styles/theme';
import type { Course, CourseMark } from '../../types';

// The marks grid is not under test and ag-grid needs a real layout engine.
// CourseDetail hands the grid a ref, so the stand-in has to accept one.
vi.mock('ag-grid-react', async () => {
  const { forwardRef } = await import('react');
  return { AgGridReact: forwardRef(() => null) };
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mark: CourseMark = {
  result_id: 1,
  student_id: 41020,
  student_name: 'Lena Schneider',
  program: 'SE Master',
  semester: 'WISE_25',
  grade: 1.7,
  passed: true,
  outcome: 'passed',
  absence_code: null,
  version: 1,
};

const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  course_id: 3545,
  course_name: 'SE Tools Lab',
  assigned_professor: 'Prof. Muster',
  semester: 'WISE_25',
  study_program: 'SE Master',
  total_attempts: 0,
  pass_rate: 0,
  avg_grade: 0,
  is_archived: false,
  version: 1,
  marks: [],
  ...overrides,
});

// The charts read theme.app.*, which only the app's own theme defines.
const renderDetail = (course: Course) => {
  const ui = (current: Course) => (
    <ThemeProvider theme={getGlassTheme('light')}>
      <MemoryRouter>
        <CourseDetail course={current} onRefresh={vi.fn()} />
      </MemoryRouter>
    </ThemeProvider>
  );
  const view = render(ui(course));
  return { ...view, update: (next: Course) => view.rerender(ui(next)) };
};

describe('CourseDetail without submissions', () => {
  it('shows a placeholder instead of empty metrics and charts', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderDetail(makeCourse());

    expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    expect(screen.queryByText('Pass Rate:')).not.toBeInTheDocument();
    expect(screen.queryByText('Average Grade:')).not.toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).toBeNull();
    // Uploading is how the first submission gets in, so it has to stay reachable.
    expect(screen.getByRole('button', { name: /upload exam data/i })).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('swaps the placeholder for the metrics once the first submission arrives', () => {
    const { container, update } = renderDetail(makeCourse());
    expect(screen.getByText('No submissions yet')).toBeInTheDocument();

    update(makeCourse({ total_attempts: 1, pass_rate: 100, avg_grade: 1.7, marks: [mark] }));

    expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
    expect(screen.getByText('Pass Rate:')).toBeInTheDocument();
    expect(screen.getByText('Average Grade:')).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull();
  });
});
