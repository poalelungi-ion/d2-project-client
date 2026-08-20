/**
 * @file uploads.ts
 * @description Ingestion endpoints, mirroring the backend's routers/upload.py.
 */
import { post, postForm } from './client';
import type { PreviewRecord } from '../types';

/** Payload for POST /upload/confirm/ -- schemas.UploadConfirmRequest. */
export interface UploadConfirmPayload {
  course: string;
  courseName: string;
  ects: string;
  semester: string;
  records: PreviewRecord[];
}

/** Legacy single-step upload used by the simple upload form. */
export const uploadFile = (formData: FormData): Promise<Response> =>
  postForm('/upload/', formData);

/** Parses and validates a file, returning rows for review without saving. */
export const previewUpload = (formData: FormData): Promise<Response> =>
  postForm('/upload/preview/', formData);

/** Commits the reviewed rows in a single transaction. */
export const confirmUpload = (payload: UploadConfirmPayload): Promise<Response> =>
  post('/upload/confirm/', payload);
