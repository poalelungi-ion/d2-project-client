import { Box, Typography, Button } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../app/navigation';

interface NotFoundProps {
  title?: string;
  backTo?: string;
  backLabel?: string;
}

export const NotFound = ({
  title = 'Page not found',
  backTo = ROUTES.courses,
  backLabel = 'Back to Courses',
}: NotFoundProps) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: '800', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        The address you followed does not match anything in this application.
      </Typography>
      <Button
        variant="contained"
        startIcon={<ChevronLeftIcon />}
        onClick={() => void navigate(backTo)}
      >
        {backLabel}
      </Button>
    </Box>
  );
};
