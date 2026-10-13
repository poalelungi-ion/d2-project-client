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
import { useNavigate } from 'react-router-dom';

import { useThemeStore, useToastStore, useStudyProgramStore, useSystemLogStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { STUDY_PROGRAMS } from '../../../utils/studyProgram';
import { ROUTES } from '../../../app/navigation';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
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
        <UniHildesheimLogo size={46} />
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

          {/* Teacher Break Dino Game (Hidden by Default) */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SportsEsportsOutlinedIcon color="primary" />
                <Box>
                  <Typography variant="body1" fontWeight="600">
                    Teacher Break (Dino Run Mini-Game)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gameExpanded ? 'Click to hide mini-game' : 'Hidden by default · Click to expand and play'}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              {gameExpanded && <ProfDinoGame />}
            </AccordionDetails>
          </Accordion>

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
          <Paper variant="outlined" sx={{ p: 2, borderRadius: radii.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <SchoolOutlinedIcon color="action" />
              <Typography variant="body2" fontWeight="700">
                Stiftung Universität Hildesheim
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Faculty IV – Mathematics, Natural Sciences, Economics and Computer Science
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Software Systems Engineering (SSE) · SPA System v2.0
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
