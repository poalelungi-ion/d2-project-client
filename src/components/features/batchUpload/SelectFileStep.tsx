import { Box, Typography, Grid, Card, Button, useTheme } from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import { radii, typography } from '../../../styles/tokens';
import { dropZone, fieldLabel, selectableTile, warningBadge } from '../../../styles/mixins';

/** The sample spreadsheets offered on this step, each exercising a different mess. */
const DEMO_FILES = [
  {
    name: 'Klausur_DBS_WS2425.xlsx',
    description: 'Single "Name" column (Last, First). Fachsemester given as a plain integer.',
    columns: 'Matrikelnr - Name - Studiengang - Fachsemester - Note',
    issues: 'name not split · format issues',
  },
  {
    name: 'results_export.csv',
    description: 'Names already split, a percentage slipped into one grade.',
    columns: 'MatrNr - Vorname - Nachname - Program - Fachsemester - Grade',
    issues: 'invalid grade value',
  },
  {
    name: 'ExamPoints-example.xlsx',
    description:
      'Real exam-points export — per-question point columns and no Fachsemester column, so that required field stays empty.',
    columns:
      'Matrikelnr. - Last Name - First Name - Study Program - 1a - 1b - 2a - 2b - 3a - 3b - 4a - 4b - Points - Grade - Attended - Publish - Attest - Notes',
    issues: 'missing required columns · extra point columns',
  },
] as const;

export const SelectFileStep = () => {
  const {
    file,
    setFile,
    demoFile: selectedDemoFile,
    setDemoFile: setSelectedDemoFile,
    setStep: setActiveStep,
  } = useUploadWizard();

  const theme = useTheme();
  const brandColor = theme.palette.primary.main;

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mb: 4, color: 'text.secondary', fontSize: '1rem', maxWidth: 800 }}
      >
        Upload a spreadsheet from any lecturer. The system standardises the columns, flags
        problems automatically, and only saves once everything is clean.
      </Typography>
      <Box sx={{ ...dropZone(Boolean(file)), p: 8, textAlign: 'center', mb: 6 }}>
        <input
          accept=".xlsx, .xls, .csv, .tsv, .ods"
          style={{ display: 'none' }}
          id="excel-upload-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor="excel-upload-file"
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              bgcolor: theme.app.surface.well,
              borderRadius: radii.lg,
              p: 2,
              mb: 2,
              display: 'inline-flex',
            }}
          >
            <DownloadIcon sx={{ color: 'grey.600', fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight="700">
            Drag &amp; drop .xlsx, .xls or .csv
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every lecturer&apos;s file looks different &mdash; that&apos;s fine.
          </Typography>
        </label>
        {file && (
          <Typography variant="body1" color="success.main" fontWeight="600" sx={{ mt: 2 }}>
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      <Typography variant="overline" sx={{ ...fieldLabel, mb: 2 }}>
        DEMO FILES - PICK ONE TO SIMULATE AN UPLOAD
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {DEMO_FILES.map((demo) => {
          const selected = selectedDemoFile === demo.name;
          return (
            <Grid item xs={12} md={4} key={demo.name}>
              <Card
                variant="outlined"
                onClick={() => setSelectedDemoFile(demo.name)}
                sx={{ ...selectableTile(selected, brandColor), p: 2, height: '100%' }}
              >
                {selected && (
                  <CheckCircleIcon
                    color="primary"
                    sx={{ position: 'absolute', top: 16, right: 16 }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TableChartIcon sx={{ color: 'grey.600', mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="700">
                    {demo.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {demo.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'grey.500',
                    display: 'block',
                    mb: 2,
                    fontFamily: typography.mono,
                    lineHeight: 1.2,
                  }}
                >
                  {demo.columns}
                </Typography>
                <Box sx={warningBadge}>{demo.issues}</Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
        <Button variant="contained" size="large" onClick={() => setActiveStep(1)} sx={{ px: 4 }}>
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};
