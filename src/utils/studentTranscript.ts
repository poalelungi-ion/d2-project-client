import type { TranscriptEntry } from '../types';
import type { StudentCourseHistoryRow } from '../components/features/StudentCourseAttemptsDialog';
import { compareSemesters } from './semester';

function pickBestEntry(sorted: TranscriptEntry[]): TranscriptEntry {
  const passedEntries = sorted.filter((e) => e.passed || e.outcome === 'passed');
  const pool = passedEntries.length > 0 ? passedEntries : sorted;
  const withGrade = pool.filter((e) => e.grade != null);

  if (withGrade.length > 0) {
    return [...withGrade].sort((a, b) => (a.grade ?? 5) - (b.grade ?? 5))[0];
  }

  return pool.find((e) => e.outcome === 'excused' || e.absence_code === 'AT') ?? pool[0];
}

function findExamAttempts(sorted: TranscriptEntry[]) {
  let first = sorted.find((e) => e.attempt_type === 'Exam 1' || e.attempt === 1) ?? null;
  let second = sorted.find((e) => e.attempt_type === 'Exam 2' || e.attempt === 2) ?? null;

  if (!first && sorted.length > 0) first = sorted[0];
  if (!second && sorted.length > 1 && sorted[1] !== first) second = sorted[1];

  return { first, second };
}

function createCourseHistoryRow(course: string, entries: TranscriptEntry[]): StudentCourseHistoryRow {
  const sorted = [...entries].sort((a, b) => {
    const cmp = compareSemesters(a.semester, b.semester);
    if (cmp !== 0) return cmp;
    return (a.attempt ?? 1) - (b.attempt ?? 1);
  });

  const semesters = [...new Set(sorted.map((e) => e.semester).filter(Boolean))].join(', ');
  const best = pickBestEntry(sorted);
  const { first, second } = findExamAttempts(sorted);
  const hasPassed = sorted.some((e) => e.passed || e.outcome === 'passed');

  return {
    course,
    semesters: semesters || 'Current',
    best_grade: best.grade,
    best_absence: best.absence_code,
    best_outcome: best.outcome,
    final_status: hasPassed ? 'Passed' : 'Failed',
    attempt_count: sorted.length,
    exam1_grade: first?.grade ?? null,
    exam1_absence: first?.absence_code ?? null,
    exam2_grade: second?.grade ?? null,
    exam2_absence: second?.absence_code ?? null,
    attempts: sorted,
  };
}

/**
 * Collapses a student's individual transcript entries into per-course summary rows,
 * identifying the best academic mark, Exam 1 vs Exam 2 retake sittings, and total attempts.
 */
export function groupTranscriptByCourse(
  transcript: readonly TranscriptEntry[],
): StudentCourseHistoryRow[] {
  if (!transcript || transcript.length === 0) return [];

  const byCourse = new Map<string, TranscriptEntry[]>();
  for (const entry of transcript) {
    const list = byCourse.get(entry.course) ?? [];
    list.push(entry);
    byCourse.set(entry.course, list);
  }

  const rows: StudentCourseHistoryRow[] = [];
  for (const [course, entries] of byCourse.entries()) {
    rows.push(createCourseHistoryRow(course, entries));
  }

  return rows.sort((a, b) => a.course.localeCompare(b.course));
}
