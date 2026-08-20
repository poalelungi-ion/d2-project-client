/**
 * @file students.js
 * @description Student endpoints, mirroring the backend's routers/students.py.
 */
import { get, post, put } from './client.js';

export const listStudents = () => get('/students/');

/** Full profile including the transcript. */
export const getStudent = (studentId, { auth = false } = {}) =>
  get(`/students/${studentId}`, { auth });

export const createStudent = (student) =>
  post('/students/', student, { auth: true });

export const updateStudent = (studentId, student) =>
  put(`/students/${studentId}`, student, { auth: true });

export const updateStudentStatus = (studentId, body) =>
  put(`/students/${studentId}/status`, body);

export const addStudentGrade = (studentId, grade) =>
  post(`/students/${studentId}/grades`, grade);
