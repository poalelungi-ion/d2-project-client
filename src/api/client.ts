/**
 * @file client.ts
 * @description The single place this app knows the backend's address and
 * credentials. Every request to the API goes through here.
 *
 * The base URL and token come from the environment so the same build can be
 * pointed at a local backend, a staging one or production. Vite inlines
 * `VITE_`-prefixed variables at build time, so a production image must be
 * built with the values it will run against; see .env.example.
 *
 * These helpers deliberately return the raw `Response` rather than parsed
 * JSON. Callers inspect `res.ok` and `res.status` themselves -- notably to
 * turn a 409 into the "modified by another user" message -- so handing back
 * the Response keeps that handling intact.
 */

export const API_BASE_URL: string =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const API_TOKEN: string = import.meta.env?.VITE_API_TOKEN ?? 'sse-staff-token';

/** Authorization header the backend's verify_token dependency expects. */
export const authHeader = (): Record<string, string> => ({
  Authorization: `Bearer ${API_TOKEN}`,
});

const url = (path: string): string => `${API_BASE_URL}${path}`;

export interface RequestOptions {
  method?: string;
  /** Serialized as JSON when present. */
  body?: unknown;
  /** Attach the bearer token. */
  auth?: boolean;
}

/**
 * Sends a JSON request.
 *
 * @param path Path below the API root, e.g. "/students/".
 */
export function request(
  path: string,
  { method = 'GET', body, auth = false }: RequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, authHeader());

  return fetch(url(path), {
    method,
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

/**
 * Sends multipart form data. The browser sets the Content-Type boundary, so
 * no headers are supplied here.
 */
export function postForm(
  path: string,
  formData: FormData,
  { auth = false }: Pick<RequestOptions, 'auth'> = {},
): Promise<Response> {
  return fetch(url(path), {
    method: 'POST',
    ...(auth ? { headers: authHeader() } : {}),
    body: formData,
  });
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
