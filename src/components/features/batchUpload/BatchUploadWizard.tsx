import { Box, Typography, Stepper, Step, StepLabel, Fade } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import type { UploadCourseHandoff } from '../../../types';
import { ROUTES } from '../../../app/navigation';
import { STEPS } from '../../../utils/constants';
import { pageTitle } from '../../../styles/mixins';
import { UploadWizardProvider } from './UploadWizardProvider';
import { useUploadWizard } from './uploadWizardContext';
import { SelectFileStep } from './SelectFileStep';
import { CourseInfoStep } from './CourseInfoStep';
import { MapColumnsStep } from './MapColumnsStep';
import { ReviewStep } from './ReviewStep';
import { DoneStep } from './DoneStep';

const STEP_COMPONENTS = [SelectFileStep, CourseInfoStep, MapColumnsStep, ReviewStep, DoneStep];

/**
 * The course a Course view handed over. Both halves must be present: an id
 * without a name (or the reverse) is not a course this wizard can lock onto.
 */
const courseHandoff = (state: unknown): UploadCourseHandoff | undefined => {
  if (state === null || typeof state !== 'object') return undefined;
  const { courseId, courseName } = state as Record<string, unknown>;
  if (typeof courseId !== 'number' || typeof courseName !== 'string') return undefined;
  return { id: courseId, name: courseName };
};

const WizardBody = () => {
  const { step } = useUploadWizard();
  const CurrentStep = STEP_COMPONENTS[step];

  return (
    <>
      <Box sx={{ width: '100%', mb: 6 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {CurrentStep ? <CurrentStep /> : null}
    </>
  );
};

export const BatchUploadWizard = () => {
  // React Router types route state as `any`; narrow it before trusting it.
  const routeState: unknown = useLocation().state;
  const course = courseHandoff(routeState);

  // Reached without a course (e.g. a stale link) -- there is no standalone
  // wizard anymore, so send the lecturer to pick a course instead.
  if (!course) return <Navigate to={ROUTES.courses} replace />;

  return (
    <UploadWizardProvider course={course}>
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 4,
            maxWidth: 1600,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ ...pageTitle, mb: 1 }}>
            Import grades
          </Typography>

          <WizardBody />
        </Box>
      </Fade>
    </UploadWizardProvider>
  );
};
