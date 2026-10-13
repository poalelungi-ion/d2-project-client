import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
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
import type { CourseMark, TranscriptEntry } from '../../../types';
import { chart } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import { attemptsBySemester, countOutcomes, gradeDistribution } from '../../../utils/courseMarks';
import { averageGradeBySemester } from '../../../utils/semester';
import type { SemesterGradeAverage } from '../../../utils/semester';
import { ExamsHeatmap } from '../ExamsHeatmap';

interface CourseAnalyticsProps {
  /** The visible marks: these panels follow the semester and exam filters. */
  marks: readonly CourseMark[];
  /**
   * Every sitting ever recorded. The two panels that compare offerings against
   * each other read this instead, since one semester makes no comparison.
   */
  allMarks: readonly CourseMark[];
  /** The student picked out of the roster, plotted against the cohort. */
  student: CourseMark | null;
  studentTranscript: readonly TranscriptEntry[];
}

export const CourseAnalytics = ({
  marks,
  allMarks,
  student,
  studentTranscript,
}: CourseAnalyticsProps) => {
  const distribution = useMemo(() => gradeDistribution(marks), [marks]);
  const outcomes = useMemo(() => countOutcomes(marks), [marks]);
  const semesterAverages = useMemo(() => averageGradeBySemester(allMarks), [allMarks]);
  const heatmapData = useMemo(() => attemptsBySemester(allMarks), [allMarks]);
  const longitudinal = useMemo(
    () => averageGradeBySemester(studentTranscript),
    [studentTranscript],
  );

  // No submissions, nothing to chart; the header already says so.
  if (allMarks.length === 0) return null;

  const outcomeSlices = [
    { name: 'Passed', value: outcomes.passed, fill: chart.pass },
    { name: 'Failed', value: outcomes.failed, fill: chart.fail },
    { name: 'Excused', value: outcomes.excused, fill: chart.excused },
  ].filter((slice) => slice.value > 0);

  const studentGrade = student?.grade?.toString() ?? null;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 2, minWidth: 400, borderRadius: radii.xxl }}>
          <Typography variant="h6" fontWeight="700" mb={2}>
            Course Grade Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="grade" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell
                    key={`grade-${entry.grade}`}
                    fill={entry.grade === studentGrade ? chart.highlight : chart.cohort}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {student && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
              mt={1}
            >
              Highlighting <strong>{student.student_name}&apos;s</strong> grade (
              {student.grade ?? student.absence_code ?? '—'})
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
                data={outcomeSlices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {outcomeSlices.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: student ? { xs: '1fr', lg: '1fr 1fr' } : '1fr',
          gap: 3,
          mb: 3,
        }}
      >
        {student && (
          <Paper
            sx={{
              p: 3,
              borderRadius: radii.xxl,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="700" mb={0.5}>
                {student.student_name}&apos;s Longitudinal Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Performance trajectory across all enrolled semesters.
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={longitudinal}>
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
            </Box>
          </Paper>
        )}

        <Paper
          sx={{
            p: 3,
            borderRadius: radii.xxl,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="700" mb={0.5}>
              Average grade by semester
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Mean of numeric grades for this course in each offering. Excused sittings (AT) are
              omitted.
            </Typography>
            {semesterAverages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No graded sittings yet.
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
                        const sittingLabel = sittings === 1 ? '1 sitting' : `${sittings} sittings`;
                        return [`${value} (${sittingLabel})`, 'Average'];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke={chart.cohort}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                  {semesterAverages.map((row) => (
                    <Typography key={row.semester} variant="body2" color="text.secondary">
                      {row.semester}: <strong>{row.average}</strong>
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ExamsHeatmap
          heatmapData={heatmapData}
          title="Course Attempts Activity"
          subtitle="Distribution of how many times students took this specific course's exams per semester."
        />
      </Box>
    </>
  );
};
