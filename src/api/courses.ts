import { get, post, put } from './client';

/** Payload for POST /courses/ -- see the backend's schemas.CourseCreate. */
export interface CourseCreatePayload {
  course_id: number | string;
  course_name: string;
  semester?: string;
  study_program?: string | null;
  professor?: string;
}

/** Payload for PUT /courses/{id} -- CourseCreate plus optimistic-lock fields. */
export interface CourseUpdatePayload extends CourseCreatePayload {
  new_course_id?: number;
  version: number;
}

export interface CourseArchivePayload {
  is_archived: boolean;
  version: number;
}

export const listCourses = (): Promise<Response> => get('/courses/');

/**
 * [Ticket #95647 - View course details: Data Retrieval]
 * Queries the backend for a specific course by ID, returning its metadata,
 * student roster, and associated exam records (or 404 if not found).
 */
export const getCourse = (courseId: number | string): Promise<Response> =>
  get(`/courses/${courseId}`);

export const createCourse = (course: CourseCreatePayload): Promise<Response> =>
  post('/courses/', course);

export const updateCourse = (
  courseId: number | string,
  course: CourseUpdatePayload,
): Promise<Response> => put(`/courses/${courseId}`, course);

export const setCourseArchived = (
  courseId: number,
  body: CourseArchivePayload,
): Promise<Response> => put(`/courses/${courseId}/archive`, body);
