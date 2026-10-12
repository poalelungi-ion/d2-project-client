import { describe, expect, it } from 'vitest';
import {
  STUDY_PROGRAMS,
  STUDY_PROGRAM_OPTIONS,
  UNASSIGNED_PROGRAM,
  formatValidationIssues,
  normalizeStudyProgram,
  isAllowedStudyProgram,
} from './studyProgram';

describe('STUDY_PROGRAMS', () => {
  it('is sorted so dropdowns show a stable predefined list', () => {
    expect([...STUDY_PROGRAMS]).toEqual([...STUDY_PROGRAMS].sort((a, b) => a.localeCompare(b)));
  });

  it('includes the programmes named in the ticket and the seeded degrees', () => {
    expect(STUDY_PROGRAMS).toContain('Research Methods');
    expect(STUDY_PROGRAMS).toContain('Development Project');
    expect(STUDY_PROGRAMS).toContain('SE Master');
    expect(STUDY_PROGRAMS).toContain('Data Science Master');
  });

  it('keeps the empty-import placeholder off the named list', () => {
    expect(STUDY_PROGRAMS).not.toContain(UNASSIGNED_PROGRAM);
    expect(STUDY_PROGRAM_OPTIONS.at(-1)).toBe(UNASSIGNED_PROGRAM);
  });
});

describe('formatValidationIssues', () => {
  it('labels a wrong study program as invalid rather than missing', () => {
    expect(formatValidationIssues([], ['Study Program'])).toBe('Invalid: Study Program');
  });

  it('keeps truly absent fields as missing and can show both', () => {
    expect(formatValidationIssues(['Matrikelnummer'], [])).toBe('Missing: Matrikelnummer');
    expect(formatValidationIssues(['Grade'], ['Study Program'])).toBe(
      'Missing: Grade. Invalid: Study Program',
    );
  });
});

describe('normalizeStudyProgram and aliases', () => {
  it('correctly maps Uni Hildesheim common abbreviations to canonical names', () => {
    expect(normalizeStudyProgram('M.Sc. SE')).toBe('SE Master');
    expect(normalizeStudyProgram('m.sc. ainf')).toBe('Angewandte Informatik Master');
    expect(normalizeStudyProgram('M.Sc. IMIT')).toBe('IMIT Master');
    expect(normalizeStudyProgram('B.Sc. IMIT')).toBe('IMIT Bachelor');
    expect(normalizeStudyProgram('M.Sc. WiInf')).toBe('Wirtschaftsinformatik Master');
    expect(normalizeStudyProgram('Data Science')).toBe('Data Science Master');
  });

  it('recognizes dynamic study programs', () => {
    expect(isAllowedStudyProgram('M.Sc. Robotics', ['M.Sc. Robotics'])).toBe(true);
    expect(isAllowedStudyProgram('M.Sc. AI', [])).toBe(false);
  });
});
