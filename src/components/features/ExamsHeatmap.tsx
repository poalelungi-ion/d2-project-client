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
  useTheme,
} from '@mui/material';
import { compareSemesters } from '../../utils/semester';

export interface HeatmapRow {
  semester: string;
  total_students: number;
  distribution: Record<string | number, number>;
}

export const ExamsHeatmap = ({ 
  heatmapData, 
  title = "Exams Completed", 
  subtitle = "Total number of exams taken by each student per semester.",
  minColumns = 0
}: { 
  heatmapData: HeatmapRow[], 
  title?: string, 
  subtitle?: string,
  minColumns?: number
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

  if (!heatmapData || heatmapData.length === 0) return null;

  // Find the maximum number of exams taken to dynamically set columns
  let maxExams = 0;
  heatmapData.forEach(row => {
    Object.keys(row.distribution).forEach(key => {
      const num = parseInt(key, 10);
      if (!isNaN(num) && num > maxExams) {
        maxExams = num;
      }
    });
  });

  // Ensure we show at least up to maxExams, but don't force a huge number if not needed
  const cols = Math.max(minColumns, maxExams);
  const examColumns = Array.from({ length: cols + 1 }, (_, i) => i);

  const isDark = theme.palette.mode === 'dark';

  // Theme-adaptive, high-contrast heat map styling
  const getCellStyle = (value: number) => {
    if (!value || value === 0) {
      return {
        bgcolor: 'transparent',
        color: 'text.secondary',
        fontWeight: 400,
      };
    }

    if (isDark) {
      // Dark mode: Avoid jarring whitish pastels; use saturated emerald / forest tints
      // with high-contrast text (> 7:1) for optimal readability on dark backgrounds
      if (value <= 2) {
        return {
          bgcolor: 'rgba(34, 197, 94, 0.22)', // Rich translucent emerald tint, NOT whitish
          color: '#86efac',                    // Crisp luminous mint text
          fontWeight: 700,
        };
      }
      if (value <= 5) {
        return {
          bgcolor: 'rgba(34, 197, 94, 0.40)', // Medium emerald
          color: '#bbf7d0',                    // Light mint text
          fontWeight: 700,
        };
      }
      if (value <= 10) {
        return {
          bgcolor: '#15803d',                  // Solid forest green
          color: '#ffffff',                    // Crisp white text
          fontWeight: 700,
        };
      }
      return {
        bgcolor: '#16a34a',                    // Vibrant solid green
        color: '#ffffff',                      // Crisp white text
        fontWeight: 800,
      };
    } else {
      // Light mode: Fresh green hues with dark green text on lighter cells for high contrast
      if (value <= 2) {
        return {
          bgcolor: '#dcfce7',                  // Soft light green
          color: '#14532d',                    // Deep dark green text (contrast > 10:1)
          fontWeight: 700,
        };
      }
      if (value <= 5) {
        return {
          bgcolor: '#86efac',                  // Medium light green
          color: '#14532d',                    // Deep dark green text
          fontWeight: 700,
        };
      }
      if (value <= 10) {
        return {
          bgcolor: '#22c55e',                  // Solid green
          color: '#ffffff',                    // Crisp white text
          fontWeight: 700,
        };
      }
      return {
        bgcolor: '#15803d',                  // Dark forest green
        color: '#ffffff',                    // Crisp white text
        fontWeight: 800,
      };
    }
  };

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
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={true}
                  direction={order}
                  onClick={handleSortToggle}
                >
                  Semester
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>#Students</TableCell>
              {examColumns.map(col => (
                <TableCell key={col} align="center" sx={{ fontWeight: 'bold', minWidth: 40 }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.semester}>
                <TableCell component="th" scope="row">
                  {row.semester}
                </TableCell>
                <TableCell align="center">{row.total_students}</TableCell>
                {examColumns.map(col => {
                  const val = row.distribution[col] || 0;
                  return (
                    <TableCell 
                      key={col} 
                      align="center" 
                      sx={{ 
                        ...getCellStyle(val),
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        py: 0.75,
                        px: 1,
                        fontSize: '0.85rem',
                      }}
                    >
                      {val > 0 ? val : ''}
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
