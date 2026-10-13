import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  ICellRendererParams,
  RowClickedEvent,
  ValueSetterParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import type { CourseMark, Student, ThemeMode } from '../../../types';
import { ROUTES } from '../../../app/navigation';
import { useApiMutations } from '../../../hooks/useApi';
import { notify, useThemeStore, useSystemLogStore } from '../../../stores';
import { chart, gradeOutcomeColor, surfaces } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import {
  GRADE_CONSTRAINT_MESSAGE,
  formatGrade,
  outcomeLabel,
  parseGradeInput,
} from '../../../utils/gradeOutcome';
import { bySemesterOrder, perStudentHistory } from '../../../utils/courseMarks';
import type { CourseHistoryRow } from '../../../utils/courseMarks';
import { SemesterExamFilter } from './SemesterExamFilter';
import { EditMarkDialog } from './EditMarkDialog';
import { StudentAttemptsDialog } from './StudentAttemptsDialog';
import { StudentFormDialog } from '../../forms/StudentFormDialog';

const DEFAULT_COL_DEF = { resizable: true, sortable: true, filter: true, editable: false };

const applyGradeCell = (params: ValueSetterParams<CourseMark>): boolean => {
  if (!params.data) return false;
  const parsed = parseGradeInput(params.newValue);
  if (!parsed.ok) {
    notify(GRADE_CONSTRAINT_MESSAGE, 'error');
    return false;
  }
  params.data.grade = parsed.grade;
  params.data.passed = parsed.passed;
  params.data.outcome = parsed.outcome;
  params.data.absence_code = parsed.absenceCode;
  return true;
};

/** Individual Marks: Grade is the only cell a lecturer can change. */
export const individualMarksColumnDefs = (
  themeMode: ThemeMode,
  onOpenActions?: (mark: CourseMark, anchor: HTMLElement) => void,
  onQuickEdit?: (mark: CourseMark) => void,
): ColDef<CourseMark>[] => [
  { field: 'result_id', headerName: 'ID', hide: true },
  { field: 'student_id', headerName: 'Student ID', flex: 1, editable: false },
  { field: 'student_name', headerName: 'Name', flex: 2, editable: false },
  { field: 'program', headerName: 'Study Program', flex: 2, editable: false },
  { field: 'semester', headerName: 'Semester', flex: 1, editable: false, comparator: bySemesterOrder },
  { field: 'attempt_type', headerName: 'Sitting / Attempt', flex: 1, editable: false },
  {
    field: 'grade',
    headerName: 'Grade',
    flex: 1,
    editable: true,
    cellDataType: false,
    cellEditor: 'agTextCellEditor',
    valueParser: (params) => params.newValue,
    valueGetter: (params) => {
      if (!params.data) return '';
      if (params.data.absence_code) return params.data.absence_code;
      return params.data.grade ?? '';
    },
    valueFormatter: (params) => formatGrade(params.data?.grade, params.data?.absence_code),
    valueSetter: applyGradeCell,
    cellStyle: {
      fontWeight: 'bold',
      backgroundColor: surfaces.well[themeMode],
    },
  },
  {
    colId: 'outcome',
    headerName: 'Result',
    flex: 1,
    editable: false,
    valueGetter: (params) =>
      params.data ? outcomeLabel(params.data.outcome, params.data.passed) : '',
    cellRenderer: (params: ICellRendererParams<CourseMark, string>) => (
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
  ...(onOpenActions
    ? [
        {
          colId: 'actions',
          headerName: 'Actions',
          width: 135,
          editable: false,
          sortable: false,
          filter: false,
          cellRenderer: (params: ICellRendererParams<CourseMark>) => {
            if (!params.data) return null;
            const rowMark = params.data;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon sx={{ fontSize: '0.85rem' }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickEdit?.(rowMark);
                  }}
                  sx={{
                    py: 0.25,
                    px: 1,
                    fontSize: '0.72rem',
                    textTransform: 'none',
                    borderRadius: radii.sm,
                    fontWeight: 700,
                  }}
                >
                  Edit
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenActions(rowMark, e.currentTarget);
                  }}
                  sx={{ p: 0.5 }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          },
        } as ColDef<CourseMark>,
      ]
    : []),
];

interface CourseMarksTableProps {
  marks: CourseMark[];
  courseName?: string;
  semesterOptions: readonly string[];
  examOptions: readonly string[];
  semesterFilter: string;
  examFilter: string;
  onSelectSemester: (value: string) => void;
  onSelectExam: (value: string) => void;
  activeFilter: string | null;
  onSelectStudent: (mark: CourseMark) => void;
  onRefresh: () => Promise<void>;
}

export const CourseMarksTable = ({
  marks,
  courseName,
  semesterOptions,
  examOptions,
  semesterFilter,
  examFilter,
  onSelectSemester,
  onSelectExam,
  activeFilter,
  onSelectStudent,
  onRefresh,
}: CourseMarksTableProps) => {
  const { saveTranscript } = useApiMutations();
  const themeMode = useThemeStore((s) => s.mode);
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'individual' | 'history'>('history');
  const courseGridRef = useRef<AgGridReact<CourseMark>>(null);
  const historyGridRef = useRef<AgGridReact<CourseHistoryRow>>(null);

  // Modal dialog states
  const [editingMark, setEditingMark] = useState<CourseMark | null>(null);
  const [editingStudentMark, setEditingStudentMark] = useState<CourseMark | null>(null);
  const [revealedStudentHistory, setRevealedStudentHistory] = useState<CourseHistoryRow | null>(null);

  // Menu states
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
  const [selectedMarkForMenu, setSelectedMarkForMenu] = useState<CourseMark | null>(null);

  const historyRows = useMemo(() => perStudentHistory(marks), [marks]);

  const handleOpenRowMenu = (mark: CourseMark, anchor: HTMLElement) => {
    setSelectedMarkForMenu(mark);
    setActionAnchor(anchor);
  };

  const handleCloseRowMenu = () => {
    setActionAnchor(null);
  };

  const handleQuickEdit = (mark: CourseMark) => {
    setEditingMark(mark);
  };

  const handleSaveMarks = async () => {
    const api = courseGridRef.current?.api;
    if (!api) return;
    api.stopEditing();
    const rows: CourseMark[] = [];
    api.forEachNode((node) => {
      if (node.data) rows.push(node.data);
    });
    const { shouldRefresh, saved } = await saveTranscript(rows);
    if (saved) {
      useSystemLogStore.getState().addLog({
        level: 'info',
        category: 'marks',
        code: 'MARKS_BATCH_SAVED',
        message: `Saved batch grades for ${rows.length} student submission(s).`,
        actor: 'Lecturer',
        details: JSON.stringify(rows, null, 2),
      });
    }
    if (shouldRefresh) await onRefresh();
  };

  const handleSaveSingleMark = async (updatedMark: CourseMark): Promise<boolean> => {
    const { saved } = await saveTranscript([updatedMark]);
    if (saved) {
      useSystemLogStore.getState().addLog({
        level: 'info',
        category: 'marks',
        code: 'MARK_UPDATED',
        message: `Updated mark for ${updatedMark.student_name} (ID: ${updatedMark.student_id}): Grade ${updatedMark.absence_code || updatedMark.grade} (${updatedMark.outcome}) in ${updatedMark.semester} (${updatedMark.attempt_type}).`,
        actor: 'Lecturer',
        details: JSON.stringify(updatedMark, null, 2),
      });
      await onRefresh();
      return true;
    }
    return false;
  };

  const applyQuickFilter = (text: string) => {
    const ref = viewMode === 'individual' ? courseGridRef : historyGridRef;
    ref.current?.api.setGridOption('quickFilterText', text);
  };

  const studentForFormDialog: Student | null = editingStudentMark
    ? {
        student_id: editingStudentMark.student_id ?? 0,
        name: editingStudentMark.student_name,
        program: editingStudentMark.program,
        status: 'active',
        total_exams: 1,
        passed_exams: editingStudentMark.passed ? 1 : 0,
        avg_grade: editingStudentMark.grade ?? 0,
        version: editingStudentMark.version,
      }
    : null;

  return (
    <Paper
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: radii.xxl,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700">
            Detailed Course Marks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {viewMode === 'history'
              ? 'Per-Person History across exam attempts. Click "Edit" or action menu to modify marks or student profile.'
              : 'Click a grade to edit inline (1.0–5.0 or NE/EX/AT), then save, or use the "Edit" button for the modal editor.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {activeFilter
              ? `Showing ${activeFilter} only -- the figures and charts above follow this selection.`
              : 'Showing every semester. Pick one to read a single sitting.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {viewMode === 'individual' && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => void handleSaveMarks()}
            >
              Save Marks
            </Button>
          )}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newValue: 'individual' | 'history' | null) => {
              if (newValue) setViewMode(newValue);
            }}
            size="small"
          >
            <ToggleButton value="history">Per-Person History</ToggleButton>
            <ToggleButton value="individual">Individual Marks</ToggleButton>
          </ToggleButtonGroup>
          <SemesterExamFilter
            semesterOptions={semesterOptions}
            examOptions={examOptions}
            semester={semesterFilter}
            exam={examFilter}
            onSelectSemester={onSelectSemester}
            onSelectExam={onSelectExam}
          />
          <TextField
            label="Quick Search..."
            size="small"
            onChange={(e) => applyQuickFilter(e.target.value)}
            sx={{ width: 220 }}
          />
        </Box>
      </Box>

      <Box className="ag-theme-alpine" sx={{ width: '100%', p: 2 }}>
        {viewMode === 'individual' ? (
          <AgGridReact<CourseMark>
            ref={courseGridRef}
            domLayout="autoHeight"
            rowData={marks}
            singleClickEdit={true}
            stopEditingWhenCellsLoseFocus={true}
            columnDefs={individualMarksColumnDefs(themeMode, handleOpenRowMenu, handleQuickEdit)}
            defaultColDef={DEFAULT_COL_DEF}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            onCellValueChanged={(event) => {
              if (event.colDef.field !== 'grade' || !event.node) return;
              event.api.refreshCells({
                rowNodes: [event.node],
                columns: ['outcome'],
                force: true,
              });
            }}
            onRowClicked={(e: RowClickedEvent<CourseMark>) => {
              if (e.data) onSelectStudent(e.data);
            }}
            rowSelection="single"
          />
        ) : (
          <AgGridReact<CourseHistoryRow>
            ref={historyGridRef}
            domLayout="autoHeight"
            rowData={historyRows}
            singleClickEdit={true}
            columnDefs={[
              { field: 'student_id', headerName: 'Student ID', flex: 1, editable: false },
              { field: 'student_name', headerName: 'Student Name', flex: 2, editable: false },
              { field: 'program', headerName: 'Study Program', flex: 2, editable: false },
              { field: 'semester', headerName: 'Semester', flex: 1, editable: false, comparator: bySemesterOrder },
              {
                colId: 'best_grade',
                headerName: 'Best Mark',
                flex: 1.2,
                editable: false,
                cellRenderer: (params: ICellRendererParams<CourseHistoryRow>) => {
                  if (!params.data) return null;
                  const { best_grade, best_absence, best_outcome, best_attempt_label } = params.data;
                  const text = formatGrade(best_grade, best_absence);
                  if (!text || text === '—') return <span>—</span>;
                  const isPass = best_outcome === 'passed' || (best_grade != null && best_grade <= 4.0);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          backgroundColor: isPass ? `${chart.pass}22` : `${chart.fail}22`,
                          color: isPass ? chart.pass : chart.fail,
                          border: `1px solid ${isPass ? chart.pass : chart.fail}`,
                        }}
                      >
                        {text}
                      </span>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {best_attempt_label}
                      </Typography>
                    </Box>
                  );
                },
              },
              {
                field: 'exam1_grade',
                headerName: 'Exam 1 Grade',
                flex: 1,
                editable: false,
                valueFormatter: (params: ValueFormatterParams<CourseHistoryRow, number | null>) =>
                  formatGrade(params.value, params.data?.exam1_absence),
                cellStyle: { fontWeight: 'bold' },
              },
              {
                field: 'exam2_grade',
                headerName: 'Exam 2 Grade',
                flex: 1,
                editable: false,
                valueFormatter: (params: ValueFormatterParams<CourseHistoryRow, number | null>) =>
                  formatGrade(params.value, params.data?.exam2_absence),
                cellStyle: { fontWeight: 'bold' },
              },
              {
                colId: 'attempts',
                headerName: 'Attempts',
                width: 140,
                editable: false,
                cellRenderer: (params: ICellRendererParams<CourseHistoryRow>) => {
                  if (!params.data) return null;
                  const row = params.data;
                  const count = row.attempt_count || row.marks?.length || 1;
                  if (count > 1) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRevealedStudentHistory(row);
                          }}
                          sx={{
                            py: 0.25,
                            px: 1,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: radii.sm,
                          }}
                        >
                          {count} Attempts ▾
                        </Button>
                      </Box>
                    );
                  }
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        1 Attempt
                      </Typography>
                    </Box>
                  );
                },
              },
              {
                field: 'final_status',
                headerName: 'Final Status',
                flex: 1,
                editable: false,
                cellRenderer: (params: ICellRendererParams<CourseHistoryRow, string>) => (
                  <span
                    style={{
                      color: params.value === 'Passed' ? chart.pass : chart.fail,
                      fontWeight: 'bold',
                    }}
                  >
                    {params.value}
                  </span>
                ),
              },
              {
                colId: 'actions',
                headerName: 'Actions',
                width: 135,
                editable: false,
                sortable: false,
                filter: false,
                cellRenderer: (params: ICellRendererParams<CourseHistoryRow>) => {
                  if (!params.data) return null;
                  const row = params.data;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon sx={{ fontSize: '0.85rem' }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.marks && row.marks.length > 0) {
                            handleQuickEdit(row.marks[row.marks.length - 1]);
                          }
                        }}
                        sx={{
                          py: 0.25,
                          px: 1,
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          borderRadius: radii.sm,
                          fontWeight: 700,
                        }}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (row.marks && row.marks.length > 0) {
                            handleOpenRowMenu(row.marks[row.marks.length - 1], e.currentTarget);
                          }
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                },
              },
            ]}
            defaultColDef={DEFAULT_COL_DEF}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            onRowClicked={(e: RowClickedEvent<CourseHistoryRow>) => {
              if (e.data && e.data.marks.length > 0) onSelectStudent(e.data.marks[0]);
            }}
            rowSelection="single"
          />
        )}
      </Box>

      {/* Row Context Actions Dropdown Menu */}
      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleCloseRowMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { borderRadius: radii.md, minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } }}
      >
        <MenuItem
          onClick={() => {
            handleCloseRowMenu();
            if (selectedMarkForMenu) {
              setEditingMark(selectedMarkForMenu);
            }
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Edit Grade &amp; Sitting" secondary="Modify numeric grade or NE/EX/AT" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseRowMenu();
            if (selectedMarkForMenu) {
              setEditingStudentMark(selectedMarkForMenu);
            }
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Edit Student Profile" secondary="Change name, ID, program, status" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseRowMenu();
            if (selectedMarkForMenu?.student_id) {
              void navigate(ROUTES.studentDetail(selectedMarkForMenu.student_id));
            }
          }}
        >
          <ListItemIcon>
            <SchoolIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Student Transcript" secondary="Inspect all courses &amp; history" />
        </MenuItem>
      </Menu>

      {/* Centered Modal: Edit Grade & Sitting */}
      {editingMark && (
        <EditMarkDialog
          open={Boolean(editingMark)}
          mark={editingMark}
          courseName={courseName}
          availableSemesters={semesterOptions}
          onClose={() => setEditingMark(null)}
          onSave={handleSaveSingleMark}
        />
      )}

      {/* Centered Modal: Student Attempts Breakdown */}
      {revealedStudentHistory && (
        <StudentAttemptsDialog
          open={Boolean(revealedStudentHistory)}
          historyRow={revealedStudentHistory}
          courseName={courseName}
          onClose={() => setRevealedStudentHistory(null)}
          onEditAttempt={(markToEdit) => {
            setRevealedStudentHistory(null);
            setEditingMark(markToEdit);
          }}
        />
      )}

      {/* Centered Modal: Edit Student Profile (Changes everything about student) */}
      {editingStudentMark && (
        <StudentFormDialog
          student={studentForFormDialog}
          onClose={() => setEditingStudentMark(null)}
          onSaved={() => {
            setEditingStudentMark(null);
            void onRefresh();
          }}
        />
      )}
    </Paper>
  );
};
