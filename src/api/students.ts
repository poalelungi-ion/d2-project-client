/**
 * @file students.ts
 * @description Student endpoints, mirroring the backend's routers/students.py.
 */
import { get, post, put } from './client';
import type { StudentStatus } from '../types';

/** Payload for POST /students/ -- see the backend's schemas.StudentCreate. */
export interface StudentCreatePayload {
  student_id: number;
  name: string;
  program: string;
  status: StudentStatus;
}

/** Payload for PUT /students/{id} -- StudentCreate plus lock fields. */
export interface StudentUpdatePayload {
  student_id?: number;
  new_student_id?: number;
  name?: string;
  program: string;
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
  grade: number;
}

export const listStudents = (): Promise<Response> => get('/students/');

/** Full profile including the transcript. */
export const getStudent = (
  studentId: number,
  { auth = false }: { auth?: boolean } = {},
): Promise<Response> => get(`/students/${studentId}`, { auth });

export const createStudent = (student: StudentCreatePayload): Promise<Response> =>
  post('/students/', student, { auth: true });

export const updateStudent = (
  studentId: number | string,
  student: StudentUpdatePayload,
): Promise<Response> => put(`/students/${studentId}`, student, { auth: true });

export const updateStudentStatus = (
  studentId: number,
  body: StudentStatusPayload,
): Promise<Response> => put(`/students/${studentId}/status`, body);

export const addStudentGrade = (
  studentId: number,
  grade: AddGradePayload,
): Promise<Response> => post(`/students/${studentId}/grades`, grade);
