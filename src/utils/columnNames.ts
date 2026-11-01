/**
 * Closed list of spreadsheet headers the importer accepts.
 *
 * Each alias standardises to one internal field. Unknown names are rejected so
 * a typo cannot land in the wrong column. Keep in lockstep with
 * d2-project-backend/src/lib/column_names.py.
 */

import { IGNORED_UPLOAD_COLUMNS } from './gradeOutcome';

const HEADER_TO_FIELD: Record<string, string> = {
  name: 'name',
  'full name': 'name',
  fullname: 'name',
  'first name': 'first_name',
  firstname: 'first_name',
  vorname: 'first_name',
  'last name': 'last_name',
  lastname: 'last_name',
  nachname: 'last_name',
  matrikelnr: 'student_id',
  matrnr: 'student_id',
  matrikelnummer: 'student_id',
  'student id': 'student_id',
  studentid: 'student_id',
  studiengang: 'program',
  program: 'program',
  'study program': 'program',
  fachsemester: 'semester',
  semester: 'semester',
  note: 'grade',
  grade: 'grade',
};

export const FIELD_LABEL: Record<string, string> = {
  student_id: 'Matrikelnr',
  name: 'Name',
  first_name: 'First Name',
  last_name: 'Last Name',
  program: 'Studiengang',
  semester: 'Fachsemester',
  grade: 'Note',
};

export const CANONICAL_HEADERS = [
  'Matrikelnr',
  'Name',
  'First Name',
  'Last Name',
  'Studiengang',
  'Fachsemester',
  'Note',
] as const;

const COURSE_COLUMN_KEYS = new Set([
  'course',
  'courseid',
  'coursenumber',
  'courseno',
  'coursecode',
  'kurs',
  'kursid',
  'kursnummer',
  'modulnummer',
  'veranstaltungsnummer',
]);

export type HeaderStatus = 'Mapped' | 'Ignored' | 'Unrecognized' | 'Duplicate';

export interface ClassifiedHeader {
  source: string;
  target: string;
  status: HeaderStatus;
}

export function normalizeHeader(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/[.:]+$/, '').toLowerCase();
}

export function fieldForHeader(name: string): string | undefined {
  return HEADER_TO_FIELD[normalizeHeader(name)];
}

export function isDroppedColumn(name: string): boolean {
  const folded = name.trim().toLowerCase();
  if (IGNORED_UPLOAD_COLUMNS.has(folded)) return true;
  const alnum = folded.replace(/[^a-z0-9]/g, '');
  return COURSE_COLUMN_KEYS.has(alnum);
}

export function classifyHeaders(headers: readonly string[]): ClassifiedHeader[] {
  const claimed = new Map<string, string>();
  return headers.map((source) => {
    const trimmed = source.trim() || source;
    if (!normalizeHeader(trimmed) || normalizeHeader(trimmed).startsWith('unnamed')) {
      return { source: trimmed, target: '—', status: 'Ignored' as const };
    }
    if (isDroppedColumn(trimmed)) {
      return { source: trimmed, target: 'Ignored', status: 'Ignored' as const };
    }
    const field = fieldForHeader(trimmed);
    if (!field) {
      return { source: trimmed, target: '—', status: 'Unrecognized' as const };
    }
    if (claimed.has(field)) {
      return {
        source: trimmed,
        target: FIELD_LABEL[field] ?? field,
        status: 'Duplicate' as const,
      };
    }
    claimed.set(field, trimmed);
    return {
      source: trimmed,
      target: FIELD_LABEL[field] ?? field,
      status: 'Mapped' as const,
    };
  });
}

export function headersAreImportable(rows: readonly ClassifiedHeader[]): boolean {
  const fields = new Set(
    rows.filter((row) => row.status === 'Mapped').map((row) => fieldForHeader(row.source)),
  );
  const hasId = fields.has('student_id');
  const hasGrade = fields.has('grade');
  const hasName = fields.has('name') || (fields.has('first_name') && fields.has('last_name'));
  const noUnknown = rows.every(
    (row) => row.status === 'Mapped' || row.status === 'Ignored',
  );
  return hasId && hasGrade && hasName && noUnknown;
}

/** First-row headers of a pasted or CSV sheet. */
export function headersFromTabularText(text: string): string[] {
  const first = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!first) return [];
  const tabs = (first.match(/\t/g) ?? []).length;
  const semis = (first.match(/;/g) ?? []).length;
  const commas = (first.match(/,/g) ?? []).length;
  let sep = ',';
  if (tabs > 0 && tabs >= commas && tabs >= semis) sep = '\t';
  else if (semis > commas) sep = ';';
  return first.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ''));
}
