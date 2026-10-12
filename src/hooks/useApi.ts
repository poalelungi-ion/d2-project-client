import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addStudentGrade,
  confirmUpload,
  createCourse,
  createStudent,
  errorDetail,
  getCourse,
  getStudent,
  listCourses,
  listStudents,
  previewUpload,
  saveGrades,
  setCourseArchived,
  updateCourse,
  updateStudent,
  updateStudentStatus,
} from '../api/index';
import type {
  AddGradePayload,
  CourseCreatePayload,
  CourseUpdatePayload,
  StudentCreatePayload,
  StudentUpdatePayload,
} from '../api/index';
import type {
  Course,
  CourseFormValues,
  NameSplitRule,
  PreviewRecord,
  Student,
  StudentDetails,
  StudentFormValues,
  StudentStatus,
  TranscriptEntry,
  UploadConfirmResponse,
  UploadCourseInfo,
  UploadPreviewResponse,
} from '../types';
import { notify } from '../stores';
import {
  GRADE_CONSTRAINT_MESSAGE,
  gradeSaveValue,
  parseGradeInput,
  withoutIgnoredColumns,
} from '../utils/gradeOutcome';

const COLUMN_MAPPING: Record<string, string> = {
  Name: 'name',
  'Full Name': 'name',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  Vorname: 'first_name',
  Nachname: 'last_name',
  Fachsemester: 'semester',
  Semester: 'semester',
  Matrikelnr: 'student_id',
  MatrNr: 'student_id',
  'Matrikelnr.': 'student_id',
  Studiengang: 'program',
  Program: 'program',
  'Study Program': 'program',
  Note: 'grade',
  Grade: 'grade',
  // Passed/Failed/Yes/No are stripped before upload; they are never a result.
};

function isTimeoutError(e: unknown): boolean {
  const err = e as { name?: string; message?: string };
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return true;
  const msg = err?.message?.toLowerCase();
  return msg ? msg.includes('timeout') || msg.includes('timed out') : false;
}

function notifyTimeout(): void {
  notify('Request timed out. Please refresh the page.', 'error');
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await listCourses();
      if (res.status === 408 || res.status === 504) {
        notifyTimeout();
        return;
      }
      setCourses((await res.json()) as Course[]);
    } catch (e: unknown) {
      if (isTimeoutError(e)) {
        notifyTimeout();
      } else {
        console.error('Failed to load courses', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { courses, loading, refetch };
}

/**
 * [Ticket #95647 - View course details: State Management & Error Handling]
 * Fetches course details from backend endpoint GET /api/courses/{id}.
 * - Manages visual loading state (loading: boolean).
 * - Identifies non-existent courses on HTTP 404 (notFound: true).
 * - Triggers toast notification alerting the user to refresh the page on timeout.
 */
export function useCourseDetails(courseId: number | string | null) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refetch = useCallback(async () => {
    if (!courseId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const res = await getCourse(courseId);
      if (res.status === 404) {
        setNotFound(true);
        setCourse(null);
      } else if (res.status === 408 || res.status === 504) {
        notifyTimeout();
        setCourse(null);
      } else if (res.ok) {
        setCourse((await res.json()) as Course);
      } else {
        setCourse(null);
      }
    } catch (e: unknown) {
      if (isTimeoutError(e)) {
        notifyTimeout();
      } else {
        console.error('Failed to load course details', e);
      }
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    setCourse(null);
    void refetch();
  }, [refetch]);

  return { course, loading, notFound, refetch };
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listStudents();
      setStudents((await res.json()) as Student[]);
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { students, loading, refetch };
}

export function useStudentDetails(studentId: number | null) {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (studentId === null) return;
    setLoading(true);
    try {
      const res = await getStudent(studentId);
      setStudent((await res.json()) as StudentDetails);
    } catch (e) {
      console.error('Failed to fetch transcript', e);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    setStudent(null);
    void refetch();
  }, [refetch]);

  return { student, loading, refetch };
}

export interface TranscriptSaveResult {
  saved: boolean;
  shouldRefresh: boolean;
}

async function saveCourse(values: CourseFormValues, version?: number): Promise<boolean> {
  const base: CourseCreatePayload = {
    course_id: values.course_id,
    course_name: values.course_name,
    semester: values.semester,
    professor: values.professor || 'Not Assigned',
  };

  try {
    let res: Response;
    if (version === undefined) {
      res = await createCourse(base);
    } else {
      const payload: CourseUpdatePayload = {
        ...base,
        new_course_id: parseInt(values.course_id, 10),
        version,
      };
      res = await updateCourse(values.course_id, payload);
    }

    if (res.ok) {
      notify(`Course successfully ${version === undefined ? 'created' : 'updated'}`);
      return true;
    }
    notify(`Error: ${await errorDetail(res)}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
}

export interface SaveStudentResult {
  success: boolean;
  conflict?: boolean;
  error?: string;
}

async function saveStudent(
  values: StudentFormValues,
  version?: number,
): Promise<SaveStudentResult> {
  const studentId = parseInt(values.student_id, 10);
  const name = `${values.first_name.trim()} ${values.last_name.trim()}`;

  try {
    let res: Response;
    if (version === undefined) {
      const payload: StudentCreatePayload = {
        student_id: studentId,
        name,
        program: values.program,
        status: values.status,
      };
      res = await createStudent(payload);
    } else {
      const payload: StudentUpdatePayload = {
        student_id: studentId,
        new_student_id: studentId,
        name,
        program: values.program,
        status: values.status,
        version,
      };
      res = await updateStudent(studentId, payload);
    }

    if (res.ok) {
      notify(version === undefined ? 'Student profile created' : 'Student profile updated');
      return { success: true };
    }
    const detail = await errorDetail(res);
    notify(`Error: ${detail}`, 'error');
    return { success: false, conflict: res.status === 409, error: detail };
  } catch {
    notify('Network error', 'error');
    return { success: false, error: 'Network error' };
  }
}

async function addGrade(studentId: number, grade: AddGradePayload): Promise<boolean> {
  try {
    const res = await addStudentGrade(studentId, grade);
    if (res.ok) {
      notify('Grade added successfully!');
      return true;
    }
    notify(`Error: ${await errorDetail(res)}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
}

async function archiveCourse(
  courseId: number,
  isArchived: boolean,
  version: number,
): Promise<boolean> {
  try {
    const res = await setCourseArchived(courseId, { is_archived: isArchived, version });
    if (res.ok) {
      notify(isArchived ? 'Course archived successfully!' : 'Course restored successfully!');
      return true;
    }
    notify(`Error: ${await errorDetail(res)}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
}

async function loadTranscript(studentId: number): Promise<TranscriptEntry[]> {
  try {
    const res = await getStudent(studentId);
    if (res.ok) {
      const data = (await res.json()) as StudentDetails;
      return data.transcript || [];
    }
  } catch (e) {
    console.error('Failed to fetch student transcript for analytics', e);
  }
  return [];
}

async function saveTranscript(
  rows: Array<{
    result_id: number;
    version: number;
    grade: number | null;
    absence_code?: string | null;
  }>,
): Promise<TranscriptSaveResult> {
  const payload: Array<{ result_id: number; version: number; grade: number | string }> = [];
  for (const row of rows) {
    const value = gradeSaveValue(row);
    if (value == null || !parseGradeInput(value).ok) {
      notify(GRADE_CONSTRAINT_MESSAGE, 'error');
      return { saved: false, shouldRefresh: false };
    }
    payload.push({
      result_id: row.result_id,
      version: row.version,
      grade: value,
    });
  }

  try {
    const res = await saveGrades(payload);
    if (res.ok) {
      notify('Database updated successfully!');
      return { saved: true, shouldRefresh: true };
    }
    notify(
      res.status === 409
        ? 'Update failed: Data was modified by another user. Please refresh.'
        : `Validation Error: ${await errorDetail(res)}`,
      'error',
    );
    return { saved: false, shouldRefresh: res.status === 409 };
  } catch {
    notify('Network error occurred', 'error');
  }
  return { saved: false, shouldRefresh: false };
}

async function updateProgram(
  studentId: number,
  program: string,
  version: number,
): Promise<boolean> {
  try {
    const res = await updateStudent(studentId, { program, version });
    if (res.ok) {
      notify('Student program updated successfully!');
      return true;
    }
    notify('Failed to update program', 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
}

async function setStudentStatusById(
  studentId: number,
  status: StudentStatus,
  version: number,
): Promise<boolean> {
  try {
    const res = await updateStudentStatus(studentId, { status, version });
    if (res.ok) {
      notify(`Student marked as ${status}!`);
      return true;
    }
    notify(`Error: ${await errorDetail(res)}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
}

/** File upload and spreadsheet paste share POST /upload/preview/. */
export type PreviewSource = { file: File } | { paste: string };

async function previewImport(
  source: PreviewSource,
  courseInfo: UploadCourseInfo,
  nameSplitRule: NameSplitRule,
): Promise<PreviewRecord[] | null> {
  const formData = new FormData();
  if ('file' in source) formData.append('file', source.file);
  else formData.append('paste', source.paste);
  formData.append('course', courseInfo.courseNumber);
  formData.append('courseName', courseInfo.courseName);
  formData.append('ects', courseInfo.ects);
  formData.append('semester', courseInfo.semester);
  formData.append('attemptType', courseInfo.attemptType);
  formData.append('mapping', JSON.stringify(withoutIgnoredColumns(COLUMN_MAPPING)));
  formData.append('nameSplitRule', nameSplitRule);

  try {
    const res = await previewUpload(formData);
    const data = (await res.json()) as UploadPreviewResponse;
    if (res.ok) return data.preview_data ?? [];
    notify(`Error: ${data.detail}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return null;
}

export interface ConfirmImportResult {
  success: boolean;
  courseId?: number;
  message?: string;
}

async function confirmImport(
  courseInfo: UploadCourseInfo,
  records: PreviewRecord[],
): Promise<ConfirmImportResult> {
  try {
    const res = await confirmUpload({
      // Non-null when the upload started inside a course: the backend then
      // attaches the batch to that course instead of matching on the name.
      courseId: courseInfo.courseId,
      course: courseInfo.courseNumber,
      courseName: courseInfo.courseName,
      ects: courseInfo.ects,
      semester: courseInfo.semester,
      attemptType: courseInfo.attemptType,
      records,
    });
    const data = (await res.json()) as UploadConfirmResponse;
    if (res.ok) {
      const message = data.message ?? 'Upload successful!';
      notify(message);
      const parsedNum = courseInfo.courseNumber ? parseInt(courseInfo.courseNumber, 10) : undefined;
      const courseId =
        data.course_id ??
        courseInfo.courseId ??
        (parsedNum != null && !isNaN(parsedNum) ? parsedNum : undefined);
      return { success: true, courseId, message };
    }
    notify(`Error: ${data.detail}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return { success: false };
}

const MUTATIONS = {
  saveCourse,
  saveStudent,
  addGrade,
  archiveCourse,
  loadTranscript,
  saveTranscript,
  updateProgram,
  setStudentStatus: setStudentStatusById,
  previewImport,
  confirmImport,
};

export function useApiMutations() {
  return useMemo(() => MUTATIONS, []);
}
