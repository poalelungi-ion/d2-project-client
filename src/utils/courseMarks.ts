/**
 * Filtering and re-aggregation for one course's marks.
 *
 * A course row from the API carries every sitting ever recorded against it,
 * across all semesters, plus aggregates computed over that whole set. Once a
 * lecturer narrows to one semester those aggregates no longer describe what is
 * on screen, so they are recomputed here from the visible rows.
 */
import type { AttemptType, CourseMark, GradeOutcome } from '../types';
import { compareSemesters } from './semester';

/** Sentinel for "no filter", so the Select always has a defined value. */
export const ALL_SEMESTERS = '__all_semesters__';
export const ALL_EXAMS = '__all_exams__';

/**
 * Sittings are tagged at upload with which exam they were. Older rows predate
 * the tag and the backend defaults them to "Other".
 */
const EXAM_ORDER: readonly string[] = ['Exam 1', 'Exam 2', 'Other'];

/** Joins a history row's semesters into one cell. */
const SEMESTER_SEPARATOR = ', ';

const examOf = (mark: CourseMark): string => mark.attempt_type || 'Other';

const byExamOrder = (a: string, b: string): number => {
  const left = EXAM_ORDER.indexOf(a);
  const right = EXAM_ORDER.indexOf(b);
  // Anything unrecognised sorts after the known sittings, alphabetically.
  if (left === -1 && right === -1) return a.localeCompare(b);
  if (left === -1) return 1;
  if (right === -1) return -1;
  return left - right;
};

/** Distinct semesters this course has been offered in, oldest first. */
export function semestersOf(marks: readonly CourseMark[]): string[] {
  return [...new Set(marks.map((m) => m.semester).filter(Boolean))].sort(compareSemesters);
}

/**
 * Orders semester cells oldest first, not alphabetically. A history row lists
 * several semesters (see perStudentHistory); its earliest one decides.
 */
export const bySemesterOrder = (a = '', b = ''): number =>
  compareSemesters(a.split(SEMESTER_SEPARATOR)[0], b.split(SEMESTER_SEPARATOR)[0]);

/**
 * Distinct sittings within one semester.
 *
 * A semester with a single entry needs no exam filter, which is what the
 * caller uses the length of this list to decide.
 */
export function examsOf(marks: readonly CourseMark[], semester: string): string[] {
  const inSemester = semester === ALL_SEMESTERS
    ? marks
    : marks.filter((m) => m.semester === semester);
  return [...new Set(inSemester.map(examOf))].sort(byExamOrder);
}

/** Narrows to one semester and, within it, one sitting. */
export function filterMarks(
  marks: readonly CourseMark[],
  semester: string,
  exam: string,
): CourseMark[] {
  return marks.filter(
    (mark) =>
      (semester === ALL_SEMESTERS || mark.semester === semester) &&
      (exam === ALL_EXAMS || examOf(mark) === exam),
  );
}

export interface MarksSummary {
  /** Every sitting, excused ones included. */
  totalAttempts: number;
  /** Percentage of counted sittings that passed, to one decimal. */
  passRate: number;
  /** Mean grade of the passed sittings, to two decimals. */
  avgGrade: number;
}

/**
 * Course headline figures for a set of marks.
 *
 * Two things here look wrong and are not, because they match the backend:
 * excused sittings (AT) are excluded from the pass-rate denominator but still
 * counted in `totalAttempts`, and the average is taken over passed sittings
 * only rather than over everything graded.
 */
export function summariseMarks(marks: readonly CourseMark[]): MarksSummary {
  const counted = marks.filter((mark) => mark.outcome !== 'excused');
  const passed = counted.filter((mark) => mark.passed || mark.outcome === 'passed');
  const grades = passed.map((mark) => mark.grade).filter((g): g is number => g != null);

  return {
    totalAttempts: marks.length,
    passRate: counted.length
      ? Math.round((passed.length / counted.length) * 1000) / 10
      : 0,
    avgGrade: grades.length
      ? Math.round((grades.reduce((sum, g) => sum + g, 0) / grades.length) * 100) / 100
      : 0,
  };
}

/** Human label for the active filter, e.g. "SOSE_25 · Exam 2". */
export function filterLabel(semester: string, exam: string): string | null {
  if (semester === ALL_SEMESTERS) return null;
  return exam === ALL_EXAMS ? semester : `${semester} · ${exam}`;
}

export type { AttemptType };

/** One bar of the course's grade histogram. */
export interface GradeBucket {
  grade: string;
  count: number;
}

/** How often each distinct grade was awarded, best grade first. */
export function gradeDistribution(marks: readonly CourseMark[]): GradeBucket[] {
  const counts = new Map<string, number>();
  for (const mark of marks) {
    if (mark.grade == null) continue;
    const grade = mark.grade.toString();
    counts.set(grade, (counts.get(grade) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => parseFloat(left) - parseFloat(right))
    .map(([grade, count]) => ({ grade, count }));
}

/** Sittings split three ways. Excused (AT) is its own bucket, not a fail. */
export interface OutcomeCounts {
  passed: number;
  failed: number;
  excused: number;
}

export function countOutcomes(marks: readonly CourseMark[]): OutcomeCounts {
  const counts: OutcomeCounts = { passed: 0, failed: 0, excused: 0 };
  for (const mark of marks) {
    if (mark.outcome === 'excused') counts.excused += 1;
    else if (mark.passed || mark.outcome === 'passed') counts.passed += 1;
    else counts.failed += 1;
  }
  return counts;
}

/** A student's sittings for this course, each list oldest first. */
function groupByStudent(marks: readonly CourseMark[]): Map<number, CourseMark[]> {
  const byStudent = new Map<number, CourseMark[]>();
  for (const mark of marks) {
    if (mark.student_id == null) continue;
    const sittings = byStudent.get(mark.student_id) ?? [];
    sittings.push(mark);
    byStudent.set(mark.student_id, sittings);
  }
  for (const sittings of byStudent.values()) {
    sittings.sort((a, b) => {
      const semDiff = compareSemesters(a.semester, b.semester);
      if (semDiff !== 0) return semDiff;
      if (a.attempt_type === 'Exam 1' && b.attempt_type === 'Exam 2') return -1;
      if (a.attempt_type === 'Exam 2' && b.attempt_type === 'Exam 1') return 1;
      return (a.result_id || 0) - (b.result_id || 0);
    });
  }
  return byStudent;
}

/** One row of the per-person history grid: a student's sittings side by side. */
export interface CourseHistoryRow {
  student_id: number;
  student_name: string;
  program: string;
  /** Every semester the student sat this course in, oldest first, e.g. "SOSE_25, WISE_25". */
  semester: string;
  best_grade: number | null;
  best_absence: string | null;
  best_outcome: GradeOutcome | null;
  best_attempt_label: string;
  attempt_count: number;
  exam1_grade: number | null;
  exam1_absence: string | null;
  exam2_grade: number | null;
  exam2_absence: string | null;
  final_status: 'Passed' | 'Failed';
  /** Every sitting behind the row, so clicking it can open the student. */
  marks: CourseMark[];
}

/**
 * Identifies the best academic mark for a student across all exam sittings
 * (in German grading, 1.0 is highest pass, 4.0 is lowest pass, 5.0 is fail).
 */
export function findBestMark(sittings: readonly CourseMark[]): CourseMark | null {
  if (!sittings || sittings.length === 0) return null;

  // 1. Prioritize passed attempts first
  const passed = sittings.filter((m) => m.passed || m.outcome === 'passed');
  if (passed.length > 0) {
    const withGrade = passed.filter((m) => m.grade != null);
    if (withGrade.length > 0) {
      return [...withGrade].sort((a, b) => (a.grade ?? 5) - (b.grade ?? 5))[0];
    }
    return passed[0];
  }

  // 2. If all failed, select the closest numeric grade to passing (lowest number)
  const withGrade = sittings.filter((m) => m.grade != null);
  if (withGrade.length > 0) {
    return [...withGrade].sort((a, b) => (a.grade ?? 5) - (b.grade ?? 5))[0];
  }

  // 3. Fallback: excused absence (AT) is preferred over non-attendance (NE/EX)
  const excused = sittings.find((m) => m.outcome === 'excused' || m.absence_code === 'AT');
  if (excused) return excused;

  return sittings[0];
}

/**
 * Places a student's sittings into the Exam 1 and Exam 2 columns.
 *
 * Rows imported before the tag existed are all "Other", so those fall back to
 * chronological order and fill whichever column is still free -- otherwise a
 * course with only legacy data would show two empty columns.
 */
function intoExamColumns(
  sittings: readonly CourseMark[],
): { first: CourseMark | null; second: CourseMark | null } {
  let first = sittings.find((m) => m.attempt_type === 'Exam 1') ?? null;
  let second = sittings.find((m) => m.attempt_type === 'Exam 2') ?? null;

  for (const mark of sittings) {
    if (mark.attempt_type === 'Exam 1' || mark.attempt_type === 'Exam 2') continue;
    if (!first) first = mark;
    else if (!second) second = mark;
  }
  return { first, second };
}

/**
 * Collapses the per-sitting rows into one row per student, so a retake reads
 * next to the attempt it followed instead of as an unrelated second row.
 */
export function perStudentHistory(marks: readonly CourseMark[]): CourseHistoryRow[] {
  const history: CourseHistoryRow[] = [];
  for (const [student_id, sittings] of groupByStudent(marks)) {
    const { first, second } = intoExamColumns(sittings);
    // groupByStudent never yields an empty list, so there is always a sitting
    // to read the student's name off -- but it may not be the Exam 1 one.
    const identity = sittings[0];
    const best = findBestMark(sittings);
    const bestLabel = best
      ? `${best.semester} · ${best.attempt_type || 'Other'}`
      : '';

    history.push({
      student_id,
      student_name: identity.student_name,
      program: identity.program,
      semester: semestersOf(sittings).join(SEMESTER_SEPARATOR),
      best_grade: best ? best.grade : null,
      best_absence: best ? best.absence_code : null,
      best_outcome: best ? best.outcome : null,
      best_attempt_label: bestLabel,
      attempt_count: sittings.length,
      exam1_grade: first ? first.grade : null,
      exam1_absence: first ? first.absence_code : null,
      exam2_grade: second ? second.grade : null,
      exam2_absence: second ? second.absence_code : null,
      final_status: sittings.some((m) => m.passed || m.outcome === 'passed')
        ? 'Passed'
        : 'Failed',
      marks: sittings,
    });
  }
  return history;
}

/** One semester's spread of first, second, ... attempts. */
export interface SemesterAttempts {
  semester: string;
  total_students: number;
  distribution: Record<string | number, number>;
}

/**
 * How many students sat their first, second, ... attempt in each semester.
 *
 * The attempt number is chronological across the whole course history, so this
 * always reads every semester: filtering to one would renumber the attempts
 * and collapse the panel to a single column.
 */
export function attemptsBySemester(marks: readonly CourseMark[]): SemesterAttempts[] {
  const bySemester = new Map<string, SemesterAttempts>();
  for (const sittings of groupByStudent(marks).values()) {
    sittings.forEach((mark, index) => {
      const row = bySemester.get(mark.semester) ?? {
        semester: mark.semester,
        total_students: 0,
        distribution: {},
      };
      const attempt = index + 1;
      row.distribution[attempt] = (row.distribution[attempt] ?? 0) + 1;
      row.total_students += 1;
      bySemester.set(mark.semester, row);
    });
  }
  return [...bySemester.values()].sort((a, b) => compareSemesters(a.semester, b.semester));
}

export interface ExamSelection {
  /** Empty until a semester is chosen. There is no "all semesters" here. */
  semester: string;
  /** ALL_EXAMS means the whole semester, retakes included. */
  exam: string;
}

export const EMPTY_SELECTION: ExamSelection = { semester: '', exam: ALL_EXAMS };

/** The marks one side covers. Empty while its semester is unchosen. */
export function marksOfSelection(
  marks: readonly CourseMark[],
  selection: ExamSelection,
): CourseMark[] {
  if (!selection.semester) return [];
  return filterMarks(marks, selection.semester, selection.exam);
}

/** "SOSE_25" or "SOSE_25 · Exam 2", or null while nothing is chosen. */
export function selectionLabel(selection: ExamSelection): string | null {
  if (!selection.semester) return null;
  return filterLabel(selection.semester, selection.exam);
}

export function isSameSelection(a: ExamSelection, b: ExamSelection): boolean {
  return a.semester === b.semester && a.exam === b.exam;
}

/**
 * How many distinct sittings this course has held, counting a semester's
 * retake separately. Below two there is nothing to compare, and the whole
 * comparison mode stays off the screen.
 */
export function sittingCount(marks: readonly CourseMark[]): number {
  const sittings = new Set<string>();
  for (const mark of marks) {
    if (mark.semester) sittings.add(`${mark.semester}::${examOf(mark)}`);
  }
  return sittings.size;
}

/**
 * The grades awarded in either of two sittings, best first.
 *
 * Two histograms drawn over their own grades are not comparable -- a 4.0 sits
 * in a different place on each axis, and a grade missing from one exam simply
 * vanishes rather than reading as zero. Both charts are drawn over this list
 * instead, so the bars line up.
 */
export function sharedGrades(
  left: readonly GradeBucket[],
  right: readonly GradeBucket[],
): string[] {
  const grades = new Set([...left, ...right].map((bucket) => bucket.grade));
  return [...grades].sort((a, b) => parseFloat(a) - parseFloat(b));
}

/** Pads a distribution with zeroes so it covers every grade in `grades`. */
export function alignDistribution(
  buckets: readonly GradeBucket[],
  grades: readonly string[],
): GradeBucket[] {
  const counts = new Map(buckets.map((bucket) => [bucket.grade, bucket.count]));
  return grades.map((grade) => ({ grade, count: counts.get(grade) ?? 0 }));
}
