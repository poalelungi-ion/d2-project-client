import { describe, expect, it } from 'vitest';
import {
  evaluateGradeCell,
  formatGrade,
  isOfficialAbsenceCell,
  outcomeLabel,
  withoutIgnoredColumns,
} from './gradeOutcome';

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
    expect(formatGrade(5.0, 'NE')).toBe('5');
  });

  it('recognises official absence cells so the review grid does not rewrite them', () => {
    expect(isOfficialAbsenceCell('NE')).toBe(true);
    expect(isOfficialAbsenceCell('at')).toBe(true);
    expect(isOfficialAbsenceCell('na')).toBe(false);
  });
});
