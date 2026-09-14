import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
} from '@mui/material';

import type { AttemptType } from '../../../types';
import { useUploadWizard } from './uploadWizardContext';
import { fieldLabel, monoChip, toneSurface } from '../../../styles/mixins';
import { semantic } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';

const ATTEMPT_TYPES: readonly AttemptType[] = [
  'Exam 1',
  'Exam 2',
  'Other',
];

/**
 * Predefined semester options in chronological order.
 *
 * Keeping semester values predefined prevents free-form input,
 * avoids typos and ensures consistent semester formatting.
 */
const SEMESTERS = [
  'WiSe23/24',
  'SoSe24',
  'WiSe24/25',
  'SoSe25',
  'WiSe25/26',
  'SoSe26',
  'WiSe26/27',
  'SoSe27',
  'WiSe27/28',
  'SoSe28',
] as const;

export const CourseInfoStep = () => {
  const {
    sourceLabel,
    courseInfo: uploadCourseInfo,
    courseLocked,
    setCourseInfo: setUploadCourseInfo,
    setStep: setActiveStep,
  } = useUploadWizard();

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
        A table is always for one course and one semester &mdash; that can&apos;t vary within
        one import.{' '}
        {courseLocked ? (
          <>
            The course is already settled below; tell us which semester and sitting{' '}
            <Box component="span" sx={{ ...monoChip, px: 1 }}>
              {sourceLabel}
            </Box>{' '}
            covers.
          </>
        ) : (
          <>
            Tell us which one{' '}
            <Box component="span" sx={{ ...monoChip, px: 1 }}>
              {sourceLabel}
            </Box>{' '}
            is for.
          </>
        )}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        {courseLocked ? (
          <Box>
            <Typography variant="overline" sx={fieldLabel}>
              COURSE
            </Typography>
            <Box sx={{ ...toneSurface(semantic.success), p: 2, borderRadius: radii.lg }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {uploadCourseInfo.courseName}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
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
              sx={{ mt: 0.5, display: 'block' }}
            >
              Taken from the course you started this upload in and attached to every row,
              so there is nothing to type. A course or course-number column in the file is
              ignored.
            </Typography>
          </Box>
        ) : (
          <>
            <Box>
              <Typography variant="overline" sx={fieldLabel}>
                COURSE NUMBER
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={uploadCourseInfo.courseNumber}
                onChange={(e) => setUploadCourseInfo({ courseNumber: e.target.value })}
              />
            </Box>
            <Box>
              <Typography variant="overline" sx={fieldLabel}>
                COURSE NAME
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={uploadCourseInfo.courseName}
                onChange={(e) => setUploadCourseInfo({ courseName: e.target.value })}
              />
            </Box>
          </>
        )}
        <Box>
          <Typography
            variant="overline"
            sx={fieldLabel}
          >
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
            {courseLocked
              ? 'Recorded with the import. The course itself is fixed by the tab you came from, so the credits here never split it into a second course.'
              : 'Same course number but different credits (e.g. 6 vs 8) counts as a separate course instance.'}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={fieldLabel}
            id="attempt-type-label"
          >
            ATTEMPT TYPE
          </Typography>

          <Select
            fullWidth
            variant="outlined"
            labelId="attempt-type-label"
            value={uploadCourseInfo.attemptType}
            onChange={(e) =>
              setUploadCourseInfo({
                attemptType: e.target.value as AttemptType,
              })
            }
          >
            {ATTEMPT_TYPES.map((attempt) => (
              <MenuItem
                key={attempt}
                value={attempt}
              >
                {attempt}
              </MenuItem>
            ))}
          </Select>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
            }}
          >
            Saved on every record in this import, so you can compare how the
            first and second sitting of this course went later.
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="overline"
            sx={fieldLabel}
            id="semester-label"
          >
            SEMESTER
          </Typography>

          <Select
            fullWidth
            variant="outlined"
            labelId="semester-label"
            value={uploadCourseInfo.semester}
            displayEmpty
            onChange={(e) =>
              setUploadCourseInfo({
                semester: e.target.value,
              })
            }
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 320,
                },
              },
            }}
          >
            <MenuItem
              value=""
              disabled
            >
              Select semester
            </MenuItem>

            {SEMESTERS.map((semester) => (
              <MenuItem
                key={semester}
                value={semester}
              >
                {semester}
              </MenuItem>
            ))}
          </Select>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
            }}
          >
            Select the required semester from the predefined list.
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
          onClick={() => setActiveStep(2)}
          sx={{ px: 4 }}
        >
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};