import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Alert, Box, CssBaseline, IconButton, Paper, Snackbar, Tooltip, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
import { getGlassTheme } from '../../../styles/theme';
import { gradients, layout, radii } from '../../../styles/tokens';
import { useThemeStore, useToastStore } from '../../../stores';
import { AuthSettingsDialog } from './AuthSettingsDialog';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Sign-up prompt or sign-in prompt shown under the form. */
  footer: ReactNode;
}

/**
 * The shell the login and registration forms share.
 *
 * It carries its own ThemeProvider: these screens render outside App, which is
 * where the rest of the application picks up the theme, because the navigation
 * drawer has nothing to show to someone who is not signed in yet.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const mode = useThemeStore((s) => s.mode);
  const glassTheme = useMemo(() => getGlassTheme(mode), [mode]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toast = useToastStore((s) => s.toast);
  const dismissToast = useToastStore((s) => s.dismiss);

  return (
    <ThemeProvider theme={glassTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper sx={{ width: '100%', maxWidth: layout.authCardWidth, p: 4, borderRadius: radii.xl }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UniHildesheimLogo size={48} />
              <Box>
                <Typography
                  variant="h6"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.2,
                    background: gradients.wordmark,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Study Progress Analysis
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Universität Hildesheim
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Settings & Connection">
              <IconButton
                aria-label="Settings"
                onClick={() => setSettingsOpen(true)}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: radii.md,
                  p: 0.8,
                }}
              >
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {subtitle}
          </Typography>

          {children}

          <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
        </Paper>
      </Box>

      <AuthSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={dismissToast}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
