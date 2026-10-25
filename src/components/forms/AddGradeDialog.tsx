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
} from '@mui/material';
import type { AddGradeFormValues, AttemptType, StudentDetails } from '../../types';
import { notify, useSystemLogStore } from '../../stores';
import { useApiMutations, useCourses } from '../../hooks/useApi';
import { GRADE_CONSTRAINT_MESSAGE, parseGradeInput } from '../../utils/gradeOutcome';
import { getStandardSemesterOptions } from '../../utils/semester';

interface AddGradeDialogProps {
  /** Whose transcript the record is appended to. */
  student: StudentDetails;
  onClose: () => void;
  /** Called after a successful save so the transcript can reload. */
  onSaved: () => void;
}

const EMPTY_FORM: AddGradeFormValues = {
  course_id: '',
  semester: 'WiSe 2024/25',
  grade: '1.0',
  attempt_type: 'Exam 1',
};

const COMMON_GRADES = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0'];
const ABSENCE_CODES = ['NE', 'EX', 'AT'];

export function AddGradeDialog({ student, onClose, onSaved }: AddGradeDialogProps) {
  // Its own request: the dialog is the only thing on this screen that needs
  // the course list, so StudentDetail should not have to carry it.
  const { courses } = useCourses();
  const { addGrade } = useApiMutations();
  const [values, setValues] = useState<AddGradeFormValues>(EMPTY_FORM);
  const [gradeInput, setGradeInput] = useState<string>('1.0');

  const semesterOptions = useMemo(() => getStandardSemesterOptions(), []);

  const update = (patch: Partial<AddGradeFormValues>) =>
    setValues((current) => ({ ...current, ...patch }));

  const handleSelectGradeChip = (val: string) => {
    setGradeInput(val);
    update({ grade: val });
  };

  const handleSave = async () => {
    if (values.course_id === '') {
      notify('Please select a course', 'warning');
      return;
    }
    const parsed = parseGradeInput(gradeInput);
    if (!parsed.ok) {
      notify(GRADE_CONSTRAINT_MESSAGE, 'error');
      return;
    }

    const payloadGrade = parsed.absenceCode ? parsed.absenceCode : (parsed.grade ?? 5.0);
    const attemptType = values.attempt_type ?? 'Exam 1';

    const added = await addGrade(student.student_id, {
      course_id: values.course_id,
      semester: values.semester,
      grade: payloadGrade,
      attempt_type: attemptType,
    });

    if (added) {
      const selectedCourseName =
        courses.find((c) => c.course_id === values.course_id)?.course_name || `Course #${values.course_id}`;

      useSystemLogStore.getState().addLog({
        level: 'info',
        category: 'marks',
        code: 'MARK_RECORD_ADDED',
        message: `Manually added mark for ${student.name} in "${selectedCourseName}": Grade ${payloadGrade} in ${values.semester} (${attemptType}).`,
        actor: 'Lecturer',
        details: JSON.stringify(
          {
            studentId: student.student_id,
            courseId: values.course_id,
            semester: values.semester,
            grade: payloadGrade,
            attemptType,
          },
          null,
          2,
        ),
      });

      onSaved();
      onClose();
    }
  };

  return (
    <Dialog disableRestoreFocus disableEnforceFocus open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Manual Exam Record</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Record a new exam attempt (Exam 1, Exam 2 retake, or Other) for {student.name} (ID: {student.student_id}).
        </Typography>

        <FormControl fullWidth variant="outlined">
          <InputLabel id="add-grade-course-label">Course</InputLabel>
          <Select
            labelId="add-grade-course-label"
            id="add-grade-course"
            value={values.course_id}
            label="Course"
            onChange={(e) => update({ course_id: Number(e.target.value) })}
          >
            {courses.map((c) => (
              <MenuItem key={c.course_id} value={c.course_id}>
                {c.course_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined">
          <InputLabel id="add-grade-semester-label">Semester</InputLabel>
          <Select
            labelId="add-grade-semester-label"
            id="add-grade-semester"
            value={values.semester}
            label="Semester"
            onChange={(e) => update({ semester: e.target.value })}
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 280 },
              },
            }}
          >
            {semesterOptions.map((sem) => (
              <MenuItem key={sem} value={sem}>
                {sem}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined">
          <InputLabel id="add-grade-attempt-label">Exam Sitting / Attempt</InputLabel>
          <Select
            labelId="add-grade-attempt-label"
            id="add-grade-attempt"
            value={values.attempt_type ?? 'Exam 1'}
            label="Exam Sitting / Attempt"
            onChange={(e) => update({ attempt_type: e.target.value as AttemptType })}
          >
            <MenuItem value="Exam 1">Exam 1 (First Sitting / Main Exam)</MenuItem>
            <MenuItem value="Exam 2">Exam 2 (Second Sitting / Retake Exam)</MenuItem>
            <MenuItem value="Other">Other Sitting</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <TextField
            fullWidth
            label="Grade (1.0–5.0) or Code (NE, EX, AT)"
            value={gradeInput}
            onChange={(e) => {
              setGradeInput(e.target.value);
              update({ grade: e.target.value });
            }}
            helperText="Enter 1.0–4.0 (pass), 5.0 (fail), NE (absent), EX (excused), or AT (medical cert)"
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
        <Button onClick={() => void handleSave()} variant="contained" color="primary">
          Add Exam Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}
