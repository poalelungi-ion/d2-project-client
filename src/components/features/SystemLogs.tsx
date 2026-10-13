import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Fade,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Terminal as TerminalIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  DeleteSweep as DeleteSweepIcon,
  PlayArrow as PlayArrowIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  WarningAmber as WarningAmberIcon,
  InfoOutlined as InfoOutlinedIcon,
  RestartAlt as RestartAltIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Dns as DnsIcon,
  VpnKey as VpnKeyIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
  CloudUpload as CloudUploadIcon,
  Healing as HealingIcon,
  ReportProblem as ReportProblemIcon,
} from '@mui/icons-material';
import { useSystemLogStore, useToastStore, type LogLevel, type LogCategory, type SystemLogItem } from '../../stores';
import { radii } from '../../styles/tokens';
import { pageTitle } from '../../styles/mixins';

const LEVEL_COLORS: Record<LogLevel, { bg: string; text: string; border: string; icon: typeof InfoOutlinedIcon }> = {
  info: {
    bg: 'rgba(56, 189, 248, 0.12)',
    text: '#0284c7',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: InfoOutlinedIcon,
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#16a34a',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: CheckCircleIcon,
  },
  warn: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#d97706',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: WarningAmberIcon,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#dc2626',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: ErrorOutlineIcon,
  },
  critical: {
    bg: 'rgba(225, 29, 72, 0.18)',
    text: '#e11d48',
    border: 'rgba(225, 29, 72, 0.4)',
    icon: ErrorOutlineIcon,
  },
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth: 'Authentication & Logins',
  marks: 'Grade & Marks Editions',
  student: 'Student Registry',
  incident: 'System Incidents',
  ingestion: 'Data Ingestion',
  drive: 'Course Drive',
  system: 'System Core',
  network: 'Network & API',
};

export type LogPageTab = 'all' | 'incidents' | 'logins' | 'marks' | 'updates' | 'ingestion' | 'diagnostics';

interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  healthy: number;
}

const SystemLogMetricsCards = ({ stats }: { stats: LogStats }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: radii.lg,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          <DnsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
              Total Events
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {stats.total}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: radii.lg,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 32, color: '#16a34a' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
              Operational / Info
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16a34a' }}>
              {stats.healthy}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: radii.lg,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 32, color: '#d97706' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
              Warnings
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#d97706' }}>
              {stats.warnings}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: radii.lg,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 32, color: stats.errors > 0 ? '#dc2626' : 'text.disabled' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
              Errors / Critical
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: stats.errors > 0 ? '#dc2626' : 'text.secondary' }}>
              {stats.errors}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

interface SystemLogRowItemProps {
  log: SystemLogItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCopy: (log: SystemLogItem) => void;
}

const SystemLogRowItem = ({ log, isExpanded, onToggleExpand, onCopy }: SystemLogRowItemProps) => {
  const cfg = LEVEL_COLORS[log.level] || LEVEL_COLORS.info;
  const IconComp = cfg.icon;
  const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = new Date(log.timestamp).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: radii.md,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Box
        sx={{
          p: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          cursor: log.details ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (log.details) {
            onToggleExpand();
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 300 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: radii.sm,
              bgcolor: cfg.bg,
              color: cfg.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComp fontSize="small" />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Tooltip title={`${formattedDate} ${log.timestamp}`}>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  {formattedTime}
                </Typography>
              </Tooltip>

              <Chip
                label={log.level.toUpperCase()}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  bgcolor: cfg.bg,
                  color: cfg.text,
                  border: `1px solid ${cfg.border}`,
                }}
              />

              <Chip
                label={CATEGORY_LABELS[log.category] || log.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'text.disabled',
                  fontSize: '0.72rem',
                }}
              >
                [{log.code}]
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.25 }}>
              {log.message}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} onClick={(e) => e.stopPropagation()}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              display: { xs: 'none', md: 'block' },
              fontFamily: 'monospace',
            }}
          >
            {log.actor}
          </Typography>

          <Tooltip title="Copy full JSON record">
            <IconButton size="small" onClick={() => onCopy(log)} sx={{ color: 'text.secondary' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {log.details && (
            <Tooltip title={isExpanded ? 'Hide Payload' : 'Inspect Diagnostic Payload'}>
              <IconButton
                size="small"
                onClick={onToggleExpand}
                sx={{ color: 'text.secondary' }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {log.details && (
        <Collapse in={isExpanded} timeout={200}>
          <Box
            sx={{
              p: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#090d16' : '#f8fafc'),
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Diagnostic Payload &amp; Metadata
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => onCopy(log)}
                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
              >
                Copy Raw Details
              </Button>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.5,
                borderRadius: radii.sm,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#040711' : '#f1f5f9'),
                color: (theme) => (theme.palette.mode === 'dark' ? '#38bdf8' : '#0369a1'),
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                overflowX: 'auto',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {log.details}
            </Box>
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

const TAB_DESCRIPTIONS: Record<LogPageTab, { title: string; desc: string; icon: typeof TerminalIcon }> = {
  all: {
    title: 'Full Institutional Audit Trail',
    desc: 'Real-time chronologic stream of all actions across the entire platform.',
    icon: TerminalIcon,
  },
  incidents: {
    title: 'Incidents & System Warnings',
    desc: 'Audit page for detected anomalies, runtime exceptions, grade rejections, and security warnings.',
    icon: ReportProblemIcon,
  },
  logins: {
    title: 'Staff Logins & Authentication',
    desc: 'Audit page tracking staff sign-ins, session exchanges, Bearer tokens, and auth security claims.',
    icon: VpnKeyIcon,
  },
  marks: {
    title: 'Grade & Marks Editions',
    desc: 'Audit page documenting lecturer grade modifications, sitting changes, and transcript saves.',
    icon: GradeIcon,
  },
  updates: {
    title: 'Student & Course Registry Updates',
    desc: 'Audit page tracking student profile edits, alias normalizations, and course metadata changes.',
    icon: PersonIcon,
  },
  ingestion: {
    title: 'Data Ingestion & Course Storage',
    desc: 'Audit page for batch exam spreadsheet parsing, course drive uploads, and schema mapping.',
    icon: CloudUploadIcon,
  },
  diagnostics: {
    title: 'System Diagnostics & Health',
    desc: 'System monitoring page for database connection pools, gateway delays, and live diagnostics.',
    icon: HealingIcon,
  },
};

export const SystemLogs = ({ embedded = false }: { embedded?: boolean }) => {
  const { logs, clearLogs, resetToDefaults, triggerDiagnostics } = useSystemLogStore();
  const notify = useToastStore((s) => s.notify);

  const [activeTab, setActiveTab] = useState<LogPageTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LogCategory>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const tabFilteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeTab === 'incidents') {
        return log.level === 'error' || log.level === 'critical' || log.level === 'warn' || log.category === 'incident';
      }
      if (activeTab === 'logins') {
        return log.category === 'auth';
      }
      if (activeTab === 'marks') {
        return log.category === 'marks' || log.code.includes('MARK') || log.code.includes('GRADE');
      }
      if (activeTab === 'updates') {
        return log.category === 'student' || log.code.includes('STUDENT') || log.code.includes('COURSE');
      }
      if (activeTab === 'ingestion') {
        return log.category === 'ingestion' || log.category === 'drive';
      }
      if (activeTab === 'diagnostics') {
        return log.category === 'system' || log.category === 'network';
      }
      return true;
    });
  }, [logs, activeTab]);

  const filteredLogs = useMemo(() => {
    return tabFilteredLogs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesActor = log.actor.toLowerCase().includes(q);
        const matchesCode = log.code.toLowerCase().includes(q);
        const matchesDetails = log.details ? log.details.toLowerCase().includes(q) : false;
        return matchesMsg || matchesActor || matchesCode || matchesDetails;
      }
      return true;
    });
  }, [tabFilteredLogs, levelFilter, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const errorCount = logs.filter((l) => l.level === 'error' || l.level === 'critical').length;
    const warnCount = logs.filter((l) => l.level === 'warn').length;
    const infoCount = logs.filter((l) => l.level === 'info' || l.level === 'success').length;
    return {
      total: logs.length,
      errors: errorCount,
      warnings: warnCount,
      healthy: infoCount,
    };
  }, [logs]);

  const handleCopy = (log: SystemLogItem) => {
    const content = JSON.stringify(log, null, 2);
    void navigator.clipboard.writeText(content);
    notify(`Copied log entry [${log.code}] to clipboard`, 'success');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${activeTab}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredLogs.length} logs to JSON`, 'info');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Level', 'Category', 'Code', 'Actor', 'Message'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.level.toUpperCase(),
      l.category.toUpperCase(),
      l.code,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.message.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredLogs.length} logs to CSV`, 'info');
  };

  const handleRunDiagnostics = () => {
    triggerDiagnostics();
    notify('Diagnostic completed: System check passed and logged.', 'success');
  };

  const currentTabInfo = TAB_DESCRIPTIONS[activeTab];
  const CurrentIcon = currentTabInfo.icon;

  return (
    <Fade in={true} timeout={400}>
      <Box sx={{ width: '100%' }}>
        {!embedded && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <TerminalIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ ...pageTitle, m: 0 }}>
                  Full System &amp; Audit Logs
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Real-time audit trail of institutional data ingestion, course storage, authentication, and core system diagnostics.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunDiagnostics}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
              >
                Run Diagnostic Check
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportJson}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
              >
                Export JSON
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
              >
                Export CSV
              </Button>
              <Button
                variant="text"
                size="small"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => {
                  clearLogs();
                  notify('Cleared active system log entries.', 'info');
                }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Clear Logs
              </Button>
              <Button
                variant="text"
                size="small"
                color="inherit"
                startIcon={<RestartAltIcon />}
                onClick={() => {
                  resetToDefaults();
                  notify('Restored standard system log events.', 'info');
                }}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Reset Seed
              </Button>
            </Box>
          </Box>
        )}

        <SystemLogMetricsCards stats={stats} />

        {/* Dedicated Log Pages Navigation Tabs */}
        <Paper variant="outlined" sx={{ mb: 2.5, borderRadius: radii.lg, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val: LogPageTab) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab value="all" icon={<TerminalIcon fontSize="small" />} iconPosition="start" label="All Audit Trail" />
            <Tab value="incidents" icon={<ReportProblemIcon fontSize="small" />} iconPosition="start" label="Incidents &amp; Issues" />
            <Tab value="logins" icon={<VpnKeyIcon fontSize="small" />} iconPosition="start" label="Logins &amp; Auth" />
            <Tab value="marks" icon={<GradeIcon fontSize="small" />} iconPosition="start" label="Marks &amp; Grades" />
            <Tab value="updates" icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Registry Updates" />
            <Tab value="ingestion" icon={<CloudUploadIcon fontSize="small" />} iconPosition="start" label="Ingestion &amp; Drive" />
            <Tab value="diagnostics" icon={<HealingIcon fontSize="small" />} iconPosition="start" label="System Health" />
          </Tabs>

          <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CurrentIcon color="primary" />
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {currentTabInfo.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentTabInfo.desc}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${tabFilteredLogs.length} records`}
              size="small"
              color={activeTab === 'incidents' ? 'error' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Paper>

        {/* Filter and Search Bar */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: radii.lg,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <TextField
            size="small"
            placeholder="Search logs by message, actor, code, or payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 260 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="log-level-label">Severity Level</InputLabel>
            <Select
              labelId="log-level-label"
              value={levelFilter}
              label="Severity Level"
              onChange={(e) => setLevelFilter(e.target.value as 'all' | LogLevel)}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="error">Error &amp; Critical</MenuItem>
              <MenuItem value="warn">Warnings</MenuItem>
              <MenuItem value="info">Information</MenuItem>
              <MenuItem value="success">Success</MenuItem>
            </Select>
          </FormControl>

          {activeTab === 'all' && (
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="log-category-label">Module Category</InputLabel>
              <Select
                labelId="log-category-label"
                value={categoryFilter}
                label="Module Category"
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | LogCategory)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="incident">Incidents &amp; Issues</MenuItem>
                <MenuItem value="auth">Authentication &amp; Logins</MenuItem>
                <MenuItem value="marks">Grade &amp; Marks Editions</MenuItem>
                <MenuItem value="student">Student Registry</MenuItem>
                <MenuItem value="ingestion">Data Ingestion</MenuItem>
                <MenuItem value="drive">Course Drive</MenuItem>
                <MenuItem value="system">System Core</MenuItem>
                <MenuItem value="network">Network &amp; API</MenuItem>
              </Select>
            </FormControl>
          )}

          <Chip
            label={`${filteredLogs.length} matching event${filteredLogs.length === 1 ? '' : 's'}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, height: 32 }}
          />
        </Paper>

        {/* Log Entries Stream List */}
        {filteredLogs.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: radii.lg,
              bgcolor: 'background.paper',
            }}
          >
            <TerminalIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              No matching log records found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Try loosening your search terms or severity filters.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchQuery('');
                setLevelFilter('all');
                setCategoryFilter('all');
              }}
              sx={{ textTransform: 'none', borderRadius: radii.md }}
            >
              Reset Filters
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredLogs.map((log) => (
              <SystemLogRowItem
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggleExpand={() => setExpandedLogId((prev) => (prev === log.id ? null : log.id))}
                onCopy={handleCopy}
              />
            ))}
          </Box>
        )}
      </Box>
    </Fade>
  );
};
