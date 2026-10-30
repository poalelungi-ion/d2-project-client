import { describe, expect, it } from 'vitest';
import type { TranscriptEntry } from '../types';
import { groupTranscriptByCourse } from './studentTranscript';

interface EntryOptions {
  attempt?: number;
  attempt_type?: 'Exam 1' | 'Exam 2' | 'Other';
  passed?: boolean;
}

const entry = (
  course: string,
  semester: string,
  grade: number | null,
  options: EntryOptions = {},
): TranscriptEntry => {
  const attempt = options.attempt ?? 1;
  const attempt_type = options.attempt_type ?? 'Exam 1';
  const passed = options.passed ?? (grade != null && grade <= 4.0);

  return {
    result_id: Math.floor(Math.random() * 10000),
    student_id: 1001,
    name: 'Anna Chiriciuc',
    course,
    semester,
    grade,
    passed,
    outcome: grade == null ? 'excused' : passed ? 'passed' : 'failed',
    absence_code: grade == null ? 'AT' : null,
    attempt,
    attempt_type,
    version: 1,
  };
};

describe('groupTranscriptByCourse', () => {
  it('returns empty array when given an empty transcript', () => {
    expect(groupTranscriptByCourse([])).toEqual([]);
  });

  it('correctly maps a single course with one passing attempt', () => {
    const transcript = [entry('Machine Learning', 'SOSE_25', 1.7, { attempt: 1, attempt_type: 'Exam 1' })];
    const rows = groupTranscriptByCourse(transcript);

    expect(rows).toHaveLength(1);
    expect(rows[0].course).toBe('Machine Learning');
    expect(rows[0].semesters).toBe('SOSE_25');
    expect(rows[0].attempt_count).toBe(1);
    expect(rows[0].best_grade).toBe(1.7);
    expect(rows[0].final_status).toBe('Passed');
    expect(rows[0].exam1_grade).toBe(1.7);
    expect(rows[0].exam2_grade).toBeNull();
  });

  it('collapses Exam 1 and Exam 2 retakes into a single row with best grade', () => {
    const transcript = [
      entry('Data Mining', 'SOSE_26', 5.0, { attempt: 1, attempt_type: 'Exam 1', passed: false }),
      entry('Data Mining', 'SOSE_26', 1.3, { attempt: 2, attempt_type: 'Exam 2', passed: true }),
    ];
    const rows = groupTranscriptByCourse(transcript);

    expect(rows).toHaveLength(1);
    expect(rows[0].course).toBe('Data Mining');
    expect(rows[0].attempt_count).toBe(2);
    expect(rows[0].best_grade).toBe(1.3);
    expect(rows[0].final_status).toBe('Passed');
    expect(rows[0].exam1_grade).toBe(5.0);
    expect(rows[0].exam2_grade).toBe(1.3);
  });

  it('sorts multiple courses alphabetically', () => {
    const transcript = [
      entry('Software Architecture', 'SOSE_25', 2.0, { attempt: 1 }),
      entry('Algorithms', 'WISE_24', 1.0, { attempt: 1 }),
      entry('Database Systems', 'SOSE_25', 1.3, { attempt: 1 }),
    ];
    const rows = groupTranscriptByCourse(transcript);

    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.course)).toEqual([
      'Algorithms',
      'Database Systems',
      'Software Architecture',
    ]);
  });
});
