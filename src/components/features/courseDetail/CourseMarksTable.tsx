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
import type { ICellRendererParams, RowClickedEvent } from 'ag-grid-community';
import type { CourseMark } from '../../../types';
import { useApiMutations } from '../../../hooks/useApi';
import { useThemeStore } from '../../../stores';
import { chart, gradeOutcomeColor, surfaces } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import { formatGrade, outcomeLabel } from '../../../utils/gradeOutcome';
import { perStudentHistory } from '../../../utils/courseMarks';
import type { CourseHistoryRow } from '../../../utils/courseMarks';

const DEFAULT_COL_DEF = { resizable: true, sortable: true, filter: true, editable: false };

interface CourseMarksTableProps {
  /** The rows the filters left visible. */
  marks: CourseMark[];
  /** Label of the filter chosen in the bar above, or null for every semester. */
  activeFilter: string | null;
  /** Plots this student against the cohort in the panels above. */
  onSelectStudent: (mark: CourseMark) => void;
  /** Reloads the course after grades are saved from the individual view. */
  onRefresh: () => Promise<void>;
}

export const CourseMarksTable = ({
  marks,
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
              : 'Click a grade to edit, then save. Student profiles are read-only.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {activeFilter
              ? `Showing ${activeFilter} only -- the figures and charts above follow this selection.`
              : 'Showing every semester. Pick one in the bar above to read a single sitting.'}
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
            columnDefs={[
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
                type: 'numericColumn',
                valueFormatter: (params) => formatGrade(params.value, params.data?.absence_code),
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
            ]}
            defaultColDef={DEFAULT_COL_DEF}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
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
              { field: 'student_id', headerName: 'Student ID', flex: 1 },
              { field: 'student_name', headerName: 'Student Name', flex: 2 },
              { field: 'program', headerName: 'Study Program', flex: 2 },
              {
                field: 'exam1_grade',
                headerName: 'Exam 1 Grade',
                flex: 1,
                valueFormatter: (params) => formatGrade(params.value, params.data?.exam1_absence),
                cellStyle: { fontWeight: 'bold' },
              },
              {
                field: 'exam2_grade',
                headerName: 'Exam 2 Grade',
                flex: 1,
                valueFormatter: (params) => formatGrade(params.value, params.data?.exam2_absence),
                cellStyle: { fontWeight: 'bold' },
              },
              {
                field: 'final_status',
                headerName: 'Final Status',
                flex: 1,
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
