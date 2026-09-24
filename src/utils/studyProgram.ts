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
