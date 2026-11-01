/**
 * Client-side helpers for the system's pass/fail calculation.
 *
 * The backend is the source of truth on save; these keep the review grid and
 * transcripts visually consistent, and they never treat Passed/Failed/Yes/No
 * as a result.
 */

import type { GradeOutcome } from '../types';

const IGNORED_LABELS = new Set(['PASSED', 'FAILED', 'YES', 'NO']);
const FILTERED_STATUS_CODES = new Set(['NE', 'EX', 'AT', 'NA', 'TA']);
const JUNK_CELLS = new Set(['', 'NAN']);

/** Shown when a lecturer types a cell the upload parser would also reject. */
export const GRADE_CONSTRAINT_MESSAGE = 'Grade must be between 1.0 and 5.0.';

export type ParsedGrade =
  | {
      ok: true;
      grade: number | null;
      passed: boolean;
      outcome: GradeOutcome;
      absenceCode: string | null;
    }
  | { ok: false };

export const IGNORED_UPLOAD_COLUMNS = new Set(['passed', 'failed', 'yes', 'no']);

const OUTCOME_LABEL: Record<GradeOutcome, string> = {
  passed: 'Pass',
  failed: 'Fail',
  excused: 'Excused',
  invalid: 'Invalid',
};

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[.\s]/g, '');
}

/** Drop spreadsheet headers the parser must never map to a result. */
export function withoutIgnoredColumns(
  mapping: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(mapping).filter(
      ([source, target]) =>
        !IGNORED_UPLOAD_COLUMNS.has(source.trim().toLowerCase()) &&
        !IGNORED_UPLOAD_COLUMNS.has(target.trim().toLowerCase()),
    ),
  );
}

/**
 * The same rules as spreadsheet upload: numeric 1.0–5.0 only.
 * Status codes (NE, EX, NA, TA, AT), Pass/Fail labels, and anything else are rejected.
 */
export function parseGradeInput(raw: unknown): ParsedGrade {
  const text = String(raw ?? '').trim();
  const code = normalizeCode(text);
  if (JUNK_CELLS.has(code) || FILTERED_STATUS_CODES.has(code) || IGNORED_LABELS.has(code)) {
    return { ok: false };
  }

  const grade = Number(text.replace(',', '.'));

  if (!Number.isFinite(grade) || grade < 1 || grade > 5) {
    return { ok: false };
  }

  const passed = grade <= 4;

  return {
    ok: true,
    grade,
    passed,
    outcome: passed ? 'passed' : 'failed',
    absenceCode: null,
  };
}

export function evaluateGradeCell(raw: unknown): {
  outcome: GradeOutcome;
  absenceCode: string | null;
} {
  const parsed = parseGradeInput(raw);

  if (!parsed.ok) {
    return { outcome: 'invalid', absenceCode: null };
  }

  return {
    outcome: parsed.outcome,
    absenceCode: parsed.absenceCode,
  };
}

/** Value POST /grades/ expects: a numeric 1.0–5.0 mark. */
export function gradeSaveValue(mark: {
  grade: number | null;
  absence_code?: string | null;
}): number | string | null {
  return mark.grade;
}

export function isOfficialAbsenceCell(_raw: unknown): boolean {
  return false;
}

export function outcomeLabel(
  outcome: string | null | undefined,
  passed?: boolean,
): string {
  if (outcome && outcome in OUTCOME_LABEL) {
    return OUTCOME_LABEL[outcome as GradeOutcome];
  }

  return passed ? 'Pass' : 'Fail';
}

export function formatGrade(
  grade: number | null | undefined,
  absenceCode?: string | null,
): string {
  if (grade == null) return absenceCode || '—';

  return Number.isInteger(grade) ? grade.toFixed(1) : String(grade);
}