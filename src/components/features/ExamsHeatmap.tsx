import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme } from '@mui/material';

export const ExamsHeatmap = ({ heatmapData, title = "Exams Completed", subtitle = "Total number of exams taken by each student per semester." }: { heatmapData: any[], title?: string, subtitle?: string }) => {
  const theme = useTheme();

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

  // Ensure we at least show 0-15, or up to maxExams
  const cols = Math.max(15, maxExams);
  const examColumns = Array.from({ length: cols + 1 }, (_, i) => i);

  // Helper to get color scale (light green to dark green based on value)
  const getCellColor = (value: number) => {
    if (!value || value === 0) return 'transparent';
    if (value <= 2) return '#c8e6c9'; // light green
    if (value <= 5) return '#81c784'; // medium green
    if (value <= 10) return '#4caf50';
    return '#388e3c'; // dark green
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {subtitle}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Semester</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>#Students</TableCell>
              {examColumns.map(col => (
                <TableCell key={col} align="center" sx={{ fontWeight: 'bold', minWidth: 40 }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {heatmapData.map((row) => (
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
                        bgcolor: getCellColor(val),
                        color: val > 5 ? 'white' : 'inherit',
                        border: '1px solid',
                        borderColor: theme.palette.divider,
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
