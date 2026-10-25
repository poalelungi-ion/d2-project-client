import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Chip,
  FormLabel,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import type { AttemptType, CourseMark } from '../../../types';
import { notify, useSystemLogStore } from '../../../stores';
import { useApiMutations } from '../../../hooks/useApi';
import { GRADE_CONSTRAINT_MESSAGE, parseGradeInput } from '../../../utils/gradeOutcome';
import { getStandardSemesterOptions } from '../../../utils/semester';

export interface AddMarkRecordDialogProps {
  courseId: number;
  courseName: string;
  semesterOptions: readonly string[];
  currentSemester?: string;
  existingMarks: readonly CourseMark[];
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

const COMMON_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];
const ABSENCE_CODES = ['NE', 'EX', 'AT'];

export function AddMarkRecordDialog({
  courseId,
  courseName,
  semesterOptions,
  currentSemester,
  existingMarks,
  open,
  onClose,
  onSaved,
}: AddMarkRecordDialogProps) {
  const { addGrade } = useApiMutations();

  // Mode: pick from existing course students or enter custom ID
  const [studentMode, setStudentMode] = useState<'existing' | 'manual'>('existing');

  // Distinct students who already have records in this course
  const courseStudents = useMemo(() => {
    const map = new Map<number, { studentId: number; name: string; program: string; attempts: CourseMark[] }>();
    for (const m of existingMarks) {
      if (m.student_id != null) {
        if (!map.has(m.student_id)) {
          map.set(m.student_id, {
            studentId: m.student_id,
            name: m.student_name,
            program: m.program,
            attempts: [],
          });
        }
        map.get(m.student_id)?.attempts.push(m);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [existingMarks]);

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    courseStudents.length > 0 ? courseStudents[0].studentId : null,
  );
  const [manualStudentId, setManualStudentId] = useState<string>('');

  const allSemestersList = useMemo(() => {
    const standard = getStandardSemesterOptions();
    const existing = semesterOptions.filter((s) => s && s !== 'All' && !s.startsWith('__'));
    return Array.from(new Set([...existing, ...standard]));
  }, [semesterOptions]);

  const [semester, setSemester] = useState<string>(() => {
    if (currentSemester && currentSemester !== 'All') return currentSemester;
    if (semesterOptions.length > 0 && semesterOptions[0] !== 'All') return semesterOptions[0];
    return 'WiSe 2024/25';
  });

  const [attemptType, setAttemptType] = useState<AttemptType>('Exam 1');
  const [gradeInput, setGradeInput] = useState<string>('1.0');

  const activeStudentId = studentMode === 'existing' ? selectedStudentId : (parseInt(manualStudentId, 10) || null);

  const selectedStudentInfo = useMemo(() => {
    if (!activeStudentId) return null;
    return courseStudents.find((s) => s.studentId === activeStudentId) ?? null;
  }, [courseStudents, activeStudentId]);

  // Check if selected student already has this attempt in this semester
  const existingAttemptNotice = useMemo(() => {
    if (!selectedStudentInfo) return null;
    const sameAttempt = selectedStudentInfo.attempts.find(
      (a) => a.semester === semester && a.attempt_type === attemptType,
    );
    if (sameAttempt) {
      return `Student already has a recorded grade (${sameAttempt.absence_code || sameAttempt.grade}) for ${attemptType} in ${semester}. Saving will update this sitting.`;
    }
    const otherAttempts = selectedStudentInfo.attempts.filter((a) => a.semester === semester);
    if (otherAttempts.length > 0) {
      const descriptions = otherAttempts.map((a) => `${a.attempt_type}: ${a.absence_code || a.grade}`).join(', ');
      return `Student has other sitting(s) in ${semester} (${descriptions}). This will add a distinct ${attemptType} record.`;
    }
    return null;
  }, [selectedStudentInfo, semester, attemptType]);

  const handleSelectGradeChip = (val: string) => {
    setGradeInput(val);
  };

  const handleSave = async () => {
    if (!activeStudentId || isNaN(activeStudentId) || activeStudentId <= 0) {
      notify('Please select or specify a valid numeric Student ID', 'warning');
      return;
    }

    const parsed = parseGradeInput(gradeInput);
    if (!parsed.ok) {
      notify(GRADE_CONSTRAINT_MESSAGE, 'error');
      return;
    }

    const payloadGrade = parsed.absenceCode ? parsed.absenceCode : (parsed.grade ?? 5.0);

    const added = await addGrade(activeStudentId, {
      course_id: courseId,
      semester,
      grade: payloadGrade,
      attempt_type: attemptType,
    });

    if (added) {
      useSystemLogStore.getState().addLog({
        level: 'info',
        category: 'marks',
        code: 'MARK_RECORD_ADDED',
        message: `Manually added mark record for student ${activeStudentId} in "${courseName}": Grade ${payloadGrade} in ${semester} (${attemptType}).`,
        actor: 'Lecturer',
        details: JSON.stringify(
          {
            studentId: activeStudentId,
            courseId,
            courseName,
            semester,
            grade: payloadGrade,
            attemptType,
          },
          null,
          2,
        ),
      });

      await onSaved();
      onClose();
    }
  };

  return (
    <Dialog disableRestoreFocus disableEnforceFocus open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Mark Record &mdash; {courseName}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Add an exam mark record for either the first attempt (Exam 1) or second attempt / retake (Exam 2) in this course.
        </Typography>

        {/* Student Mode Selector */}
        <Box>
          <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Target Student
          </FormLabel>
          <RadioGroup
            row
            value={studentMode}
            onChange={(e) => setStudentMode(e.target.value as 'existing' | 'manual')}
          >
            <FormControlLabel
              value="existing"
              control={<Radio size="small" />}
              label={`Enrolled Student (${courseStudents.length})`}
              disabled={courseStudents.length === 0}
            />
            <FormControlLabel
              value="manual"
              control={<Radio size="small" />}
              label="Enter Any Student ID"
            />
          </RadioGroup>

          {studentMode === 'existing' && courseStudents.length > 0 ? (
            <Autocomplete
              options={courseStudents}
              getOptionLabel={(option) => `${option.studentId} - ${option.name} (${option.program})`}
              value={courseStudents.find((s) => s.studentId === selectedStudentId) || null}
              onChange={(_, val) => setSelectedStudentId(val ? val.studentId : null)}
              renderInput={(params) => (
                <TextField {...params} label="Select Student" size="small" sx={{ mt: 1 }} />
              )}
            />
          ) : (
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Student ID (Matrikelnummer)"
              placeholder="e.g. 1012345"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Semester Selection */}
        <FormControl fullWidth size="small">
          <InputLabel id="mark-semester-label">Semester</InputLabel>
          <Select
            labelId="mark-semester-label"
            value={semester}
            label="Semester"
            onChange={(e) => setSemester(e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 280 },
              },
            }}
          >
            {allSemestersList.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Attempt Type Selection */}
        <FormControl fullWidth size="small">
          <InputLabel id="mark-attempt-label">Exam Sitting / Attempt</InputLabel>
          <Select
            labelId="mark-attempt-label"
            value={attemptType}
            label="Exam Sitting / Attempt"
            onChange={(e) => setAttemptType(e.target.value as AttemptType)}
          >
            <MenuItem value="Exam 1">Exam 1 (First Sitting / Main Exam)</MenuItem>
            <MenuItem value="Exam 2">Exam 2 (Second Sitting / Retake Exam)</MenuItem>
            <MenuItem value="Other">Other Sitting</MenuItem>
          </Select>
        </FormControl>

        {existingAttemptNotice && (
          <Alert severity="info" sx={{ py: 0.5, fontSize: '0.85rem' }}>
            {existingAttemptNotice}
          </Alert>
        )}

        {/* Grade Selection */}
        <Box>
          <TextField
            fullWidth
            size="small"
            label="Grade (1.0–5.0) or Code (NE, EX, AT)"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            helperText="German scale: 1.0–4.0 (pass), 5.0 (fail), NE (absent), EX (excused), AT (medical cert)"
          />

          <Box sx={{ mt: 1.5 }}>
            <FormLabel sx={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Quick Grade Selection
            </FormLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {COMMON_GRADES.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  size="small"
                  color={gradeInput === g ? 'primary' : 'default'}
                  variant={gradeInput === g ? 'filled' : 'outlined'}
                  onClick={() => handleSelectGradeChip(g)}
                  clickable
                  sx={{ fontWeight: gradeInput === g ? 700 : 500 }}
                />
              ))}
              {ABSENCE_CODES.map((code) => (
                <Chip
                  key={code}
                  label={code}
                  size="small"
                  color={gradeInput === code ? 'warning' : 'default'}
                  variant={gradeInput === code ? 'filled' : 'outlined'}
                  onClick={() => handleSelectGradeChip(code)}
                  clickable
                  sx={{ fontWeight: gradeInput === code ? 700 : 500 }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => void handleSave()}
          variant="contained"
          color="primary"
          disabled={!activeStudentId}
        >
          Add Mark Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}
