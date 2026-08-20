/**
 * @file grades.js
 * @description Exam result endpoints, mirroring the backend's routers/grades.py.
 */
import { post } from './client.js';

/** Persists a batch of edited grade rows. */
export const saveGrades = (rows) => post('/grades/', rows);
