import { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  ICellRendererParams,
  RowClickedEvent,
  ValueSetterParams,
} from 'ag-grid-community';
import type { CourseMark, ThemeMode } from '../../../types';
import { useApiMutations } from '../../../hooks/useApi';
import { notify, useThemeStore } from '../../../stores';
import { chart, gradeOutcomeColor, surfaces } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import {
  GRADE_CONSTRAINT_MESSAGE,
  formatGrade,
  outcomeLabel,
  parseGradeInput,
} from '../../../utils/gradeOutcome';
import { perStudentHistory } from '../../../utils/courseMarks';
import type { CourseHistoryRow } from '../../../utils/courseMarks';
import { SemesterExamFilter } from './SemesterExamFilter';

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
export const individualMarksColumnDefs = (themeMode: ThemeMode): ColDef<CourseMark>[] => [
  { field: 'result_id', headerName: 'ID', hide: true },
  { field: 'student_id', headerName: 'Student ID', flex: 1, editable: false },
  { field: 'student_name', headerName: 'Name', flex: 2, editable: false },
  { field: 'program', headerName: 'Study Program', flex: 2, editable: false },
  { field: 'semester', headerName: 'Semester', flex: 1, editable: false },
  {
    field: 'grade',
    headerName: 'Grade',
    flex: 1,
    editable: true,
    valueFormatter: (params) => formatGrade(params.value, params.data?.absence_code),
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
];

interface CourseMarksTableProps {
  /** The rows the filters left visible. */
  marks: CourseMark[];
  /**
   * The same filter the bar at the top of the screen holds. The table carries
   * its own copy of the control so a lecturer scrolled down to the grid does
   * not have to go back up to change what it shows.
   */
  semesterOptions: readonly string[];
  examOptions: readonly string[];
  semesterFilter: string;
  examFilter: string;
  onSelectSemester: (value: string) => void;
  onSelectExam: (value: string) => void;
  /** Label of the active filter, or null for every semester. */
  activeFilter: string | null;
  /** Plots this student against the cohort in the panels above. */
  onSelectStudent: (mark: CourseMark) => void;
  /** Reloads the course after grades are saved from the individual view. */
  onRefresh: () => Promise<void>;
}

export const CourseMarksTable = ({
  marks,
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
  const [viewMode, setViewMode] = useState<'individual' | 'history'>('history');
  const courseGridRef = useRef<AgGridReact<CourseMark>>(null);
  const historyGridRef = useRef<AgGridReact<CourseHistoryRow>>(null);

  const historyRows = useMemo(() => perStudentHistory(marks), [marks]);

  const handleSaveMarks = async () => {
    const api = courseGridRef.current?.api;
    if (!api) return;
    api.stopEditing();
    const rows: CourseMark[] = [];
    api.forEachNode((node) => {
      if (node.data) rows.push(node.data);
    });
    const { shouldRefresh } = await saveTranscript(rows);
    if (shouldRefresh) await onRefresh();
  };

  const applyQuickFilter = (text: string) => {
    const ref = viewMode === 'individual' ? courseGridRef : historyGridRef;
    ref.current?.api.setGridOption('quickFilterText', text);
  };

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
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700">
            Detailed Course Marks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {viewMode === 'history'
              ? 'Per-Person History across exam attempts.'
              : 'Click a grade to edit (1.0–5.0 or NE/EX/AT), then save. Other columns stay read-only.'}
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
            sx={{ width: 250 }}
          />
        </Box>
      </Box>
      <Box className="ag-theme-alpine" sx={{ width: '100%', p: 2 }}>
        {viewMode === 'individual' ? (
          <AgGridReact<CourseMark>
            ref={courseGridRef}
            domLayout="autoHeight"
            rowData={marks}
            stopEditingWhenCellsLoseFocus={true}
            columnDefs={individualMarksColumnDefs(themeMode)}
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
            columnDefs={[
              { field: 'student_id', headerName: 'Student ID', flex: 1, editable: false },
              { field: 'student_name', headerName: 'Student Name', flex: 2, editable: false },
              { field: 'program', headerName: 'Study Program', flex: 2, editable: false },
              {
                field: 'exam1_grade',
                headerName: 'Exam 1 Grade',
                flex: 1,
                editable: false,
                valueFormatter: (params) => formatGrade(params.value, params.data?.exam1_absence),
                cellStyle: { fontWeight: 'bold' },
              },
              {
                field: 'exam2_grade',
                headerName: 'Exam 2 Grade',
                flex: 1,
                editable: false,
                valueFormatter: (params) => formatGrade(params.value, params.data?.exam2_absence),
                cellStyle: { fontWeight: 'bold' },
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
    </Paper>
  );
};
