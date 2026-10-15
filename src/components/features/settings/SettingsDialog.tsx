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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TerminalIcon from '@mui/icons-material/Terminal';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

import { useThemeStore, useToastStore, useSystemLogStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { ROUTES } from '../../../app/navigation';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
import { ProfDinoGame } from './ProfDinoGame';
import { SystemLogs } from '../SystemLogs';
import { BackendApiConnectionSection } from './BackendApiConnectionSection';
import { StudyProgramAliasesSection } from './StudyProgramAliasesSection';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog = ({ open, onClose }: SettingsDialogProps) => {
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const notify = useToastStore((s) => s.notify);

  const systemLogs = useSystemLogStore((s) => s.logs);
  const [gameExpanded, setGameExpanded] = useState(false);
  const [logsExpanded, setLogsExpanded] = useState(false);

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
        <BackendApiConnectionSection />

        {/* Study Program Name Mappings & Aliases */}
        <StudyProgramAliasesSection />

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
