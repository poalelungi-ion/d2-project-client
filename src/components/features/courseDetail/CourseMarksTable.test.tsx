import { describe, expect, it, vi } from 'vitest';
import type { ValueSetterParams } from 'ag-grid-community';
import type { CourseMark } from '../../../types';
import { chart } from '../../../styles/colors';
import { perStudentHistory } from '../../../utils/courseMarks';
import { historyColumnDefs, individualMarksColumnDefs } from './CourseMarksTable';

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

describe('consolidated Best Mark column (#104098)', () => {
  it('replaces separate Exam 1 and Exam 2 columns with a single Best Mark column in the course grade table', () => {
    const cols = historyColumnDefs(chart, vi.fn(), vi.fn(), vi.fn());
    const headers = cols.map((c) => c.headerName);
    const fields = cols.map((c) => c.field ?? c.colId);

    expect(headers).toContain('Best Mark');
    expect(headers).not.toContain('Exam 1 Grade');
    expect(headers).not.toContain('Exam 2 Grade');
    expect(fields).not.toContain('exam1_grade');
    expect(fields).not.toContain('exam2_grade');
  });

  it('displays the lowest numeric German grade (1.0-5.0) as Best Mark across multiple attempts', () => {
    const sittings: CourseMark[] = [
      { ...sitting(3.7), result_id: 1, attempt_type: 'Exam 1' },
      { ...sitting(1.3), result_id: 2, attempt_type: 'Exam 2' },
    ];
    const rows = perStudentHistory(sittings);
    expect(rows).toHaveLength(1);
    expect(rows[0].best_grade).toBe(1.3);
  });
});
