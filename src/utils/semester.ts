/**
 * Semester parsing, validation, generation and chronological comparison
 * utilities (Ticket #99881).
 *
 * Standard semester format:
 * - Summer semester: SoSeYY
 * - Winter semester: WiSeYY/YY
 */

export interface ParsedSemester {
  year: number;
  term: number;
}

const WINTER_MARKERS = ['WISE', 'WS', 'WINTER'];
const SUMMER_MARKERS = ['SOSE', 'SS', 'SOMMER', 'SUMMER'];

const SEMESTER_PATTERN = /^(SoSe\d{2}|WiSe\d{2}\/\d{2})$/;

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

function shortYear(year: number): string {
  return String(year % 100).padStart(2, '0');
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

export function isValidSemester(value: string): boolean {
  return SEMESTER_PATTERN.test(value.trim());
}

export function getCurrentSemester(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4 && month <= 9) {
    return `SoSe${shortYear(year)}`;
  }

  if (month >= 10) {
    return `WiSe${shortYear(year)}/${shortYear(year + 1)}`;
  }

  return `WiSe${shortYear(year - 1)}/${shortYear(year)}`;
}

export function getNextSemester(semester: string): string {
  const parsed = parseSemester(semester);
  if (parsed.term === 1) {
    return `WiSe${shortYear(parsed.year)}/${shortYear(parsed.year + 1)}`;
  }
  if (parsed.term === 2) {
    return `SoSe${shortYear(parsed.year + 1)}`;
  }
  return semester;
}

export function generateSemesters(
  date: Date = new Date(),
  startYear = 2016,
): string[] {
  const currentSemester = getCurrentSemester(date);
  const nextSemester = getNextSemester(currentSemester);
  const nextParsed = parseSemester(nextSemester);
  const endYear = nextParsed.year + 1;
  const semesters: string[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const summerSemester = `SoSe${shortYear(year)}`;
    const winterSemester = `WiSe${shortYear(year)}/${shortYear(year + 1)}`;

    semesters.push(summerSemester);
    semesters.push(winterSemester);
  }

  return semesters
    .filter(
      (semester) => compareSemesters(semester, nextSemester) <= 0,
    )
    .sort(compareSemesters);
}

/**
 * Standard list of semesters matching the upload page:
 * [Next Semester, Current Semester, ...reversed past semesters (most recent first)]
 */
export function getStandardSemesterOptions(date: Date = new Date()): string[] {
  const currentSemester = getCurrentSemester(date);
  const nextSemester = getNextSemester(currentSemester);
  const allSemesters = generateSemesters(date);
  const otherSemesters = [...allSemesters]
    .filter((s) => s !== nextSemester && s !== currentSemester)
    .reverse();

  return [nextSemester, currentSemester, ...otherSemesters];
}

/** Mean numeric grade for one offering of a course. */
export interface SemesterGradeAverage {
  semester: string;
  average: number;
  sittings: number;
}

/**
 * Average German grade per semester, oldest first.
 * Null grades (excused / AT) are skipped so they do not pull the mean.
 */
export function averageGradeBySemester(
  marks: readonly { semester: string; grade: number | null }[],
): SemesterGradeAverage[] {
  const bySemester = new Map<string, { sum: number; count: number }>();

  for (const mark of marks) {
    if (mark.grade == null) continue;

    const bucket = bySemester.get(mark.semester) ?? {
      sum: 0,
      count: 0,
    };

    bucket.sum += mark.grade;
    bucket.count += 1;
    bySemester.set(mark.semester, bucket);
  }

  return [...bySemester.entries()]
    .sort(([left], [right]) => compareSemesters(left, right))
    .map(([semester, { sum, count }]) => ({
      semester,
      average: parseFloat((sum / count).toFixed(2)),
      sittings: count,
    }));
}