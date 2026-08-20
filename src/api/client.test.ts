/**
 * Guards the contract between this client and the backend: which URL each
 * call hits, which method it uses, and whether it carries the bearer token
 * the backend's verify_token dependency requires.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { API_BASE_URL } from './client';
import { listCourses, createCourse, updateCourse, setCourseArchived } from './courses';
import { listStudents, getStudent, createStudent, updateStudent } from './students';
import { confirmUpload, previewUpload } from './uploads';

const fetchMock = () => global.fetch as MockedFunction<typeof fetch>;

/** Returns the [url, init] pair passed to the most recent fetch call. */
const lastCall = () => {
  const call = fetchMock().mock.calls.at(-1);
  if (!call) throw new Error('fetch was never called');
  const [url, init] = call;
  return [url as string, (init ?? {}) as RequestInit & { headers?: Record<string, string> }] as const;
};

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 } as Response));
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
    await confirmUpload({
      course: 'TEST101',
      courseName: 'Test',
      ects: '6',
      semester: 'WiSe24/25',
      records: [],
    });
    const [, init] = lastCall();
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      course: 'TEST101',
      courseName: 'Test',
      ects: '6',
      semester: 'WiSe24/25',
      records: [],
    });
    expect(init.headers?.['Content-Type']).toBe('application/json');
  });

  it('uses PUT when updating', async () => {
    await updateCourse(7, {
      course_id: 7,
      course_name: 'x',
      semester: 'WiSe24/25',
      study_program: 'B.Sc.',
      professor: 'Not Assigned',
      version: 2,
    });
    expect(lastCall()[1].method).toBe('PUT');
  });
});

describe('authentication', () => {
  it('attaches the bearer token to mutating course and student endpoints', async () => {
    const calls = [
      () =>
        createCourse({
          course_id: 1,
          course_name: 'x',
          semester: 'WiSe24/25',
          study_program: 'B.Sc.',
          professor: 'Not Assigned',
        }),
      () =>
        updateCourse(1, {
          course_id: 1,
          course_name: 'x',
          semester: 'WiSe24/25',
          study_program: 'B.Sc.',
          professor: 'Not Assigned',
          version: 1,
        }),
      () => createStudent({ student_id: 1, name: 'A B', program: 'B.Sc.', status: 'active' }),
      () => updateStudent(1, { program: 'B.Sc.', version: 1 }),
    ];

    for (const call of calls) {
      await call();
      expect(lastCall()[1].headers?.Authorization).toMatch(/^Bearer .+/);
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
