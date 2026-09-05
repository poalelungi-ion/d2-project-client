import { useParams } from 'react-router-dom';
import { Skeleton, Box } from '@mui/material';

import { StudentDetail as StudentDetailView } from '../components/features/StudentDetail';
import { useStudentDetails } from '../hooks/useApi';
import { ROUTES } from '../app/navigation';
import { radii } from '../styles/tokens';
import { NotFound } from './NotFound';

export const StudentDetail = () => {
  const { studentId } = useParams<'studentId'>();
  const id = Number(studentId);
  const idIsValid = studentId !== undefined && Number.isInteger(id);

  const { student, refetch } = useStudentDetails(idIsValid ? id : null);

  if (!idIsValid) {
    return (
      <NotFound title="Student not found" backTo={ROUTES.students} backLabel="Back to Students" />
    );
  }

  if (!student) {
    return (
      <Box>
        <Skeleton variant="text" width={360} height={72} />
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: radii.xxl, mt: 3 }} />
      </Box>
    );
  }

  // Keyed on the id so the in-place program draft resets when a different
  // student is opened.
  return <StudentDetailView key={student.student_id} student={student} onRefresh={() => void refetch()} />;
};
