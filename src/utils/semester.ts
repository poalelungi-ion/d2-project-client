/**
 * Semester parsing and chronological comparison utilities (Ticket #99881).
 *
 * In the German academic calendar:
 * - Sommersemester (SoSe/SS): starts ~April (spring) -> term 1
 * - Wintersemester (WiSe/WS): starts ~October (fall) -> term 2
 */
export interface ParsedSemester {
  year: number;
  term: number;
}

const WINTER_MARKERS = ['WISE', 'WS', 'WINTER'];
const SUMMER_MARKERS = ['SOSE', 'SS', 'SOMMER', 'SUMMER'];

function getSemesterTerm(value: string): number {
  if (
    value.startsWith('W') ||
    WINTER_MARKERS.some((marker) => value.includes(marker))
  ) {
    return 2;
  }

  if (
    value.startsWith('S') ||
    SUMMER_MARKERS.some((marker) => value.includes(marker))
  ) {
    return 1;
  }

  return 0;
}

function normalizeYear(raw: number): number {
  if (raw >= 100) {
    return raw;
  }

  if (raw <= 70) {
    return 2000 + raw;
  }

  return 1900 + raw;
}

export function parseSemester(s: string): ParsedSemester {
  if (!s) {
    return { year: 0, term: 0 };
  }

  const clean = String(s).trim();
  const term = getSemesterTerm(clean.toUpperCase());
  const firstNumber = clean.match(/\d+/)?.[0];

  if (!firstNumber) {
    return { year: 0, term };
  }

  const raw = Number.parseInt(firstNumber, 10);

  if (Number.isNaN(raw)) {
    return { year: 0, term };
  }

  return {
    year: normalizeYear(raw),
    term,
  };
}

export function compareSemesters(a: string, b: string): number {
  const semA = parseSemester(a);
  const semB = parseSemester(b);

  if (semA.year !== semB.year) {
    return semA.year - semB.year;
  }

  if (semA.term !== semB.term) {
    return semA.term - semB.term;
  }

  return String(a).localeCompare(String(b));
}