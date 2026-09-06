import type { ApiError } from '../types';

export async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    return body.detail ?? `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}
