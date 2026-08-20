/**
 * @file client.js
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

export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const API_TOKEN = import.meta.env?.VITE_API_TOKEN ?? 'sse-staff-token';

/** Authorization header the backend's verify_token dependency expects. */
export const authHeader = () => ({ Authorization: `Bearer ${API_TOKEN}` });

const url = (path) => `${API_BASE_URL}${path}`;

/**
 * Sends a JSON request.
 *
 * @param {string} path   Path below the API root, e.g. "/students/".
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {*} [options.body]   Serialized as JSON when present.
 * @param {boolean} [options.auth=false]  Attach the bearer token.
 * @returns {Promise<Response>}
 */
export function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
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
 *
 * @returns {Promise<Response>}
 */
export function postForm(path, formData, { auth = false } = {}) {
  return fetch(url(path), {
    method: 'POST',
    ...(auth ? { headers: authHeader() } : {}),
    body: formData,
  });
}

export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body });
export const put = (path, body, options) => request(path, { ...options, method: 'PUT', body });
