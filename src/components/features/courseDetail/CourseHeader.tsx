import { Box, Breadcrumbs, Button, Chip, Link as MuiLink, Paper, Typography } from '@mui/material';
import {
  Restore as RestoreIcon,
  ChevronLeft as ChevronLeftIcon,
  CloudUpload as CloudUploadIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
  NavigateNext as NavigateNextIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../../../types';
import { ROUTES } from '../../../app/navigation';
import { useApiMutations } from '../../../hooks/useApi';
import { passRateColor } from '../../../styles/colors';
import { metaChip, pageSubtitle, pageTitle } from '../../../styles/mixins';
import { radii } from '../../../styles/tokens';
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
      {/* Navigation Breadcrumb Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
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
          size="small"
          startIcon={<ChevronLeftIcon />}
          onClick={onBack}
          sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
        >
          Return to List
        </Button>
      </Box>

      {/* Hero Course Overview Card */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: radii.xl,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', lg: 'center' },
          gap: 3,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 4px 24px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Left Section: Course Title, Taxonomy & Academic Metadata */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
            <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h3" sx={{ ...pageTitle, m: 0 }}>
              {course.course_name}
            </Typography>
            {course.is_archived && (
              <Chip
                label="Archived"
                size="small"
                color="default"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={metaChip}>
              ID: {course.course_id}
            </Typography>
            <Typography variant="caption" sx={metaChip}>
              {course.semester}
            </Typography>
            <Typography variant="caption" sx={metaChip}>
              {course.study_program}
            </Typography>
            {course.assigned_professor && course.assigned_professor !== 'Not Assigned' && (
              <Typography variant="caption" sx={metaChip}>
                {course.assigned_professor}
              </Typography>
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
          </Box>
        </Box>

        {/* Right Section: Key Metrics & Quick Actions (Utilizes the top-right corner) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'stretch', lg: 'flex-end' },
            gap: 2,
            flexShrink: 0,
          }}
        >
          {/* Key Metrics / Summary Statistics */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {summary.totalAttempts === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  px: 2,
                  borderRadius: radii.md,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <Typography variant="h6" sx={pageSubtitle}>
                  No submissions yet – upload exam data to see course statistics.
                </Typography>
              </Paper>
            ) : (
              <>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    px: 2,
                    borderRadius: radii.md,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Typography variant="h6" sx={pageSubtitle}>
                    Average Grade: <strong>{summary.avgGrade}</strong>
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    px: 2,
                    borderRadius: radii.md,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Typography variant="h6" sx={pageSubtitle}>
                    Pass Rate:{' '}
                    <strong style={{ color: passRateColor(summary.passRate) }}>
                      {summary.passRate}%
                    </strong>
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    px: 2,
                    borderRadius: radii.md,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Typography variant="h6" sx={pageSubtitle}>
                    Total Submissions: <strong>{summary.totalAttempts}</strong>
                  </Typography>
                </Paper>
              </>
            )}
          </Box>

          {/* Course Actions Toolbar */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
            >
              Edit Course
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() =>
                void navigate(ROUTES.upload, {
                  state: { courseId: course.course_id, courseName: course.course_name },
                })
              }
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
            >
              Upload Exam Data
            </Button>
            {!course.is_archived && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<ArchiveIcon />}
                onClick={() => setArchived(true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
              >
                Archive Course
              </Button>
            )}
            {course.is_archived && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={() => setArchived(false)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
              >
                Restore Course
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
