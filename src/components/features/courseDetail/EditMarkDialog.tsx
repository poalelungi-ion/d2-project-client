import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GradeIcon from '@mui/icons-material/Grade';
import type { CourseMark, AttemptType } from '../../../types';
import { radii } from '../../../styles/tokens';
import { gradeOutcomeColor } from '../../../styles/colors';
import { parseGradeInput, outcomeLabel, GRADE_CONSTRAINT_MESSAGE } from '../../../utils/gradeOutcome';
import { getStandardSemesterOptions } from '../../../utils/semester';

interface EditMarkDialogProps {
  open: boolean;
  mark: CourseMark | null;
  courseName?: string;
  availableSemesters?: readonly string[];
  onClose: () => void;
  onSave: (updatedMark: CourseMark) => Promise<boolean>;
}

const COMMON_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];
const ABSENCE_CODES = ['NE', 'EX', 'AT'];
const ATTEMPT_TYPES: { value: AttemptType; label: string }[] = [
  { value: 'Exam 1', label: 'Exam 1 (1st Attempt / 1. Termin)' },
  { value: 'Exam 2', label: 'Exam 2 (2nd Attempt / 2. Termin)' },
  { value: 'Other', label: 'Other Sitting' },
];

export const EditMarkDialog = ({
  open,
  mark,
  courseName,
  availableSemesters,
  onClose,
  onSave,
}: EditMarkDialogProps) => {
  const [gradeInput, setGradeInput] = useState('');
  const [attemptType, setAttemptType] = useState<AttemptType>('Exam 1');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mark) {
      if (mark.absence_code) {
        setGradeInput(mark.absence_code);
      } else if (mark.grade != null) {
        setGradeInput(String(mark.grade));
      } else {
        setGradeInput('');
      }
      setAttemptType(mark.attempt_type || 'Exam 1');
      setSemester(mark.semester || '');
      setError(null);
    }
  }, [mark]);

  const semesterOptionsList = useMemo(() => {
    const standard = getStandardSemesterOptions();
    const existing = mark
      ? [mark.semester, ...(availableSemesters || [])].filter(
          (s) => Boolean(s) && !s.startsWith('__') && s !== 'All',
        )
      : [];
    return Array.from(new Set([...existing, ...standard]));
  }, [mark, availableSemesters]);

  if (!mark) return null;

  const parsed = parseGradeInput(gradeInput);
  const currentOutcome = parsed.ok ? parsed.outcome : mark.outcome;
  const isPassed = parsed.ok ? parsed.passed : mark.passed;

  const handleSelectPreset = (value: string) => {
    setGradeInput(value);
    setError(null);
  };

  const handleCommit = async () => {
    const res = parseGradeInput(gradeInput);
    if (!res.ok) {
      setError(GRADE_CONSTRAINT_MESSAGE);
      return;
    }

    setSaving(true);
    const updated: CourseMark = {
      ...mark,
      grade: res.grade,
      absence_code: res.absenceCode,
      passed: res.passed,
      outcome: res.outcome,
      attempt_type: attemptType,
      semester: semester || mark.semester,
    };

    const ok = await onSave(updated);
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: radii.xl,
          p: 1,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: radii.md,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
          }}
        >
          <GradeIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Edit Grade &amp; Sitting
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mark.student_name} (ID: {mark.student_id})
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        {/* Context metadata card */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: radii.md,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Course: <strong>{courseName || 'Current Course'}</strong> · Registered: <strong>{mark.semester} ({mark.attempt_type || 'Other'})</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Study Program: <strong>{mark.program}</strong>
          </Typography>
        </Paper>

        {/* Sitting and Semester controls */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="sitting-type-label">Exam Attempt</InputLabel>
            <Select
              labelId="sitting-type-label"
              value={attemptType}
              label="Exam Attempt"
              onChange={(e) => setAttemptType(e.target.value as AttemptType)}
            >
              {ATTEMPT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="semester-select-label">Semester</InputLabel>
            <Select
              labelId="semester-select-label"
              value={semester}
              label="Semester"
              onChange={(e) => setSemester(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: { maxHeight: 280 },
                },
              }}
            >
              {semesterOptionsList.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Grade Input & Real-time Outcome preview */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
              Grade or Absence Code
            </Typography>
            {parsed.ok && (
              <Chip
                label={outcomeLabel(currentOutcome, isPassed)}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: `${gradeOutcomeColor(currentOutcome)}22`,
                  color: gradeOutcomeColor(currentOutcome),
                  border: `1px solid ${gradeOutcomeColor(currentOutcome)}`,
                  height: 22,
                }}
              />
            )}
          </Box>

          <TextField
            fullWidth
            size="small"
            placeholder="e.g. 1.7 or AT"
            value={gradeInput}
            onChange={(e) => {
              setGradeInput(e.target.value);
              setError(null);
            }}
            error={Boolean(error)}
            helperText={error || 'Standard grades (1.0–5.0) or absence code (NE/EX/AT)'}
          />
        </Box>

        {/* Quick-Select Buttons */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
            Quick Select Standard Grades:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {COMMON_GRADES.map((g) => (
              <Chip
                key={g}
                label={g}
                size="small"
                clickable
                onClick={() => handleSelectPreset(g)}
                color={gradeInput === g ? 'primary' : 'default'}
                variant={gradeInput === g ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, mb: 0.75, fontWeight: 600 }}>
            Absence Codes:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {ABSENCE_CODES.map((code) => (
              <Chip
                key={code}
                label={code}
                size="small"
                clickable
                onClick={() => handleSelectPreset(code)}
                color={gradeInput === code ? 'warning' : 'default'}
                variant={gradeInput === code ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleCommit()}
          variant="contained"
          color="primary"
          disabled={saving || !gradeInput.trim()}
          startIcon={<EditIcon />}
        >
          {saving ? 'Saving...' : 'Save Grade'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
