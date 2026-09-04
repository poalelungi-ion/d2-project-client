import { Box, Typography, Button } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';

export const DoneStep = () => {
  const { reset: resetWizard } = useUploadWizard();

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h5" fontWeight="700" sx={{ mb: 1 }}>
        Import Successful
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The grades have been safely stored in the database.
      </Typography>
      <Button variant="outlined" onClick={resetWizard} sx={{ px: 3 }}>
        Import another file
      </Button>
    </Box>
  );
};
