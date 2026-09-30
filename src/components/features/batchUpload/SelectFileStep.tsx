import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, Divider, useTheme } from '@mui/material';
import { Download as DownloadIcon, ContentPaste as ContentPasteIcon } from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import { notify } from '../../../stores';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { radii, typography } from '../../../styles/tokens';
import { dropZone, fieldLabel } from '../../../styles/mixins';

export const SelectFileStep = () => {
  const { file, setFile, paste, setPaste, setStep: setActiveStep } = useUploadWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = useTheme();
  const hasPaste = Boolean(paste.trim());
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Browsers skip change when the same filename is picked again. Clear after
  // each selection (and when the wizard resets) so identical names can be uploaded.
  useEffect(() => {
    if (!file && fileInputRef.current) fileInputRef.current.value = '';
  }, [file]);

  const acceptFile = (next: File | null) => {
    setFile(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
          if (droppedFile) acceptFile(droppedFile);
        }}
      >
        <input
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv, .tsv, .ods"
          style={{ display: 'none' }}
          id="excel-upload-file"
          type="file"
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
        <Button variant="contained" size="large" onClick={continueToCourse} sx={{ px: 4 }}>
          Continue &rarr;
        </Button>
      </Box>
    </Box>
  );
};
