import type { SessionResponse } from '../types';

export const DEFAULT_API_BASE_URL: string = (
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
).replace(/\/+$/, '');

export const API_BASE_URL_STORAGE_KEY = 'spa_api_base_url';

/**
 * Returns any runtime API Base URL injected into window.__APP_CONFIG__
 * by the Docker container entrypoint script from the container's environment (.env).
 */
export const getRuntimeApiBaseUrl = (): string | null => {
  try {
    if (typeof window !== 'undefined') {
      const runtime = (window as unknown as { __APP_CONFIG__?: { API_BASE_URL?: string } }).__APP_CONFIG__;
      if (runtime?.API_BASE_URL && runtime.API_BASE_URL.trim() && !runtime.API_BASE_URL.startsWith('__')) {
        return runtime.API_BASE_URL.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // Ignore runtime lookup errors
  }
  return null;
};

/**
 * The effective default URL (either dynamically injected by container environment or build-time default).
 */
export const getEffectiveDefaultApiBaseUrl = (): string => {
  return getRuntimeApiBaseUrl() ?? DEFAULT_API_BASE_URL;
};

export const getApiBaseUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim().replace(/\/+$/, '');
      }
    }
  } catch {
    // Ignore storage errors (e.g. private browsing sandbox)
  }
  return getEffectiveDefaultApiBaseUrl();
};

export const setApiBaseUrl = (newUrl: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const clean = newUrl.trim().replace(/\/+$/, '');
      if (clean) {
        window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, clean);
      } else {
        window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage errors
  }
};

export const resetApiBaseUrl = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

/** Backwards-compatible export of the default API base URL. */
export const API_BASE_URL: string = DEFAULT_API_BASE_URL;

/**
 * Pings the backend to verify network connectivity and CORS readiness.
 */
export const testApiConnection = async (
  targetUrl: string,
): Promise<{ ok: boolean; status?: number; error?: string }> => {
  const cleanUrl = targetUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    return { ok: false, error: 'URL cannot be empty' };
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${cleanUrl}/courses/`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { ok: true, status: res.status };
  } catch (err: unknown) {
    try {
      const rootUrl = cleanUrl.replace(/\/api\/?$/, '');
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
      const res2 = await fetch(`${rootUrl}/`, {
        method: 'GET',
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);
      return { ok: true, status: res2.status };
    } catch {
      const message = err instanceof Error ? err.message : 'Unable to connect';
      return { ok: false, error: message };
    }
  }
};

/**
 * The access token is held here, in a module variable, and nowhere else.
 */
let accessToken: string | null = null;

/** Called by the auth store whenever a token is issued, refreshed or dropped. */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

/**
 * Invoked when a refresh attempt fails and the session is over, so the app can
 * clear its user state and send the person back to the login screen. Set once
 * by the auth store; kept as a callback so this module stays free of React and
 * router imports.
 */
let onSessionExpired: () => void = () => { };

export const setSessionExpiredHandler = (handler: () => void): void => {
  onSessionExpired = handler;
};

export const authHeader = (): Record<string, string> =>
  accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

const url = (path: string): string => {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

/** Path of the endpoint that exchanges the refresh cookie, relative to the API root. */
const REFRESH_PATH = '/auth/refresh';

/**
 * A single in-flight refresh, shared by every caller that hits a 401 while it
 * runs. Without this, a screen that fires four requests at once would perform
 * four rotations, and three of them would be replaying an already-rotated
 * token 
 */
let refreshInFlight: Promise<SessionResponse | null> | null = null;

async function requestNewSession(): Promise<SessionResponse | null> {
  try {
    const res = await fetch(url(REFRESH_PATH), {
      method: 'POST',
      // Sends the httpOnly refresh cookie. The API is a different origin from
      // the client in development, so this has to be explicit.
      credentials: 'include',
    });
    if (!res.ok) return null;
    return (await res.json()) as SessionResponse;
  } catch {
    return null;
  }
}

/**
 * Exchanges the refresh cookie for a fresh session, coalescing concurrent
 * callers onto one network round trip. 
 */
export function refreshSession(): Promise<SessionResponse | null> {
  refreshInFlight ??= requestNewSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export interface RequestOptions {
  method?: string;
  /** Serialized as JSON when present. */
  body?: unknown;
  /** Skip the refresh-and-retry on 401. Used by the auth calls themselves. */
  skipRefresh?: boolean;
}

/**
 * Issues a request, and on a 401 refreshes the access token once and replays
 * it. Access tokens are minutes long, so this is the normal path rather than
 * an error path -- the alternative is bouncing the user to the login screen
 * mid-task every quarter of an hour.
 */
async function send(
  path: string,
  init: RequestInit,
  skipRefresh: boolean,
): Promise<Response> {
  const attempt = (): Promise<Response> =>
    fetch(url(path), {
      ...init,
      credentials: 'include',
      headers: { ...(init.headers as Record<string, string>), ...authHeader() },
    });

  const response = await attempt();
  if (response.status !== 401 || skipRefresh) return response;

  const session = await refreshSession();
  if (!session) {
    onSessionExpired();
    return response;
  }
  setAccessToken(session.access_token);
  return attempt();
}

/**
 * Sends a JSON request.
 *
 * @param path Path below the API root, e.g. "/students/".
 */
export function request(
  path: string,
  { method = 'GET', body, skipRefresh = false }: RequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  return send(
    path,
    {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    },
    skipRefresh,
  );
}

/**
 * Sends multipart form data. The browser sets the Content-Type boundary, so
 * no headers are supplied here.
 */
export function postForm(path: string, formData: FormData): Promise<Response> {
  return send(path, { method: 'POST', body: formData }, false);
}

type BodylessOptions = Omit<RequestOptions, 'method' | 'body'>;

export const get = (path: string, options?: BodylessOptions): Promise<Response> =>
  request(path, { ...options, method: 'GET' });

export const post = (
  path: string,
  body?: unknown,
  options?: BodylessOptions,
): Promise<Response> => request(path, { ...options, method: 'POST', body });

export const put = (
  path: string,
  body?: unknown,
  options?: BodylessOptions,
): Promise<Response> => request(path, { ...options, method: 'PUT', body });
