import { describe, expect, it } from 'vitest';
import {
  ALL_EXAMS,
  ALL_SEMESTERS,
  examsOf,
  filterLabel,
  filterMarks,
  semestersOf,
  summariseMarks,
} from './courseMarks';
import type { AttemptType, CourseMark } from '../types';

let nextId = 1;

/** A course mark with only the fields these functions read spelled out. */
const mark = (
  semester: string,
  grade: number | null,
  attempt_type: AttemptType = 'Exam 1',
  extra: Partial<CourseMark> = {},
): CourseMark => ({
  result_id: nextId++,
  student_id: 1000 + nextId,
  student_name: 'Student',
  program: 'SE Master',
  semester,
  grade,
  passed: grade != null && grade <= 4.0,
  outcome: grade == null ? 'excused' : grade <= 4.0 ? 'passed' : 'failed',
  absence_code: grade == null ? 'AT' : null,
  attempt_type,
  version: 1,
  ...extra,
});

describe('semestersOf', () => {
  it('lists each semester once, oldest first', () => {
    const marks = [
      mark('WISE_25', 2.0),
      mark('SOSE_25', 1.0),
      mark('WISE_25', 3.0),
      mark('SOSE_26', 2.3),
    ];
    expect(semestersOf(marks)).toEqual(['SOSE_25', 'WISE_25', 'SOSE_26']);
  });

  it('is empty for a course with no marks', () => {
    expect(semestersOf([])).toEqual([]);
  });
});

describe('examsOf', () => {
  it('lists the sittings within one semester in exam order', () => {
    const marks = [
      mark('SOSE_25', 2.0, 'Exam 2'),
      mark('SOSE_25', 1.0, 'Exam 1'),
      mark('WISE_25', 3.0, 'Other'),
    ];
    expect(examsOf(marks, 'SOSE_25')).toEqual(['Exam 1', 'Exam 2']);
    expect(examsOf(marks, 'WISE_25')).toEqual(['Other']);
  });

  it('orders Exam 1 before Exam 2 before Other, not alphabetically', () => {
    const marks = [
      mark('SOSE_25', 2.0, 'Other'),
      mark('SOSE_25', 2.0, 'Exam 2'),
      mark('SOSE_25', 2.0, 'Exam 1'),
    ];
    expect(examsOf(marks, 'SOSE_25')).toEqual(['Exam 1', 'Exam 2', 'Other']);
  });

  it('treats a missing tag as Other, the way the backend defaults it', () => {
    const untagged = mark('SOSE_25', 2.0, '' as AttemptType);
    expect(examsOf([untagged], 'SOSE_25')).toEqual(['Other']);
  });

  it('spans every semester when none is selected', () => {
    const marks = [mark('SOSE_25', 2.0, 'Exam 1'), mark('WISE_25', 2.0, 'Exam 2')];
    expect(examsOf(marks, ALL_SEMESTERS)).toEqual(['Exam 1', 'Exam 2']);
  });
});

describe('filterMarks', () => {
  const marks = [
    mark('SOSE_25', 1.0, 'Exam 1'),
    mark('SOSE_25', 5.0, 'Exam 2'),
    mark('WISE_25', 2.0, 'Exam 1'),
  ];

  it('returns everything when nothing is selected', () => {
    expect(filterMarks(marks, ALL_SEMESTERS, ALL_EXAMS)).toHaveLength(3);
  });

  it('narrows to one semester', () => {
    const result = filterMarks(marks, 'SOSE_25', ALL_EXAMS);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.semester === 'SOSE_25')).toBe(true);
  });

  it('narrows to one sitting within a semester', () => {
    const result = filterMarks(marks, 'SOSE_25', 'Exam 2');
    expect(result).toHaveLength(1);
    expect(result[0].grade).toBe(5.0);
  });

  it('does not leak the same sitting from another semester', () => {
    // Both semesters have an "Exam 1"; picking SOSE_25 must exclude WISE_25's.
    const result = filterMarks(marks, 'SOSE_25', 'Exam 1');
    expect(result).toHaveLength(1);
    expect(result[0].semester).toBe('SOSE_25');
  });

  it('returns nothing for a combination that was never recorded', () => {
    expect(filterMarks(marks, 'WISE_25', 'Exam 2')).toEqual([]);
  });
});

describe('summariseMarks', () => {
  it('matches the backend: excused sittings count as attempts but not toward the pass rate', () => {
    const marks = [
      mark('SOSE_25', 1.0), // passed
      mark('SOSE_25', 5.0), // failed
      mark('SOSE_25', null), // excused (AT)
    ];
    const summary = summariseMarks(marks);
    expect(summary.totalAttempts).toBe(3);
    // 1 pass out of 2 counted sittings, the excused one excluded.
    expect(summary.passRate).toBe(50);
  });

  it('averages the passed sittings only, as the backend does', () => {
    const marks = [mark('SOSE_25', 1.0), mark('SOSE_25', 3.0), mark('SOSE_25', 5.0)];
    // (1.0 + 3.0) / 2 -- the 5.0 is a fail and does not pull the mean.
    expect(summariseMarks(marks).avgGrade).toBe(2);
  });

  it('rounds the pass rate to one decimal and the average to two', () => {
    const marks = [mark('SOSE_25', 1.3), mark('SOSE_25', 1.7), mark('SOSE_25', 5.0)];
    expect(summariseMarks(marks).passRate).toBe(66.7);
    expect(summariseMarks(marks).avgGrade).toBe(1.5);
  });

  it('reports zeroes rather than NaN for an empty selection', () => {
    expect(summariseMarks([])).toEqual({ totalAttempts: 0, passRate: 0, avgGrade: 0 });
  });

  it('reports a zero average when nothing passed', () => {
    const summary = summariseMarks([mark('SOSE_25', 5.0)]);
    expect(summary.passRate).toBe(0);
    expect(summary.avgGrade).toBe(0);
  });

  it('does not divide by zero when every sitting was excused', () => {
    const summary = summariseMarks([mark('SOSE_25', null), mark('SOSE_25', null)]);
    expect(summary.totalAttempts).toBe(2);
    expect(summary.passRate).toBe(0);
  });
});

describe('filterLabel', () => {
  it('is null when no semester is selected, so the caller can hide the chip', () => {
    expect(filterLabel(ALL_SEMESTERS, ALL_EXAMS)).toBeNull();
  });

  it('names the semester alone, then the sitting once one is chosen', () => {
    expect(filterLabel('SOSE_25', ALL_EXAMS)).toBe('SOSE_25');
    expect(filterLabel('SOSE_25', 'Exam 2')).toBe('SOSE_25 · Exam 2');
  });
});
