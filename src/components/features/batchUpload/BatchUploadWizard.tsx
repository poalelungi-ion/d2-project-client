import { Box, Typography, Stepper, Step, StepLabel, Fade } from '@mui/material';
import { useLocation } from 'react-router-dom';
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

const handoffCourseName = (state: unknown): string | undefined =>
  state !== null &&
    typeof state === 'object' &&
    'courseName' in state &&
    typeof state.courseName === 'string'
    ? state.courseName
    : undefined;

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

  return (
    <UploadWizardProvider initialCourseName={handoffCourseName(routeState)}>
      <Fade in={true} timeout={800}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 4,
            maxWidth: 1100,
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
