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

const detail = (marks: CourseMark[]) => (
  <ThemeProvider theme={getGlassTheme('light')}>
    <MemoryRouter>
      <CourseDetail course={course(marks)} onRefresh={() => Promise.resolve()} />
    </MemoryRouter>
  </ThemeProvider>
);

const renderDetail = (marks: CourseMark[] = MARKS) => render(detail(marks));

const renderCourse = (current: Course) => {
  const ui = (next: Course) => (
    <ThemeProvider theme={getGlassTheme('light')}>
      <MemoryRouter>
        <CourseDetail course={next} onRefresh={() => Promise.resolve()} />
      </MemoryRouter>
    </ThemeProvider>
  );
  const view = render(ui(current));
  return { ...view, update: (next: Course) => view.rerender(ui(next)) };
};

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

describe('course without submissions', () => {
  it('shows a placeholder instead of the headline figures and charts', () => {
    const consoleError = vi.spyOn(console, 'error');
    renderDetail([]);

    expect(screen.getByText(/No submissions yet/)).toBeInTheDocument();
    expect(screen.queryByText(/Pass Rate/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Average Grade:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Course Grade Distribution')).not.toBeInTheDocument();
    // The way out of the empty state stays reachable.
    expect(screen.getByRole('button', { name: /upload exam data/i })).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('shows the figures once the first submission arrives', () => {
    const { rerender } = renderDetail([]);

    rerender(detail([mark('WISE_25', 'Exam 1', 'Clara Later', 3.0)]));

    expect(screen.queryByText(/No submissions yet/)).not.toBeInTheDocument();
    expect(statFor(/Pass Rate/)).toBe('Pass Rate: 100%');
    expect(screen.getByText('Course Grade Distribution')).toBeInTheDocument();
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

describe('per-person history columns', () => {
  /** Reads a rendered AG Grid cell by its column id. */
  const cell = (colId: string): string =>
    (document.querySelector(`[col-id="${colId}"][role="gridcell"]`)?.textContent ?? '').trim();

  /** Both sittings must belong to one student, or they become two rows. */
  const bruno = (): CourseMark[] =>
    [
      mark('SOSE_25', 'Exam 1', 'Bruno Retake', 5.0),
      mark('SOSE_25', 'Exam 2', 'Bruno Retake', 1.7),
    ].map((m) => ({ ...m, student_id: 500 }));

  it('shows a retake under Exam 2 when the grid is filtered to Exam 2', () => {
    renderDetail(bruno());

    choose(semesterSelect(), 'SOSE_25');
    choose(examSelect()!, 'Exam 2');

    expect(cell('exam2_grade')).toBe('1.7');
    expect(cell('exam1_grade')).toBe('—');
  });

  it('keeps both sittings in their own columns when unfiltered', () => {
    renderDetail(bruno());

    expect(cell('exam1_grade')).toBe('5');
    expect(cell('exam2_grade')).toBe('1.7');
  });
});

describe('empty course state', () => {
  it('shows a placeholder instead of empty metrics and charts', () => {
    const { container } = renderCourse(course([]));

    expect(screen.getByText('No submissions yet')).toBeInTheDocument();
    expect(screen.queryByText('Pass Rate:')).not.toBeInTheDocument();
    expect(screen.queryByText('Average Grade:')).not.toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).toBeNull();
    expect(screen.getByRole('button', { name: /upload exam data/i })).toBeInTheDocument();
  });

  it('shows metrics when the first submission arrives', () => {
    const { container, update } = renderCourse(course([]));
    expect(screen.getByText('No submissions yet')).toBeInTheDocument();

    const firstMark = mark('WISE_25', 'Exam 1', 'Lena Schneider', 1.7);
    update(course([firstMark]));

    expect(screen.queryByText('No submissions yet')).not.toBeInTheDocument();
    expect(screen.getByText('Pass Rate:')).toBeInTheDocument();
    expect(screen.getByText('Average Grade:')).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull();
  });
});

describe('exam comparison', () => {
  const compareMode = () => screen.getByRole('button', { name: /compare exams/i });
  const semesterA = () => screen.getByRole('combobox', { name: /semester a/i });
  const semesterB = () => screen.getByRole('combobox', { name: /semester b/i });
  const examA = () => screen.queryByRole('combobox', { name: /^exam a$/i });
  const examB = () => screen.queryByRole('combobox', { name: /^exam b$/i });

  /** The comparison panel only, so its figures never collide with the header's. */
  const panel = (): HTMLElement =>
    screen.getByText(/ vs /).closest('.MuiPaper-root') as HTMLElement;

  /** Every "<label>: <value>" line inside the panel matching `label`. */
  const panelStats = (label: RegExp): string[] =>
    within(panel())
      .getAllByText(label)
      .map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim());

  it('is not offered while the course has held only one sitting', () => {
    renderDetail([
      mark('SOSE_25', 'Exam 1', 'Anna Early', 1.0),
      mark('SOSE_25', 'Exam 1', 'Bruno Second', 2.0),
    ]);
    expect(screen.queryByRole('button', { name: /compare exams/i })).not.toBeInTheDocument();
  });

  it('asks for a semester on each side before it compares anything', () => {
    renderDetail();
    fireEvent.click(compareMode());

    expect(screen.getByText(/pick a semester for a and for b/i)).toBeInTheDocument();
    // Semester comes first: there is nothing to narrow until one is chosen.
    expect(examA()).not.toBeInTheDocument();
  });

  it('compares whole semesters once both are chosen', () => {
    renderDetail();
    fireEvent.click(compareMode());
    choose(semesterA(), 'SOSE_25');
    choose(semesterB(), 'WISE_25');

    // SOSE_25 held a 1.0 pass and a 5.0 fail; WISE_25 a single 3.0 pass.
    expect(within(panel()).getByText('SOSE_25 vs WISE_25')).toBeInTheDocument();
    expect(panelStats(/Pass Rate:/)).toEqual(['Pass Rate: 50%', 'Pass Rate: 100%']);
    expect(panelStats(/^Submissions:/)).toEqual(['Submissions: 2', 'Submissions: 1']);
  });

  it('offers the individual exams only for a semester that held more than one', () => {
    renderDetail();
    fireEvent.click(compareMode());

    choose(semesterA(), 'SOSE_25');
    expect(examA()).toBeInTheDocument();

    choose(semesterB(), 'WISE_25');
    expect(examB()).not.toBeInTheDocument();
  });

  it('narrows a side to one sitting of the semester already chosen', () => {
    renderDetail();
    fireEvent.click(compareMode());
    choose(semesterA(), 'SOSE_25');
    choose(semesterB(), 'SOSE_25');
    expect(screen.getByText(/same sitting/i)).toBeInTheDocument();

    choose(examA()!, 'Exam 1');
    choose(examB()!, 'Exam 2');

    expect(within(panel()).getByText('SOSE_25 · Exam 1 vs SOSE_25 · Exam 2')).toBeInTheDocument();
    expect(panelStats(/Pass Rate:/)).toEqual(['Pass Rate: 100%', 'Pass Rate: 0%']);
    expect(panelStats(/Average Grade:/)).toEqual(['Average Grade: 1', 'Average Grade: 0']);
  });

  it('reports the change from A to B', () => {
    renderDetail();
    fireEvent.click(compareMode());
    choose(semesterA(), 'SOSE_25');
    choose(semesterB(), 'SOSE_25');
    choose(examA()!, 'Exam 1');
    choose(examB()!, 'Exam 2');

    expect(panelStats(/Pass rate:/)).toEqual(['Pass rate: -100%']);
  });

  it('drops the exam when its semester changes, since sittings do not carry over', () => {
    renderDetail();
    fireEvent.click(compareMode());
    choose(semesterA(), 'SOSE_25');
    choose(examA()!, 'Exam 2');
    choose(semesterB(), 'WISE_25');
    expect(within(panel()).getByText('SOSE_25 · Exam 2 vs WISE_25')).toBeInTheDocument();

    // WISE_25 never held an Exam 2, so A falls back to the whole semester.
    choose(semesterA(), 'WISE_25');
    expect(screen.getByText(/same sitting/i)).toBeInTheDocument();
  });

  it('leaves the marks table on its own filter', () => {
    renderDetail();
    // The table was narrowed to WISE_25 before the lecturer went comparing.
    choose(semesterSelect(), 'WISE_25');
    fireEvent.click(screen.getByRole('button', { name: /individual marks/i }));
    fireEvent.click(compareMode());
    choose(semesterA(), 'SOSE_25');
    choose(semesterB(), 'WISE_25');

    expect(screen.getByText('Showing WISE_25')).toBeInTheDocument();
    expect(screen.getByText('Clara Later')).toBeInTheDocument();
    expect(screen.queryByText('Anna Early')).not.toBeInTheDocument();
  });

  it('keeps the single-exam filter to come back to', () => {
    renderDetail();
    choose(semesterSelect(), 'SOSE_25');
    fireEvent.click(compareMode());
    fireEvent.click(screen.getByRole('button', { name: /single exam/i }));

    expect(semesterSelect()).toHaveTextContent('SOSE_25');
  });
});
