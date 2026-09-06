/**
 * Application Constants
 *
 * The backend's address is deliberately not here: it lives in
 * src/api/client.ts, the only module that talks to the API.
 */
export const STEPS: readonly string[] = [
  'Add data',
  'Course',
  'Map columns',
  'Review & fix',
  'Done',
];

/** Runtime companions to the ViewMode / CoursesSortBy types, for validating URLs. */
export const VIEW_MODES = ['grid', 'table'] as const;

export const COURSE_SORTS = ['name', 'semester'] as const;
