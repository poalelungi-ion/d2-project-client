import { useId } from 'react';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';
import { STUDY_PROGRAMS, UNASSIGNED_PROGRAM } from '../../utils/studyProgram';

interface StudyProgramSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  /** Include the upload placeholder so an empty import can stay unassigned. */
  allowUnassigned?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

/**
 * Study program is a closed list. Lecturers pick an entry; they cannot type
 * a custom Studiengang that would later fail validation.
 */
export function StudyProgramSelect({
  value,
  onChange,
  label = 'Study Program',
  error,
  helperText,
  allowUnassigned = false,
  size,
  sx,
}: StudyProgramSelectProps) {
  const labelId = useId();
  const options = allowUnassigned
    ? [...STUDY_PROGRAMS, UNASSIGNED_PROGRAM]
    : [...STUDY_PROGRAMS];
  const items = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <FormControl fullWidth size={size} margin="dense" error={error} sx={sx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={(event: SelectChangeEvent<string>) => onChange(event.target.value)}
      >
        {value === '' && <MenuItem value="" disabled sx={{ display: 'none' }} />}
        {items.map((program) => (
          <MenuItem key={program} value={program}>
            {program}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
