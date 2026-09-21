/**
 * Semester parsing and chronological comparison utilities (Ticket #99881).
 * 
 * In the German academic calendar:
 * - Sommersemester (SoSe/SS): starts ~April (spring) -> term 1
 * - Wintersemester (WiSe/WS): starts ~October (fall) -> term 2
 * 
 * Example chronological order:
 *   WiSe23/24 (Oct 2023) < SoSe24 (Apr 2024) < WiSe24/25 (Oct 2024) < SOSE_25 (Apr 2025) < WISE_25 (Oct 2025)
 */
export interface ParsedSemester {
  year: number;
  term: number; // 1 for Summer, 2 for Winter, 0 for unknown
}

export function parseSemester(s: string): ParsedSemester {
  if (!s) return { year: 0, term: 0 };
  const clean = String(s).trim();
  const upper = clean.toUpperCase();

  let term = 0;
  if (upper.startsWith('W') || upper.includes('WISE') || upper.includes('WS') || upper.includes('WINTER')) {
    term = 2;
  } else if (upper.startsWith('S') || upper.includes('SOSE') || upper.includes('SS') || upper.includes('SOMMER') || upper.includes('SUMMER')) {
    term = 1;
  }

  const matches = clean.match(/\d+/g);
  let year = 0;
  if (matches && matches.length > 0) {
    const raw = parseInt(matches[0], 10);
    if (!isNaN(raw)) {
      year = raw < 100 ? (raw <= 70 ? 2000 + raw : 1900 + raw) : raw;
    }
  }

  return { year, term };
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
    const bucket = bySemester.get(mark.semester) ?? { sum: 0, count: 0 };
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

