import { describe, expect, it } from 'vitest';
import type { PreviewRecord } from '../../../types';
import { revalidatePreviewRow } from './ReviewStep';

describe('ReviewStep inline editing & revalidation (#104089)', () => {
  it('revalidates all editable fields (student_id, first_name, last_name, program, semester, grade) when edited inline', () => {
    const row: PreviewRecord = {
      id: 0,
      student_id: '',
      name: '',
      first_name: '',
      last_name: '',
      program: 'M.Sc. WINF',
      semester: '2',
      grade: '9.9',
      outcome: 'invalid',
      absence_code: null,
      is_valid: false,
      missing_fields: ['Matrikelnr', 'Name'],
      invalid_fields: ['Study Program', 'Grade'],
    };

    // Simulate inline edits in AG Grid to fix missing student_id, name, program, and grade
    row.student_id = '1001001';
    row.first_name = 'Lena';
    row.last_name = 'Schneider';
    row.program = 'M.Sc. WINF';
    row.semester = '3';
    row.grade = '1.3';

    revalidatePreviewRow(row);

    expect(row.student_id).toBe('1001001');
    expect(row.first_name).toBe('Lena');
    expect(row.last_name).toBe('Schneider');
    expect(row.name).toBe('Lena Schneider');
    expect(row.program).toBe('Wirtschaftsinformatik Master');
    expect(row.semester).toBe('3');
    expect(row.grade).toBe('1.3');
    expect(row.outcome).toBe('passed');
    expect(row.missing_fields).toEqual([]);
    expect(row.invalid_fields).toEqual([]);
    expect(row.is_valid).toBe(true);
  });

  it('flags missing or invalid fields when a valid pasted row is edited to an invalid grade', () => {
    const row: PreviewRecord = {
      id: 1,
      student_id: '1001002',
      name: 'Max Weber',
      first_name: 'Max',
      last_name: 'Weber',
      program: 'Data Science Master',
      semester: '1',
      grade: '2.0',
      outcome: 'passed',
      absence_code: null,
      is_valid: true,
      missing_fields: [],
      invalid_fields: [],
    };

    row.grade = '5.0';
    revalidatePreviewRow(row);
    expect(row.outcome).toBe('failed');
    expect(row.is_valid).toBe(true);

    row.grade = 'invalid_grade';
    revalidatePreviewRow(row);
    expect(row.outcome).toBe('invalid');
    expect(row.invalid_fields).toContain('Grade');
    expect(row.is_valid).toBe(false);
  });
});
