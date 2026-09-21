import { useMemo, useState } from 'react';
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
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

import { getGlassTheme } from '../styles/theme';
import { gradients, layout, shadows } from '../styles/tokens';
import { navItem } from '../styles/mixins';
import { useAuthStore, useThemeStore, useToastStore } from '../stores';
import { initials } from '../utils/userName';
import { NAV_ITEMS, ROUTES, isNavItemActive } from './navigation';

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const toast = useToastStore((s) => s.toast);
  const dismissToast = useToastStore((s) => s.dismiss);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const glassTheme = useMemo(() => getGlassTheme(mode), [mode]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [accountMenu, setAccountMenu] = useState<HTMLElement | null>(null);

  const handleSignOut = async () => {
    setAccountMenu(null);
    await logout();
    // RequireAuth redirects on its own once the user is cleared; navigating
    // explicitly keeps the login screen from being reached through a back step
    // that still has the protected route in history.
    void navigate(ROUTES.login, { replace: true });
  };

  const avatarInitials = initials(user?.name);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
              >
                Software Systems Engineering
              </Typography>

              {user && (
                <>
                  <Tooltip title={user.email}>
                    <IconButton
                      onClick={(e) => setAccountMenu(e.currentTarget)}
                      size="small"
                      aria-label="Account menu"
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          color: 'common.white',
                          background: gradients.avatar,
                          boxShadow: shadows.avatar,
                        }}
                      >
                        {avatarInitials}
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={accountMenu}
                    open={!!accountMenu}
                    onClose={() => setAccountMenu(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {user.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => void handleSignOut()}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      Sign out
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
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
