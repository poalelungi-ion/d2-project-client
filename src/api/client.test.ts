import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  DEFAULT_API_BASE_URL,
  authHeader,
  get,
  getApiBaseUrl,
  getEffectiveDefaultApiBaseUrl,
  getRuntimeApiBaseUrl,
  refreshSession,
  resetApiBaseUrl,
  setAccessToken,
  setApiBaseUrl,
  setSessionExpiredHandler,
  testApiConnection,
} from './client';

/**
 * These cover the two things the API client is responsible for on its own:
 * attaching the in-memory access token, and turning an expired one back into a
 * working session without the user noticing.
 */

const session = (token: string) => ({
  access_token: token,
  token_type: 'bearer',
  expires_in: 900,
  user: {
    user_id: 1,
    email: 'a.musterfrau@uni-hildesheim.de',
    name: 'Anna Musterfrau',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
});

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status < 400, status, json: () => Promise.resolve(body) }) as Response;

const unauthorized = (): Response =>
  ({ ok: false, status: 401, json: () => Promise.resolve({ detail: 'Not authenticated' }) }) as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setAccessToken(null);
  setSessionExpiredHandler(() => {});
  resetApiBaseUrl();
});

afterEach(() => {
  vi.unstubAllGlobals();
  setAccessToken(null);
  resetApiBaseUrl();
});

/** Arguments of the nth fetch call, as [url, init]. */
const callArgs = (index: number) => fetchMock.mock.calls[index] as [string, RequestInit];

describe('access token handling', () => {
  it('sends no Authorization header before sign-in', () => {
    expect(authHeader()).toEqual({});
  });

  it('attaches the token once one is set', () => {
    setAccessToken('token-abc');
    expect(authHeader()).toEqual({ Authorization: 'Bearer token-abc' });
  });

  it('forgets the token when the session ends', () => {
    setAccessToken('token-abc');
    setAccessToken(null);
    expect(authHeader()).toEqual({});
  });

  it('sends credentials so the httpOnly refresh cookie travels with the request', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await get('/courses/');
    expect(callArgs(0)[1].credentials).toBe('include');
  });

  it('puts the bearer token on an ordinary data request', async () => {
    setAccessToken('token-abc');
    fetchMock.mockResolvedValue(jsonResponse([]));
    await get('/courses/');
    const headers = callArgs(0)[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-abc');
  });
});

describe('refresh on 401', () => {
  it('refreshes once and replays the original request', async () => {
    setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse(session('fresh')))
      .mockResolvedValueOnce(jsonResponse([{ course_id: 1 }]));

    const response = await get('/courses/');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(callArgs(1)[0]).toBe(`${API_BASE_URL}/auth/refresh`);
    // The replay carries the new token, not the one that just failed.
    expect((callArgs(2)[1].headers as Record<string, string>).Authorization).toBe('Bearer fresh');
  });

  it('reports the session as over when the refresh cookie is gone', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    setAccessToken('expired');
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(unauthorized());

    const response = await get('/courses/');

    expect(response.status).toBe(401);
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('does not retry a request that succeeded', async () => {
    setAccessToken('good');
    fetchMock.mockResolvedValue(jsonResponse([]));
    await get('/courses/');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('survives the refresh request throwing', async () => {
    setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockRejectedValueOnce(new Error('network down'));

    await expect(get('/courses/')).resolves.toMatchObject({ status: 401 });
  });
});

describe('concurrent refreshes', () => {
  it('coalesces simultaneous callers onto a single rotation', async () => {
    /*
     * Refresh tokens rotate and are single-use: a second exchange of the same
     * cookie looks to the backend like a stolen token being replayed, and it
     * answers by ending every session for the account. Three panels loading at
     * once must therefore produce one call to /auth/refresh, not three.
     */
    let refreshCalls = 0;
    fetchMock.mockImplementation((requestUrl: string) => {
      if (requestUrl.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse(session('fresh')));
      }
      return Promise.resolve(jsonResponse([]));
    });

    const results = await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(refreshCalls).toBe(1);
    expect(results.every((r) => r?.access_token === 'fresh')).toBe(true);
  });

  it('starts a new rotation after the previous one settles', async () => {
    fetchMock.mockResolvedValue(jsonResponse(session('fresh')));
    await refreshSession();
    await refreshSession();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('dynamic base URL resolution', () => {
  it('falls back to DEFAULT_API_BASE_URL when nothing is in storage', () => {
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it('updates the base URL when setApiBaseUrl is called', async () => {
    setApiBaseUrl('http://custom-host:9999/api/');
    expect(getApiBaseUrl()).toBe('http://custom-host:9999/api');

    fetchMock.mockResolvedValue(jsonResponse([]));
    await get('/courses/');
    expect(callArgs(0)[0]).toBe('http://custom-host:9999/api/courses/');
  });

  it('removes custom override on resetApiBaseUrl', () => {
    setApiBaseUrl('http://temporary:8080/api');
    expect(getApiBaseUrl()).toBe('http://temporary:8080/api');
    resetApiBaseUrl();
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it('reports connection success when backend returns any HTTP status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Not authenticated' }, 401));
    const result = await testApiConnection('http://localhost:8000/api');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(401);
  });

  it('reports connection failure when fetch throws network error', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'));
    const result = await testApiConnection('http://invalid-host:1234/api');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Failed to fetch|Unable to connect/);
  });

  it('reads runtime API Base URL from window.__APP_CONFIG__ when present', () => {
    (window as unknown as { __APP_CONFIG__: { API_BASE_URL: string } }).__APP_CONFIG__ = {
      API_BASE_URL: 'http://runtime-server:8000/api',
    };
    expect(getRuntimeApiBaseUrl()).toBe('http://runtime-server:8000/api');
    expect(getEffectiveDefaultApiBaseUrl()).toBe('http://runtime-server:8000/api');
    expect(getApiBaseUrl()).toBe('http://runtime-server:8000/api');

    delete (window as unknown as { __APP_CONFIG__?: unknown }).__APP_CONFIG__;
    expect(getRuntimeApiBaseUrl()).toBeNull();
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});

