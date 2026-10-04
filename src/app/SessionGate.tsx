import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from './navigation';
import { useAuthStore } from '../stores';

const FullPageSpinner = () => (
  <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

/**
 * Root layout route. Trades the httpOnly refresh cookie for a session once on
 * load, before any screen renders.
 *
 * The access token lives only in memory, so after a reload the app has no
 * credential until this completes. Rendering children first would send a wave
 * of requests that all 401, and would flash the login screen at someone who is
 * in fact signed in.
 */
export function SessionGate() {
  const initializing = useAuthStore((s) => s.initializing);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (initializing) return <FullPageSpinner />;
  return <Outlet />;
}

/**
 * Guards everything that reads course or student data. The backend refuses
 * those requests without a token regardless; this only spares the user a
 * screenful of failed panels on the way to being told to sign in.
 */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    // Remember the destination so signing in lands where the user was headed
    // rather than dumping everyone on the courses page.
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Keeps a signed-in user off the login and registration screens. */
export function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to={ROUTES.courses} replace />;
  return <Outlet />;
}
