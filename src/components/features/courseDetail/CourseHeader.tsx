import { Box, Breadcrumbs, Button, Chip, Link as MuiLink, Typography } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../../../types';
import { ROUTES } from '../../../app/navigation';
import { useApiMutations } from '../../../hooks/useApi';
import { passRateColor } from '../../../styles/colors';
import { metaChip, pageSubtitle, pageTitle } from '../../../styles/mixins';
import { ALL_SEMESTERS } from '../../../utils/courseMarks';
import type { MarksSummary } from '../../../utils/courseMarks';

interface CourseHeaderProps {
  course: Course;
  /** Recomputed from the visible marks, so it follows the active filter. */
  summary: MarksSummary;
  /** Label of the active filter, or null when every semester is shown. */
  activeFilter: string | null;
  onSelectSemester: (value: string) => void;
  onEdit: () => void;
  onBack: () => void;
}

export const CourseHeader = ({
  course,
  summary,
  activeFilter,
  onSelectSemester,
  onEdit,
  onBack,
}: CourseHeaderProps) => {
  const { archiveCourse } = useApiMutations();
  const navigate = useNavigate();

  const setArchived = (archived: boolean) => {
    void archiveCourse(course.course_id, archived, course.version).then((done) => {
      if (done) void navigate(ROUTES.courses);
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* [Ticket #95647 - Navigation & Layout]
          Clear breadcrumb navigation allowing the user to easily return to the main course list */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 1.5 }}
      >
        <MuiLink
          component="button"
          underline="hover"
          color="inherit"
          onClick={onBack}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            p: 0,
          }}
        >
          Courses
        </MuiLink>
        <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {course.course_name}
        </Typography>
      </Breadcrumbs>
      <Button
        startIcon={<ChevronLeftIcon />}
        onClick={onBack}
        sx={{ color: 'text.secondary', mb: 1 }}
      >
        Return to List
      </Button>
      {/* [Ticket #95647 - Data Retrieval & Presentation]
          Display core course metadata: Course Name, Course ID, Semester, and Study Program */}
      <Typography variant="h3" sx={pageTitle}>
        {course.course_name}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={metaChip}>
          ID: {course.course_id}
        </Typography>
        <Typography variant="caption" sx={metaChip}>
          {course.semester}
        </Typography>
        <Typography variant="caption" sx={metaChip}>
          {course.study_program}
        </Typography>
        <Typography variant="caption" sx={metaChip}>
          {course.assigned_professor}
        </Typography>
      </Box>
      {/* [Ticket #95647 - Data Retrieval & Presentation]
          Summary statistics: Average Grade, Pass Rate, Total Submissions */}
      <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
        {summary.totalAttempts === 0 ? (
          // Nothing to summarise yet -- a 0% pass rate would read as a real result.
          <Typography variant="h6" sx={pageSubtitle}>
            No submissions yet – upload exam data to see course statistics.
          </Typography>
        ) : (
          <>
            <Typography variant="h6" sx={pageSubtitle}>
              Average Grade: <strong>{summary.avgGrade}</strong>
            </Typography>
            <Typography variant="h6" sx={pageSubtitle}>
              Pass Rate:{' '}
              <strong style={{ color: passRateColor(summary.passRate) }}>
                {summary.passRate}%
              </strong>
            </Typography>
            <Typography variant="h6" sx={pageSubtitle}>
              Total Submissions: <strong>{summary.totalAttempts}</strong>
            </Typography>
          </>
        )}
        {activeFilter && (
          <Chip
            label={`Showing ${activeFilter}`}
            onDelete={() => onSelectSemester(ALL_SEMESTERS)}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ alignSelf: 'center', fontWeight: 700 }}
          />
        )}
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={onEdit}
          sx={{ ml: 'auto' }}
        >
          Edit Course
        </Button>
        {/* [Ticket #95647 - Navigation & Layout]
            Primary action button labelled 'Upload Exam Data' that triggers data ingestion pipeline */}
        <Button
          variant="contained"
          color="success"
          startIcon={<CloudUploadIcon />}
          // The id travels with the handoff, so the wizard never has to ask
          // which course the file is for -- and never gets told the wrong one.
          onClick={() =>
            void navigate(ROUTES.upload, {
              state: { courseId: course.course_id, courseName: course.course_name },
            })
          }
        >
          Upload Exam Data
        </Button>
        {!course.is_archived && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ArchiveIcon />}
            onClick={() => setArchived(true)}
          >
            Archive Course
          </Button>
        )}
        {course.is_archived && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RestoreIcon />}
            onClick={() => setArchived(false)}
            sx={{ ml: 'auto' }}
          >
            Restore Course
          </Button>
        )}
      </Box>
    </Box>
  );
};
