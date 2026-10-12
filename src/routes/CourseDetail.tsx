import { useParams } from 'react-router-dom';
import { Skeleton, Box } from '@mui/material';

import { CourseDetail as CourseDetailView } from '../components/features/CourseDetail';
import { useCourseDetails } from '../hooks/useApi';
import { ROUTES } from '../app/navigation';
import { radii } from '../styles/tokens';
import { NotFound } from './NotFound';

/**
 * [Ticket #95647 - View course details Route]
 * Implementation of acceptance criteria:
 * 1. Data Retrieval: Queries the backend via useCourseDetails(courseId) for metadata and metrics.
 * 2. Visual Loading State: Displays Skeleton loader while React components fetch the payload.
 * 3. 404 Error Handling: Displays "Course Not Found" message with a button to return to the course list.
 * 4. Presentation: Renders CourseDetailView once data arrives.
 */
export const CourseDetail = () => {
  const { courseId } = useParams<'courseId'>();
  const { course, loading, notFound, refetch } = useCourseDetails(courseId ?? null);

  // Loading State: Visual placeholder rendered during API query
  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={360} height={72} />
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: radii.xxl, mt: 3 }} />
      </Box>
    );
  }

  // 404 Error State: Displayed when course does not exist in backend
  if (notFound || !course) {
    return (
      <NotFound
        title="Course Not Found"
        backTo={ROUTES.courses}
        backLabel="Return to Course List"
      />
    );
  }

  // Keyed on the id so drilling into a different course starts with a clean
  // analytics panel rather than the previous course's student.
  return <CourseDetailView key={course.course_id} course={course} onRefresh={refetch} />;
};
