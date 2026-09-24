import { TextField, MenuItem } from '@mui/material';
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
  const options = allowUnassigned
    ? [...STUDY_PROGRAMS, UNASSIGNED_PROGRAM]
    : [...STUDY_PROGRAMS];
  const items = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <TextField
      select
      fullWidth
      size={size}
      margin="dense"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      helperText={helperText}
      sx={sx}
      SelectProps={{
        displayEmpty: true,
      }}
      inputProps={{ 'aria-label': label }}
    >
      {!value && (
        <MenuItem value="" disabled>
          Select a study program
        </MenuItem>
      )}
      {items.map((program) => (
        <MenuItem key={program} value={program}>
          {program}
        </MenuItem>
      ))}
    </TextField>
  );
}
