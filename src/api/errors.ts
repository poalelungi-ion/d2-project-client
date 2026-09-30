import type { ApiError, ValidationProblem } from '../types';

const isValidationProblem = (item: unknown): item is ValidationProblem =>
  typeof item === 'object' && item !== null && typeof (item as ValidationProblem).msg === 'string';

/**
 * Pulls a displayable message out of a failed response.
 *
 * FastAPI answers a rejected DTO with `detail` as an *array* of field problems
 * rather than a string -- registration hits this whenever the backend catches
 * something the form did not, such as a malformed address inside the right
 * domain. Returning that array unchanged would put an object into the UI, so
 * the field messages are joined here instead.
 */
export async function errorDetail(res: Response): Promise<string> {
  const fallback = `Request failed with status ${res.status}`;
  try {
    const body = (await res.json()) as ApiError;
    const { detail } = body;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .filter(isValidationProblem)
        // Pydantic prefixes its own messages with "Value error, "; the part
        // after it is the text the validator was written to show.
        .map((problem) => problem.msg.replace(/^Value error, /, ''));
      if (messages.length > 0) return messages.join('. ');
    }

    return fallback;
  } catch {
    return fallback;
  }
}
