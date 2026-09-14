import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';

import type { Course, CourseFormErrors, CourseFormValues } from '../../types';
import { useApiMutations } from '../../hooks/useApi';

interface CourseFormDialogProps {
  /** The course being edited, or null to create a new one. */
  course: Course | null;
  onClose: () => void;
  /** Called after a successful save so the caller can reload its list. */
  onSaved: () => void;
}

const SEMESTERS = [
  'WiSe23/24',
  'SoSe24',
  'WiSe24/25',
  'SoSe25',
  'WiSe25/26',
  'SoSe26',
  'WiSe26/27',
  'SoSe27',
  'WiSe27/28',
  'SoSe28',
] as const;

const EMPTY_FORM: CourseFormValues = {
  course_id: '',
  course_name: '',
  semester: '',
  study_program: '',
  professor: '',
};

const toFormValues = (course: Course | null): CourseFormValues =>
  course
    ? {
        course_id: course.course_id?.toString() ?? '',
        course_name: course.course_name || '',
        semester: course.semester || '',
        study_program: course.study_program || '',
        professor: course.assigned_professor || '',
      }
    : EMPTY_FORM;

const validate = (values: CourseFormValues): CourseFormErrors => {
  const errors: CourseFormErrors = {};

  if (!values.course_name.trim()) {
    errors.course_name = 'Course Name is mandatory';
  }

  if (!values.course_id.trim()) {
    errors.course_id = 'Course ID is mandatory';
  }

  if (!values.semester.trim()) {
    errors.semester = 'Semester is mandatory';
  }

  if (!values.study_program.trim()) {
    errors.study_program = 'Study Program is mandatory';
  }

  return errors;
};

/**
 * Mounted by CoursesAdmin only while open, so the field values below start
 * fresh on every open without needing a reset effect.
 */
export function CourseFormDialog({
  course,
  onClose,
  onSaved,
}: CourseFormDialogProps) {
  const { saveCourse } = useApiMutations();

  const [values, setValues] = useState<CourseFormValues>(() =>
    toFormValues(course)
  );

  const [errors, setErrors] = useState<CourseFormErrors>({});

  const update = (patch: Partial<CourseFormValues>) =>
    setValues((current) => ({
      ...current,
      ...patch,
    }));

  const handleSave = async () => {
    const found = validate(values);

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    if (await saveCourse(values, course?.version)) {
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle sx={{ fontSize: '1.25rem' }}>
        {course ? 'Edit Course' : 'Create New Course'}
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Course Number / ID"
          type="text"
          fullWidth
          variant="outlined"
          value={values.course_id}
          onChange={(e) => update({ course_id: e.target.value })}
          error={!!errors.course_id}
          helperText={errors.course_id}
          sx={{ mb: 2, mt: 1 }}
        />

        <TextField
          margin="dense"
          label="Course Name"
          type="text"
          fullWidth
          variant="outlined"
          value={values.course_name}
          onChange={(e) => update({ course_name: e.target.value })}
          error={!!errors.course_name}
          helperText={errors.course_name}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          margin="dense"
          label="Semester"
          fullWidth
          variant="outlined"
          value={values.semester}
          onChange={(e) => update({ semester: e.target.value })}
          error={!!errors.semester}
          helperText={errors.semester}
          sx={{ mb: 2 }}
        >
          <MenuItem value="" disabled>
            Select semester
          </MenuItem>

          {SEMESTERS.map((semester) => (
            <MenuItem key={semester} value={semester}>
              {semester}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          margin="dense"
          label="Study Program"
          type="text"
          fullWidth
          variant="outlined"
          value={values.study_program}
          onChange={(e) => update({ study_program: e.target.value })}
          error={!!errors.study_program}
          helperText={errors.study_program}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Assigned Professor"
          type="text"
          fullWidth
          variant="outlined"
          value={values.professor}
          onChange={(e) => update({ professor: e.target.value })}
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>

        <Button
          onClick={() => void handleSave()}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}