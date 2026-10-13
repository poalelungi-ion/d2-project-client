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
  { field: 'attempt', headerName: 'Attempt #', editable: false, flex: 0.8 },
  // Declared on import, unlike 'Attempt #', which this system derives by counting.
  {
    field: 'attempt_type',
    headerName: 'Sitting / Attempt',
    editable: false,
    flex: 1.2,
    cellRenderer: (params: ICellRendererParams<TranscriptEntry, string>) => {
      const type = params.value || 'Exam 1';
      const isRetake = type === 'Exam 2';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: isRetake ? 'rgba(237, 108, 2, 0.12)' : 'rgba(25, 118, 210, 0.12)',
            color: isRetake ? '#e65100' : '#1565c0',
            border: isRetake ? '1px solid rgba(237, 108, 2, 0.35)' : '1px solid rgba(25, 118, 210, 0.35)',
          }}
        >
          {type === 'Exam 2' ? 'Exam 2 (Retake)' : type === 'Exam 1' ? 'Exam 1 (First)' : type}
        </span>
      );
    },
  },
  {
    field: 'semester',
    headerName: 'Semester',
    editable: false,
    flex: 1,
    comparator: (a: string | undefined, b: string | undefined) =>
      compareSemesters(a ?? '', b ?? ''),
  },
  { field: 'course', headerName: 'Course', editable: false, flex: 2 },
  {
    field: 'grade',
    headerName: 'Grade (1.0-5.0)',
    editable: false,
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
    flex: 1,
    valueGetter: (params) => {
      const row = params.data;
      if (!row) return '';
      return outcomeLabel(row.outcome, row.passed);
    },
    cellRenderer: (
      params: ICellRendererParams<TranscriptEntry, string>,
    ) => (
      <span
        style={{
          color: gradeOutcomeColor(params.data?.outcome ?? ''),
          fontWeight: 'bold',
        }}
      >
        {params.value}
      </span>
    ),
  },
];