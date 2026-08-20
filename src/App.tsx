/**
 * @file App.tsx
 * @description Main React application component for the SPA System.
 * Owns the shell -- app bar, navigation drawer, global dialogs and the toast --
 * and switches the main pane between feature screens. All state and behaviour
 * live in useAppLogic; this file only wires them to the UI.
 */
import { useMemo } from 'react';
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
import type { ReactNode } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

import { getGlassTheme } from './theme';
import { useAppLogic } from './hooks/useAppLogic';
import { CourseFormDialog } from './components/forms/CourseFormDialog';
import { StudentFormDialog } from './components/forms/StudentFormDialog';
import { AddGradeDialog } from './components/forms/AddGradeDialog';

import { AnalysisHub } from './components/features/AnalysisHub';
import { BatchUploadWizard } from './components/features/BatchUploadWizard';
import { CoursesAdmin } from './components/features/CoursesAdmin';
import { StudentsAdmin } from './components/features/StudentsAdmin';

const drawerWidth = 260;

interface MenuItemDef {
  text: string;
  icon: ReactNode;
}

const menuItems: MenuItemDef[] = [
  { text: 'Teacher Dashboard', icon: <DashboardIcon /> },
  { text: 'Batch Data Upload', icon: <TableChartIcon /> },
  { text: 'Analysis Hub', icon: <SchoolIcon /> },
  { text: 'Student LSF Roster', icon: <PersonIcon /> },
];

export default function App() {
  const appState = useAppLogic();
  const {
    activeTab,
    setActiveTab,
    setSelectedStudent,
    setSelectedCourse,
    themeMode,
    toast,
    setToast,
  } = appState;
  const glassTheme = useMemo(() => getGlassTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={glassTheme}>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <CssBaseline />
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
            color: '#212121',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: '800',
                background: 'linear-gradient(45deg, #B71C1C 30%, #FF8E53 90%)',
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

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(40px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.8)',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={activeTab === item.text}
                    onClick={() => {
                      setActiveTab(item.text);
                      setSelectedStudent(null);
                      setSelectedCourse(null);
                    }}
                    sx={{
                      borderRadius: '12px',
                      '&.Mui-selected': {
                        background:
                          'linear-gradient(135deg, rgba(183, 28, 28, 0.1), rgba(183, 28, 28, 0.05))',
                        color: '#B71C1C',
                      },
                      '&:hover': { background: 'rgba(255, 255, 255, 0.9)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: activeTab === item.text ? '#B71C1C' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: activeTab === item.text ? 700 : 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <CourseFormDialog {...appState} />
        <StudentFormDialog {...appState} />
        <AddGradeDialog {...appState} />

        <Box component="main" sx={{ flexGrow: 1, p: 4, pt: 10, overflowY: 'auto' }}>
          {activeTab === 'Teacher Dashboard' && <AnalysisHub {...appState} />}
          {activeTab === 'Batch Data Upload' && <BatchUploadWizard {...appState} />}
          {activeTab === 'Analysis Hub' && <CoursesAdmin {...appState} />}
          {activeTab === 'Student LSF Roster' && <StudentsAdmin {...appState} />}
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert
          severity={toast.severity}
          sx={{
            width: '100%',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            background:
              toast.severity === 'success' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(211, 47, 47, 0.9)',
            color: '#FFF',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
