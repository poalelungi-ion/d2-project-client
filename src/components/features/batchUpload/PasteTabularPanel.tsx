import { useMemo } from 'react';
import { Box, Typography, Button, TextField, Chip } from '@mui/material';
import {
  ContentPaste as ContentPasteIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  PlaylistAdd as PlaylistAddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { convertPasteToExcel } from '../../../api/uploads';
import { typography, radii } from '../../../styles/tokens';
import { useToastStore } from '../../../stores';

interface PasteTabularPanelProps {
  paste: string;
  setPaste: (val: string) => void;
  pasteError: string | null;
  setPasteError: (err: string | null) => void;
  onFileGenerated: (file: File) => Promise<void>;
  onClearOtherSources: () => void;
}

const SAMPLE_DATA = `Matrikelnr\tName\tStudiengang\tFachsemester\tNote\n1012345\tMustermann, Max\tSoftware Engineering\t3\t1.7\n1012346\tMusterfrau, Anna\tInformatik\t2\t1.3\n1012347\tSchmidt, Lukas\tData Science\t4\t2.0`;

export const PasteTabularPanel = ({
  paste,
  setPaste,
  pasteError,
  setPasteError,
  onFileGenerated,
  onClearOtherSources,
}: PasteTabularPanelProps) => {
  const notifyToast = useToastStore((s) => s.notify);

  const hasPaste = Boolean(paste.trim());

  const detectedRowCount = useMemo(() => {
    if (!paste.trim()) return 0;
    const lines = paste.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.length > 1 ? lines.length - 1 : lines.length;
  }, [paste]);

  const handleInsertSampleData = () => {
    setPaste(SAMPLE_DATA);
    setPasteError(null);
    onClearOtherSources();
    notifyToast('Sample grade table inserted!', 'info');
  };

  const handleClearPaste = () => {
    setPaste('');
    setPasteError(null);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        notifyToast('Clipboard is empty. Copy cells from Excel or CSV first.', 'info');
        return;
      }
      setPaste(text);
      setPasteError(null);
      onClearOtherSources();
      notifyToast('Pasted content from clipboard!', 'info');
    } catch {
      notifyToast('Could not read clipboard directly. Please click inside the box and press Ctrl+V.', 'info');
    }
  };

  const handleCreateExcelFromPaste = async () => {
    if (!paste || !paste.trim()) {
      notifyToast('Please paste tabular data into the box first.', 'info');
      return;
    }
    if (!isTabularPaste(paste)) {
      const err = 'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.';
      setPasteError(err);
      notifyToast(err, 'error');
      return;
    }
    setPasteError(null);
    notifyToast('Converting pasted table into Excel (.xlsx) file...', 'info');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `pasted_table_${timestamp}.xlsx`;
    try {
      const res = await convertPasteToExcel(paste, filename);
      if (res.ok) {
        const blob = await res.blob();
        const excelFile = new File([blob], filename, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        await onFileGenerated(excelFile);
        notifyToast(`Created Excel file "${filename}" and added to Course Drive!`);
        return;
      }
    } catch {
      // fallback to CSV
    }
    const csvFile = new File([paste], `pasted_table_${timestamp}.csv`, { type: 'text/csv' });
    await onFileGenerated(csvFile);
    notifyToast(`Created spreadsheet file "${csvFile.name}" and added to Course Drive!`);
  };

  const handleDownloadExcelFromPaste = async () => {
    if (!paste || !paste.trim()) {
      notifyToast('Please paste tabular data into the box first.', 'info');
      return;
    }
    if (!isTabularPaste(paste)) {
      const err = 'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.';
      setPasteError(err);
      notifyToast(err, 'error');
      return;
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `pasted_table_${timestamp}.xlsx`;
    try {
      const res = await convertPasteToExcel(paste, filename);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        notifyToast(`Downloaded "${filename}"!`);
        return;
      }
    } catch {
      // fallback
    }
    const blob = new Blob([paste], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pasted_table_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifyToast(`Downloaded "pasted_table_${timestamp}.csv"!`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Copy table cells from Microsoft Excel, Google Sheets, or a CSV file (including the header row) and paste below.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentPasteIcon />}
            onClick={() => {
              void handlePasteFromClipboard();
            }}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: radii.md }}
          >
            Paste from Clipboard
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<PlaylistAddIcon />}
            onClick={handleInsertSampleData}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Insert Example
          </Button>
          {hasPaste && (
            <Button
              variant="text"
              size="small"
              color="inherit"
              startIcon={<ClearIcon />}
              onClick={handleClearPaste}
              sx={{ textTransform: 'none' }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      <TextField
        multiline
        minRows={7}
        maxRows={14}
        fullWidth
        placeholder={'Matrikelnr\tName\tStudiengang\tFachsemester\tNote\n1012345\tSchneider, Lena\tSE Master\t3\t1.7\n1012346\tMuster, Max\tCS Bachelor\t1\t2.3'}
        value={paste}
        onChange={(e) => {
          setPasteError(null);
          setPaste(e.target.value);
          if (e.target.value) {
            onClearOtherSources();
          }
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

      {hasPaste && (
        <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label={`${detectedRowCount} ${detectedRowCount === 1 ? 'row' : 'rows'} detected`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<TableChartOutlinedIcon />}
            onClick={() => {
              void handleCreateExcelFromPaste();
            }}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: radii.md }}
          >
            Save as Excel (.xlsx) to Course Drive
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => {
              void handleDownloadExcelFromPaste();
            }}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: radii.md }}
          >
            Download as .xlsx
          </Button>
        </Box>
      )}
    </Box>
  );
};
