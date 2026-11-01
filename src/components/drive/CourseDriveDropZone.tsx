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
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

import { useToastStore, isAcceptedSpreadsheet } from '../../stores';
import { radii } from '../../styles/tokens';

interface CourseDriveDropZoneProps {
  onUpload: (file: File) => Promise<void> | void;
  isUploading?: boolean;
  uploadProgress?: number;
  currentFileName?: string;
  /** Staged spreadsheet shown in the dropzone until the lecturer removes it. */
  selectedFileName?: string;
  onClear?: () => void;
  fileInputId?: string;
}

export const CourseDriveDropZone = ({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
  currentFileName,
  selectedFileName,
  onClear,
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

  const handleClear = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear?.();
  };

  const hasStagedFile = Boolean(selectedFileName);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (isUploading) return;
    const files = e.clipboardData.files;
    if (files && files.length > 0) {
      processFile(files[0]);
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
        cursor: isUploading || hasStagedFile ? 'default' : 'pointer',
      }}
      onClick={isUploading || hasStagedFile ? undefined : handleClickBrowse}
    >
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {isUploading && !hasStagedFile ? (
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
      ) : hasStagedFile ? (
        <Stack spacing={1.5} alignItems="center">
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 36, color: 'success.main' }} />
          <Typography variant="body1" color="success.main" fontWeight="700">
            Selected: {selectedFileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Remove this file to return to an empty dropzone, or replace it with another spreadsheet.
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="medium"
              color="inherit"
              onClick={handleClear}
              sx={{
                borderRadius: radii.md,
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
              }}
            >
              Remove file
            </Button>
            <Button
              variant="contained"
              size="medium"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleClickBrowse();
              }}
              sx={{
                borderRadius: radii.md,
                textTransform: 'none',
                px: 3,
                fontWeight: 600,
              }}
            >
              Replace file
            </Button>
          </Stack>
        </Stack>
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

          <Button
            variant="contained"
            size="medium"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleClickBrowse();
            }}
            sx={{
              borderRadius: radii.md,
              textTransform: 'none',
              px: 3.5,
              py: 0.9,
              fontWeight: 600,
            }}
          >
            Browse from computer
          </Button>
        </Stack>
      )}
    </Paper>
  );
};
