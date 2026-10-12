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
  it('accepts the same numeric grades and absence codes as upload', () => {
    expect(parseGradeInput('1.7')).toEqual({
      ok: true,
      grade: 1.7,
      passed: true,
      outcome: 'passed',
      absenceCode: null,
    });
    expect(parseGradeInput('4,0').ok).toBe(true);
    expect(parseGradeInput('NE')).toEqual({
      ok: true,
      grade: 5.0,
      passed: false,
      outcome: 'failed',
      absenceCode: 'NE',
    });
    expect(parseGradeInput('AT')).toEqual({
      ok: true,
      grade: null,
      passed: false,
      outcome: 'excused',
      absenceCode: 'AT',
    });
  });

  it('rejects cells the upload parser would also reject', () => {
    expect(parseGradeInput('6.0').ok).toBe(false);
    expect(parseGradeInput('0.7').ok).toBe(false);
    expect(parseGradeInput('Passed').ok).toBe(false);
    expect(parseGradeInput('').ok).toBe(false);
  });

  it('sends the absence code on save so AT is not dropped', () => {
    expect(gradeSaveValue({ grade: 1.7, absence_code: null })).toBe(1.7);
    expect(gradeSaveValue({ grade: 5.0, absence_code: 'NE' })).toBe('NE');
    expect(gradeSaveValue({ grade: null, absence_code: 'AT' })).toBe('AT');
  });
});

describe('evaluateGradeCell', () => {
  it('passes numeric German grades at 4.0 and below', () => {
    expect(evaluateGradeCell('1.7').outcome).toBe('passed');
    expect(evaluateGradeCell('4.0').outcome).toBe('passed');
    expect(evaluateGradeCell('4.3').outcome).toBe('failed');
  });

  it('treats NE and EX as fail and AT as excused', () => {
    expect(evaluateGradeCell('NE')).toEqual({ outcome: 'failed', absenceCode: 'NE' });
    expect(evaluateGradeCell('ex')).toEqual({ outcome: 'failed', absenceCode: 'EX' });
    expect(evaluateGradeCell('AT')).toEqual({ outcome: 'excused', absenceCode: 'AT' });
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

  it('recognises official absence cells so the review grid does not rewrite them', () => {
    expect(isOfficialAbsenceCell('NE')).toBe(true);
    expect(isOfficialAbsenceCell('at')).toBe(true);
    expect(isOfficialAbsenceCell('na')).toBe(false);
  });
});


