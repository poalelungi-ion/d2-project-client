import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ICellRendererParams, ValueSetterParams } from 'ag-grid-community';
import type { CourseMark } from '../../../types';
import type { CourseHistoryRow } from '../../../utils/courseMarks';
import { chart } from '../../../styles/colors';
import { individualMarksColumnDefs, historyColumnDefs } from './CourseMarksTable';
import { StudentAttemptsDialog } from './StudentAttemptsDialog';

const sitting = (grade: number): CourseMark => ({
  result_id: 1,
  student_id: 1001,
  student_name: 'Anna Early',
  program: 'SE Master',
  semester: 'WISE_25',
  grade,
  passed: grade <= 4,
  outcome: grade <= 4 ? 'passed' : 'failed',
  absence_code: null,
  attempt_type: 'Exam 1',
  version: 1,
});

const mockHistoryRow: CourseHistoryRow = {
  student_id: 1001,
  student_name: 'Anna Early',
  program: 'SE Master',
  semester: 'SOSE_24, WISE_24',
  best_grade: 1.7,
  best_absence: null,
  best_outcome: 'passed',
  best_attempt_label: 'WISE_24 · Exam 2',
  attempt_count: 2,
  exam1_grade: 5.0,
  exam1_absence: null,
  exam2_grade: 1.7,
  exam2_absence: null,
  final_status: 'Passed',
  marks: [
    {
      result_id: 1,
      student_id: 1001,
      student_name: 'Anna Early',
      program: 'SE Master',
      semester: 'SOSE_24',
      grade: 5.0,
      passed: false,
      outcome: 'failed',
      absence_code: null,
      attempt_type: 'Exam 1',
      version: 1,
    },
    {
      result_id: 2,
      student_id: 1001,
      student_name: 'Anna Early',
      program: 'SE Master',
      semester: 'WISE_24',
      grade: 1.7,
      passed: true,
      outcome: 'passed',
      absence_code: null,
      attempt_type: 'Exam 2',
      version: 1,
    },
  ],
};

describe('individual marks columns', () => {
  it('lets the lecturer edit only the Grade column', () => {
    const cols = individualMarksColumnDefs('light');
    const editable = cols
      .filter((col) => col.editable === true)
      .map((col) => col.field ?? col.colId);
    expect(editable).toEqual(['grade']);

    const gradeCol = cols.find((col) => col.field === 'grade');
    expect(gradeCol?.cellDataType).toBe(false);
    expect(gradeCol?.cellEditor).toBe('agTextCellEditor');
  });

  it('applies the same grade rules as upload and keeps other fields intact', () => {
    const gradeCol = individualMarksColumnDefs('light').find((col) => col.field === 'grade');
    const setter = gradeCol?.valueSetter;
    expect(typeof setter).toBe('function');
    if (typeof setter !== 'function') return;

    const data = sitting(1.0);
    const apply = (value: string) =>
      setter({ newValue: value, data } as ValueSetterParams<CourseMark, unknown>);

    expect(apply('Passed')).toBe(false);
    expect(data.grade).toBe(1.0);

    expect(apply('NE')).toBe(false);
    expect(data.grade).toBe(1.0);

    expect(apply('2.3')).toBe(true);
    expect(data.grade).toBe(2.3);
    expect(data.outcome).toBe('passed');
    expect(data.absence_code).toBe(null);
    expect(data.student_name).toBe('Anna Early');
  });
});

describe('Task #104104: Chronological Mark History via Best Mark Entry', () => {
  it('configures Best Mark column with header name and clickable trigger', () => {
    const onRevealHistory = vi.fn();
    const cols = historyColumnDefs(chart, vi.fn(), vi.fn(), onRevealHistory);
    const bestMarkCol = cols.find((col) => col.colId === 'best_grade');

    expect(bestMarkCol).toBeDefined();
    expect(bestMarkCol?.headerName).toBe('Best Mark');

    const renderer = bestMarkCol?.cellRenderer as (params: ICellRendererParams<CourseHistoryRow>) => React.ReactElement;
    expect(typeof renderer).toBe('function');

    const rendered = renderer({ data: mockHistoryRow } as ICellRendererParams<CourseHistoryRow>);
    render(<div>{rendered}</div>);

    const bestMarkEntry = screen.getByTestId('best-mark-entry');
    expect(bestMarkEntry).toBeInTheDocument();
    expect(screen.getByText('1.7')).toBeInTheDocument();
    expect(screen.getByText('WISE_24 · Exam 2')).toBeInTheDocument();

    fireEvent.click(bestMarkEntry);
    expect(onRevealHistory).toHaveBeenCalledWith(mockHistoryRow);
  });

  it('renders complete chronological exam attempts in StudentAttemptsDialog upon clicking Best Mark', () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();

    render(
      <StudentAttemptsDialog
        open={true}
        historyRow={mockHistoryRow}
        courseName="Distributed Systems"
        onClose={onClose}
        onEditAttempt={onEdit}
      />,
    );

    expect(screen.getByText('Exam Attempts History')).toBeInTheDocument();
    expect(screen.getByText('Distributed Systems')).toBeInTheDocument();
    expect(screen.getByText('Total Recorded Attempts:')).toBeInTheDocument();

    // Check attempts in chronological table
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('SOSE_24')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('WISE_24')).toBeInTheDocument();
    expect(screen.getAllByText('1.7')).toHaveLength(2);
    expect(screen.getByText('Best')).toBeInTheDocument();
  });
});
