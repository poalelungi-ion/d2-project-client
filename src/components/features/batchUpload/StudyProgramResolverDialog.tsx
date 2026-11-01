import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { radii } from '../../../styles/tokens';
import { suggestClosestStudyProgram } from '../../../utils/studyProgram';

interface StudyProgramResolverDialogProps {
  open: boolean;
  onClose: () => void;
  unmappedPrograms: string[];
  existingPrograms: readonly string[];
  programCounts?: Record<string, number>;
  onApply: (mappings: Record<string, string>, newPrograms: string[]) => void;
}

type ResolutionMode = 'map' | 'create';

interface ProgramResolution {
  mode: ResolutionMode;
  targetProgram: string;
  newProgramName: string;
}

export function StudyProgramResolverDialog({
  open,
  onClose,
  unmappedPrograms,
  existingPrograms,
  programCounts = {},
  onApply,
}: StudyProgramResolverDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, ProgramResolution>>(() => {
    const init: Record<string, ProgramResolution> = {};
    for (const prog of unmappedPrograms) {
      init[prog] = {
        mode: 'map',
        targetProgram: suggestClosestStudyProgram(prog, existingPrograms),
        newProgramName: prog,
      };
    }
    return init;
  });

  const [bulkTarget, setBulkTarget] = useState<string>(existingPrograms[0] ?? 'SE Master');

  const updateResolution = (prog: string, patch: Partial<ProgramResolution>) => {
    setResolutions((prev) => ({
      ...prev,
      [prog]: {
        ...(prev[prog] ?? {
          mode: 'map',
          targetProgram: suggestClosestStudyProgram(prog, existingPrograms),
          newProgramName: prog,
        }),
        ...patch,
      },
    }));
  };

  const handleApplyBulk = () => {
    setResolutions((prev) => {
      const next = { ...prev };
      for (const prog of unmappedPrograms) {
        next[prog] = {
          mode: 'map',
          targetProgram: bulkTarget,
          newProgramName: prev[prog]?.newProgramName ?? prog,
        };
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const mappings: Record<string, string> = {};
    const newPrograms: string[] = [];

    for (const prog of unmappedPrograms) {
      const res = resolutions[prog] ?? {
        mode: 'map',
        targetProgram: suggestClosestStudyProgram(prog, existingPrograms),
        newProgramName: prog,
      };

      if (res.mode === 'create') {
        const name = res.newProgramName.trim() || prog;
        mappings[prog] = name;
        newPrograms.push(name);
      } else {
        mappings[prog] = res.targetProgram;
      }
    }

    onApply(mappings, newPrograms);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Study Program Mapping &amp; Normalization
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Map raw imported abbreviations or program names to standardized study programs
            </Typography>
          </Box>
        </Box>
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={`${unmappedPrograms.length} value${unmappedPrograms.length === 1 ? '' : 's'} to map`}
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Assign each imported study program value to an official standardized program or register it
          as a new study program. Saved mappings are remembered automatically for future imports.
        </Typography>

        {unmappedPrograms.length > 1 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: radii.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Quick Bulk Assignment:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="bulk-program-select-label">Target Study Program</InputLabel>
                <Select
                  labelId="bulk-program-select-label"
                  label="Target Study Program"
                  value={bulkTarget}
                  onChange={(e) => setBulkTarget(e.target.value)}
                >
                  {existingPrograms.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="outlined"
                onClick={handleApplyBulk}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Map All to Selected
              </Button>
            </Box>
          </Paper>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {unmappedPrograms.map((prog) => {
            const current = resolutions[prog] ?? {
              mode: 'map',
              targetProgram: suggestClosestStudyProgram(prog, existingPrograms),
              newProgramName: prog,
            };
            const rowCount = programCounts[prog];

            return (
              <Paper
                key={prog}
                variant="outlined"
                data-testid={`program-mapping-row-${prog}`}
                sx={{
                  p: 2,
                  borderRadius: radii.lg,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      RAW IMPORTED VALUE:
                    </Typography>
                    <Chip
                      label={prog}
                      color="warning"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                    {rowCount != null && rowCount > 0 && (
                      <Chip
                        label={`${rowCount} row${rowCount === 1 ? '' : 's'}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={current.mode}
                    onChange={(_e, nextMode: ResolutionMode | null) => {
                      if (nextMode) {
                        updateResolution(prog, { mode: nextMode });
                      }
                    }}
                  >
                    <ToggleButton value="map" sx={{ textTransform: 'none', px: 1.5, py: 0.25, fontSize: '0.75rem' }}>
                      Map to Standardized Program
                    </ToggleButton>
                    <ToggleButton value="create" sx={{ textTransform: 'none', px: 1.5, py: 0.25, fontSize: '0.75rem' }}>
                      Add as New Program
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 160 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {prog}
                    </Typography>
                    <ArrowForwardIcon fontSize="small" color="action" />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 240 }}>
                    {current.mode === 'map' ? (
                      <FormControl fullWidth size="small">
                        <InputLabel id={`select-label-${prog}`}>
                          Standardized Study Program
                        </InputLabel>
                        <Select
                          labelId={`select-label-${prog}`}
                          label="Standardized Study Program"
                          value={current.targetProgram}
                          onChange={(e) =>
                            updateResolution(prog, {
                              targetProgram: e.target.value,
                            })
                          }
                        >
                          {existingPrograms.map((p) => (
                            <MenuItem key={p} value={p}>
                              {p}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        label="New Study Program Name"
                        value={current.newProgramName}
                        onChange={(e) =>
                          updateResolution(prog, {
                            newProgramName: e.target.value,
                          })
                        }
                        placeholder="e.g. M.Sc. Robotics"
                      />
                    )}
                  </Box>

                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label={
                      current.mode === 'map'
                        ? current.targetProgram
                        : current.newProgramName.trim() || prog
                    }
                    color="success"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Paper>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
        >
          Apply Mappings &amp; Validate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
