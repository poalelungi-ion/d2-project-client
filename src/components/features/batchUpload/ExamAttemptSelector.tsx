import { Box, Typography, Chip, Paper } from '@mui/material';
import { SchoolOutlined as SchoolOutlinedIcon } from '@mui/icons-material';
import type { AttemptType } from '../../../types';
import { radii } from '../../../styles/tokens';

interface ExamAttemptSelectorProps {
  attemptType?: AttemptType;
  onChange: (attempt: AttemptType) => void;
}

export const ExamAttemptSelector = ({
  attemptType = 'Exam 1',
  onChange,
}: ExamAttemptSelectorProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: radii.lg,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="subtitle1" fontWeight="700">
            Exam Sitting / Attempt
          </Typography>
        </Box>
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={`Currently: ${attemptType}`}
          sx={{ fontWeight: 600 }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select whether this spreadsheet or pasted table contains marks for the first attempt (Exam 1) or second attempt / retake (Exam 2).
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Chip
          label="Exam 1 (First Attempt / Regular Sitting)"
          color={attemptType === 'Exam 1' ? 'primary' : 'default'}
          variant={attemptType === 'Exam 1' ? 'filled' : 'outlined'}
          onClick={() => onChange('Exam 1')}
          clickable
          sx={{
            fontWeight: attemptType === 'Exam 1' ? 700 : 500,
            py: 2.2,
            px: 1.5,
            fontSize: '0.875rem',
          }}
        />
        <Chip
          label="Exam 2 (Second Attempt / Retake Exam)"
          color={attemptType === 'Exam 2' ? 'warning' : 'default'}
          variant={attemptType === 'Exam 2' ? 'filled' : 'outlined'}
          onClick={() => onChange('Exam 2')}
          clickable
          sx={{
            fontWeight: attemptType === 'Exam 2' ? 700 : 500,
            py: 2.2,
            px: 1.5,
            fontSize: '0.875rem',
          }}
        />
        <Chip
          label="Other Sitting"
          color={attemptType === 'Other' ? 'secondary' : 'default'}
          variant={attemptType === 'Other' ? 'filled' : 'outlined'}
          onClick={() => onChange('Other')}
          clickable
          sx={{
            fontWeight: attemptType === 'Other' ? 700 : 500,
            py: 2.2,
            px: 1.5,
            fontSize: '0.875rem',
          }}
        />
      </Box>
    </Paper>
  );
};
