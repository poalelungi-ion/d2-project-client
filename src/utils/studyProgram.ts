/**
 * Canonical study programs.
 *
 * This is a mirror of the backend's StudyProgram Literal. The upload review
 * grid and the student/course forms only offer these values, so a typed-in
 * Studiengang cannot drift from the list. Change both together.
 */
export const STUDY_PROGRAMS = [
  'Data Science Master',
  'Development Project',
  'Research Methods',
  'SE Master',
] as const;

export type StudyProgram = (typeof STUDY_PROGRAMS)[number];

/** Fills a blank Studiengang on import rather than failing the row. */
export const UNASSIGNED_PROGRAM = 'Unassigned / Unknown';

/** Upload review options: named programs, then the empty-cell placeholder. */
export const STUDY_PROGRAM_OPTIONS: readonly string[] = [
  ...STUDY_PROGRAMS,
  UNASSIGNED_PROGRAM,
];

export const isAllowedStudyProgram = (value: string): boolean =>
  STUDY_PROGRAM_OPTIONS.includes(value);

/** Review-grid copy: a wrong study program is invalid, not missing. */
export const formatValidationIssues = (
  missing: string[] = [],
  invalid: string[] = [],
): string | null => {
  if (missing.length === 0 && invalid.length === 0) return null;
  const parts: string[] = [];
  if (missing.length > 0) parts.push(`Missing: ${missing.join(', ')}`);
  if (invalid.length > 0) parts.push(`Invalid: ${invalid.join(', ')}`);
  return parts.join('. ');
};
