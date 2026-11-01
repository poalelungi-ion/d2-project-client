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
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useThemeStore, useToastStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
import {
  getApiBaseUrl,
  getEffectiveDefaultApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
  testApiConnection,
} from '../../../api/client';

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
    const defaultUrl = getEffectiveDefaultApiBaseUrl();
    setApiUrl(defaultUrl);
    setTestResult(null);
    notify(`Reset Backend API Base URL to default: ${defaultUrl}`, 'info');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1.5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
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

      <DialogContent dividers sx={{ maxHeight: '90vh' }}>
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
                  Default: <code>{getEffectiveDefaultApiBaseUrl()}</code>
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

        {/* System & Institution Info */}
        <Box>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            System Information
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: radii.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SchoolOutlinedIcon color="action" />
                <Typography variant="body2" fontWeight="700">
                  Stiftung Universität Hildesheim
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Faculty IV – Mathematics, Natural Sciences, Economics and Computer Science
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Software Systems Engineering (SSE) · SPA System v2.0 (Build 2026.10)
            </Typography>
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
