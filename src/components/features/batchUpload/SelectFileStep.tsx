import { useState } from 'react';
import { Box, Typography, Grid, Card, Button, TextField, Divider, useTheme } from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  TableChart as TableChartIcon,
  ContentPaste as ContentPasteIcon,
} from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import { notify } from '../../../stores';
import { isTabularPaste } from '../../../utils/tabularPaste';
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
    paste,
    setPaste,
    demoFile: selectedDemoFile,
    setDemoFile: setSelectedDemoFile,
    setStep: setActiveStep,
  } = useUploadWizard();

  const theme = useTheme();
  const brandColor = theme.palette.primary.main;
  const hasPaste = Boolean(paste.trim());
  const [pasteError, setPasteError] = useState<string | null>(null);

  const continueToCourse = () => {
    if (file) {
      setPasteError(null);
      setActiveStep(1);
      return;
    }
    if (hasPaste) {
      if (!isTabularPaste(paste)) {
        const message =
          'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.';
        setPasteError(message);
        notify(message, 'error');
        return;
      }
      setPasteError(null);
      setActiveStep(1);
      return;
    }
    notify('Please select a file or paste tabular data first.', 'error');
  };

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mb: 4, color: 'text.secondary', fontSize: '1rem', maxWidth: 800 }}
      >
        Upload a spreadsheet or paste rows copied from Excel, LibreOffice or Google Sheets.
        The system standardises the columns, flags problems automatically, and only saves
        once everything is clean.
      </Typography>
      <Box 
        sx={{ ...dropZone(Boolean(file)), p: 8, textAlign: 'center', mb: 6 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) {
            setFile(droppedFile);
          }
        }}
      >
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

      <Divider sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ ...fieldLabel, mb: 0 }}>
          or paste tabular data
        </Typography>
      </Divider>

      <Box
        sx={{
          ...dropZone(hasPaste),
          p: 3,
          mb: 6,
          cursor: 'default',
          textAlign: 'left',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <ContentPasteIcon sx={{ color: 'grey.600' }} />
          <Typography variant="subtitle1" fontWeight="700">
            Paste from a spreadsheet
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Copy the cells (including the header row) and paste them here. Tab-separated and CSV
          both work.
        </Typography>
        <TextField
          multiline
          minRows={6}
          maxRows={14}
          fullWidth
          placeholder={'Matrikelnr\tName\tStudiengang\tFachsemester\tNote\n1012345\tSchneider, Lena\tSE Master\t3\t1.7'}
          value={paste}
          onChange={(e) => {
            setPasteError(null);
            setPaste(e.target.value);
          }}
          error={Boolean(pasteError)}
          helperText={pasteError}
          inputProps={{ 'aria-label': 'Paste tabular grade data' }}
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: typography.mono,
              fontSize: '0.85rem',
              whiteSpace: 'pre',
            },
          }}
        />
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
        <Button variant="contained" size="large" onClick={continueToCourse} sx={{ px: 4 }}>
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};
