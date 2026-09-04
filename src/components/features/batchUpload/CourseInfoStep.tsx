import { Box, Typography, Button, TextField } from '@mui/material';
import { useUploadWizard } from './uploadWizardContext';
import { fieldLabel, monoChip, segmentedOption, segmentedTrack } from '../../../styles/mixins';

const EXAM_DATES = ['1st date', '2nd date'] as const;

export const CourseInfoStep = () => {
  const {
    demoFile: selectedDemoFile,
    courseInfo: uploadCourseInfo,
    setCourseInfo: setUploadCourseInfo,
    setStep: setActiveStep,
  } = useUploadWizard();

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mb: 4, color: 'text.secondary', fontSize: '1rem', maxWidth: 800 }}
      >
        A table is always for one course and one semester &mdash; that can&apos;t vary within
        a file. Tell us which one{' '}
        <Box component="span" sx={{ ...monoChip, px: 1 }}>
          {selectedDemoFile}
        </Box>{' '}
        is for.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            COURSE NUMBER
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={uploadCourseInfo.courseNumber}
            onChange={(e) =>
              setUploadCourseInfo({ courseNumber: e.target.value })
            }
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
            onChange={(e) =>
              setUploadCourseInfo({ courseName: e.target.value })
            }
          />
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
              setUploadCourseInfo({ ects: e.target.value })
            }
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            Same course number but different credits (e.g. 6 vs 8) counts as a separate
            course instance.
          </Typography>
        </Box>
        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            EXAM DATE
          </Typography>
          <Box sx={segmentedTrack}>
            {EXAM_DATES.map((date) => (
              <Button
                key={date}
                variant="text"
                onClick={() => setUploadCourseInfo({ examDate: date })}
                sx={{
                  ...segmentedOption(uploadCourseInfo.examDate === date),
                  px: 2,
                }}
              >
                {date}
              </Button>
            ))}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            Lets you compare how the first and second exam date went for this course later.
          </Typography>
        </Box>
        <Box>
          <Typography variant="overline" sx={fieldLabel}>
            SEMESTER
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={uploadCourseInfo.semester}
            onChange={(e) =>
              setUploadCourseInfo({ semester: e.target.value })
            }
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
        <Button variant="outlined" color="inherit" onClick={() => setActiveStep(0)} sx={{ px: 3 }}>
          &larr; Back
        </Button>
        <Button variant="contained" size="large" onClick={() => setActiveStep(2)} sx={{ px: 4 }}>
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};
