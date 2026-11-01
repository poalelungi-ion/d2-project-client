import { post } from './client';

/** The fields POST /grades/ actually reads. Extra keys are ignored. */
export interface GradeSaveRow {
  result_id: number;
  version: number;
  /** Numeric German grade 1.0–5.0. Status codes are rejected. */
  grade: number | string;
  attempt_type?: string;
  semester?: string;
}

/** Persists a batch of edited grade rows. */
export const saveGrades = (rows: GradeSaveRow[]): Promise<Response> =>
  post('/grades/', rows);
