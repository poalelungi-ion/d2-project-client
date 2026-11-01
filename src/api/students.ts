import { get, post, put } from './client';
import type { AttemptType, StudentStatus } from '../types';

/** Payload for POST /students/ -- see the backend's schemas.StudentCreate. */
export interface StudentCreatePayload {
  student_id: number;
  name: string;
  program?: string;
  study_program?: string;
  status?: StudentStatus;
}

/** Payload for PUT /students/{id} -- StudentCreate plus lock fields. */
export interface StudentUpdatePayload {
  student_id?: number;
  new_student_id?: number;
  name?: string;
  program?: string;
  study_program?: string;
  status?: StudentStatus;
  version: number;
}

export interface StudentStatusPayload {
  status: StudentStatus;
  /** Optimistic-lock guard; the backend rejects a stale version with a 409. */
  version: number;
}

export interface AddGradePayload {
  course_id: number;
  semester: string;
  grade: number | string;
  attempt_type?: AttemptType;
}

export const listStudents = (): Promise<Response> => get('/students/');

/** Full profile including the transcript. */
export const getStudent = (studentId: number): Promise<Response> =>
  get(`/students/${studentId}`);

export const createStudent = (student: StudentCreatePayload): Promise<Response> =>
  post('/students/', student);

export const updateStudent = (
  studentId: number | string,
  student: StudentUpdatePayload,
): Promise<Response> => put(`/students/${studentId}`, student);

export const updateStudentStatus = (
  studentId: number,
  body: StudentStatusPayload,
): Promise<Response> => put(`/students/${studentId}/status`, body);

export const addStudentGrade = (
  studentId: number,
  grade: AddGradePayload,
): Promise<Response> => post(`/students/${studentId}/grades`, grade);
