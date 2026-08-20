/**
 * @file courses.js
 * @description Course endpoints, mirroring the backend's routers/courses.py.
 */
import { get, post, put } from './client.js';

export const listCourses = () => get('/courses/');

export const createCourse = (course) =>
  post('/courses/', course, { auth: true });

export const updateCourse = (courseId, course) =>
  put(`/courses/${courseId}`, course, { auth: true });

export const setCourseArchived = (courseId, body) =>
  put(`/courses/${courseId}/archive`, body);
