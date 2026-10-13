import {
  Autocomplete,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
} from '@mui/material';

import { useUploadWizard } from './uploadWizardContext';
import { fieldLabel, monoChip, toneSurface } from '../../../styles/mixins';
import { semantic } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import {
  generateSemesters,
  getCurrentSemester,
  getNextSemester,
  isValidSemester,
} from '../../../utils/semester';

const CURRENT_SEMESTER = getCurrentSemester();
const NEXT_SEMESTER = getNextSemester(CURRENT_SEMESTER);
const ALL_SEMESTERS = generateSemesters();
const otherSemesters = [...ALL_SEMESTERS]
  .filter((s) => s !== NEXT_SEMESTER && s !== CURRENT_SEMESTER)
  .reverse();

const SEMESTER_OPTIONS = [
  NEXT_SEMESTER,
  CURRENT_SEMESTER,
  ...otherSemesters,
];

export const CourseInfoStep = () => {
  const {
    sourceLabel,
    courseInfo: uploadCourseInfo,
    setCourseInfo: setUploadCourseInfo,
    setStep: setActiveStep,
  } = useUploadWizard();

  const semesterIsValid =
    uploadCourseInfo.semester === '' ||
    isValidSemester(uploadCourseInfo.semester);

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{
          mb: 4,
          color: 'text.secondary',
          fontSize: '1rem',
          maxWidth: 800,
        }}
      >
        A table is always for one course and one semester &mdash; that can&apos;t
        vary within one import.{' '}
        The course is already settled below; tell us which semester and sitting{' '}
        <Box component="span" sx={{ ...monoChip, px: 1 }}>
          {sourceLabel}
        </Box>{' '}
        covers.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          maxWidth: 600,
        }}
      >
        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            COURSE
          </Typography>

          <Box
            sx={{
              ...toneSurface(semantic.success),
              p: 2,
              borderRadius: radii.lg,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              {uploadCourseInfo.courseName}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 0.5,
              }}
            >
              Course number
              <Box component="span" sx={{ ...monoChip, px: 1 }}>
                {uploadCourseInfo.courseNumber}
              </Box>
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
            }}
          >
            Taken from the course you started this upload in and attached to
            every row, so there is nothing to type. A course or course-number
            column in the file is ignored.
          </Typography>
        </Box>

        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            ECTS (CREDITS FOR THIS COURSE)
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            value={uploadCourseInfo.ects}
            onChange={(e) =>
              setUploadCourseInfo({
                ects: e.target.value,
              })
            }
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
            }}
          >
            Recorded with the import. The course itself is fixed by the tab you
            came from, so the credits here never split it into a second course.
          </Typography>
        </Box>

        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            EXAM SITTING / ATTEMPT
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: radii.md,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Chip
              label={uploadCourseInfo.attemptType || 'Exam 1'}
              color={uploadCourseInfo.attemptType === 'Exam 2' ? 'warning' : 'primary'}
              sx={{ fontWeight: 700 }}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              Selected in Step 1. Every grade imported from this file will be registered as {uploadCourseInfo.attemptType || 'Exam 1'}.
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            SEMESTER
          </Typography>

          <Autocomplete
            fullWidth
            options={SEMESTER_OPTIONS}
            value={
              isValidSemester(uploadCourseInfo.semester)
                ? uploadCourseInfo.semester
                : null
            }
            onChange={(_, newValue) => {
              setUploadCourseInfo({
                semester: newValue ?? '',
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select or search semester"
                error={!semesterIsValid}
                helperText={
                  !semesterIsValid
                    ? 'Please select a valid semester.'
                    : undefined
                }
              />
            )}
            ListboxProps={{
              sx: {
                maxHeight: 320,
                overflowY: 'auto',
              },
            }}
            slotProps={{
              paper: {
                sx: {
                  overflow: 'hidden',
                },
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
            }}
          >
            Select or type to search for a semester.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 6,
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => setActiveStep(0)}
          sx={{ px: 3 }}
        >
          &larr; Back
        </Button>

        <Button
          variant="contained"
          size="large"
          disabled={
            !uploadCourseInfo.semester ||
            !isValidSemester(uploadCourseInfo.semester)
          }
          onClick={() => setActiveStep(2)}
          sx={{ px: 4 }}
        >
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};