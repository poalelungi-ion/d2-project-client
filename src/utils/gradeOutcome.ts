/**
 * Client-side helpers for the system's pass/fail calculation.
 *
 * The backend is the source of truth on save; these keep the review grid and
 * transcripts visually consistent, and they never treat Passed/Failed/Yes/No
 * as a result.
 */

import type { GradeOutcome } from '../types';

const FAIL_ABSENCE = new Set(['NE', 'EX']);
const EXCUSED_ABSENCE = new Set(['AT']);
const IGNORED_LABELS = new Set(['PASSED', 'FAILED', 'YES', 'NO']);
const JUNK_CELLS = new Set(['', 'NA', 'TA', 'NAN']);

/** Shown when a lecturer types a cell the upload parser would also reject. */
export const GRADE_CONSTRAINT_MESSAGE =
  'Grade must be between 1.0 and 5.0, or NE/EX/AT.';

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
 * The same rules as spreadsheet upload: 1.0–5.0, NE/EX (fail), AT (excused).
 * Passed/Failed/Yes/No and anything else are rejected.
 */
export function parseGradeInput(raw: unknown): ParsedGrade {
  const text = String(raw ?? '').trim();
  if (JUNK_CELLS.has(normalizeCode(text))) {
    return { ok: false };
  }
  const code = normalizeCode(text);
  if (IGNORED_LABELS.has(code)) {
    return { ok: false };
  }
  if (FAIL_ABSENCE.has(code)) {
    return {
      ok: true,
      grade: 5.0,
      passed: false,
      outcome: 'failed',
      absenceCode: code,
    };
  }
  if (EXCUSED_ABSENCE.has(code)) {
    return {
      ok: true,
      grade: null,
      passed: false,
      outcome: 'excused',
      absenceCode: code,
    };
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
  return { outcome: parsed.outcome, absenceCode: parsed.absenceCode };
}

/** Value POST /grades/ expects: a number, or the NE/EX/AT cell itself. */
export function gradeSaveValue(mark: {
  grade: number | null;
  absence_code?: string | null;
}): number | string | null {
  const code = mark.absence_code?.trim();
  if (code) return code;
  return mark.grade;
}

export function isOfficialAbsenceCell(raw: unknown): boolean {
  const code = normalizeCode(String(raw ?? ''));
  return FAIL_ABSENCE.has(code) || EXCUSED_ABSENCE.has(code);
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
  return String(grade);
}
