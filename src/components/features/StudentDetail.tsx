import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Chip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import type { RowClickedEvent } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import type { StudentDetails, TranscriptEntry } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useApiMutations } from '../../hooks/useApi';
import { radii } from '../../styles/tokens';
import { pageTitle } from '../../styles/mixins';
import { chart } from '../../styles/colors';
import { averageGradeBySemester, type SemesterGradeAverage } from '../../utils/semester';
import { groupTranscriptByCourse } from '../../utils/studentTranscript';
import { transcriptColumns, studentCourseHistoryColumns } from './columns';
import {
  StudentCourseAttemptsDialog,
  type StudentCourseHistoryRow,
} from './StudentCourseAttemptsDialog';
import { StudyProgramSelect } from '../forms/StudyProgramSelect';
import { StudentFormDialog } from '../forms/StudentFormDialog';
import { UNASSIGNED_PROGRAM } from '../../utils/studyProgram';

interface StudentDetailProps {
  /** Fetched by the route from :studentId, transcript included. */
  student: StudentDetails;
  /** Reloads that fetch after this screen changes something. */
  onRefresh: () => void;
}

export const StudentDetail = ({ student, onRefresh }: StudentDetailProps) => {
  const { updateProgram } = useApiMutations();
  const [program, setProgram] = useState(student.program);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transcriptViewMode, setTranscriptViewMode] = useState<'compact' | 'individual'>('compact');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseHistory, setSelectedCourseHistory] = useState<StudentCourseHistoryRow | null>(null);

  const navigate = useNavigate();

  // 1. Calculate longitudinal average grade evolution by semester
  const semesterAverages = useMemo(
    () => averageGradeBySemester(student.transcript),
    [student.transcript],
  );

  // 2. Calculate grouped per-course history
  const courseHistoryRows = useMemo(
    () => groupTranscriptByCourse(student.transcript),
    [student.transcript],
  );

  // 3. Filter rows by search query
  const filteredCourseRows = useMemo(() => {
    if (!searchQuery.trim()) return courseHistoryRows;
    const q = searchQuery.toLowerCase();
    return courseHistoryRows.filter(
      (r) => r.course.toLowerCase().includes(q) || r.semesters.toLowerCase().includes(q),
    );
  }, [courseHistoryRows, searchQuery]);

  const filteredIndividualRows = useMemo(() => {
    if (!searchQuery.trim()) return student.transcript;
    const q = searchQuery.toLowerCase();
    return student.transcript.filter(
      (t) =>
        t.course.toLowerCase().includes(q) ||
        t.semester.toLowerCase().includes(q) ||
        (t.attempt_type && t.attempt_type.toLowerCase().includes(q)),
    );
  }, [student.transcript, searchQuery]);

  // 4. Academic performance statistics
  const overallStats = useMemo(() => {
    const passedSittings = student.transcript.filter((t) => t.passed && t.grade != null);
    const gpa =
      passedSittings.length > 0
        ? Math.round(
            (passedSittings.reduce((acc, curr) => acc + (curr.grade ?? 0), 0) /
              passedSittings.length) *
              100,
          ) / 100
        : null;
    const totalExams = student.transcript.length;
    const passedCourses = courseHistoryRows.filter((r) => r.final_status === 'Passed').length;
    const retakesCount = student.transcript.filter((t) => t.attempt > 1 || t.attempt_type === 'Exam 2').length;

    return { gpa, totalExams, passedCourses, totalCourses: courseHistoryRows.length, retakesCount };
  }, [student.transcript, courseHistoryRows]);

  const handleOpenAttempts = (row: StudentCourseHistoryRow) => {
    setSelectedCourseHistory(row);
  };

  const compactColumnDefs = useMemo(
    () => studentCourseHistoryColumns(handleOpenAttempts),
    [],
  );

  const individualColumnDefs = useMemo(() => transcriptColumns(), []);

  const updateStudentProgram = async () => {
    if (await updateProgram(student.student_id, program, student.version)) onRefresh();
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, width: '100%', pb: 6 }}>
        {/* Header Profile Section */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={() => void navigate(ROUTES.students)}
            sx={{ color: 'text.secondary', mb: 1 }}
          >
            Return to List
          </Button>
          <Typography variant="h3" sx={pageTitle}>
            {student.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              ID: {student.student_id}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <StudyProgramSelect
              size="small"
              label="Learning Program"
              value={program}
              onChange={setProgram}
              sx={{ width: 250 }}
              error={program === 'Unknown' || program === UNASSIGNED_PROGRAM}
              helperText={
                program === 'Unknown' || program === UNASSIGNED_PROGRAM
                  ? 'Action required: Update program'
                  : ''
              }
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => void updateStudentProgram()}
            >
              Save Profile
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Edit Full Record
            </Button>
          </Box>
        </Box>

        {/* Section 1: Academic Trajectory & Semester Averages Chart (As seen in Course Analytics) */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: radii.xxl,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" fontWeight="700">
                  {student.name}&apos;s Academic Performance Trajectory
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Mean grade across each active semester. Excused absence sittings (AT) are excluded from numeric averages.
              </Typography>
            </Box>

            {/* Quick KPI Badges */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Overall GPA: ${overallStats.gpa ?? 'N/A'}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Passed: ${overallStats.passedCourses}/${overallStats.totalCourses} Subjects`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Total Sittings: ${overallStats.totalExams} (${overallStats.retakesCount} Retakes)`}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </Box>

          {semesterAverages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No graded examination sittings recorded yet for this student.
            </Typography>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={semesterAverages}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="semester" />
                  <YAxis
                    domain={[1, 5]}
                    reversed={true}
                    label={{ value: 'Average Grade', angle: -90, position: 'insideLeft' }}
                  />
                  <RechartsTooltip
                    formatter={(
                      value: number,
                      _name: string,
                      item: { payload?: SemesterGradeAverage },
                    ) => {
                      const sittings = item.payload?.sittings ?? 0;
                      const label = sittings === 1 ? '1 sitting' : `${sittings} sittings`;
                      return [`${value} (${label})`, 'Average Grade'];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke={chart.highlight}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <Box sx={{ display: 'flex', gap: 2.5, mt: 2, flexWrap: 'wrap' }}>
                {semesterAverages.map((row) => (
                  <Typography key={row.semester} variant="body2" color="text.secondary">
                    {row.semester}: <strong>{row.average}</strong> ({row.sittings} {row.sittings === 1 ? 'exam' : 'exams'})
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </Paper>

        {/* Section 2: Personal Transcript (Compact / Per-Course vs All Individual Attempts) */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: radii.xxl,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            mb: 4,
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
                Personal Transcript
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {transcriptViewMode === 'compact'
                  ? 'Per-Course History grouped by subject. Displays best mark, Exam 1 vs Exam 2 retakes, and attempts.'
                  : 'All individual examination sittings and attempts registered for this student.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search course or mark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ width: 230 }}
              />

              <ToggleButtonGroup
                value={transcriptViewMode}
                exclusive
                onChange={(_, next: 'compact' | 'individual' | null) => {
                  if (next) setTranscriptViewMode(next);
                }}
                size="small"
              >
                <ToggleButton value="compact">Per-Course (Compact)</ToggleButton>
                <ToggleButton value="individual">All Sittings</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box className="ag-theme-alpine" sx={{ width: '100%', p: 2 }}>
            {transcriptViewMode === 'compact' ? (
              <AgGridReact<StudentCourseHistoryRow>
                domLayout="autoHeight"
                rowData={filteredCourseRows}
                columnDefs={compactColumnDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true, editable: false }}
                animateRows={true}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 20, 50]}
                onRowClicked={(e: RowClickedEvent<StudentCourseHistoryRow>) => {
                  if (e.data) handleOpenAttempts(e.data);
                }}
              />
            ) : (
              <AgGridReact<TranscriptEntry>
                domLayout="autoHeight"
                rowData={filteredIndividualRows}
                columnDefs={individualColumnDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true, editable: false }}
                animateRows={true}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 20, 50]}
              />
            )}
          </Box>
        </Paper>

        {/* Dialog: View Exam Attempts Breakdown for a Course */}
        {selectedCourseHistory && (
          <StudentCourseAttemptsDialog
            open={Boolean(selectedCourseHistory)}
            courseRow={selectedCourseHistory}
            student={student}
            onClose={() => setSelectedCourseHistory(null)}
          />
        )}

        {/* Dialog: Edit Student Metadata */}
        {editDialogOpen && (
          <StudentFormDialog
            student={student}
            onClose={() => setEditDialogOpen(false)}
            onSaved={() => {
              setEditDialogOpen(false);
              onRefresh();
            }}
          />
        )}
      </Box>
    </Fade>
  );
};
