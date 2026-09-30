import { useMemo } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CourseMark } from '../../../types';
import { chart, passRateColor } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import { pageSubtitle } from '../../../styles/mixins';
import {
  alignDistribution,
  countOutcomes,
  gradeDistribution,
  isSameSelection,
  marksOfSelection,
  selectionLabel,
  sharedGrades,
  summariseMarks,
} from '../../../utils/courseMarks';
import type { ExamSelection, GradeBucket, MarksSummary } from '../../../utils/courseMarks';

/** German grades run the other way: 1.0 is the best mark, 5.0 the worst. */
const BETTER_WHEN_LOWER = true;

interface ExamSideProps {
  /** "A" or "B", matching the badge the filter bar put on this side. */
  badge: string;
  label: string;
  marks: readonly CourseMark[];
  summary: MarksSummary;
  /** Padded to the grades of both sittings, so the two axes line up. */
  distribution: readonly GradeBucket[];
  /** Tallest bar across both sittings, so the two y-axes line up too. */
  maxCount: number;
  /** Tints the heading, matching the colour this side's bars are drawn in. */
  color: string;
}

const ExamSide = ({
  badge,
  label,
  marks,
  summary,
  distribution,
  maxCount,
  color,
}: ExamSideProps) => {
  const outcomes = countOutcomes(marks);
  const slices = [
    { name: 'Passed', value: outcomes.passed, fill: chart.pass },
    { name: 'Failed', value: outcomes.failed, fill: chart.fail },
    { name: 'Excused', value: outcomes.excused, fill: chart.excused },
  ].filter((slice) => slice.value > 0);

  return (
    <Box sx={{ flex: 1, minWidth: 320 }}>
      <Chip
        label={`${badge} · ${label}`}
        sx={{ fontWeight: 700, bgcolor: color, color: 'common.white', mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
        <Typography variant="body1" sx={pageSubtitle}>
          Pass Rate:{' '}
          <strong style={{ color: passRateColor(summary.passRate) }}>
            {summary.passRate}%
          </strong>
        </Typography>
        <Typography variant="body1" sx={pageSubtitle}>
          Average Grade: <strong>{summary.avgGrade}</strong>
        </Typography>
        <Typography variant="body1" sx={pageSubtitle}>
          Submissions: <strong>{summary.totalAttempts}</strong>
        </Typography>
      </Box>

      <Typography variant="subtitle2" fontWeight={700} mt={2}>
        Grade distribution
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={[...distribution]}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="grade" />
          {/* Both sides share this domain: bars only compare if the axes do. */}
          <YAxis allowDecimals={false} domain={[0, maxCount]} />
          <RechartsTooltip />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <Typography variant="subtitle2" fontWeight={700} mt={2}>
        Pass ratio
      </Typography>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

interface DeltaProps {
  label: string;
  /** Already rounded by the summary, so the difference needs no rounding. */
  from: number;
  to: number;
  unit?: string;
  /** Whether a fall in this figure is the good direction. */
  lowerIsBetter?: boolean;
}

const Delta = ({ label, from, to, unit = '', lowerIsBetter = false }: DeltaProps) => {
  // Both inputs carry at most two decimals; the subtraction can still land on
  // a float artefact, so it is rounded back to the same precision.
  const change = Math.round((to - from) * 100) / 100;
  const improved = lowerIsBetter ? change < 0 : change > 0;
  const color = change === 0 ? 'text.secondary' : improved ? chart.pass : chart.fail;

  return (
    <Typography variant="body2" sx={pageSubtitle}>
      {label}:{' '}
      <Box component="strong" sx={{ color }}>
        {change > 0 ? '+' : ''}
        {change}
        {unit}
      </Box>
    </Typography>
  );
};

/** What the panel says while it has nothing to draw yet. */
const Hint = ({ children }: { children: string }) => (
  <Paper sx={{ p: 3, mb: 3, borderRadius: radii.xxl }}>
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  </Paper>
);

interface ExamComparisonProps {
  allMarks: readonly CourseMark[];
  left: ExamSelection;
  right: ExamSelection;
}

export const ExamComparison = ({ allMarks, left, right }: ExamComparisonProps) => {
  const leftMarks = useMemo(() => marksOfSelection(allMarks, left), [allMarks, left]);
  const rightMarks = useMemo(() => marksOfSelection(allMarks, right), [allMarks, right]);

  const comparison = useMemo(() => {
    const leftBuckets = gradeDistribution(leftMarks);
    const rightBuckets = gradeDistribution(rightMarks);
    const grades = sharedGrades(leftBuckets, rightBuckets);
    const aligned = {
      left: alignDistribution(leftBuckets, grades),
      right: alignDistribution(rightBuckets, grades),
    };
    return {
      ...aligned,
      maxCount: Math.max(
        1,
        ...aligned.left.map((bucket) => bucket.count),
        ...aligned.right.map((bucket) => bucket.count),
      ),
    };
  }, [leftMarks, rightMarks]);

  const leftSummary = useMemo(() => summariseMarks(leftMarks), [leftMarks]);
  const rightSummary = useMemo(() => summariseMarks(rightMarks), [rightMarks]);

  const leftLabel = selectionLabel(left);
  const rightLabel = selectionLabel(right);

  if (!leftLabel || !rightLabel) {
    return <Hint>Pick a semester for A and for B above to compare them.</Hint>;
  }
  if (isSameSelection(left, right)) {
    // Drawing one sitting against itself produces two identical charts and a
    // row of zero deltas, which reads as a bug rather than as a result.
    return <Hint>A and B are the same sitting. Pick two different ones to compare.</Hint>;
  }

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: radii.xxl }}>
      <Typography variant="h6" fontWeight="700" mb={0.5}>
        {leftLabel} vs {rightLabel}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Grade distribution and pass ratio for each sitting, over a shared scale.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          mb: 3,
          p: 2,
          borderRadius: radii.lg,
          bgcolor: (theme) => theme.app.surface.well,
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          B against A
        </Typography>
        <Delta
          label="Pass rate"
          from={leftSummary.passRate}
          to={rightSummary.passRate}
          unit="%"
        />
        <Delta
          label="Average grade"
          from={leftSummary.avgGrade}
          to={rightSummary.avgGrade}
          lowerIsBetter={BETTER_WHEN_LOWER}
        />
        <Delta
          label="Submission count"
          from={leftSummary.totalAttempts}
          to={rightSummary.totalAttempts}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <ExamSide
          badge="A"
          label={leftLabel}
          marks={leftMarks}
          summary={leftSummary}
          distribution={comparison.left}
          maxCount={comparison.maxCount}
          color={chart.cohort}
        />
        <ExamSide
          badge="B"
          label={rightLabel}
          marks={rightMarks}
          summary={rightSummary}
          distribution={comparison.right}
          maxCount={comparison.maxCount}
          color={chart.highlight}
        />
      </Box>
    </Paper>
  );
};
