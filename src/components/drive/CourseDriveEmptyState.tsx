import { Box, Button, Paper, Typography } from '@mui/material';
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { radii } from '../../styles/tokens';

interface CourseDriveEmptyStateProps {
  onUploadClick: () => void;
  onLaunchWizard?: () => void;
}

export const CourseDriveEmptyState = ({ onUploadClick, onLaunchWizard }: CourseDriveEmptyStateProps) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 6,
        textAlign: 'center',
        borderRadius: radii.xl,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(59, 130, 246, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: 'primary.main',
        }}
      >
        <FolderSharedOutlinedIcon sx={{ fontSize: 36 }} />
      </Box>

      <Typography variant="h6" fontWeight="700" sx={{ mb: 0.75 }}>
        No files in Course Drive yet
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 420, mb: 3, lineHeight: 1.6 }}
      >
        Upload exam result spreadsheets (.xlsx, .csv) or student rosters to organize, store, and
        automatically parse grades for this course offering.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={onUploadClick}
          sx={{
            borderRadius: radii.md,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Upload your first file
        </Button>

        {onLaunchWizard && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<CloudUploadOutlinedIcon />}
            onClick={onLaunchWizard}
            sx={{
              borderRadius: radii.md,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Launch 5-Step Ingestion Wizard
          </Button>
        )}
      </Box>
    </Paper>
  );
};
