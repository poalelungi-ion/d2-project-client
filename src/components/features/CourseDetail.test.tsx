import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { CourseDetail } from './CourseDetail';
import { getGlassTheme } from '../../styles/theme';
import type { AttemptType, Course, CourseMark } from '../../types';

let nextId = 1;

const mark = (
  semester: string,
  attempt_type: AttemptType,
  student_name: string,
  grade: number | null,
): CourseMark => ({
  result_id: nextId++,
  student_id: 1000 + nextId,
  student_name,
  program: 'SE Master',
  semester,
  grade,
  passed: grade != null && grade <= 4.0,
  outcome: grade == null ? 'excused' : grade <= 4.0 ? 'passed' : 'failed',
  absence_code: grade == null ? 'AT' : null,
  attempt_type,
  version: 1,
});

/**
 * SOSE_25 held two sittings, WISE_25 only one -- so the exam dropdown must
 * appear for the first and not the second.
 */
const course = (marks: CourseMark[]): Course => ({
  course_id: 101,
  course_name: 'Software Architecture',
  assigned_professor: 'Not Assigned',
  semester: 'WISE_25',
  study_program: 'SE Master',
  total_attempts: marks.length,
  pass_rate: 0,
  avg_grade: 0,
  is_archived: false,
  version: 1,
  marks,
});

const MARKS = [
  mark('SOSE_25', 'Exam 1', 'Anna Early', 1.0),
  mark('SOSE_25', 'Exam 2', 'Bruno Retake', 5.0),
  mark('WISE_25', 'Exam 1', 'Clara Later', 3.0),
];

const renderDetail = (marks: CourseMark[] = MARKS) =>
  render(
    <ThemeProvider theme={getGlassTheme('light')}>
      <MemoryRouter>
        <CourseDetail course={course(marks)} onRefresh={() => Promise.resolve()} />
      </MemoryRouter>
    </ThemeProvider>,
  );

/**
 * Reads one headline figure. Each renders as "<label>: <value>" inside a
 * single Typography, so matching the label finds the pair.
 */
const statFor = (label: RegExp): string =>
  (screen.getByText(label).textContent ?? '').replace(/\s+/g, ' ').trim();

const semesterSelect = () => screen.getByRole('combobox', { name: /^semester$/i });
const examSelect = () => screen.queryByRole('combobox', { name: /^exam$/i });

/** Opens a MUI select and clicks one of its options. */
const choose = (select: HTMLElement, option: RegExp | string) => {
  fireEvent.mouseDown(select);
  fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('semester filter', () => {
  it('offers every semester the course has been held in', () => {
    renderDetail();
    fireEvent.mouseDown(semesterSelect());
    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByText('All semesters')).toBeInTheDocument();
    expect(listbox.getByText('SOSE_25')).toBeInTheDocument();
    expect(listbox.getByText('WISE_25')).toBeInTheDocument();
  });

  it('shows every semester before one is chosen', () => {
    renderDetail();
    expect(screen.getByText(/showing every semester/i)).toBeInTheDocument();
  });

  it('restricts the marks table to the chosen semester', () => {
    renderDetail();
    // Switch to the editable per-sitting grid, which lists one row per mark.
    fireEvent.click(screen.getByRole('button', { name: /individual marks/i }));
    expect(screen.getByText('Clara Later')).toBeInTheDocument();

    choose(semesterSelect(), 'SOSE_25');

    expect(screen.getByText('Anna Early')).toBeInTheDocument();
    expect(screen.getByText('Bruno Retake')).toBeInTheDocument();
    expect(screen.queryByText('Clara Later')).not.toBeInTheDocument();
  });

  it('recomputes the headline figures for that semester only', () => {
    renderDetail();
    // Across both semesters: 3 sittings, 2 of 3 passed, mean of 1.0 and 3.0.
    expect(statFor(/Total Submissions/)).toBe('Total Submissions: 3');
    expect(statFor(/Pass Rate/)).toBe('Pass Rate: 66.7%');
    expect(statFor(/Average Grade:/)).toBe('Average Grade: 2');

    choose(semesterSelect(), 'WISE_25');

    // WISE_25 alone holds one sitting, a 3.0 pass.
    expect(statFor(/Total Submissions/)).toBe('Total Submissions: 1');
    expect(statFor(/Pass Rate/)).toBe('Pass Rate: 100%');
    expect(statFor(/Average Grade:/)).toBe('Average Grade: 3');
  });

  it('leaves excused sittings out of the pass rate but counts them as attempts', () => {
    renderDetail([
      mark('SOSE_25', 'Exam 1', 'Anna Early', 1.0),
      mark('SOSE_25', 'Exam 1', 'Dora Excused', null),
    ]);
    choose(semesterSelect(), 'SOSE_25');

    expect(statFor(/Total Submissions/)).toBe('Total Submissions: 2');
    expect(statFor(/Pass Rate/)).toBe('Pass Rate: 100%');
  });

  it('announces the active filter and can clear it', () => {
    renderDetail();
    choose(semesterSelect(), 'SOSE_25');
    expect(screen.getByText('Showing SOSE_25')).toBeInTheDocument();

    // The chip's delete control returns to the unfiltered view.
    fireEvent.click(screen.getByTestId('CancelIcon'));
    expect(screen.getByText(/showing every semester/i)).toBeInTheDocument();
  });
});

describe('exam filter', () => {
  it('is hidden until a semester is chosen', () => {
    renderDetail();
    expect(examSelect()).not.toBeInTheDocument();
  });

  it('appears when the chosen semester held more than one sitting', () => {
    renderDetail();
    choose(semesterSelect(), 'SOSE_25');
    expect(examSelect()).toBeInTheDocument();
  });

  it('stays hidden when the semester held a single sitting', () => {
    renderDetail();
    choose(semesterSelect(), 'WISE_25');
    expect(examSelect()).not.toBeInTheDocument();
  });

  it('narrows the table to one sitting', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /individual marks/i }));
    choose(semesterSelect(), 'SOSE_25');
    choose(examSelect()!, 'Exam 2');

    expect(screen.getByText('Bruno Retake')).toBeInTheDocument();
    expect(screen.queryByText('Anna Early')).not.toBeInTheDocument();
    expect(screen.getByText('Showing SOSE_25 · Exam 2')).toBeInTheDocument();
  });

  it('resets when the semester changes, since sittings do not carry over', () => {
    renderDetail();
    choose(semesterSelect(), 'SOSE_25');
    choose(examSelect()!, 'Exam 2');
    expect(screen.getByText('Showing SOSE_25 · Exam 2')).toBeInTheDocument();

    choose(semesterSelect(), 'WISE_25');
    // Not "WISE_25 · Exam 2", which would have shown an empty table.
    expect(screen.getByText('Showing WISE_25')).toBeInTheDocument();
  });
});
