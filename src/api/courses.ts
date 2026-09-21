import { get, post, put } from './client';

/** Payload for POST /courses/ -- see the backend's schemas.CourseCreate. */
export interface CourseCreatePayload {
  course_id: number | string;
  course_name: string;
  semester: string;
  study_program: string;
  professor: string;
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
