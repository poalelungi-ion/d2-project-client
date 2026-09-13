import { post, postForm } from './client';
import type { AttemptType, PreviewRecord } from '../types';

/** Payload for POST /upload/confirm/ -- schemas.UploadConfirmRequest. */
export interface UploadConfirmPayload {
  course: string;
  courseName: string;
  ects: string;
  semester: string;
  attemptType: AttemptType;
  records: PreviewRecord[];
}

/** Legacy single-step upload used by the simple upload form. */
export const uploadFile = (formData: FormData): Promise<Response> =>
  postForm('/upload/', formData);

/**
 * Parses a file or pasted table (the `paste` form field) and returns rows
 * for review without saving. Same endpoint either way.
 */
export const previewUpload = (formData: FormData): Promise<Response> =>
  postForm('/upload/preview/', formData);

/** Commits the reviewed rows in a single transaction. */
export const confirmUpload = (payload: UploadConfirmPayload): Promise<Response> =>
  post('/upload/confirm/', payload);
