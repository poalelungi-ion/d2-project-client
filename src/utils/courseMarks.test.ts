import { describe, expect, it } from 'vitest';
import {
  ALL_EXAMS,
  ALL_SEMESTERS,
  EMPTY_SELECTION,
  alignDistribution,
  bySemesterOrder,
  examsOf,
  filterLabel,
  filterMarks,
  gradeDistribution,
  isSameSelection,
  marksOfSelection,
  perStudentHistory,
  selectionLabel,
  semestersOf,
  sharedGrades,
  sittingCount,
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

describe('bySemesterOrder', () => {
  it('sorts chronologically, a multi-semester cell by its earliest', () => {
    const cells = ['WISE_25', 'SOSE_25, WISE_25', 'WISE_24'];
    expect(cells.sort(bySemesterOrder)).toEqual(['WISE_24', 'SOSE_25, WISE_25', 'WISE_25']);
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

describe('perStudentHistory exam columns', () => {
  it('puts each sitting in the column matching its tag', () => {
    const rows = perStudentHistory([
      mark('SOSE_25', 4.0, 'Exam 1'),
      mark('SOSE_25', 1.7, 'Exam 2'),
    ].map((m) => ({ ...m, student_id: 500, student_name: 'Bruno Retake' })));

    expect(rows).toHaveLength(1);
    expect(rows[0].exam1_grade).toBe(4.0);
    expect(rows[0].exam2_grade).toBe(1.7);
  });

  it('reports a retake as Exam 2 even when it is the only sitting', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 1.7, 'Exam 2'), student_id: 500, student_name: 'Bruno Retake' },
    ]);

    expect(rows[0].exam1_grade).toBeNull();
    expect(rows[0].exam2_grade).toBe(1.7);
  });

  it('does not report a skipped first sitting as Exam 1', () => {
    // A student who missed Exam 1 entirely and only sat the retake.
    const rows = perStudentHistory([
      { ...mark('WISE_25', 2.3, 'Exam 2'), student_id: 501, student_name: 'Clara Skipped' },
    ]);

    expect(rows[0].exam1_grade).toBeNull();
    expect(rows[0].exam2_grade).toBe(2.3);
  });

  it('keeps the tag even when the sittings arrive out of order', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 1.7, 'Exam 2'), student_id: 502, student_name: 'Dana' },
      { ...mark('SOSE_25', 5.0, 'Exam 1'), student_id: 502, student_name: 'Dana' },
    ]);

    expect(rows[0].exam1_grade).toBe(5.0);
    expect(rows[0].exam2_grade).toBe(1.7);
  });

  it('falls back to chronological order for untagged legacy rows', () => {
    // Everything imported before the tag existed comes back as "Other".
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 5.0, 'Other'), student_id: 503, student_name: 'Legacy' },
      { ...mark('WISE_25', 2.0, 'Other'), student_id: 503, student_name: 'Legacy' },
    ]);

    expect(rows[0].exam1_grade).toBe(5.0);
    expect(rows[0].exam2_grade).toBe(2.0);
  });

  it('slots an untagged sitting into the column a tagged one left free', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 3.0, 'Other'), student_id: 504, student_name: 'Mixed' },
      { ...mark('SOSE_25', 1.0, 'Exam 2'), student_id: 504, student_name: 'Mixed' },
    ]);

    expect(rows[0].exam1_grade).toBe(3.0);
    expect(rows[0].exam2_grade).toBe(1.0);
  });

  it('still reads the student name when there is no Exam 1 sitting', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 1.7, 'Exam 2'), student_id: 505, student_name: 'Bruno Retake' },
    ]);
    expect(rows[0].student_name).toBe('Bruno Retake');
    expect(rows[0].program).toBe('SE Master');
  });

  it('passes a student who only passed the retake', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 5.0, 'Exam 1'), student_id: 506, student_name: 'Eve' },
      { ...mark('SOSE_25', 2.0, 'Exam 2'), student_id: 506, student_name: 'Eve' },
    ]);
    expect(rows[0].final_status).toBe('Passed');
  });

  it('lists the semesters of every sitting, oldest first', () => {
    const rows = perStudentHistory([
      { ...mark('WISE_25', 2.0, 'Exam 2'), student_id: 507, student_name: 'Finn' },
      { ...mark('SOSE_25', 5.0, 'Exam 1'), student_id: 507, student_name: 'Finn' },
    ]);
    expect(rows[0].semester).toBe('SOSE_25, WISE_25');
  });

  it('names a semester once when both sittings fell in it', () => {
    const rows = perStudentHistory([
      { ...mark('SOSE_25', 5.0, 'Exam 1'), student_id: 508, student_name: 'Gina' },
      { ...mark('SOSE_25', 2.0, 'Exam 2'), student_id: 508, student_name: 'Gina' },
    ]);
    expect(rows[0].semester).toBe('SOSE_25');
  });
});

describe('sittingCount', () => {
  it('counts a retake as a sitting of its own', () => {
    expect(
      sittingCount([
        mark('SOSE_25', 1.0, 'Exam 1'),
        mark('SOSE_25', 1.3, 'Exam 1'),
        mark('SOSE_25', 5.0, 'Exam 2'),
        mark('WISE_25', 2.0, 'Exam 1'),
      ]),
    ).toBe(3);
  });

  it('is below two for a course with a single sitting, which cannot be compared', () => {
    expect(sittingCount([mark('SOSE_25', 1.0), mark('SOSE_25', 2.0)])).toBe(1);
    expect(sittingCount([])).toBe(0);
  });
});

describe('marksOfSelection', () => {
  const marks = [
    mark('SOSE_25', 1.0, 'Exam 1'),
    mark('SOSE_25', 5.0, 'Exam 2'),
    mark('WISE_25', 3.0, 'Exam 1'),
  ];

  it('covers the whole semester until an exam narrows it', () => {
    const grades = marksOfSelection(marks, { semester: 'SOSE_25', exam: ALL_EXAMS });
    expect(grades.map((m) => m.grade)).toEqual([1.0, 5.0]);
  });

  it('narrows to one sitting of that semester', () => {
    const grades = marksOfSelection(marks, { semester: 'SOSE_25', exam: 'Exam 2' });
    expect(grades.map((m) => m.grade)).toEqual([5.0]);
  });

  it('covers nothing while no semester is chosen', () => {
    expect(marksOfSelection(marks, EMPTY_SELECTION)).toEqual([]);
  });
});

describe('selectionLabel', () => {
  it('names the semester alone when the whole semester is selected', () => {
    expect(selectionLabel({ semester: 'SOSE_25', exam: ALL_EXAMS })).toBe('SOSE_25');
  });

  it('names the sitting once an exam narrows it', () => {
    expect(selectionLabel({ semester: 'SOSE_25', exam: 'Exam 2' })).toBe('SOSE_25 · Exam 2');
  });

  it('is null while no semester is chosen', () => {
    expect(selectionLabel(EMPTY_SELECTION)).toBeNull();
  });
});

describe('isSameSelection', () => {
  it('spots the two sides landing on one sitting', () => {
    const sel = { semester: 'SOSE_25', exam: 'Exam 1' };
    expect(isSameSelection(sel, { ...sel })).toBe(true);
  });

  it('keeps the same exam in different semesters apart', () => {
    expect(
      isSameSelection(
        { semester: 'SOSE_25', exam: 'Exam 1' },
        { semester: 'WISE_25', exam: 'Exam 1' },
      ),
    ).toBe(false);
  });
});

describe('sharedGrades / alignDistribution', () => {
  it('spans the grades of both sittings, best first', () => {
    const left = gradeDistribution([mark('SOSE_25', 1.0), mark('SOSE_25', 3.0)]);
    const right = gradeDistribution([mark('WISE_25', 2.0), mark('WISE_25', 3.0)]);

    expect(sharedGrades(left, right)).toEqual(['1', '2', '3']);
  });

  it('pads a sitting with zeroes where it never awarded a grade', () => {
    const left = gradeDistribution([mark('SOSE_25', 1.0), mark('SOSE_25', 1.0)]);
    const right = gradeDistribution([mark('WISE_25', 3.0)]);
    const grades = sharedGrades(left, right);

    // Without the padding a 3.0 would sit in the first slot of the left chart.
    expect(alignDistribution(left, grades)).toEqual([
      { grade: '1', count: 2 },
      { grade: '3', count: 0 },
    ]);
    expect(alignDistribution(right, grades)).toEqual([
      { grade: '1', count: 0 },
      { grade: '3', count: 1 },
    ]);
  });
});
