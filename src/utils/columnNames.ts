/**
 * Spreadsheet header classification and dynamic column mapping helpers.
 *
 * Known aliases standardise to internal fields automatically, while lecturers
 * can also dynamically map or ignore columns in the Map Columns wizard step.
 * Keep in lockstep with d2-project-backend/src/lib/column_names.py.
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

export const TARGET_FIELD_OPTIONS = [
  { field: 'student_id', label: 'Matrikelnr', displayLabel: 'Matrikelnummer (Student ID)' },
  { field: 'name', label: 'Name', displayLabel: 'Full Name (Auto-Split)' },
  { field: 'first_name', label: 'First Name', displayLabel: 'First Name (Vorname)' },
  { field: 'last_name', label: 'Last Name', displayLabel: 'Last Name (Nachname)' },
  { field: 'program', label: 'Studiengang', displayLabel: 'Study Program (Studiengang)' },
  { field: 'semester', label: 'Fachsemester', displayLabel: 'Semester (Fachsemester)' },
  { field: 'grade', label: 'Note', displayLabel: 'Grade (Note)' },
] as const;

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

const EXAM_EXTRA_COLUMN_KEYS = new Set([
  'ects',
  'credit',
  'credits',
  'ectscredit',
  'ectscredits',
  'kreditpunkte',
  'leistungspunkte',
  'points',
  'punkte',
  'gesamtpunkte',
  'summe',
  'total',
  'attended',
  'teilgenommen',
  'publish',
  'veroeffentlichen',
  'attest',
  'notes',
  'notizen',
  'bemerkung',
  'bemerkungen',
  'attempt',
  'versuch',
]);

const EXERCISE_HEADER_RE = /^(?:ex(?:ercise)?|aufgabe|task|q)?\s*\d+[a-z]?$/i;

export type HeaderStatus = 'Mapped' | 'Ignored' | 'Unrecognized' | 'Duplicate';

export interface ClassifiedHeader {
  source: string;
  target: string;
  status: HeaderStatus;
  field?: string;
}

export function normalizeHeader(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/[.:]+$/, '').toLowerCase();
}

export function fieldForHeader(name: string): string | undefined {
  return HEADER_TO_FIELD[normalizeHeader(name)];
}

export function isDroppedColumn(name: string): boolean {
  const trimmed = name.trim();
  if (EXERCISE_HEADER_RE.test(trimmed)) return true;
  const folded = trimmed.toLowerCase();
  if (IGNORED_UPLOAD_COLUMNS.has(folded)) return true;
  const alnum = folded.replace(/[^a-z0-9]/g, '');
  return COURSE_COLUMN_KEYS.has(alnum) || EXAM_EXTRA_COLUMN_KEYS.has(alnum);
}

export function classifyHeaders(
  headers: readonly string[],
  overrides?: Record<string, string>,
): ClassifiedHeader[] {
  const claimed = new Map<string, string>();
  return headers.map((source) => {
    const trimmed = source.trim() || source;
    const explicit = overrides?.[trimmed] ?? overrides?.[source];

    if (explicit !== undefined) {
      if (explicit === 'ignore' || explicit === 'Ignored') {
        return { source: trimmed, target: 'Ignored', status: 'Ignored' as const, field: 'ignore' };
      }
      if (explicit === '' || explicit === '—') {
        return { source: trimmed, target: '—', status: 'Unrecognized' as const, field: '' };
      }
      const resolvedField = FIELD_LABEL[explicit] ? explicit : fieldForHeader(explicit);
      if (resolvedField) {
        const label = FIELD_LABEL[resolvedField] ?? resolvedField;
        if (claimed.has(resolvedField)) {
          return {
            source: trimmed,
            target: label,
            status: 'Duplicate' as const,
            field: resolvedField,
          };
        }
        claimed.set(resolvedField, trimmed);
        return {
          source: trimmed,
          target: label,
          status: 'Mapped' as const,
          field: resolvedField,
        };
      }
    }

    if (!normalizeHeader(trimmed) || normalizeHeader(trimmed).startsWith('unnamed')) {
      return { source: trimmed, target: '—', status: 'Ignored' as const, field: 'ignore' };
    }
    if (isDroppedColumn(trimmed)) {
      return { source: trimmed, target: 'Ignored', status: 'Ignored' as const, field: 'ignore' };
    }
    const field = fieldForHeader(trimmed);
    if (!field) {
      return { source: trimmed, target: '—', status: 'Unrecognized' as const, field: '' };
    }
    if (claimed.has(field)) {
      return {
        source: trimmed,
        target: FIELD_LABEL[field] ?? field,
        status: 'Duplicate' as const,
        field,
      };
    }
    claimed.set(field, trimmed);
    return {
      source: trimmed,
      target: FIELD_LABEL[field] ?? field,
      status: 'Mapped' as const,
      field,
    };
  });
}

export function headersAreImportable(rows: readonly ClassifiedHeader[]): boolean {
  const fields = new Set(
    rows
      .filter((row) => row.status === 'Mapped')
      .map((row) => row.field ?? fieldForHeader(row.target) ?? fieldForHeader(row.source)),
  );
  const hasId = fields.has('student_id');
  const hasGrade = fields.has('grade');
  const hasName = fields.has('name') || (fields.has('first_name') && fields.has('last_name'));
  const noUnknown = rows.every(
    (row) => row.status === 'Mapped' || row.status === 'Ignored',
  );
  return hasId && hasGrade && hasName && noUnknown;
}

function detectTabularSeparator(line: string): string {
  const tabs = (line.match(/\t/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

/** First-row headers of a pasted or CSV sheet. */
export function headersFromTabularText(text: string): string[] {
  const first = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!first) return [];
  const sep = detectTabularSeparator(first);
  return first.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

/** First non-empty sample values per column from pasted or CSV text. */
export function samplesFromTabularText(text: string): {
  samples: Record<string, string>;
  rowCount: number;
} {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { samples: {}, rowCount: 0 };
  const sep = detectTabularSeparator(lines[0]);
  const headers = lines[0].split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const dataLines = lines.slice(1);
  const samples: Record<string, string> = {};
  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const colName = headers[colIdx];
    if (!colName) continue;
    for (const rowLine of dataLines) {
      const cells = rowLine.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
      const val = cells[colIdx];
      if (val) {
        samples[colName] = `e.g. ${val}`;
        break;
      }
    }
  }
  return { samples, rowCount: dataLines.length };
}
