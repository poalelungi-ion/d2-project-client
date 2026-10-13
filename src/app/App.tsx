import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  Drawer,
  CssBaseline,
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
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { getGlassTheme } from '../styles/theme';
import { gradients, shadows, radii } from '../styles/tokens';
import { navItem } from '../styles/mixins';
import { useAuthStore, useThemeStore, useToastStore } from '../stores';
import { initials } from '../utils/userName';
import { NAV_ITEMS, ROUTES, isNavItemActive } from './navigation';
import { SettingsDialog } from '../components/features/settings/SettingsDialog';
import { UniHildesheimLogo } from '../components/common/UniHildesheimLogo';

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const toast = useToastStore((s) => s.toast);
  const dismissToast = useToastStore((s) => s.dismiss);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const glassTheme = useMemo(() => getGlassTheme(mode), [mode]);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [expanded, setExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Android-style 10-tap Developer Easter Egg on sidebar brand
  const notify = useToastStore((s) => s.notify);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastLogoClickTime, setLastLogoClickTime] = useState(0);

  const handleSidebarEasterEggClick = () => {
    const now = Date.now();
    const isConsecutive = now - lastLogoClickTime < 2500;
    const nextCount = isConsecutive ? logoClicks + 1 : 1;
    setLastLogoClickTime(now);
    setLogoClicks(nextCount);

    const isUnlocked = localStorage.getItem('spa_developer_mode_unlocked') === 'true';
    if (isUnlocked) {
      notify('Developer mode already active! Opening Settings...', 'info');
      setSettingsOpen(true);
      return;
    }

    const remaining = 10 - nextCount;
    if (nextCount >= 5 && remaining > 0) {
      notify(
        `You are now ${remaining} ${remaining === 1 ? 'step' : 'steps'} away from being a developer! 🛠️`,
        'info'
      );
    } else if (nextCount >= 10) {
      try {
        localStorage.setItem('spa_developer_mode_unlocked', 'true');
      } catch {}
      notify('🎉 You are now a developer! Teacher Break (Dino Run) unlocked in Settings!', 'success');
      setSettingsOpen(true);
    }
  };

  const drawerWidth = expanded ? 260 : 76;

  const handleSignOut = async () => {
    await logout();
    void navigate(ROUTES.login, { replace: true });
  };

  const avatarInitials = initials(user?.name);

  return (
    <ThemeProvider theme={glassTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Modern Collapsible Drawer (No Top AppBar) */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
              py: 2,
              px: expanded ? 2 : 1,
            },
          }}
        >
          {/* Top of Sidebar: Brand & Collapse Toggle */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: expanded ? 'space-between' : 'center',
                mb: 2,
                px: expanded ? 1 : 0,
                minHeight: 48,
              }}
            >
              {expanded ? (
                <Box
                  onClick={handleSidebarEasterEggClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderRadius: radii.md,
                    p: 0.5,
                    transition: 'opacity 0.2s ease',
                    '&:active': { opacity: 0.8 },
                  }}
                  title="SPA System (Tap 10x for Developer Options)"
                >
                  <UniHildesheimLogo size={42} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      noWrap
                      sx={{
                        fontWeight: 800,
                        lineHeight: 1.2,
                        background: gradients.wordmark,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      SPA System
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Uni Hildesheim · SSE
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Tooltip title="Stiftung Universität Hildesheim · SPA System" placement="right">
                  <Box
                    onClick={() => setExpanded(true)}
                    sx={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UniHildesheimLogo size={36} />
                  </Box>
                </Tooltip>
              )}

              {expanded && (
                <Tooltip title="Collapse sidebar">
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(false)}
                    sx={{ color: 'text.secondary', ml: 0.5 }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {!expanded && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Tooltip title="Expand sidebar" placement="right">
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(true)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <Divider sx={{ mb: 2, opacity: 0.6 }} />

            {/* Navigation Links */}
            <List sx={{ p: 0 }}>
              {NAV_ITEMS.map((item) => {
                const active = isNavItemActive(item, pathname);
                const Icon = item.icon;

                const button = (
                  <ListItemButton
                    selected={active}
                    onClick={() => void navigate(item.path)}
                    sx={{
                      ...navItem(active),
                      justifyContent: expanded ? 'flex-start' : 'center',
                      px: expanded ? 2 : 1.5,
                      py: 1.2,
                      borderRadius: radii.lg,
                      minHeight: 44,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: expanded ? 38 : 'auto',
                        justifyContent: 'center',
                        color: active ? 'primary.main' : 'inherit',
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                    {expanded && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.9rem',
                        }}
                      />
                    )}
                  </ListItemButton>
                );

                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                    {expanded ? (
                      button
                    ) : (
                      <Tooltip title={item.label} placement="right">
                        {button}
                      </Tooltip>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Bottom Section: Settings & User Profile */}
          <Box>
            <Divider sx={{ mb: 1.5, opacity: 0.6 }} />

            {/* Settings Tab */}
            <ListItem disablePadding sx={{ mb: 1 }}>
              {expanded ? (
                <ListItemButton
                  onClick={() => setSettingsOpen(true)}
                  sx={{
                    justifyContent: 'flex-start',
                    px: 2,
                    py: 1,
                    borderRadius: radii.lg,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <SettingsOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                  />
                </ListItemButton>
              ) : (
                <Tooltip title="Settings" placement="right">
                  <ListItemButton
                    onClick={() => setSettingsOpen(true)}
                    sx={{
                      justifyContent: 'center',
                      px: 1.5,
                      py: 1,
                      borderRadius: radii.lg,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
                      <SettingsOutlinedIcon />
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              )}
            </ListItem>

            {/* User Profile Area */}
            {user && (
              <Box
                sx={{
                  p: expanded ? 1.5 : 0.5,
                  borderRadius: radii.lg,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: expanded ? 'space-between' : 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    overflow: 'hidden',
                  }}
                >
                  <Tooltip
                    title={!expanded ? `${user.name} (${user.email}) - Click to sign out` : ''}
                    placement="right"
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'common.white',
                        background: gradients.avatar,
                        boxShadow: shadows.avatar,
                        cursor: !expanded ? 'pointer' : 'default',
                      }}
                      onClick={!expanded ? () => void handleSignOut() : undefined}
                    >
                      {avatarInitials}
                    </Avatar>
                  </Tooltip>

                  {expanded && (
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="700" noWrap>
                        {user.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'block', fontSize: '0.72rem' }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {expanded && (
                  <Tooltip title="Sign out">
                    <IconButton
                      size="small"
                      onClick={() => void handleSignOut()}
                      sx={{ color: 'text.secondary' }}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Main Content View */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflowY: 'auto',
            p: { xs: 2.5, md: 4 },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Global Toast */}
      <Snackbar open={toast.open} autoHideDuration={6000} onClose={dismissToast}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
