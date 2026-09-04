import { Box, Typography, Button, Fade } from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { semantic } from '../../styles/colors';
import { radii } from '../../styles/tokens';
import { toneSurface } from '../../styles/mixins';

interface SystemLogEntry {
  id: number;
  message: string;
  action: string;
}

export const SystemLogs = () => {
  const logs: SystemLogEntry[] = [
    { id: 1, message: 'Failed to connect to database in module data_sync.', action: 'Review' },
    {
      id: 2,
      message: 'Data format mismatch during import of Klausur_DBS_WS2425.',
      action: 'Review',
    },
    { id: 3, message: 'Authentication failure on route /api/grades.', action: 'Review' },
    {
      id: 4,
      message: 'Validation error: invalid grade value in results_export.',
      action: 'Review',
    },
    { id: 5, message: 'Timeout while fetching student roster.', action: 'Review' },
  ];

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ p: 4, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WarningAmberIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
            System Logs
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
          Critical system errors and warnings requiring review.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {logs.map((log) => (
            <Box
              key={log.id}
              sx={{
                ...toneSurface(semantic.error),
                borderRadius: radii.xxl,
                p: 2,
                px: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                  Error Code #{log.id}00
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {log.message}
                </Typography>
              </Box>
              <Button variant="outlined" color="error" sx={{ minWidth: 100 }}>
                {log.action}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Fade>
  );
};
