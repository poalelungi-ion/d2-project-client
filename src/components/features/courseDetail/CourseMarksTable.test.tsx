import { describe, expect, it } from 'vitest';
import type { ValueSetterParams } from 'ag-grid-community';
import type { CourseMark } from '../../../types';
import { individualMarksColumnDefs } from './CourseMarksTable';

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

    expect(apply('NE')).toBe(true);
    expect(data.grade).toBe(5);
    expect(data.outcome).toBe('failed');
    expect(data.absence_code).toBe('NE');
    expect(data.student_name).toBe('Anna Early');
  });
});
