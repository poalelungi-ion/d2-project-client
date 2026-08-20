/**
 * Application Constants
 *
 * The backend's address is deliberately not here: it lives in
 * src/api/client.ts, the only module that talks to the API.
 */
export const STEPS: readonly string[] = [
  'Upload file',
  'Course',
  'Map columns',
  'Review & fix',
  'Done',
];

export const TABS: readonly string[] = [
  'Analysis Hub',
  'Batch Data Upload',
  'Teacher Dashboard',
  'Student LSF Roster',
];
