import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type {
  Student,
  StudentFormErrors,
  StudentFormValues,
  StudentStatus,
} from '../../types';
import { useApiMutations } from '../../hooks/useApi';

interface StudentFormDialogProps {
  /** The student being edited, or null to create a new one. */
  student: Student | null;
  onClose: () => void;
  /** Called after a successful save so the caller can reload its roster. */
  onSaved: () => void;
}

const EMPTY_FORM: StudentFormValues = {
  student_id: '',
  first_name: '',
  last_name: '',
  program: '',
  status: 'active',
};

/** Editing splits the stored full name back into the two fields the UI asks for. */
const toFormValues = (student: Student | null): StudentFormValues => {
  if (!student) return EMPTY_FORM;
  const nameParts = (student.name || '').split(' ');
  return {
    student_id: student.student_id?.toString() ?? '',
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || '',
    program: student.program || '',
    status: student.status || 'active',
  };
};

const validate = (values: StudentFormValues): StudentFormErrors => {
  const errors: StudentFormErrors = {};
  if (!values.first_name.trim()) errors.first_name = 'First Name is mandatory';
  if (!values.last_name.trim()) errors.last_name = 'Last Name is mandatory';
  if (!values.student_id.trim()) errors.student_id = 'Student ID is mandatory';
  if (!values.program.trim()) errors.program = 'Study Program is mandatory';
  return errors;
};

/** Mounted by StudentsAdmin only while open, so the fields start fresh each time. */
export function StudentFormDialog({ student, onClose, onSaved }: StudentFormDialogProps) {
  const { saveStudent } = useApiMutations();
  const [values, setValues] = useState<StudentFormValues>(() => toFormValues(student));
  const [errors, setErrors] = useState<StudentFormErrors>({});

  const update = (patch: Partial<StudentFormValues>) =>
    setValues((current) => ({ ...current, ...patch }));

  const handleSave = async () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (await saveStudent(values, student?.version)) {
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle sx={{ fontSize: '1.25rem' }}>
        {student ? 'Edit Student' : 'Create New Student'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Student ID / Matrikelnummer"
          type="number"
          fullWidth
          variant="outlined"
          value={values.student_id}
          onChange={(e) => update({ student_id: e.target.value })}
          error={!!errors.student_id}
          helperText={errors.student_id}
          sx={{ mb: 2, mt: 1 }}
        />
        {/*
          First and last name are captured separately because that is what the
          roster shows; they are joined again before the API sees them.
        */}
        <TextField
          margin="dense"
          label="First Name"
          type="text"
          fullWidth
          variant="outlined"
          value={values.first_name}
          onChange={(e) => update({ first_name: e.target.value })}
          error={!!errors.first_name}
          helperText={errors.first_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Last Name"
          type="text"
          fullWidth
          variant="outlined"
          value={values.last_name}
          onChange={(e) => update({ last_name: e.target.value })}
          error={!!errors.last_name}
          helperText={errors.last_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Study Program"
          type="text"
          fullWidth
          variant="outlined"
          value={values.program}
          onChange={(e) => update({ program: e.target.value })}
          error={!!errors.program}
          helperText={errors.program}
          sx={{ mb: 2 }}
        />
        {student && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="student-status-label">Status</InputLabel>
            <Select
              labelId="student-status-label"
              id="student-status"
              value={values.status}
              label="Status"
              onChange={(e) => update({ status: e.target.value as StudentStatus })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="graduated">Graduated</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={() => void handleSave()} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
