import { useState, useMemo } from 'react';
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
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import TerminalIcon from '@mui/icons-material/Terminal';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

import { useThemeStore, useToastStore, useStudyProgramStore, useSystemLogStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { STUDY_PROGRAMS } from '../../../utils/studyProgram';
import { ROUTES } from '../../../app/navigation';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  resetApiBaseUrl,
  setApiBaseUrl,
  testApiConnection,
} from '../../../api/client';
import { ProfDinoGame } from './ProfDinoGame';
import { SystemLogs } from '../SystemLogs';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const notify = useToastStore((s) => s.notify);

  const { aliases, addAlias, removeAlias, resetDefaults } = useStudyProgramStore();
  const systemLogs = useSystemLogStore((s) => s.logs);
  const [gameExpanded, setGameExpanded] = useState(false);
  const [logsExpanded, setLogsExpanded] = useState(false);

  // Backend API Base URL state
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
    setApiUrl(DEFAULT_API_BASE_URL);
    setTestResult(null);
    notify(`Reset Backend API Base URL to default: ${DEFAULT_API_BASE_URL}`, 'info');
  };

  // Android-style 10-click Developer Mode Easter Egg
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
        'info'
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

  const [searchQuery, setSearchQuery] = useState('');
  const [newAliasInputs, setNewAliasInputs] = useState<Record<string, string>>({});

  // Group aliases by canonical study program
  const programAliasMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const prog of STUDY_PROGRAMS) {
      map[prog] = [];
    }
    for (const [alias, target] of Object.entries(aliases)) {
      if (!map[target]) {
        map[target] = [];
      }
      map[target].push(alias);
    }
    // Sort aliases alphabetically
    for (const prog of Object.keys(map)) {
      map[prog].sort();
    }
    return map;
  }, [aliases]);

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return STUDY_PROGRAMS;
    return STUDY_PROGRAMS.filter((prog) => {
      const matchProgramName = prog.toLowerCase().includes(q);
      const matchAlias = (programAliasMap[prog] ?? []).some((a) => a.includes(q));
      return matchProgramName || matchAlias;
    });
  }, [searchQuery, programAliasMap]);

  const handleAddAlias = (program: string) => {
    const val = (newAliasInputs[program] || '').trim();
    if (!val) return;

    const success = addAlias(program, val);
    if (success) {
      notify(`Added alias "${val}" for ${program}`);
      setNewAliasInputs((prev) => ({ ...prev, [program]: '' }));
    } else {
      notify('Could not add alias', 'error');
    }
  };

  const handleRemoveAlias = (alias: string, program: string) => {
    removeAlias(alias);
    notify(`Removed alias "${alias}" from ${program}`);
  };

  const handleReset = () => {
    resetDefaults();
    notify('Reset study program aliases to defaults');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            System Settings &amp; Preferences
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

        {/* Study Program Name Mappings & Aliases */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Study Program Name Mappings &amp; Aliases
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Associate spreadsheet naming variations and abbreviations with official programs
              </Typography>
            </Box>
            <Tooltip title="Reset all aliases to university defaults">
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                sx={{ textTransform: 'none', borderRadius: radii.md }}
              >
                Reset Defaults
              </Button>
            </Tooltip>
          </Box>

          <TextField
            size="small"
            fullWidth
            placeholder="Search programs or aliases (e.g. SE, AINF, Informatik)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredPrograms.map((prog) => {
              const progAliases = programAliasMap[prog] ?? [];
              const inputValue = newAliasInputs[prog] || '';

              return (
                <Accordion
                  key={prog}
                  variant="outlined"
                  disableGutters
                  sx={{
                    borderRadius: radii.md,
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <SchoolOutlinedIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="600">
                        {prog}
                      </Typography>
                      <Chip
                        label={`${progAliases.length} alias${progAliases.length === 1 ? '' : 'es'}`}
                        size="small"
                        sx={{ ml: 'auto', mr: 2, height: 22, fontSize: '0.75rem' }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Any of these abbreviations or spreadsheet column entries will automatically resolve to <strong>{prog}</strong> on upload:
                    </Typography>

                    {/* Active Aliases */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                      {progAliases.length === 0 ? (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No aliases registered yet.
                        </Typography>
                      ) : (
                        progAliases.map((alias) => (
                          <Chip
                            key={alias}
                            label={alias}
                            size="small"
                            onDelete={() => handleRemoveAlias(alias, prog)}
                            color="default"
                            sx={{
                              borderRadius: radii.sm,
                              bgcolor: (theme) => theme.palette.action.hover,
                            }}
                          />
                        ))
                      )}
                    </Box>

                    {/* Add Alias Input */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={`Add new alias for ${prog} (e.g. M.Sc. ${prog.slice(0, 4)})...`}
                        value={inputValue}
                        onChange={(e) =>
                          setNewAliasInputs((prev) => ({ ...prev, [prog]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAlias(prog);
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => handleAddAlias(prog)}
                        disabled={!inputValue.trim()}
                        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                      >
                        Add Alias
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        </Box>

        {/* Staff Break Mini Game & System Logs (Hidden by default) */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Staff Tools &amp; Logs
          </Typography>

          {/* Teacher Break Dino Game (Hidden until unlocked by 10 clicks) */}
          {gameUnlocked && (
            <Accordion
              expanded={gameExpanded}
              onChange={(_, exp) => setGameExpanded(exp)}
              variant="outlined"
              sx={{
                borderRadius: `${radii.lg} !important`,
                overflow: 'hidden',
                mb: 2,
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
          )}

          {/* System & Audit Logs Suite (Hidden by Default Under Game) */}
          <Accordion
            expanded={logsExpanded}
            onChange={(_, exp) => setLogsExpanded(exp)}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TerminalIcon color="primary" />
                  <Box>
                    <Typography variant="body1" fontWeight="600">
                      System &amp; Audit Logs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {logsExpanded ? 'Click to hide logs' : 'Hidden under mini-game · Audits, logins, grade editions, and incidents'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={`${systemLogs.length} Events`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                  {systemLogs.filter((l) => l.level === 'error' || l.level === 'critical').length > 0 && (
                    <Chip
                      label={`${systemLogs.filter((l) => l.level === 'error' || l.level === 'critical').length} Incidents`}
                      size="small"
                      color="error"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<OpenInNewIcon fontSize="small" />}
                  onClick={() => {
                    onClose();
                    void navigate(ROUTES.logs);
                  }}
                  sx={{ textTransform: 'none', borderRadius: radii.md, fontWeight: 600 }}
                >
                  Open Full-Page Inspector
                </Button>
              </Box>
              {logsExpanded && <SystemLogs embedded={true} />}
            </AccordionDetails>
          </Accordion>
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
