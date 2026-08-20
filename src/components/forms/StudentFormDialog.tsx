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
import type { StudentStatus } from '../../types';
import type { AppState } from '../../hooks/useAppLogic';

export function StudentFormDialog(props: AppState) {
  const {
    studentFormOpen,
    setStudentFormOpen,
    studentFormMode,
    studentForm,
    setStudentForm,
    studentFormErrors,
    handleSaveStudent,
  } = props;

  return (
    <Dialog
      open={studentFormOpen}
      onClose={() => setStudentFormOpen(false)}
      PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 400 } }}
    >
      <DialogTitle sx={{ fontWeight: '800', fontSize: '1.25rem' }}>
        {studentFormMode === 'edit' ? 'Edit Student' : 'Create New Student'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Student ID / Matrikelnummer"
          type="number"
          fullWidth
          variant="outlined"
          value={studentForm.student_id}
          onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
          error={!!studentFormErrors.student_id}
          helperText={studentFormErrors.student_id}
          sx={{ mb: 2, mt: 1 }}
        />
        {/*
          First and last name are captured separately because that is what the
          form state and validateStudentForm work with; handleSaveStudent joins
          them back into the single `name` the backend stores.
        */}
        <TextField
          margin="dense"
          label="First Name"
          type="text"
          fullWidth
          variant="outlined"
          value={studentForm.first_name}
          onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
          error={!!studentFormErrors.first_name}
          helperText={studentFormErrors.first_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Last Name"
          type="text"
          fullWidth
          variant="outlined"
          value={studentForm.last_name}
          onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
          error={!!studentFormErrors.last_name}
          helperText={studentFormErrors.last_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Study Program"
          type="text"
          fullWidth
          variant="outlined"
          value={studentForm.program}
          onChange={(e) => setStudentForm({ ...studentForm, program: e.target.value })}
          error={!!studentFormErrors.program}
          helperText={studentFormErrors.program}
          sx={{ mb: 2 }}
        />
        {studentFormMode === 'edit' && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={studentForm.status}
              label="Status"
              onChange={(e) =>
                setStudentForm({ ...studentForm, status: e.target.value as StudentStatus })
              }
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="graduated">Graduated</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={() => setStudentFormOpen(false)} color="inherit" sx={{ borderRadius: '8px' }}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleSaveStudent()}
          variant="contained"
          color="primary"
          sx={{ fontWeight: '600', borderRadius: '8px' }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
