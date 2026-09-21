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

/**
 * Accounts are restricted to the university's mail domain.
 *
 * This is a mirror of the backend's UNIVERSITY_EMAIL_DOMAIN, kept here so the
 * login and registration forms can flag a wrong address before a round trip.
 * It is not the rule -- the backend re-checks every registration and refuses
 * anything outside the domain with a 422. Change both together.
 */
export const UNIVERSITY_EMAIL_DOMAIN = 'uni-hildesheim.de';

export const UNIVERSITY_EMAIL_SUFFIX = `@${UNIVERSITY_EMAIL_DOMAIN}`;

/** Mirrors the backend's MIN_PASSWORD_LENGTH. */
export const MIN_PASSWORD_LENGTH = 10;

/** bcrypt hashes at most 72 bytes; the backend rejects anything longer. */
export const MAX_PASSWORD_BYTES = 72;

/**
 * True when the address sits in the university domain.
 *
 * Compares the part after the final "@" whole, so an address that merely ends
 * with the domain ("...@uni-hildesheim.de.example.com") does not pass.
 */
export const isUniversityEmail = (email: string): boolean =>
  email.trim().toLowerCase().split('@').length === 2 &&
  email.trim().toLowerCase().split('@')[1] === UNIVERSITY_EMAIL_DOMAIN;
