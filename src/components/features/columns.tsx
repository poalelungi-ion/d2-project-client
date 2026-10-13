import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import type { Course, Student, TranscriptEntry } from '../../types';
import { gradeOutcomeColor, passRateColor } from '../../styles/colors';
import { formatGrade, outcomeLabel } from '../../utils/gradeOutcome';
import { compareSemesters } from '../../utils/semester';

const editAction = <T,>(onEdit: (row: T) => void): ColDef<T> => ({
  headerName: 'Actions',
  colId: 'actions',
  flex: 0.8,
  sortable: false,
  filter: false,
  cellRenderer: (params: ICellRendererParams<T>) => (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        if (params.data) onEdit(params.data);
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  ),
});

export const courseColumns = (onEdit: (course: Course) => void): ColDef<Course>[] => [
  { field: 'course_id', headerName: 'ID', minWidth: 90, flex: 0.8 },
  { field: 'course_name', headerName: 'Name', minWidth: 200, flex: 2 },
  { field: 'total_attempts', headerName: 'Submissions', minWidth: 130, flex: 1 },
  {
    field: 'pass_rate',
    headerName: 'Pass Rate',
    minWidth: 110,
    flex: 1,
    cellRenderer: (params: ICellRendererParams<Course, number>) => (
      <span style={{ color: passRateColor(params.value ?? 0), fontWeight: 'bold' }}>
        {params.value}%
      </span>
    ),
  },
  {
    field: 'avg_grade',
    headerName: 'Avg Grade',
    minWidth: 110,
    flex: 1,
    valueFormatter: (params: ValueFormatterParams<Course, number>) => formatGrade(params.value),
  },
  { ...editAction(onEdit), minWidth: 90, flex: 0.8 },
];

export const studentColumns = (onEdit: (student: Student) => void): ColDef<Student>[] => [
  { field: 'student_id', headerName: 'ID', minWidth: 100, flex: 0.8 },
  { field: 'name', headerName: 'Name', minWidth: 160, flex: 1.8 },
  { field: 'program', headerName: 'Study Program', minWidth: 180, flex: 2 },
  { field: 'total_exams', headerName: 'Exams Taken', minWidth: 140, flex: 1.2 },
  {
    field: 'avg_grade',
    headerName: 'Avg Grade',
    minWidth: 120,
    flex: 1,
    valueFormatter: (params: ValueFormatterParams<Student, number>) => formatGrade(params.value),
  },
  { ...editAction(onEdit), minWidth: 90, flex: 0.8 },
];

export const transcriptColumns = (): ColDef<TranscriptEntry>[] => [
  { field: 'result_id', headerName: 'ID', hide: true },
  { field: 'attempt', headerName: 'Attempt #', minWidth: 90, editable: false, flex: 0.8 },
  // Declared on import, unlike 'Attempt #', which this system derives by counting.
  {
    field: 'attempt_type',
    headerName: 'Sitting / Attempt',
    editable: false,
    minWidth: 140,
    flex: 1.2,
    cellRenderer: (params: ICellRendererParams<TranscriptEntry, string>) => {
      const type = params.value || 'Exam 1';
      const isRetake = type === 'Exam 2';
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              backgroundColor: isRetake ? 'rgba(237, 108, 2, 0.14)' : 'rgba(25, 118, 210, 0.14)',
              color: isRetake ? '#e65100' : '#1976d2',
              border: isRetake ? '1px solid rgba(237, 108, 2, 0.35)' : '1px solid rgba(25, 118, 210, 0.35)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {type === 'Exam 2' ? 'Exam 2 (Retake)' : type === 'Exam 1' ? 'Exam 1 (First)' : type}
          </span>
        </div>
      );
    },
  },
  {
    field: 'semester',
    headerName: 'Semester',
    editable: false,
    minWidth: 120,
    flex: 1,
    comparator: (a: string | undefined, b: string | undefined) =>
      compareSemesters(a ?? '', b ?? ''),
  },
  { field: 'course', headerName: 'Course', minWidth: 180, editable: false, flex: 2 },
  {
    field: 'grade',
    headerName: 'Grade (1.0-5.0)',
    editable: false,
    minWidth: 120,
    flex: 1,
    type: 'numericColumn',
    valueFormatter: (params: ValueFormatterParams<TranscriptEntry, number | null>) =>
      formatGrade(params.value, params.data?.absence_code),
    cellStyle: { fontWeight: 'bold' },
  },
  {
    colId: 'outcome',
    headerName: 'Result',
    editable: false,
    minWidth: 110,
    flex: 1,
    valueGetter: (params) => {
      const row = params.data;
      if (!row) return '';
      return outcomeLabel(row.outcome, row.passed);
    },
    cellRenderer: (
      params: ICellRendererParams<TranscriptEntry, string>,
    ) => {
      const color = gradeOutcomeColor(params.data?.outcome ?? '');
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              color,
              border: `1px solid ${color}44`,
              backgroundColor: `${color}18`,
            }}
          >
            {params.value}
          </span>
        </div>
      );
    },
  },
];

export const studentCourseHistoryColumns = (
  onViewAttempts: (row: import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow) => void,
): ColDef<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow>[] => [
  { field: 'course', headerName: 'Course / Subject', minWidth: 180, flex: 2 },
  { field: 'semesters', headerName: 'Semesters', minWidth: 140, flex: 1.5 },
  {
    field: 'attempt_count',
    headerName: 'Attempts & Retakes',
    minWidth: 160,
    flex: 1.3,
    cellRenderer: (params: ICellRendererParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow, number>) => {
      const count = params.value ?? 1;
      const isRetake = count > 1;
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              backgroundColor: isRetake ? 'rgba(237, 108, 2, 0.14)' : 'rgba(76, 175, 80, 0.14)',
              color: isRetake ? '#e65100' : '#2e7d32',
              border: isRetake ? '1px solid rgba(237, 108, 2, 0.35)' : '1px solid rgba(76, 175, 80, 0.35)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {count} {count === 1 ? 'Attempt' : `Attempts (${count - 1} Retake)`}
          </span>
        </div>
      );
    },
  },
  {
    field: 'best_grade',
    headerName: 'Best Grade',
    minWidth: 120,
    flex: 1,
    cellRenderer: (params: ICellRendererParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow, number>) => {
      const text = formatGrade(params.value, params.data?.best_absence);
      const isPassed = params.data?.final_status === 'Passed';
      return (
        <span style={{ fontWeight: 800, color: isPassed ? '#2e7d32' : '#d32f2f' }}>
          {text} {isPassed ? '✓' : '✗'}
        </span>
      );
    },
  },
  {
    field: 'exam1_grade',
    headerName: 'Exam 1',
    minWidth: 100,
    flex: 0.9,
    valueFormatter: (params: ValueFormatterParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow, number | null>) =>
      params.value != null ? formatGrade(params.value, params.data?.exam1_absence) : '—',
  },
  {
    field: 'exam2_grade',
    headerName: 'Exam 2 (Retake)',
    minWidth: 120,
    flex: 1.1,
    valueFormatter: (params: ValueFormatterParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow, number | null>) =>
      params.value != null ? formatGrade(params.value, params.data?.exam2_absence) : '—',
  },
  {
    field: 'final_status',
    headerName: 'Final Status',
    minWidth: 110,
    flex: 1,
    cellRenderer: (params: ICellRendererParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow, string>) => {
      const isPassed = params.value === 'Passed';
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              color: isPassed ? '#2e7d32' : '#d32f2f',
              backgroundColor: isPassed ? 'rgba(46, 125, 50, 0.12)' : 'rgba(211, 47, 47, 0.12)',
              border: isPassed ? '1px solid rgba(46, 125, 50, 0.35)' : '1px solid rgba(211, 47, 47, 0.35)',
            }}
          >
            {params.value}
          </span>
        </div>
      );
    },
  },
  {
    colId: 'actions',
    headerName: 'Attempts',
    minWidth: 110,
    flex: 0.9,
    sortable: false,
    filter: false,
    cellRenderer: (params: ICellRendererParams<import('./StudentCourseAttemptsDialog').StudentCourseHistoryRow>) => {
      if (!params.data) return null;
      const row = params.data;
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewAttempts(row);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'none',
              border: '1px solid rgba(25, 118, 210, 0.4)',
              color: '#1976d2',
              padding: '3px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            View ({row.attempt_count})
          </button>
        </div>
      );
    },
  },
];