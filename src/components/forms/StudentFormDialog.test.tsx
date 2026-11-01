import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../styles/theme';
import type { Student } from '../../types';
import { StudentFormDialog } from './StudentFormDialog';

const mockSaveStudent = vi.fn();

vi.mock('../../hooks/useApi', () => ({
  useApiMutations: () => ({
    saveStudent: mockSaveStudent,
  }),
}));

const sampleStudent: Student = {
  student_id: 12345,
  name: 'Ada Lovelace',
  program: 'SE Master',
  total_exams: 5,
  passed_exams: 4,
  avg_grade: 1.5,
  version: 3,
};

const renderDialog = (
  student: Student | null = sampleStudent,
  existingStudentIds: number[] = [12345, 99999],
) => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <StudentFormDialog
        student={student}
        existingStudentIds={existingStudentIds}
        onClose={onClose}
        onSaved={onSaved}
      />
    </ThemeProvider>,
  );

  return { onClose, onSaved };
};

describe('StudentFormDialog (#97930 & #104082: Student Data Profile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveStudent.mockResolvedValue({ success: true });
  });

  it('renders unified form blank for Create New Student with Save and Cancel buttons (AC1 & AC2)', () => {
    const { onClose } = renderDialog(null);

    expect(screen.getByText('Create New Student')).toBeInTheDocument();
    expect(screen.getByLabelText(/student id \/ matrikelnummer/i)).toHaveValue(null);
    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Clicking Cancel returns without saving
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockSaveStudent).not.toHaveBeenCalled();
  });

  it('renders Edit Student pre-populated with current student metadata without Status field (#104082)', () => {
    renderDialog(sampleStudent);

    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByLabelText(/student id \/ matrikelnummer/i)).toHaveValue(12345);
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Lovelace');
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
  });

  it('enforces validation before submission, highlighting missing mandatory fields (AC1)', () => {
    renderDialog(null);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Student ID is mandatory')).toBeInTheDocument();
    expect(screen.getByText('First Name is mandatory')).toBeInTheDocument();
    expect(screen.getByText('Last Name is mandatory')).toBeInTheDocument();
    expect(screen.getByText('Study Program is mandatory')).toBeInTheDocument();
    expect(mockSaveStudent).not.toHaveBeenCalled();
  });

  it('enforces validation preventing duplicate Student IDs before submission (AC1)', () => {
    // 99999 is in existingStudentIds
    renderDialog(null, [12345, 99999]);

    fireEvent.change(screen.getByLabelText(/student id \/ matrikelnummer/i), {
      target: { value: '99999' },
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Grace' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Hopper' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Student ID already exists')).toBeInTheDocument();
    expect(mockSaveStudent).not.toHaveBeenCalled();
  });

  it('handles backend 409 Conflict and highlights duplicate Student ID error (AC4)', async () => {
    mockSaveStudent.mockResolvedValue({
      success: false,
      conflict: true,
      error: 'Student ID already exists',
    });

    renderDialog(null, []);

    fireEvent.change(screen.getByLabelText(/student id \/ matrikelnummer/i), {
      target: { value: '88888' },
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Charles' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Babbage' },
    });

    // Pick study program from dropdown
    fireEvent.mouseDown(screen.getByLabelText(/study program/i));
    const option = await screen.findByRole('option', { name: /se master/i });
    fireEvent.click(option);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockSaveStudent).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Student ID already exists')).toBeInTheDocument();
  });

  it('successfully submits student creation payload without status field (#104082)', async () => {
    const { onClose, onSaved } = renderDialog(null, []);

    fireEvent.change(screen.getByLabelText(/student id \/ matrikelnummer/i), {
      target: { value: '77777' },
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Katherine' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Johnson' },
    });

    fireEvent.mouseDown(screen.getByLabelText(/study program/i));
    const option = await screen.findByRole('option', { name: /data science master/i });
    fireEvent.click(option);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockSaveStudent).toHaveBeenCalledTimes(1);
    });

    const [payload, version] = mockSaveStudent.mock.calls[0] as [
      Record<string, unknown>,
      number | undefined,
    ];
    expect(payload).toEqual({
      student_id: '77777',
      first_name: 'Katherine',
      last_name: 'Johnson',
      program: 'Data Science Master',
    });
    expect(version).toBeUndefined();

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(77777);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('successfully submits student edit payload without status field (#104082)', async () => {
    const { onClose, onSaved } = renderDialog(sampleStudent);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'Augusta Ada' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockSaveStudent).toHaveBeenCalledTimes(1);
    });

    const [payload, version] = mockSaveStudent.mock.calls[0] as [
      Record<string, unknown>,
      number | undefined,
    ];
    expect(payload).toEqual({
      student_id: '12345',
      first_name: 'Augusta Ada',
      last_name: 'Lovelace',
      program: 'SE Master',
    });
    expect(version).toBe(3);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(12345);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('eliminates Graduate and Fail student lifecycle classifications and actions (#104083)', () => {
    renderDialog(sampleStudent);

    expect(screen.queryByText(/graduate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/graduated/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /graduate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fail/i })).not.toBeInTheDocument();
  });
});
