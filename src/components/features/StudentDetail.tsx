import { useMemo, useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Divider, Fade } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import { useNavigate } from 'react-router-dom';
import type { StudentDetails, StudentStatus } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useApiMutations } from '../../hooks/useApi';
import { radii } from '../../styles/tokens';
import { pageTitle } from '../../styles/mixins';
import { transcriptColumns } from './columns';

interface StudentDetailProps {
  /** Fetched by the route from :studentId, transcript included. */
  student: StudentDetails;
  /** Reloads that fetch after this screen changes something. */
  onRefresh: () => void;
}

export const StudentDetail = ({ student, onRefresh }: StudentDetailProps) => {
  const { updateProgram, setStudentStatus } = useApiMutations();
  // The program field is edited in place before being saved, so it needs a
  // local draft on top of the fetched student.
  const [program, setProgram] = useState(student.program);

  const navigate = useNavigate();
  const studentColumnDefs = useMemo(() => transcriptColumns(), []);

  const updateStudentProgram = async () => {
    if (await updateProgram(student.student_id, program, student.version)) onRefresh();
  };

  const handleStudentStatus = async (status: StudentStatus) => {
    if (await setStudentStatus(student.student_id, status, student.version)) onRefresh();
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={() => void navigate(ROUTES.students)}
            sx={{ color: 'text.secondary', mb: 1 }}
          >
            Return to List
          </Button>
          <Typography variant="h3" sx={pageTitle}>
            {student.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '400' }}>
              ID: {student.student_id}
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <TextField
              size="small"
              label="Learning Program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              sx={{ width: 250 }}
              error={program === 'Unknown'}
              helperText={
                program === 'Unknown' ? 'Action required: Update program' : ''
              }
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => void updateStudentProgram()}
            >
              Save Profile
            </Button>
            {student.status === 'active' && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => void handleStudentStatus('graduated')}
                >
                  Graduate
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => void handleStudentStatus('failed')}
                >
                  Fail Student
                </Button>
              </Box>
            )}
            {student.status !== 'active' && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  color={student.status === 'graduated' ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                >
                  Status: {student.status}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RestoreIcon />}
                  onClick={() => void handleStudentStatus('active')}
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
            borderRadius: radii.xxl,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h5" fontWeight="700">
              Personal Transcript
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Grades are read-only here. Edit them on the course page.
            </Typography>
          </Box>
          <Box className="ag-theme-alpine" sx={{ flex: 1, width: '100%', p: 2 }}>
            <AgGridReact
              rowData={student.transcript}
              columnDefs={studentColumnDefs}
              defaultColDef={{ resizable: true, sortable: true, filter: true, editable: false }}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
            />
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};
