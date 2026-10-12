import { Box, Typography, Stepper, Step, StepLabel } from '@mui/material';
import type { Course } from '../../types';
import { STEPS } from '../../utils/constants';
import { UploadWizardProvider } from '../features/batchUpload/UploadWizardProvider';
import { useUploadWizard } from '../features/batchUpload/uploadWizardContext';
import { SelectFileStep } from '../features/batchUpload/SelectFileStep';
import { CourseInfoStep } from '../features/batchUpload/CourseInfoStep';
import { MapColumnsStep } from '../features/batchUpload/MapColumnsStep';
import { ReviewStep } from '../features/batchUpload/ReviewStep';
import { DoneStep } from '../features/batchUpload/DoneStep';

const STEP_COMPONENTS = [SelectFileStep, CourseInfoStep, MapColumnsStep, ReviewStep, DoneStep];

interface CourseDriveViewProps {
  course: Course;
  onMarksUpdated?: () => Promise<void>;
  onLaunchWizard?: () => void;
}

const CourseDriveWizardBody = ({ course }: { course: Course }) => {
  const { step } = useUploadWizard();
  const CurrentStep = STEP_COMPONENTS[step];

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700">
          Course Drive &amp; Ingestion Wizard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Centralized documents repository and 5-step automated exam ingestion for{' '}
          {course.course_name} (ID: {course.course_id}).
        </Typography>
      </Box>

      {/* 5-Step Ingestion Wizard Stepper */}
      <Box sx={{ width: '100%', mb: 5 }}>
        <Stepper activeStep={step} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Current Step component (Step 1 is SelectFileStep: Course Drive & Documents) */}
      {CurrentStep ? <CurrentStep /> : null}
    </Box>
  );
};

export const CourseDriveView = ({
  course,
  onMarksUpdated,
}: CourseDriveViewProps) => {
  return (
    <UploadWizardProvider
      course={{ id: course.course_id, name: course.course_name }}
      onImportSuccess={onMarksUpdated}
    >
      <CourseDriveWizardBody course={course} />
    </UploadWizardProvider>
  );
};
