import { useState } from 'react';
import { Alert, AlertTitle, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { radii } from '../../../styles/tokens';

const DEFAULT_MESSAGE =
  'Course exam data was imported successfully and all statistics have been updated.';

/**
 * Confirms the upload wizard's handoff. The wizard navigates here with the
 * outcome in route state, so the banner reads it rather than taking props.
 */
export const ImportSuccessBanner = () => {
  const routeState = useLocation().state as Record<string, unknown> | null;
  const [open, setOpen] = useState(Boolean(routeState?.importSuccess));

  if (!open) return null;

  const message = (routeState?.importMessage as string | undefined) || DEFAULT_MESSAGE;

  return (
    <Fade in={open}>
      <Alert
        severity="success"
        onClose={() => setOpen(false)}
        sx={{ mb: 3, borderRadius: radii.lg }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>Import Successful</AlertTitle>
        {message}
      </Alert>
    </Fade>
  );
};
