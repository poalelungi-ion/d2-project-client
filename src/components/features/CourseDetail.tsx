import { useRef } from 'react';
import { Box, Typography, Button, TextField, Paper, Fade } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ICellRendererParams, RowClickedEvent } from 'ag-grid-community';
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
import type { CourseMark } from '../../types';
import type { AppState } from '../../hooks/useAppLogic';

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

export const CourseDetail = (props: AppState) => {
  const {
    selectedCourse,
    setSelectedCourse,
    setActiveTab,
    analyticsStudent,
    setAnalyticsStudent,
    analyticsStudentTranscript,
    uploadCourseInfo,
    setUploadCourseInfo,
    handleArchiveCourse,
    fetchAnalyticsStudentTranscript,
  } = props;

  const courseGridRef = useRef<AgGridReact<CourseMark>>(null);

  // CoursesAdmin only mounts this once a course is selected.
  if (!selectedCourse) return null;
  const course = selectedCourse;

  const getGradeDistributionData = (): GradeBucket[] => {
    if (!course.marks) return [];
    const dist: Record<string, number> = {};
    course.marks.forEach((m) => {
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
    course.marks.forEach((m) => {
      if (m.passed) pass++;
      else fail++;
    });
    return [
      { name: 'Passed', value: pass, fill: '#2E7D32' },
      { name: 'Failed', value: fail, fill: '#D32F2F' },
    ];
  };

  const getLongitudinalData = (): SemesterAverage[] => {
    if (!analyticsStudentTranscript.length) return [];
    const semMap: Record<string, { sum: number; count: number }> = {};
    analyticsStudentTranscript.forEach((t) => {
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
              setSelectedCourse(null);
              setAnalyticsStudent(null);
            }}
            sx={{ color: '#424242', mb: 1 }}
          >
            Return to List
          </Button>
          <Typography variant="h3" sx={{ fontWeight: '800', letterSpacing: '-1.5px' }}>
            {course.course_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              Average Grade: <strong>{course.avg_grade}</strong>
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              Pass Rate:{' '}
              <strong style={{ color: course.pass_rate > 50 ? '#2E7D32' : '#D32F2F' }}>
                {course.pass_rate}%
              </strong>
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              Total Submissions: <strong>{course.total_attempts}</strong>
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                setUploadCourseInfo({ ...uploadCourseInfo, courseName: course.course_name });
                setActiveTab('Batch Data Upload');
              }}
              sx={{ ml: 'auto', borderRadius: '8px' }}
            >
              Upload Data
            </Button>
            {!course.is_archived && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ArchiveIcon />}
                onClick={() => void handleArchiveCourse(course.course_id, true)}
                sx={{ borderRadius: '8px' }}
              >
                Archive Course
              </Button>
            )}
            {course.is_archived && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RestoreIcon />}
                onClick={() => void handleArchiveCourse(course.course_id, false)}
                sx={{ ml: 'auto', borderRadius: '8px' }}
              >
                Restore Course
              </Button>
            )}
          </Box>
        </Box>

        {/* === ANALYTICS DASHBOARD SECTION === */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 3, flex: 2, minWidth: 400, borderRadius: '24px' }}>
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
                        analyticsStudent && entry.grade === analyticsStudent.grade.toString()
                          ? '#FF8F00'
                          : '#1976d2'
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
                {analyticsStudent.grade})
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, flex: 1, minWidth: 250, borderRadius: '24px' }}>
            <Typography variant="h6" fontWeight="700" mb={2}>
              Pass vs. Fail
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
            <Paper sx={{ p: 3, flex: 3, minWidth: 400, borderRadius: '24px' }}>
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
                    stroke="#FF8F00"
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
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
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
          <div className="ag-theme-alpine" style={{ width: '100%', padding: '16px' }}>
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
                  type: 'numericColumn',
                  cellStyle: { fontWeight: 'bold' },
                },
                {
                  field: 'passed',
                  headerName: 'Passed?',
                  flex: 1,
                  cellRenderer: (params: ICellRendererParams<CourseMark, boolean>) =>
                    params.value ? 'Yes' : 'No',
                },
              ]}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
              onRowClicked={(e: RowClickedEvent<CourseMark>) => {
                if (e.data) void fetchAnalyticsStudentTranscript(e.data);
              }}
              rowSelection="single"
            />
          </div>
        </Paper>
      </Box>
    </Fade>
  );
};
