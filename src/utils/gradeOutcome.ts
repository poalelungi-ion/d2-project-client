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

export function evaluateGradeCell(raw: unknown): {
  outcome: GradeOutcome;
  absenceCode: string | null;
} {
  const text = String(raw ?? '').trim();
  if (JUNK_CELLS.has(normalizeCode(text))) {
    return { outcome: 'invalid', absenceCode: null };
  }
  const code = normalizeCode(text);
  if (IGNORED_LABELS.has(code)) {
    return { outcome: 'invalid', absenceCode: null };
  }
  if (FAIL_ABSENCE.has(code)) {
    return { outcome: 'failed', absenceCode: code };
  }
  if (EXCUSED_ABSENCE.has(code)) {
    return { outcome: 'excused', absenceCode: code };
  }
  const grade = Number(text.replace(',', '.'));
  if (!Number.isFinite(grade) || grade < 1 || grade > 5) {
    return { outcome: 'invalid', absenceCode: null };
  }
  return { outcome: grade <= 4 ? 'passed' : 'failed', absenceCode: null };
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
