import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { Course, Student, StudentStatus, TranscriptEntry } from '../../types';
import { gradeOutcomeColor, passRateColor, studentStatusColor } from '../../styles/colors';
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
  { field: 'course_id', headerName: 'ID', flex: 0.8 },
  { field: 'course_name', headerName: 'Name', flex: 2 },
  { field: 'semester', headerName: 'Semester', flex: 1, comparator: (a: string | undefined, b: string | undefined) => compareSemesters(a ?? '', b ?? '') },
  { field: 'assigned_professor', headerName: 'Professor', flex: 1.5 },
  { field: 'total_attempts', headerName: 'Submissions', flex: 1 },
  {
    field: 'pass_rate',
    headerName: 'Pass Rate',
    flex: 1,
    cellRenderer: (params: ICellRendererParams<Course, number>) => (
      <span style={{ color: passRateColor(params.value ?? 0), fontWeight: 'bold' }}>
        {params.value}%
      </span>
    ),
  },
  { field: 'avg_grade', headerName: 'Avg Grade', flex: 1 },
  editAction(onEdit),
];

export const studentColumns = (onEdit: (student: Student) => void): ColDef<Student>[] => [
  { field: 'student_id', headerName: 'ID', flex: 1 },
  { field: 'name', headerName: 'Name', flex: 2 },
  { field: 'program', headerName: 'Study Program', flex: 2 },
  { field: 'total_exams', headerName: 'Exams Taken', flex: 1 },
  { field: 'avg_grade', headerName: 'Avg Grade', flex: 1 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    cellRenderer: (params: ICellRendererParams<Student, StudentStatus>) => (
      <span
        style={{
          color: params.value ? studentStatusColor(params.value) : 'inherit',
          fontWeight: 'bold',
        }}
      >
        {params.value?.toUpperCase()}
      </span>
    ),
  },
  { ...editAction(onEdit), flex: 1 },
];

export const transcriptColumns = (): ColDef<TranscriptEntry>[] => [
  { field: 'result_id', headerName: 'ID', hide: true },
  { field: 'attempt', headerName: 'Attempt #', editable: false, flex: 0.8 },
  // Declared on import, unlike 'Attempt #', which this system derives by counting.
  { field: 'attempt_type', headerName: 'Exam', editable: false, flex: 1 },
  { field: 'semester', headerName: 'Semester', editable: false, flex: 1, comparator: (a: string | undefined, b: string | undefined) => compareSemesters(a ?? '', b ?? '') },
  { field: 'course', headerName: 'Course', editable: false, flex: 2 },
  {
    field: 'grade',
    headerName: 'Grade (1.0-5.0)',
    editable: false,
    flex: 1,
    type: 'numericColumn',
    valueFormatter: (params) => formatGrade(params.value, params.data?.absence_code),
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
    cellRenderer: (params: ICellRendererParams<TranscriptEntry, string>) => (
      <span style={{ color: gradeOutcomeColor(params.data?.outcome ?? ''), fontWeight: 'bold' }}>
        {params.value}
      </span>
    ),
  },
];
