import { useState } from 'react';
import {
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

import type { Course, CourseFormErrors, CourseFormValues } from '../../types';
import { useApiMutations } from '../../hooks/useApi';
import {
  generateSemesters,
  getCurrentSemester,
  isValidSemester,
} from '../../utils/semester';

interface CourseFormDialogProps {
  /** The course being edited, or null to create a new one. */
  course: Course | null;
  onClose: () => void;
  /** Called after a successful save so the caller can reload its list. */
  onSaved: () => void;
}

const SEMESTERS = generateSemesters();
const CURRENT_SEMESTER = getCurrentSemester();

const SEMESTER_OPTIONS = [
  CURRENT_SEMESTER,
  ...SEMESTERS.filter((semester) => semester !== CURRENT_SEMESTER),
];

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
  } else if (!isValidSemester(values.semester)) {
    errors.semester = 'Please select a valid semester';
  } else if (!SEMESTER_OPTIONS.includes(values.semester)) {
    errors.semester = 'Future semesters cannot be selected';
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

        <Autocomplete
          fullWidth
          options={SEMESTER_OPTIONS}
          value={
            SEMESTER_OPTIONS.includes(values.semester)
              ? values.semester
              : null
          }
          onChange={(_, newValue) => {
            update({
              semester: newValue ?? '',
            });

            if (errors.semester) {
              setErrors((current) => ({
                ...current,
                semester: undefined,
              }));
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              label="Semester"
              variant="outlined"
              placeholder="Select or search semester"
              error={!!errors.semester}
              helperText={errors.semester}
              sx={{ mb: 2 }}
            />
          )}
          slotProps={{
            paper: {
              sx: {
                maxHeight: 320,
              },
            },
          }}
        />

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