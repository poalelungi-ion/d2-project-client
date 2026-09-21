import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Box, CssBaseline, Paper, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import { getGlassTheme } from '../../../styles/theme';
import { gradients, layout, radii } from '../../../styles/tokens';
import { useThemeStore } from '../../../stores';

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
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 0.5,
              background: gradients.wordmark,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Study Progress Analysis
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 2 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {subtitle}
          </Typography>

          {children}

          <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
