import { useState } from 'react';
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
} from '@mui/material';
import type { AddGradeFormValues, StudentDetails } from '../../types';
import { notify } from '../../stores';
import { useApiMutations, useCourses } from '../../hooks/useApi';

interface AddGradeDialogProps {
  /** Whose transcript the record is appended to. */
  student: StudentDetails;
  onClose: () => void;
  /** Called after a successful save so the transcript can reload. */
  onSaved: () => void;
}

const EMPTY_FORM: AddGradeFormValues = {
  course_id: '',
  semester: 'WiSe23/24',
  grade: 1.0,
};

export function AddGradeDialog({ student, onClose, onSaved }: AddGradeDialogProps) {
  // Its own request: the dialog is the only thing on this screen that needs
  // the course list, so StudentDetail should not have to carry it.
  const { courses } = useCourses();
  const { addGrade } = useApiMutations();
  const [values, setValues] = useState<AddGradeFormValues>(EMPTY_FORM);

  const update = (patch: Partial<AddGradeFormValues>) =>
    setValues((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    if (values.course_id === '') {
      notify('Please select a course', 'warning');
      return;
    }
    const added = await addGrade(student.student_id, {
      course_id: values.course_id,
      semester: values.semester,
      grade: values.grade,
    });
    if (added) {
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog disableRestoreFocus disableEnforceFocus open onClose={onClose}>
      <DialogTitle>Add Manual Course Record</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Assign a new exam attempt or a new course entirely to this student&apos;s transcript.
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
          >
            <MenuItem value="WiSe23/24">Winter Semester 23/24</MenuItem>
            <MenuItem value="SoSe24">Summer Semester 24</MenuItem>
            <MenuItem value="WiSe24/25">Winter Semester 24/25</MenuItem>
            <MenuItem value="SoSe25">Summer Semester 25</MenuItem>
            <MenuItem value="WiSe25/26">Winter Semester 25/26</MenuItem>
          </Select>
        </FormControl>
        <TextField
          type="number"
          inputProps={{ step: 0.1, min: 1.0, max: 5.0 }}
          label="Grade (1.0 - 5.0)"
          value={values.grade}
          onChange={(e) => update({ grade: parseFloat(e.target.value) })}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={() => void handleSave()} variant="contained" color="primary">
          Add Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}
