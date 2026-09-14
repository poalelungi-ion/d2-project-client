import { useRef, useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Fade } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, RowClickedEvent } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
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
import { pageSubtitle, pageTitle } from '../../styles/mixins';
import { formatGrade, outcomeLabel } from '../../utils/gradeOutcome';

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
}

export const CourseDetail = ({ course }: CourseDetailProps) => {
  const { archiveCourse, loadTranscript } = useApiMutations();
  // Which student out of this roster is plotted against the cohort. Only this
  // screen cares, so it stays here.
  const [analyticsStudent, setAnalyticsStudent] = useState<CourseMark | null>(null);
  const [analyticsStudentTranscript, setAnalyticsStudentTranscript] = useState<
    TranscriptEntry[]
  >([]);

  const courseGridRef = useRef<AgGridReact<CourseMark>>(null);
  const navigate = useNavigate();

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
      .sort()
      .map((sem) => ({
        semester: sem,
        average: parseFloat((semMap[sem].sum / semMap[sem].count).toFixed(2)),
      }));
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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
              sx={{ ml: 'auto' }}
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
                Marks per student per semester.
              </Typography>
            </Box>
            <TextField
              label="Quick Search (Semester, Person...)"
              size="small"
              onChange={(e) =>
                courseGridRef.current?.api.setGridOption('quickFilterText', e.target.value)
              }
              sx={{ width: 300 }}
            />
          </Box>
          <Box className="ag-theme-alpine" sx={{ width: '100%', p: 2 }}>
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
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};
