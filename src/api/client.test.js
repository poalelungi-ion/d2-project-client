/**
 * Guards the contract between this client and the backend: which URL each
 * call hits, which method it uses, and whether it carries the bearer token
 * the backend's verify_token dependency requires.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { API_BASE_URL } from './client.js';
import { listCourses, createCourse, updateCourse, setCourseArchived } from './courses.js';
import { listStudents, getStudent, createStudent, updateStudent } from './students.js';
import { confirmUpload, previewUpload } from './uploads.js';

/** Returns the [url, init] pair passed to the most recent fetch call. */
const lastCall = () => global.fetch.mock.calls.at(-1);

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 }));
});

describe('URL construction', () => {
  it('prefixes every path with the configured base URL', async () => {
    await listCourses();
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/courses/`);
  });

  it('interpolates path parameters', async () => {
    await getStudent(1001);
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/students/1001`);
  });

  it('targets the archive sub-resource', async () => {
    await setCourseArchived(42, { is_archived: true, version: 1 });
    expect(lastCall()[0]).toBe(`${API_BASE_URL}/courses/42/archive`);
  });
});

describe('methods and bodies', () => {
  it('sends GET without a body', async () => {
    await listStudents();
    const [, init] = lastCall();
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('serializes the body as JSON on POST', async () => {
    await confirmUpload({ course: 'TEST101', records: [] });
    const [, init] = lastCall();
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ course: 'TEST101', records: [] });
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('uses PUT when updating', async () => {
    await updateCourse(7, { course_name: 'x', version: 2 });
    expect(lastCall()[1].method).toBe('PUT');
  });
});

describe('authentication', () => {
  it('attaches the bearer token to mutating course and student endpoints', async () => {
    for (const call of [
      () => createCourse({ course_name: 'x' }),
      () => updateCourse(1, { version: 1 }),
      () => createStudent({ student_id: 1 }),
      () => updateStudent(1, { version: 1 }),
    ]) {
      await call();
      expect(lastCall()[1].headers.Authorization).toMatch(/^Bearer .+/);
    }
  });

  it('omits the token on read-only endpoints', async () => {
    await listCourses();
    expect(lastCall()[1].headers?.Authorization).toBeUndefined();
  });
});

describe('multipart uploads', () => {
  it('posts FormData without forcing a Content-Type', async () => {
    const form = new FormData();
    form.append('file', new Blob(['a,b']), 'grades.csv');

    await previewUpload(form);
    const [url, init] = lastCall();

    expect(url).toBe(`${API_BASE_URL}/upload/preview/`);
    expect(init.body).toBe(form);
    // The browser must set the multipart boundary itself.
    expect(init.headers?.['Content-Type']).toBeUndefined();
  });
});
