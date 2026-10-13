import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Tooltip,
  Chip,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchoolIcon from '@mui/icons-material/School';
import { compareSemesters } from '../../utils/semester';
import { getHeatmapCellStyle, getOrdinal } from '../../utils/heatmap';

export interface HeatmapRow {
  semester: string;
  total_students: number;
  distribution: Record<string | number, number>;
}

interface HeatmapLegendProps {
  maxExams: number;
  isDark: boolean;
  isCourseSpecific?: boolean;
}

const HeatmapLegend = ({ maxExams, isDark, isCourseSpecific }: HeatmapLegendProps) => {
  const exampleCol = maxExams >= 15 ? 15 : maxExams;
  const ordinalExample = getOrdinal(exampleCol);

  return (
    <Box
      sx={{
        p: 1.75,
        mb: 2,
        borderRadius: 2,
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        {/* Item 1: What is the Column Number (e.g. 15) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, maxWidth: 460 }}>
          <Box
            sx={{
              minWidth: 26,
              height: 26,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            {exampleCol}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Numbered Columns (1 ... {maxExams}) = Exam Attempt Sequence
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
              {isCourseSpecific
                ? `Shows students sitting their 1st, 2nd (retake), or ${ordinalExample} attempt for this course.`
                : `Chronological exam sitting in study timeline. Column ${exampleCol} tracks students sitting their ${ordinalExample} exam overall.`}
            </Typography>
          </Box>
        </Box>

        {/* Item 2: What is the Cell Value */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, maxWidth: 380 }}>
          <Box
            sx={{
              px: 1,
              py: 0.35,
              borderRadius: 1,
              bgcolor: isDark ? 'rgba(34, 197, 94, 0.25)' : '#dcfce7',
              color: isDark ? '#86efac' : '#14532d',
              fontWeight: 800,
              fontSize: '0.78rem',
              border: '1px solid',
              borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : '#86efac',
            }}
          >
            Cell Number
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Cell Values = Student Cohort Count
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
              Number of students in that semester who were sitting that specific attempt number.
            </Typography>
          </Box>
        </Box>

        {/* Item 3: Color Density scale */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.72rem' }}>
            Cohort Density:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Chip size="small" label="1-2" sx={{ height: 20, fontSize: '0.7rem', ...getHeatmapCellStyle(1, isDark) }} />
            <Chip size="small" label="3-5" sx={{ height: 20, fontSize: '0.7rem', ...getHeatmapCellStyle(4, isDark) }} />
            <Chip size="small" label="6-10" sx={{ height: 20, fontSize: '0.7rem', ...getHeatmapCellStyle(8, isDark) }} />
            <Chip size="small" label="11+" sx={{ height: 20, fontSize: '0.7rem', ...getHeatmapCellStyle(15, isDark) }} />
          </Box>
        </Box>
      </Box>

      {/* Helpful Highlight Banner: Specifically Explaining 15 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          py: 0.75,
          borderRadius: 1,
          bgcolor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(2, 136, 209, 0.08)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(2, 136, 209, 0.2)',
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 18, color: 'info.main', flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.75rem', lineHeight: 1.3 }}>
          <strong>Understanding Column {exampleCol}:</strong> Column {exampleCol} tracks students sitting their <strong>{ordinalExample} exam</strong>. For example, a cell value of <strong>1</strong> in SoSe 2026 under column {exampleCol} indicates exactly <strong>1 student sat their {ordinalExample} exam</strong> during that semester.
        </Typography>
      </Box>
    </Box>
  );
};

export const ExamsHeatmap = ({ 
  heatmapData, 
  title = "Exams Completed", 
  subtitle = "Total number of exams taken by each student per semester.",
  minColumns = 0,
  isCourseSpecific = false,
}: { 
  heatmapData: HeatmapRow[]; 
  title?: string; 
  subtitle?: string;
  minColumns?: number;
  isCourseSpecific?: boolean;
}) => {
  const theme = useTheme();
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleSortToggle = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedData = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return [];
    return [...heatmapData].sort((a, b) => {
      const cmp = compareSemesters(a.semester, b.semester);
      return order === 'asc' ? cmp : -cmp;
    });
  }, [heatmapData, order]);

  // Find the maximum number of exams taken to dynamically set columns
  const maxExams = useMemo(() => {
    let max = 0;
    heatmapData?.forEach((row) => {
      Object.keys(row.distribution).forEach((key) => {
        const num = parseInt(key, 10);
        if (!isNaN(num) && num > max) {
          max = num;
        }
      });
    });
    return max;
  }, [heatmapData]);

  const hasZero = useMemo(() => {
    return (heatmapData ?? []).some(
      (row) => (row.distribution[0] ?? 0) > 0 || (row.distribution['0'] ?? 0) > 0,
    );
  }, [heatmapData]);

  if (!heatmapData || heatmapData.length === 0) return null;

  const startCol = hasZero ? 0 : 1;
  const cols = Math.max(minColumns, maxExams);
  const examColumns = Array.from({ length: cols - startCol + 1 }, (_, i) => i + startCol);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ mt: title ? 4 : 0 }}>
      {title && (
        <Typography variant="h5" sx={{ fontWeight: 700, mb: subtitle ? 1 : 2 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}

      {/* Clear Legend and Column 15 Explanation */}
      <HeatmapLegend
        maxExams={cols}
        isDark={isDark}
        isCourseSpecific={isCourseSpecific}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            {/* Top Multi-Tier Header Row */}
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              <TableCell
                rowSpan={2}
                sx={{
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  borderRight: '1px solid',
                  borderColor: theme.palette.divider,
                }}
              >
                <TableSortLabel
                  active={true}
                  direction={order}
                  onClick={handleSortToggle}
                >
                  Semester
                </TableSortLabel>
              </TableCell>
              <TableCell
                rowSpan={2}
                align="center"
                sx={{
                  fontWeight: 'bold',
                  verticalAlign: 'middle',
                  borderRight: '1px solid',
                  borderColor: theme.palette.divider,
                  minWidth: 95,
                }}
              >
                <Tooltip title="Total distinct students taking exams in this semester" arrow>
                  <Box component="span" sx={{ cursor: 'help' }}>
                    # Students
                  </Box>
                </Tooltip>
              </TableCell>
              <TableCell
                colSpan={examColumns.length}
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderColor: theme.palette.divider,
                  py: 0.75,
                }}
              >
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, justifyContent: 'center' }}>
                  <SchoolIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  <span>
                    {isCourseSpecific
                      ? 'Course Exam Attempts (1st Sitting, 2nd Retake...)'
                      : `Chronological Exam Sitting in Degree Career (1st ... ${getOrdinal(cols)} Exam)`}
                  </span>
                  <Tooltip
                    title={
                      isCourseSpecific
                        ? 'Columns track how many times a student has attempted this specific course (1st sitting, 2nd retake, etc.).'
                        : `Each numbered column indicates which sequential exam sitting in their academic journey the student is taking. For example, column ${cols} tracks students sitting their ${getOrdinal(cols)} exam overall.`
                    }
                    arrow
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary', cursor: 'pointer' }} />
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>

            {/* Sub-Header Row: Individual Column Numbers (1 to 15) */}
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              {examColumns.map((col) => (
                <TableCell
                  key={col}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    minWidth: 42,
                    py: 0.5,
                    borderBottom: '2px solid',
                    borderColor: theme.palette.divider,
                  }}
                >
                  <Tooltip
                    title={
                      col === 0
                        ? '0 exams prior'
                        : isCourseSpecific
                          ? `Attempt #${col}: ${getOrdinal(col)} sitting for this course`
                          : `Exam #${col}: ${getOrdinal(col)} exam sitting in academic career`
                    }
                    arrow
                    placement="top"
                  >
                    <Box
                      component="span"
                      sx={{
                        cursor: 'help',
                        display: 'inline-block',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      {col}
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.semester} hover>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: 600,
                    borderRight: '1px solid',
                    borderColor: theme.palette.divider,
                  }}
                >
                  {row.semester}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    borderRight: '1px solid',
                    borderColor: theme.palette.divider,
                  }}
                >
                  {row.total_students}
                </TableCell>
                {examColumns.map((col) => {
                  const val = row.distribution[col] || 0;
                  const tooltipText = val > 0
                    ? `${row.semester} · ${getOrdinal(col)} Exam: ${val} student${val === 1 ? '' : 's'} took their ${getOrdinal(col)} exam sitting in this semester.`
                    : `${row.semester} · ${getOrdinal(col)} Exam: 0 students.`;
                  return (
                    <TableCell 
                      key={col} 
                      align="center" 
                      sx={{ 
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        py: 0.5,
                        px: 0.5,
                        verticalAlign: 'middle',
                      }}
                    >
                      {val > 0 ? (
                        <Tooltip title={tooltipText} arrow placement="top" disableInteractive>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 32,
                              height: 24,
                              px: 1,
                              borderRadius: '9999px',
                              fontSize: '0.78rem',
                              cursor: 'default',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              ...getHeatmapCellStyle(val, isDark),
                            }}
                          >
                            {val}
                          </Box>
                        </Tooltip>
                      ) : (
                        ''
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
