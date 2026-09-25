import { post } from './client';

/** The fields POST /grades/ actually reads. Extra keys are ignored. */
export interface GradeSaveRow {
  result_id: number;
  version: number;
  /** Numeric 1.0–5.0, or the same NE/EX/AT cell the upload parser accepts. */
  grade: number | string;
}

/** Persists a batch of edited grade rows. */
export const saveGrades = (rows: GradeSaveRow[]): Promise<Response> =>
  post('/grades/', rows);
