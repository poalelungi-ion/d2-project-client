import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  CssBaseline,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';

import { getGlassTheme } from '../styles/theme';
import { gradients, layout } from '../styles/tokens';
import { navItem } from '../styles/mixins';
import { useThemeStore, useToastStore } from '../stores';
import { NAV_ITEMS, isNavItemActive } from './navigation';

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const toast = useToastStore((s) => s.toast);
  const dismissToast = useToastStore((s) => s.dismiss);
  const glassTheme = useMemo(() => getGlassTheme(mode), [mode]);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <ThemeProvider theme={glassTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 800,
                background: gradients.wordmark,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Study Progress Analysis
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Software Systems Engineering
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer variant="permanent">
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
            <List>
              {NAV_ITEMS.map((item) => {
                const active = isNavItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      selected={active}
                      onClick={() => void navigate(item.path)}
                      sx={navItem(active)}
                    >
                      <ListItemIcon>
                        <Icon />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: layout.contentPadding,
            pt: layout.contentTop,
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={dismissToast}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
