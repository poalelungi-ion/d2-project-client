import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

import { useToastStore, isAcceptedSpreadsheet } from '../../stores';
import { radii } from '../../styles/tokens';
import { isTabularPaste } from '../../utils/tabularPaste';
import { convertPasteToExcel } from '../../api/uploads';

interface CourseDriveDropZoneProps {
  onUpload: (file: File) => Promise<void> | void;
  isUploading?: boolean;
  uploadProgress?: number;
  currentFileName?: string;
  selectedFileName?: string | null;
  fileInputId?: string;
}

export const CourseDriveDropZone = ({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  currentFileName,
  selectedFileName,
  fileInputId = 'excel-upload-file',
}: CourseDriveDropZoneProps) => {
  const notify = useToastStore((s) => s.notify);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // US-04: Client-side file validation
    if (!isAcceptedSpreadsheet(file)) {
      notify(
        `Invalid file type "${file.name}". Only spreadsheet files (.xlsx, .xls, .csv) are supported.`,
        'error',
      );
      return;
    }

    void onUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset file input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickBrowse = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (isUploading) return;
    const clipboardData = e.clipboardData;
    if (clipboardData.files && clipboardData.files.length > 0) {
      processFile(clipboardData.files[0]);
      return;
    }
    const text = clipboardData.getData('text/plain');
    if (text && text.trim() && isTabularPaste(text)) {
      e.preventDefault();
      notify('Tabular data detected! Converting to Excel file...', 'info');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `pasted_table_${timestamp}.xlsx`;
      try {
        const res = await convertPasteToExcel(text, filename);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], filename, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          void onUpload(file);
          return;
        }
      } catch {
        // fallback
      }
      const file = new File([text], `pasted_table_${timestamp}.csv`, { type: 'text/csv' });
      void onUpload(file);
    }
  };

  const handlePasteFromClipboard = async () => {
    if (isUploading) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        notify('Clipboard is empty. Copy cells from Excel or a CSV first.', 'info');
        return;
      }
      if (!isTabularPaste(text)) {
        notify('Clipboard content is not tabular data. Please copy rows from a spreadsheet.', 'error');
        return;
      }
      notify('Converting clipboard table into Excel (.xlsx) file...', 'info');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `pasted_table_${timestamp}.xlsx`;
      try {
        const res = await convertPasteToExcel(text, filename);
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], filename, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          void onUpload(file);
          return;
        }
      } catch {
        // fallback
      }
      const file = new File([text], `pasted_table_${timestamp}.csv`, { type: 'text/csv' });
      void onUpload(file);
    } catch {
      notify('Could not access clipboard automatically. Please click the dropzone and press Ctrl+V, or paste into the box below.', 'info');
    }
  };

  return (
    <Paper
      variant="outlined"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      sx={{
        p: 3.5,
        mb: 3,
        borderRadius: radii.xl,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragOver ? 'primary.main' : 'divider',
        bgcolor: (theme) => {
          if (isDragOver) {
            return theme.palette.mode === 'dark'
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(59, 130, 246, 0.05)';
          }
          return theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(0, 0, 0, 0.01)';
        },
        transition: 'all 0.2s ease-in-out',
        cursor: isUploading ? 'default' : 'pointer',
      }}
      onClick={isUploading ? undefined : handleClickBrowse}
    >
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {isUploading ? (
        // US-04: Active circular spinner and linear progress indicator during upload/parsing
        <Box sx={{ maxWidth: 460, mx: 'auto', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={32} thickness={4} color="primary" />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body1" fontWeight="700">
                {uploadProgress < 100 ? 'Uploading & Parsing File...' : 'Finalizing Exam Marks...'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentFileName ?? 'Exam spreadsheet'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 8, borderRadius: radii.sm }}
              />
            </Box>
            <Typography variant="caption" fontWeight="700" color="primary">
              {uploadProgress}%
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Extracting student grades, sitting attempts, and verifying study program matriculations...
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: (theme) =>
                isDragOver
                  ? 'primary.main'
                  : theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
              color: isDragOver ? '#fff' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>

          <Box>
            <Typography variant="body1" fontWeight="700">
              {isDragOver ? 'Drop spreadsheet file here' : 'Drag & drop exam spreadsheet here'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong> tables (max 25 MB)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleClickBrowse();
              }}
              sx={{
                borderRadius: radii.md,
                textTransform: 'none',
                px: 2.5,
                fontWeight: 600,
              }}
            >
              Browse from computer
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              startIcon={<ContentPasteIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => {
                e.stopPropagation();
                void handlePasteFromClipboard();
              }}
              sx={{
                borderRadius: radii.md,
                textTransform: 'none',
                px: 2,
                fontWeight: 600,
              }}
            >
              Paste table as Excel file
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Tip: You can also copy table cells from Excel/web and press <strong>Ctrl+V</strong> directly on this zone.
          </Typography>

          {selectedFileName && (
            <Typography variant="body1" color="success.main" fontWeight="600" sx={{ mt: 1.5 }}>
              Selected: {selectedFileName}
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
};
