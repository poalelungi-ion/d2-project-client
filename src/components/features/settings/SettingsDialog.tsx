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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';

import { useThemeStore, useSystemLogStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { ROUTES } from '../../../app/navigation';
import { UniHildesheimLogo } from '../../common/UniHildesheimLogo';
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

  const systemLogs = useSystemLogStore((s) => s.logs);
  const [logsExpanded, setLogsExpanded] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1.5 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
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

        {/* System Logs (collapsed by default) */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Staff Tools &amp; Logs
          </Typography>

          {/* System & Audit Logs Suite (collapsed by default) */}
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
                      {logsExpanded ? 'Click to hide logs' : 'Audits, logins, grade editions, and incidents'}
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
