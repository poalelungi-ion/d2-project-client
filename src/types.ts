/**
 * @file types.ts
 * @description The shapes the backend hands this app, plus the shapes of the
 * forms that feed back into it.
 *
 * These mirror the JSON assembled by the FastAPI routers rather than the
 * SQLAlchemy models: the API flattens and aggregates on the way out, so a
 * course carries a pass rate and a student carries an exam count that exist
 * nowhere in the database. Keeping them here means a change to a router
 * surfaces as a type error rather than as `undefined` on a dashboard.
 */

export type ThemeMode = 'light' | 'dark';

/** Lifecycle states the backend stores on a student profile. */
export type StudentStatus = 'active' | 'graduated' | 'dropped' | 'failed';

/** Pass/fail derived by the system from the numeric grade or NE/EX/AT. */
export type GradeOutcome = 'passed' | 'failed' | 'excused' | 'invalid';

/** One student's result in a course, as embedded in the course list response. */
export interface CourseMark {
  student_id: number | null;
  student_name: string;
  program: string;
  semester: string;
  grade: number | null;
  passed: boolean;
  /** System-calculated status. Never taken from a Passed/Failed file column. */
  outcome: GradeOutcome;
  absence_code: string | null;
  version: number;
}

/** A row of GET /api/courses/ -- the course plus its aggregate metrics. */
export interface Course {
  course_id: number;
  course_name: string;
  assigned_professor: string;
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

export interface Kpis {
  total_active_students: number;
  total_archived_courses: number;
  active_pass_rate: number;
  active_avg_grade: number;
}

export interface ToughestCourse {
  course_name: string;
  pass_rate: number;
  avg_grade: number;
}

export interface AtRiskStudent {
  name: string;
  fails: number;
  student_id: number;
}

/**
 * GET /api/stats/. `kpis` is Partial because the dashboard renders before the
 * first response lands, against an empty object.
 */
export interface Stats {
  kpis: Partial<Kpis>;
  toughest_courses: ToughestCourse[];
  atRisk: AtRiskStudent[];
  activity_heatmap?: any[];
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

/** FastAPI's error envelope: `{"detail": "..."}`. */
export interface ApiError {
  detail?: string;
}

// === Form state ===

export interface CourseFormValues {
  course_id: string;
  course_name: string;
  semester: string;
  study_program: string;
  professor: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormValues, string>>;

export interface StudentFormValues {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  status: StudentStatus;
}

export type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>;

export interface AddGradeFormValues {
  /** Empty string until a course is picked from the dropdown. */
  course_id: number | '';
  semester: string;
  grade: number;
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
  ects: string;
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
