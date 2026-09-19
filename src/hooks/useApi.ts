import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addStudentGrade,
  confirmUpload,
  createCourse,
  createStudent,
  errorDetail,
  getStats,
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
  Stats,
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
import { withoutIgnoredColumns } from '../utils/gradeOutcome';

const EMPTY_STATS: Stats = { kpis: {}, toughest_courses: [], atRisk: [] };

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

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await listCourses();
      setCourses((await res.json()) as Course[]);
    } catch (e) {
      console.error('Failed to load courses', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { courses, loading, refetch };
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

export function useStats() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStats();
      setStats((await res.json()) as Stats);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { stats, loading, refetch };
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
    study_program: values.study_program,
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

async function saveStudent(values: StudentFormValues, version?: number): Promise<boolean> {
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
      return true;
    }
    notify(`Error: ${await errorDetail(res)}`, 'error');
  } catch {
    notify('Network error', 'error');
  }
  return false;
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
    const res = await getStudent(studentId, { auth: true });
    if (res.ok) {
      const data = (await res.json()) as StudentDetails;
      return data.transcript || [];
    }
  } catch (e) {
    console.error('Failed to fetch student transcript for analytics', e);
  }
  return [];
}

async function saveTranscript(rows: TranscriptEntry[]): Promise<TranscriptSaveResult> {
  try {
    // Excused sittings have no numeric grade; the system keeps them unless
    // the lecturer types a mark over the AT placeholder.
    const res = await saveGrades(rows.filter((row) => row.grade != null));
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
