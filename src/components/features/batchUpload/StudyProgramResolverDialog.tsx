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
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Chip,
  Paper,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import { radii } from '../../../styles/tokens';

interface StudyProgramResolverDialogProps {
  open: boolean;
  onClose: () => void;
  unmappedPrograms: string[];
  existingPrograms: readonly string[];
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
  onApply,
}: StudyProgramResolverDialogProps) {
  // Initialize resolutions state for all unmapped programs
  const [resolutions, setResolutions] = useState<Record<string, ProgramResolution>>(() => {
    const init: Record<string, ProgramResolution> = {};
    for (const prog of unmappedPrograms) {
      init[prog] = {
        mode: 'map',
        targetProgram: existingPrograms[0] ?? 'SE Master',
        newProgramName: prog,
      };
    }
    return init;
  });

  const updateResolution = (prog: string, patch: Partial<ProgramResolution>) => {
    setResolutions((prev) => ({
      ...prev,
      [prog]: {
        ...(prev[prog] ?? {
          mode: 'map',
          targetProgram: existingPrograms[0] ?? 'SE Master',
          newProgramName: prog,
        }),
        ...patch,
      },
    }));
  };

  const handleConfirm = () => {
    const mappings: Record<string, string> = {};
    const newPrograms: string[] = [];

    for (const prog of unmappedPrograms) {
      const res = resolutions[prog];
      if (!res) continue;

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoFixHighIcon color="primary" />
        Resolve Unrecognized Study Programs
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Some records in your upload contain study programs not yet registered in the system.
          You can either map them to an existing study program or add them as new official programs.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {unmappedPrograms.map((prog) => {
            const current = resolutions[prog] ?? {
              mode: 'map',
              targetProgram: existingPrograms[0] ?? 'SE Master',
              newProgramName: prog,
            };

            return (
              <Paper
                key={prog}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: radii.lg,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Uploaded value:
                  </Typography>
                  <Chip
                    label={prog}
                    color="error"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <RadioGroup
                  value={current.mode}
                  onChange={(e) =>
                    updateResolution(prog, {
                      mode: e.target.value as ResolutionMode,
                    })
                  }
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="map"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        Map to an existing Study Program
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="create"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        Add as a new Study Program in the system
                      </Typography>
                    }
                  />
                </RadioGroup>

                {current.mode === 'map' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel id={`select-label-${prog}`}>
                      Select Existing Program
                    </InputLabel>
                    <Select
                      labelId={`select-label-${prog}`}
                      label="Select Existing Program"
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
