import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
} from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';

import { useStudyProgramStore, useToastStore } from '../../../stores';
import { radii } from '../../../styles/tokens';
import { STUDY_PROGRAMS } from '../../../utils/studyProgram';

export const StudyProgramAliasesSection = () => {
  const notify = useToastStore((s) => s.notify);
  const { aliases, addAlias, removeAlias, resetDefaults } = useStudyProgramStore();

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
                  Any of these abbreviations or spreadsheet column entries will automatically resolve to{' '}
                  <strong>{prog}</strong> on upload:
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
  );
};
