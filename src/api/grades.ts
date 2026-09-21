import { post } from './client';

/** The fields POST /grades/ actually reads. Extra keys are ignored. */
export interface GradeSaveRow {
  result_id: number;
  version: number;
  grade: number;
}

/** Persists a batch of edited grade rows. */
export const saveGrades = (rows: GradeSaveRow[]): Promise<Response> =>
  post('/grades/', rows);
