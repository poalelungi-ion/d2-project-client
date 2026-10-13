import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../styles/theme';
import type { Course } from '../../types';
import { CourseFormDialog } from './CourseFormDialog';

const mockSaveCourse = vi.fn();

vi.mock('../../hooks/useApi', () => ({
  useApiMutations: () => ({
    saveCourse: mockSaveCourse,
  }),
}));

const sampleCourse: Course = {
  course_id: 101,
  course_name: 'Distributed Systems',
  semester: 'WiSe24/25',
  study_program: 'SE Master',
  assigned_professor: 'Prof. Turing',
  total_attempts: 10,
  pass_rate: 80,
  avg_grade: 2.1,
  is_archived: false,
  version: 2,
  marks: [],
};

const renderDialog = (course: Course | null = sampleCourse) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <CourseFormDialog course={course} onClose={onClose} onSaved={onSaved} />
    </ThemeProvider>,
  );

  return { onClose, onSaved };
};

describe('CourseFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCourse.mockResolvedValue(true);
  });

  it('renders Edit Course without a Study Program input field or container', () => {
    renderDialog(sampleCourse);

    expect(screen.getByText('Edit Course')).toBeInTheDocument();
    expect(screen.getByLabelText(/course number \/ id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/course name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/semester/i)).toBeInTheDocument();

    // Verify Assigned Professor and Study Program fields and labels are completely absent (#99886)
    expect(screen.queryByLabelText(/assigned professor/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/study program/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/study program/i)).not.toBeInTheDocument();
  });

  it('renders Create New Course without an Assigned Professor or Study Program input field', () => {
    renderDialog(null);

    expect(screen.getByText('Create New Course')).toBeInTheDocument();
    expect(screen.queryByLabelText(/assigned professor/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/study program/i)).not.toBeInTheDocument();
  });

  it('submits course updates without study_program or professor in the payload (#99886)', async () => {
    const { onClose, onSaved } = renderDialog(sampleCourse);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockSaveCourse).toHaveBeenCalledTimes(1);
    });
    const [payload, version] = mockSaveCourse.mock.calls[0] as [
      Record<string, unknown>,
      number,
    ];

    expect(payload).toEqual({
      course_id: '101',
      course_name: 'Distributed Systems',
      semester: 'WiSe24/25',
    });
    expect(payload).not.toHaveProperty('study_program');
    expect(payload).not.toHaveProperty('professor');
    expect(version).toBe(2);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith('101');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('validates mandatory fields without requiring study program', () => {
    renderDialog(null);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Course Name is mandatory')).toBeInTheDocument();
    expect(screen.getByText('Course ID is mandatory')).toBeInTheDocument();
    expect(screen.getByText('Semester is mandatory')).toBeInTheDocument();
    expect(screen.queryByText('Study Program is mandatory')).not.toBeInTheDocument();
    expect(mockSaveCourse).not.toHaveBeenCalled();
  });
});
