import { useRef } from 'react';
import { Box, Typography, Button, TextField, Paper, Divider, Fade } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { TranscriptEntry } from '../../types';
import type { AppState } from '../../hooks/useAppLogic';

export const StudentDetail = (props: AppState) => {
  const {
    selectedStudent,
    setSelectedStudent,
    setAddGradeDialogOpen,
    studentColumnDefs,
    updateStudentProgram,
    handleStudentStatus,
    saveGradesToDB,
  } = props;

  const studentGridRef = useRef<AgGridReact<TranscriptEntry>>(null);

  // CoursesAdmin/StudentsAdmin only mount this once a student is loaded, but
  // the narrowing has to be explicit for everything below to be non-null.
  if (!selectedStudent) return null;

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={() => setSelectedStudent(null)}
            sx={{ color: '#424242', mb: 1 }}
          >
            Return to List
          </Button>
          <Typography variant="h3" sx={{ fontWeight: '800', letterSpacing: '-1.5px' }}>
            {selectedStudent.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              ID: {selectedStudent.student_id}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <TextField
              size="small"
              label="Learning Program"
              value={selectedStudent.program}
              onChange={(e) => setSelectedStudent({ ...selectedStudent, program: e.target.value })}
              sx={{ width: 250 }}
              error={selectedStudent.program === 'Unknown'}
              helperText={
                selectedStudent.program === 'Unknown' ? 'Action required: Update program' : ''
              }
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => void updateStudentProgram()}
              sx={{ borderRadius: '8px' }}
            >
              Save Profile
            </Button>
            {selectedStudent.status === 'active' && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => void handleStudentStatus(selectedStudent.student_id, 'graduated')}
                  sx={{ borderRadius: '8px' }}
                >
                  Graduate
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => void handleStudentStatus(selectedStudent.student_id, 'failed')}
                  sx={{ borderRadius: '8px' }}
                >
                  Fail Student
                </Button>
              </Box>
            )}
            {selectedStudent.status !== 'active' && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  color={selectedStudent.status === 'graduated' ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                >
                  Status: {selectedStudent.status}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RestoreIcon />}
                  onClick={() => void handleStudentStatus(selectedStudent.student_id, 'active')}
                  sx={{ borderRadius: '8px' }}
                >
                  Restore to Active
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight="700">
                Personal Transcript
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and edit marks directly in the student&apos;s official record grid.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setAddGradeDialogOpen(true)}
                sx={{ px: 3, mr: 2, borderRadius: '8px' }}
              >
                Add Course Record
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => void saveGradesToDB(studentGridRef)}
                sx={{ px: 3 }}
              >
                Save Official Marks
              </Button>
            </Box>
          </Box>
          <div className="ag-theme-alpine" style={{ flex: 1, width: '100%', padding: '16px' }}>
            <AgGridReact<TranscriptEntry>
              ref={studentGridRef}
              rowData={selectedStudent.transcript}
              columnDefs={studentColumnDefs}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
            />
          </div>
        </Paper>
      </Box>
    </Fade>
  );
};
