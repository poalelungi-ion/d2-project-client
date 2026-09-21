import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton, Box } from '@mui/material';

import { CourseDetail as CourseDetailView } from '../components/features/CourseDetail';
import { useCourses } from '../hooks/useApi';
import { ROUTES } from '../app/navigation';
import { radii } from '../styles/tokens';
import { NotFound } from './NotFound';

export const CourseDetail = () => {
  const { courses, loading, refetch } = useCourses();
  const { courseId } = useParams<'courseId'>();

  const course = useMemo(
    () => courses.find((c) => c.course_id.toString() === courseId) ?? null,
    [courses, courseId],
  );

  if (!course) {
    if (loading) {
      return (
        <Box>
          <Skeleton variant="text" width={360} height={72} />
          <Skeleton variant="rectangular" height={320} sx={{ borderRadius: radii.xxl, mt: 3 }} />
        </Box>
      );
    }
    return <NotFound title="Course not found" backTo={ROUTES.courses} backLabel="Back to Courses" />;
  }

  // Keyed on the id so drilling into a different course starts with a clean
  // analytics panel rather than the previous course's student.
  return <CourseDetailView key={course.course_id} course={course} onRefresh={refetch} />;
};
