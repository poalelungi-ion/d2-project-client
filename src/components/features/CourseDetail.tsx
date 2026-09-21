import { useRef, useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Fade, ToggleButton, ToggleButtonGroup, Alert, AlertTitle } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, RowClickedEvent } from 'ag-grid-community';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { Course, CourseMark, TranscriptEntry } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useApiMutations } from '../../hooks/useApi';
import { chart, gradeOutcomeColor, passRateColor } from '../../styles/colors';
import { radii } from '../../styles/tokens';
import { metaChip, pageSubtitle, pageTitle } from '../../styles/mixins';
import { ExamsHeatmap } from './ExamsHeatmap';
import { formatGrade, outcomeLabel } from '../../utils/gradeOutcome';
import { compareSemesters } from '../../utils/semester';
import { CourseFormDialog } from '../forms/CourseFormDialog';

/** One bar of the course's grade histogram. */
interface GradeBucket {
  grade: string;
  count: number;
}

/** One slice of the pass/fail pie. */
interface PassFailSlice {
  name: string;
  value: number;
  fill: string;
}

/** One point on a student's semester-over-semester average. */
interface SemesterAverage {
  semester: string;
  average: number;
}

interface CourseDetailProps {
  /** Resolved from :courseId by the route before this screen is mounted. */
  course: Course;
  /** Reloads the course list after an in-place edit so this page shows the new details. */
  onRefresh: () => Promise<void>;
}

export const CourseDetail = ({ course, onRefresh }: CourseDetailProps) => {
  const { archiveCourse, loadTranscript } = useApiMutations();
  // Which student out of this roster is plotted against the cohort. Only this
  // screen cares, so it stays here.
  const [analyticsStudent, setAnalyticsStudent] = useState<CourseMark | null>(null);
  const [analyticsStudentTranscript, setAnalyticsStudentTranscript] = useState<
    TranscriptEntry[]
  >([]);
  const [editing, setEditing] = useState(false);

  const [viewMode, setViewMode] = useState<'individual' | 'history'>('history');
  const courseGridRef = useRef<AgGridReact<CourseMark>>(null);
  const historyGridRef = useRef<AgGridReact<any>>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as Record<string, unknown> | null;
  const [importBannerOpen, setImportBannerOpen] = useState<boolean>(() =>
    Boolean(routeState?.importSuccess),
  );
  const importMessage = routeState?.importMessage as string | undefined;

  const clearAnalyticsStudent = () => {
    setAnalyticsStudent(null);
    setAnalyticsStudentTranscript([]);
  };

  const selectAnalyticsStudent = async (mark: CourseMark) => {
    setAnalyticsStudent(mark);
    setAnalyticsStudentTranscript([]);
    if (mark.student_id == null) return;
    setAnalyticsStudentTranscript(await loadTranscript(mark.student_id));
  };

  const getGradeDistributionData = (): GradeBucket[] => {
    if (!course.marks) return [];
    const dist: Record<string, number> = {};
    course.marks.forEach((m) => {
      if (m.grade == null) return;
      const g = m.grade.toString();
      dist[g] = (dist[g] ?? 0) + 1;
    });
    return Object.keys(dist)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map((k) => ({ grade: k, count: dist[k] }));
  };

  const getPassFailData = (): PassFailSlice[] => {
    if (!course.marks) return [];
    let pass = 0;
    let fail = 0;
    let excused = 0;
    course.marks.forEach((m) => {
      if (m.outcome === 'excused') excused++;
      else if (m.passed || m.outcome === 'passed') pass++;
      else fail++;
    });
    return [
      { name: 'Passed', value: pass, fill: chart.pass },
      { name: 'Failed', value: fail, fill: chart.fail },
      { name: 'Excused', value: excused, fill: chart.excused },
    ].filter((slice) => slice.value > 0);
  };

  const getHistoryData = () => {
    if (!course.marks) return [];
    
    const byStudent = new Map<number, CourseMark[]>();
    course.marks.forEach(m => {
      if (m.student_id != null) {
        if (!byStudent.has(m.student_id)) byStudent.set(m.student_id, []);
        byStudent.get(m.student_id)!.push(m);
      }
    });

    const history = [];
    for (const [student_id, marks] of byStudent.entries()) {
      marks.sort((a, b) => compareSemesters(a.semester, b.semester));

      const m1 = marks[0];
      const m2 = marks.length > 1 ? marks[1] : null;

      const passed = marks.some(m => m.passed || m.outcome === 'passed');
      
      history.push({
        student_id,
        student_name: m1.student_name,
        program: m1.program,
        exam1_grade: m1.grade,
        exam1_absence: m1.absence_code,
        exam2_grade: m2 ? m2.grade : null,
        exam2_absence: m2 ? m2.absence_code : null,
        final_status: passed ? 'Passed' : 'Failed',
        marks
      });
    }
    return history;
  };

  const getCourseHeatmapData = () => {
    // 1. Group marks by student to determine their chronological attempt numbers
    const byStudent = new Map<number, CourseMark[]>();
    course.marks.forEach(m => {
      if (m.student_id != null) {
        if (!byStudent.has(m.student_id)) byStudent.set(m.student_id, []);
        byStudent.get(m.student_id)!.push(m);
      }
    });

    // Sort each student's marks chronologically and assign an attempt number
    const processedMarks: (CourseMark & { attempt_number: number })[] = [];
    for (const marks of byStudent.values()) {
      marks.sort((a, b) => compareSemesters(a.semester, b.semester));
      marks.forEach((m, index) => {
        processedMarks.push({ ...m, attempt_number: index + 1 });
      });
    }

    // 2. Group the processed marks by semester
    const bySemester = new Map<string, typeof processedMarks>();
    processedMarks.forEach(m => {
      if (!bySemester.has(m.semester)) bySemester.set(m.semester, []);
      bySemester.get(m.semester)!.push(m);
    });

    const heatmapData = [];
    for (const [semester, marks] of bySemester.entries()) {
      const distribution: Record<number, number> = {};
      marks.forEach(m => {
        distribution[m.attempt_number] = (distribution[m.attempt_number] || 0) + 1;
      });
      
      heatmapData.push({
        semester,
        total_students: marks.length,
        distribution
      });
    }
    
    // Sort semesters for the final output
    heatmapData.sort((a, b) => compareSemesters(a.semester, b.semester));
    return heatmapData;
  };

  const getLongitudinalData = (): SemesterAverage[] => {
    if (!analyticsStudentTranscript.length) return [];
    const semMap: Record<string, { sum: number; count: number }> = {};
    analyticsStudentTranscript.forEach((t) => {
      if (t.grade == null) return;
      if (!semMap[t.semester]) semMap[t.semester] = { sum: 0, count: 0 };
      semMap[t.semester].sum += t.grade;
      semMap[t.semester].count += 1;
    });
    return Object.keys(semMap)
      .sort((a, b) => compareSemesters(a, b))
      .map((sem) => ({
        semester: sem,
        average: parseFloat((semMap[sem].sum / semMap[sem].count).toFixed(2)),
      }));
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {editing && (
          <CourseFormDialog
            course={course}
            onClose={() => setEditing(false)}
            onSaved={(savedCourseId) => {
              void onRefresh().then(() => {
                if (savedCourseId !== String(course.course_id)) {
                  void navigate(ROUTES.courseDetail(savedCourseId), { replace: true });
                }
              });
            }}
          />
        )}
        {importBannerOpen && (
          <Fade in={importBannerOpen}>
            <Alert
              severity="success"
              onClose={() => setImportBannerOpen(false)}
              sx={{ mb: 3, borderRadius: radii.lg }}
            >
              <AlertTitle sx={{ fontWeight: 700 }}>Import Successful</AlertTitle>
              {importMessage || 'Course exam data was imported successfully and all statistics have been updated.'}
            </Alert>
          </Fade>
        )}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={() => {
              clearAnalyticsStudent();
              void navigate(ROUTES.courses);
            }}
            sx={{ color: 'text.secondary', mb: 1 }}
          >
            Return to List
          </Button>
          <Typography variant="h3" sx={pageTitle}>
            {course.course_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={metaChip}>
              ID: {course.course_id}
            </Typography>
            <Typography variant="caption" sx={metaChip}>
              {course.semester}
            </Typography>
            <Typography variant="caption" sx={metaChip}>
              {course.study_program}
            </Typography>
            <Typography variant="caption" sx={metaChip}>
              {course.assigned_professor}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={pageSubtitle}>
              Average Grade: <strong>{course.avg_grade}</strong>
            </Typography>
            <Typography variant="h6" sx={pageSubtitle}>
              Pass Rate:{' '}
              <strong style={{ color: passRateColor(course.pass_rate) }}>
                {course.pass_rate}%
              </strong>
            </Typography>
            <Typography variant="h6" sx={pageSubtitle}>
              Total Submissions: <strong>{course.total_attempts}</strong>
            </Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              sx={{ ml: 'auto' }}
            >
              Edit Course
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CloudUploadIcon />}
              // The id travels with the handoff, so the wizard never has to ask
              // which course the file is for -- and never gets told the wrong one.
              onClick={() =>
                void navigate(ROUTES.upload, {
                  state: { courseId: course.course_id, courseName: course.course_name },
                })
              }
            >
              Upload Exam Data
            </Button>
            {!course.is_archived && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArchiveIcon />}
                onClick={() => {
                  void archiveCourse(course.course_id, true, course.version).then((archived) => {
                    if (archived) void navigate(ROUTES.courses);
                  });
                }}
              >
                Archive Course
              </Button>
            )}
            {course.is_archived && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RestoreIcon />}
                onClick={() => {
                  void archiveCourse(course.course_id, false, course.version).then((restored) => {
                    if (restored) void navigate(ROUTES.courses);
                  });
                }}
                sx={{ ml: 'auto' }}
              >
                Restore Course
              </Button>
            )}
          </Box>
        </Box>

        {/* === ANALYTICS DASHBOARD SECTION === */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 3, flex: 2, minWidth: 400, borderRadius: radii.xxl }}>
            <Typography variant="h6" fontWeight="700" mb={2}>
              Course Grade Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getGradeDistributionData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {getGradeDistributionData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        analyticsStudent &&
                        analyticsStudent.grade != null &&
                        entry.grade === analyticsStudent.grade.toString()
                          ? chart.highlight
                          : chart.cohort
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {analyticsStudent && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                mt={1}
              >
                Highlighting <strong>{analyticsStudent.student_name}&apos;s</strong> grade (
                {analyticsStudent.grade ?? analyticsStudent.absence_code ?? '—'})
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, flex: 1, minWidth: 250, borderRadius: radii.xxl }}>
            <Typography variant="h6" fontWeight="700" mb={2}>
              Results
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getPassFailData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {getPassFailData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          {analyticsStudent && (
            <Paper sx={{ p: 3, flex: 3, minWidth: 400, borderRadius: radii.xxl }}>
              <Typography variant="h6" fontWeight="700" mb={2}>
                {analyticsStudent.student_name}&apos;s Longitudinal Trend
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getLongitudinalData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="semester" />
                  <YAxis
                    domain={[1, 5]}
                    reversed={true}
                    label={{ value: 'Average Grade', angle: -90, position: 'insideLeft' }}
                  />
                  <RechartsTooltip />
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
            </Paper>
          )}
        </Box>

        {/* === COURSE EXAMS HEATMAP === */}
        <Box sx={{ mb: 3 }}>
          <ExamsHeatmap 
            heatmapData={getCourseHeatmapData()} 
            title="Course Attempts Activity" 
            subtitle="Distribution of how many times students took this specific course's exams per semester." 
          />
        </Box>

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
                {viewMode === 'history' ? 'Per-Person History across exam attempts.' : 'Marks per student per semester.'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newValue) => {
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
                onChange={(e) => {
                  if (viewMode === 'individual') {
                    courseGridRef.current?.api.setGridOption('quickFilterText', e.target.value);
                  } else {
                    historyGridRef.current?.api.setGridOption('quickFilterText', e.target.value);
                  }
                }}
                sx={{ width: 250 }}
              />
            </Box>
          </Box>
          <Box className="ag-theme-alpine" sx={{ width: '100%', p: 2 }}>
            {viewMode === 'individual' ? (
              <AgGridReact<CourseMark>
                ref={courseGridRef}
                domLayout="autoHeight"
                rowData={course.marks}
                columnDefs={[
                  { field: 'student_id', headerName: 'Student ID', flex: 1 },
                  { field: 'student_name', headerName: 'Name', flex: 2 },
                  { field: 'program', headerName: 'Study Program', flex: 2 },
                  { field: 'semester', headerName: 'Semester', flex: 1 },
                  {
                    field: 'grade',
                    headerName: 'Grade',
                    flex: 1,
                    valueFormatter: (params) =>
                      formatGrade(params.value, params.data?.absence_code),
                    cellStyle: { fontWeight: 'bold' },
                  },
                  {
                    colId: 'outcome',
                    headerName: 'Result',
                    flex: 1,
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
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                onRowClicked={(e: RowClickedEvent<CourseMark>) => {
                  if (e.data) void selectAnalyticsStudent(e.data);
                }}
                rowSelection="single"
              />
            ) : (
              <AgGridReact<any>
                ref={historyGridRef}
                domLayout="autoHeight"
                rowData={getHistoryData()}
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
                    cellRenderer: (params: ICellRendererParams<any, string>) => (
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
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                animateRows={true}
                pagination={true}
                paginationPageSize={20}
                onRowClicked={(e: RowClickedEvent<any>) => {
                  if (e.data && e.data.marks.length > 0) void selectAnalyticsStudent(e.data.marks[0]);
                }}
                rowSelection="single"
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};
