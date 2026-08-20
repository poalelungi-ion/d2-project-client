/**
 * @file uploads.js
 * @description Ingestion endpoints, mirroring the backend's routers/upload.py.
 */
import { post, postForm } from './client.js';

/** Legacy single-step upload used by the simple upload form. */
export const uploadFile = (formData) => postForm('/upload/', formData);

/** Parses and validates a file, returning rows for review without saving. */
export const previewUpload = (formData) => postForm('/upload/preview/', formData);

/** Commits the reviewed rows in a single transaction. */
export const confirmUpload = (payload) => post('/upload/confirm/', payload);
