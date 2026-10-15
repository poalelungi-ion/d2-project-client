import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useThemeStore, useToastStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
  testApiConnection,
} from '../../../api/client';
import { ProfDinoGame } from '../settings/ProfDinoGame';

interface AuthSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AuthSettingsDialog = ({ open, onClose }: AuthSettingsDialogProps) => {
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const notify = useToastStore((s) => s.notify);

  // Backend API Base URL state
  const [apiUrl, setApiUrl] = useState<string>(() => getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
  } | null>(null);

  // Easter Egg 10-tap Developer Mode mechanics
  const REQUIRED_DEV_CLICKS = 10;
  const [devClicks, setDevClicks] = useState(0);
  const [lastDevClickTime, setLastDevClickTime] = useState(0);
  const [gameUnlocked, setGameUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('spa_developer_mode_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [gameExpanded, setGameExpanded] = useState(false);

  const handleEasterEggClick = () => {
    const now = Date.now();
    const isConsecutive = now - lastDevClickTime < 2500;
    const nextCount = isConsecutive ? devClicks + 1 : 1;
    setLastDevClickTime(now);
    setDevClicks(nextCount);

    if (gameUnlocked) {
      notify('Developer mode is already active! 🦖 Teacher Break Dino Game is ready.', 'info');
      setGameExpanded(true);
      return;
    }

    const remaining = REQUIRED_DEV_CLICKS - nextCount;
    if (nextCount >= 5 && remaining > 0) {
      notify(
        `You are now ${remaining} ${remaining === 1 ? 'step' : 'steps'} away from being a developer! 🛠️`,
        'info',
      );
    } else if (nextCount >= REQUIRED_DEV_CLICKS) {
      setGameUnlocked(true);
      setGameExpanded(true);
      try {
        localStorage.setItem('spa_developer_mode_unlocked', 'true');
      } catch {
        /* ignore storage quota/private mode */
      }
      notify('🎉 You are now a developer! Teacher Break (Dino Run) unlocked!', 'success');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const target = apiUrl.trim();
    if (!target) {
      setTestResult({
        tested: true,
        ok: false,
        message: 'API Base URL cannot be empty.',
      });
      setTesting(false);
      return;
    }

    const res = await testApiConnection(target);
    if (res.ok) {
      setTestResult({
        tested: true,
        ok: true,
        message: `Successfully reached backend at ${target}${res.status ? ` (HTTP ${res.status})` : ''}`,
      });
      notify('Backend connection verified successfully!', 'success');
    } else {
      setTestResult({
        tested: true,
        ok: false,
        message: `Unable to connect: ${res.error || 'Server unreachable or CORS blocked'}. Please check if the backend is running.`,
      });
      notify('Connection test failed. Check backend status.', 'error');
    }
    setTesting(false);
  };

  const handleSaveApiUrl = () => {
    const target = apiUrl.trim();
    if (!target) {
      notify('API Base URL cannot be empty.', 'error');
      return;
    }
    setApiBaseUrl(target);
    const saved = getApiBaseUrl();
    setApiUrl(saved);
    notify(`Backend API Base URL set to: ${saved}`, 'success');
  };

  const handleResetApiUrl = () => {
    resetApiBaseUrl();
    setApiUrl(DEFAULT_API_BASE_URL);
    setTestResult(null);
    notify(`Reset Backend API Base URL to default: ${DEFAULT_API_BASE_URL}`, 'info');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1.5 }}>
        <Box
          onClick={handleEasterEggClick}
          sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', userSelect: 'none' }}
          title="Uni Hildesheim Logo (Tap 10x for Easter Egg)"
        >
          <UniHildesheimLogo size={46} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="700">
            Settings &amp; Connection
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stiftung Universität Hildesheim · Software Systems Engineering
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '72vh' }}>
        {/* Appearance Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Appearance
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: radii.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {mode === 'dark' ? (
                <DarkModeOutlinedIcon color="primary" />
              ) : (
                <LightModeOutlinedIcon color="primary" />
              )}
              <Box>
                <Typography variant="body1" fontWeight="600">
                  Dark Theme
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Toggle between modern frosted light and dark glassmorphic themes
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                  color="primary"
                />
              }
              label=""
            />
          </Paper>
        </Box>

        {/* Backend API Connection Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Backend API Connection
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Configure backend target URL. Stored locally to connect easily in case of network issues.
              </Typography>
            </Box>
            <Tooltip title="Reset to container default URL">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<RestartAltIcon />}
                onClick={handleResetApiUrl}
                sx={{ textTransform: 'none', borderRadius: radii.md }}
              >
                Reset Default
              </Button>
            </Tooltip>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: radii.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <DnsOutlinedIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="600">
                  API Base Endpoint
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Build Default: <code>{DEFAULT_API_BASE_URL}</code>
                </Typography>
              </Box>
            </Box>

            <TextField
              size="small"
              fullWidth
              label="Backend API Base URL"
              placeholder="http://localhost:8000/api"
              value={apiUrl}
              onChange={(e) => {
                setApiUrl(e.target.value);
                setTestResult(null);
              }}
              sx={{ mb: 2 }}
            />

            {testResult && (
              <Alert
                severity={testResult.ok ? 'success' : 'error'}
                icon={testResult.ok ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                sx={{ mb: 2, py: 0.5 }}
              >
                {testResult.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => void handleTestConnection()}
                disabled={testing}
                startIcon={testing ? <CircularProgress size={16} /> : undefined}
                sx={{ textTransform: 'none', borderRadius: radii.md }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveApiUrl}
                disabled={testing || !apiUrl.trim()}
                sx={{ textTransform: 'none', borderRadius: radii.md }}
              >
                Save &amp; Apply
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Teacher Break Dino Run (Mini Game Easter Egg) */}
        {gameUnlocked && (
          <Box sx={{ mb: 3 }}>
            <Accordion
              expanded={gameExpanded}
              onChange={(_, exp) => setGameExpanded(exp)}
              variant="outlined"
              sx={{
                borderRadius: `${radii.lg} !important`,
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SportsEsportsOutlinedIcon color="primary" />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="600">
                          Teacher Break (Dino Run Mini-Game)
                        </Typography>
                        <Chip
                          label="Developer Mode"
                          size="small"
                          color="secondary"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {gameExpanded ? 'Click to hide mini-game' : 'Unlocked · Click to expand and play'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                {gameExpanded && <ProfDinoGame />}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* System & Institution Info */}
        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            System Information
          </Typography>
          <Paper
            variant="outlined"
            onClick={handleEasterEggClick}
            sx={{
              p: 2,
              borderRadius: radii.lg,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              },
              '&:active': {
                transform: 'scale(0.99)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SchoolOutlinedIcon color="action" />
                <Typography variant="body2" fontWeight="700">
                  Stiftung Universität Hildesheim
                </Typography>
              </Box>
              {gameUnlocked && (
                <Chip
                  label="Developer Options Active"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Faculty IV – Mathematics, Natural Sciences, Economics and Computer Science
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Software Systems Engineering (SSE) · SPA System v2.0 (Build 2026.10)
            </Typography>
            {gameUnlocked && (
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameUnlocked(false);
                    setGameExpanded(false);
                    try {
                      localStorage.removeItem('spa_developer_mode_unlocked');
                    } catch {}
                    notify('Developer options disabled. Teacher Break game hidden.', 'info');
                  }}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', py: 0.2 }}
                >
                  Hide developer options
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
