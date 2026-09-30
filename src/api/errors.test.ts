import { describe, expect, it } from 'vitest';
import { errorDetail } from './errors';

const response = (body: unknown, status = 400): Response =>
  ({ ok: false, status, json: () => Promise.resolve(body) }) as Response;

describe('errorDetail', () => {
  it('returns the message from a raised HTTPException', async () => {
    await expect(errorDetail(response({ detail: 'Incorrect email or password' }, 401))).resolves.toBe(
      'Incorrect email or password',
    );
  });

  it('flattens the array FastAPI returns for a rejected request body', async () => {
    /*
     * A 422 carries one entry per failed field, not a string. Handing that to
     * the UI unchanged would render an object.
     */
    const body = {
      detail: [
        { type: 'value_error', loc: ['body', 'email'], msg: 'Value error, Email must be a @uni-hildesheim.de address' },
      ],
    };
    await expect(errorDetail(response(body, 422))).resolves.toBe(
      'Email must be a @uni-hildesheim.de address',
    );
  });

  it('joins several field problems', async () => {
    const body = {
      detail: [
        { msg: 'Value error, Name is required' },
        { msg: 'String should have at least 10 characters' },
      ],
    };
    await expect(errorDetail(response(body, 422))).resolves.toBe(
      'Name is required. String should have at least 10 characters',
    );
  });

  it('falls back to the status when the body is not JSON', async () => {
    const broken = { ok: false, status: 500, json: () => Promise.reject(new Error('not json')) } as unknown as Response;
    await expect(errorDetail(broken)).resolves.toBe('Request failed with status 500');
  });

  it('falls back to the status when detail is missing or unrecognised', async () => {
    await expect(errorDetail(response({}, 503))).resolves.toBe('Request failed with status 503');
    await expect(errorDetail(response({ detail: [] }, 422))).resolves.toBe('Request failed with status 422');
  });
});
