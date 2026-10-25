import { describe, expect, it } from 'vitest';
import {
  evaluateGradeCell,
  formatGrade,
  gradeSaveValue,
  isOfficialAbsenceCell,
  outcomeLabel,
  parseGradeInput,
  withoutIgnoredColumns,
} from './gradeOutcome';

describe('parseGradeInput', () => {
  it('accepts numeric German grades only', () => {
    expect(parseGradeInput('1.7')).toEqual({
      ok: true,
      grade: 1.7,
      passed: true,
      outcome: 'passed',
      absenceCode: null,
    });
    expect(parseGradeInput('4,0').ok).toBe(true);
    expect(parseGradeInput('5.0')).toEqual({
      ok: true,
      grade: 5.0,
      passed: false,
      outcome: 'failed',
      absenceCode: null,
    });
  });

  it('rejects status codes and cells the upload parser would also reject', () => {
    for (const cell of ['NE', 'EX', 'NA', 'TA', 'AT', 'ne', '6.0', '0.7', 'Passed', '']) {
      expect(parseGradeInput(cell).ok).toBe(false);
    }
  });

  it('sends the numeric grade on save', () => {
    expect(gradeSaveValue({ grade: 1.7, absence_code: null })).toBe(1.7);
    expect(gradeSaveValue({ grade: 5.0, absence_code: 'NE' })).toBe(5.0);
    expect(gradeSaveValue({ grade: null, absence_code: 'AT' })).toBe(null);
  });
});

describe('evaluateGradeCell', () => {
  it('passes numeric German grades at 4.0 and below', () => {
    expect(evaluateGradeCell('1.7').outcome).toBe('passed');
    expect(evaluateGradeCell('4.0').outcome).toBe('passed');
    expect(evaluateGradeCell('4.3').outcome).toBe('failed');
  });

  it('treats NE, EX, NA, TA and AT as invalid', () => {
    expect(evaluateGradeCell('NE').outcome).toBe('invalid');
    expect(evaluateGradeCell('ex').outcome).toBe('invalid');
    expect(evaluateGradeCell('NA').outcome).toBe('invalid');
    expect(evaluateGradeCell('TA').outcome).toBe('invalid');
    expect(evaluateGradeCell('AT').outcome).toBe('invalid');
  });

  it('ignores Passed/Failed/Yes/No labels', () => {
    expect(evaluateGradeCell('Passed').outcome).toBe('invalid');
    expect(evaluateGradeCell('No').outcome).toBe('invalid');
  });
});

describe('upload column mapping', () => {
  it('strips Passed/Failed/Yes/No headers', () => {
    const mapping = withoutIgnoredColumns({
      Grade: 'grade',
      Passed: 'passed',
      Yes: 'grade',
    });
    expect(mapping).toEqual({ Grade: 'grade' });
  });
});

describe('display helpers', () => {
  it('labels outcomes and formats a null excused grade', () => {
    expect(outcomeLabel('excused', false)).toBe('Excused');
    expect(outcomeLabel(undefined, true)).toBe('Pass');
    expect(formatGrade(null, 'AT')).toBe('AT');
    expect(formatGrade(5.0, 'NE')).toBe('5.0');
  });

  it('formats integral grades with one decimal and preserves existing precision', () => {
    expect(formatGrade(2)).toBe('2.0');
    expect(formatGrade(2.7)).toBe('2.7');
    expect(formatGrade(2.19)).toBe('2.19');
  });

  it('does not treat status codes as official grade cells', () => {
    expect(isOfficialAbsenceCell('NE')).toBe(false);
    expect(isOfficialAbsenceCell('at')).toBe(false);
    expect(isOfficialAbsenceCell('na')).toBe(false);
  });
});
