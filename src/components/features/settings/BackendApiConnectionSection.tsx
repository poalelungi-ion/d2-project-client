import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useToastStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import {
  getApiBaseUrl,
  getEffectiveDefaultApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
  testApiConnection,
} from '../../../api/client';

export const BackendApiConnectionSection = () => {
  const notify = useToastStore((s) => s.notify);
  const [apiUrl, setApiUrl] = useState<string>(() => getApiBaseUrl());
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setTestingApi(true);
    setTestResult(null);
    const target = apiUrl.trim();
    if (!target) {
      setTestResult({
        tested: true,
        ok: false,
        message: 'API Base URL cannot be empty.',
      });
      setTestingApi(false);
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
        message: `Unable to connect: ${res.error || 'Server unreachable or CORS blocked'}. Please check if backend is running.`,
      });
      notify('Connection test failed. Check backend status.', 'error');
    }
    setTestingApi(false);
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
            Configure backend target URL. Stored in your browser's local storage and overrides the build default.
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
            disabled={testingApi}
            startIcon={testingApi ? <CircularProgress size={16} /> : undefined}
            sx={{ textTransform: 'none', borderRadius: radii.md }}
          >
            {testingApi ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSaveApiUrl}
            disabled={testingApi || !apiUrl.trim()}
            sx={{ textTransform: 'none', borderRadius: radii.md }}
          >
            Save &amp; Apply
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
