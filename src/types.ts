/**
 * @file types.ts
 * @description The shapes the backend hands this app, plus the shapes of the
 * forms that feed back into it.
 *
 * These mirror the JSON assembled by the FastAPI routers rather than the
 * SQLAlchemy models: the API flattens and aggregates on the way out, so a
 * course carries a pass rate and a student carries an exam count that exist
 * nowhere in the database. Keeping them here means a change to a router
 * surfaces as a type error rather than as `undefined` at runtime.
 */

export type ThemeMode = 'light' | 'dark';

// === Authentication ===

/** GET /api/auth/me and the `user` field of a login response. */
export interface AuthenticatedUser {
  user_id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

/**
 * POST /api/auth/login and /api/auth/refresh.
 *
 * There is no refresh token in here by design: the backend returns it as an
 * httpOnly cookie, so this app never holds it and no script on the page can
 * read it.
 */
export interface SessionResponse {
  access_token: string;
  token_type: string;
  /** Access token lifetime in seconds, used to schedule a pre-emptive refresh. */
  expires_in: number;
  user: AuthenticatedUser;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;


/** Lifecycle states the backend stores on a student profile. */
export type StudentStatus = 'active' | 'graduated' | 'dropped' | 'failed';

/** Pass/fail derived by the system from the numeric grade (1.0–5.0). */
export type GradeOutcome = 'passed' | 'failed' | 'excused' | 'invalid';

/** One student's result in a course, as embedded in the course list response. */
export interface CourseMark {
  result_id: number;
  student_id: number | null;
  student_name: string;
  program: string;
  semester: string;
  grade: number | null;
  passed: boolean;
  /** System-calculated status. Never taken from a Passed/Failed file column. */
  outcome: GradeOutcome;
  absence_code: string | null;
  /**
   * Which sitting of this semester's offering the mark came from, tagged once
   * per upload. Rows imported before the tag existed come back as "Other".
   */
  attempt_type: AttemptType;
  version: number;
}

/** A row of GET /api/courses/ -- the course plus its aggregate metrics. */
export interface Course {
  course_id: number;
  course_name: string;
  assigned_professor?: string;
  semester: string;
  study_program: string;
  total_attempts: number;
  pass_rate: number;
  avg_grade: number;
  is_archived: boolean;
  version: number;
  marks: CourseMark[];
}

/** A row of GET /api/students/ -- roster entry with aggregate metrics. */
export interface Student {
  student_id: number;
  name: string;
  program: string;
  status: StudentStatus;
  total_exams: number;
  passed_exams: number;
  avg_grade: number;
  version: number;
}

/** One attempt at one course on a student's transcript. */
export interface TranscriptEntry {
  result_id: number;
  student_id: number;
  name: string;
  course: string;
  semester: string;
  grade: number | null;
  passed: boolean;
  /** System-calculated status. Never taken from a Passed/Failed file column. */
  outcome: GradeOutcome;
  absence_code: string | null;
  /** 1 for the first sitting of this course, 2 for the retake, and so on. */
  attempt: number;
  /**
   * The sitting the lecturer tagged the upload with. Distinct from `attempt`:
   * that is this system counting results, this is what was declared on import.
   */
  attempt_type: AttemptType;
  version: number;
}

/** GET /api/students/{id} -- the profile with its full transcript. */
export interface StudentDetails {
  student_id: number;
  name: string;
  program: string;
  status: StudentStatus;
  version: number;
  transcript: TranscriptEntry[];
}

/**
 * One parsed row from POST /api/upload/preview/. Every field is a string
 * because the backend stringifies whatever the spreadsheet held -- that is the
 * point of the review step, where a human fixes what did not parse.
 */
export interface PreviewRecord {
  student_id: string;
  first_name: string;
  last_name: string;
  name: string;
  program: string;
  semester: string;
  grade: string;
  missing_fields: string[];
  /** Present values that are not on the allowed list, e.g. a typed-in study program. */
  invalid_fields: string[];
  is_valid: boolean;
  outcome?: GradeOutcome;
  absence_code?: string | null;
  [key: string]: unknown;
}

/** Envelope returned by the preview endpoint. */
export interface UploadPreviewResponse {
  status: string;
  preview_data: PreviewRecord[];
  detail?: string;
}

/** Envelope returned by the confirm endpoint. */
export interface UploadConfirmResponse {
  status?: string;
  message?: string;
  detail?: string;
  course_id?: number;
}

/** One entry of FastAPI's 422 body: the field that failed and why. */
export interface ValidationProblem {
  msg: string;
  loc?: (string | number)[];
  type?: string;
}

/**
 * FastAPI's error envelope. `detail` is a string for a raised HTTPException
 * and an array of field problems for a rejected request body, so both shapes
 * have to be handled -- see errorDetail in api/errors.ts.
 */
export interface ApiError {
  detail?: string | ValidationProblem[];
}

// === Form state ===

export interface CourseFormValues {
  course_id: string;
  course_name: string;
  semester?: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>;

export interface StudentFormValues {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  status?: StudentStatus;
}

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

export interface AddGradeFormValues {
  /** Empty string until a course is picked from the dropdown. */
  course_id: number | '';
  semester: string;
  grade: number | string;
  attempt_type?: AttemptType;
}

/**
 * Which sitting an upload covers. Chosen once per import and stored on every
 * result in the batch, so first and second attempts stay comparable later.
 */
export type AttemptType = 'Exam 1' | 'Exam 2' | 'Other';

/** Course metadata that applies to every row of a batch upload. */
export interface UploadCourseInfo {
  /** The course this import belongs to, read off the Course view the upload was started in. */
  courseId: number | null;
  courseNumber: string;
  courseName: string;
  attemptType: AttemptType;
  semester: string;
}

/**
 * The active course handed to the upload wizard by a Course view's "Upload
 * Exam Data" button, carried as react-router location state.
 */
export interface UploadCourseHandoff {
  id: number;
  name: string;
}

export type FormMode = 'create' | 'edit';

export type ViewMode = 'grid' | 'table';

export type CoursesSortBy = 'name' | 'semester';

export type NameSplitRule = 'Last, First' | 'First Last';

/** Matches MUI's AlertColor, kept local so this module stays UI-agnostic. */
export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

// === Course Drive ===
export type DriveFileStatus = 'uploading' | 'parsing' | 'parsed' | 'error';

export interface CourseDriveFile {
  id: string;
  course_id: string | number;
  name: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by: string;
  status: DriveFileStatus;
  status_message?: string;
  record_count?: number;
  semester?: string;
}

