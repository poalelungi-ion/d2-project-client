import { post } from './client';
import type { TranscriptEntry } from '../types';

/** Persists a batch of edited grade rows. */
export const saveGrades = (rows: TranscriptEntry[]): Promise<Response> =>
  post('/grades/', rows);
