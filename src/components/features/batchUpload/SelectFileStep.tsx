import { useState } from 'react';
import { Box, Typography, Button, TextField, Divider, Chip } from '@mui/material';
import {
  ContentPaste as ContentPasteIcon,
  FolderSharedOutlined as FolderSharedOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
} from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import {
  notify,
  useCourseDriveStore,
  useAuthStore,
  useToastStore,
} from '../../../stores';
import type { CourseDriveFile } from '../../../types';
import { CourseDriveDropZone } from '../../drive/CourseDriveDropZone';
import { CourseDriveTable } from '../../drive/CourseDriveTable';
import { CourseDriveEmptyState } from '../../drive/CourseDriveEmptyState';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { convertPasteToExcel } from '../../../api/uploads';
import { typography } from '../../../styles/tokens';
import { dropZone, fieldLabel } from '../../../styles/mixins';

export const SelectFileStep = () => {
  const {
    file,
    setFile,
    paste,
    setPaste,
    setStep: setActiveStep,
    courseInfo,
  } = useUploadWizard();

  const {
    getFilesForCourse,
    getFileBlob,
    fetchFileBlobAsync,
    addFile,
    deleteFile,
    reparseFile,
    uploadingProgress,
  } = useCourseDriveStore();

  const currentUser = useAuthStore((s) => s.user);
  const notifyToast = useToastStore((s) => s.notify);

  const courseId = courseInfo?.courseId;
  const driveFiles = courseId ? getFilesForCourse(courseId) : [];

  const [selectedDriveFileId, setSelectedDriveFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const hasPaste = Boolean(paste.trim());

  const handleUploadNewFile = async (droppedOrSelectedFile: File) => {
    // 1. Immediately update wizard state so step navigation and tests receive the file synchronously
    setFile(droppedOrSelectedFile);
    setSelectedDriveFileId(null);
    setPasteError(null);

    // 2. Persist to Course Drive history for this course
    if (courseId) {
      setIsUploading(true);
      setUploadingFileName(droppedOrSelectedFile.name);
      try {
        const uploader = currentUser?.name || 'Dr. Instructor';
        const created = await addFile(courseId, droppedOrSelectedFile, uploader, courseInfo?.semester);
        setActiveFileId(created.id);
        notifyToast(`File "${droppedOrSelectedFile.name}" added to Course Drive`);
      } catch {
        notifyToast('Could not store file in Course Drive history', 'error');
      } finally {
        setIsUploading(false);
        setActiveFileId(null);
        setUploadingFileName('');
      }
    }
  };

  const handleSelectDriveFile = async (doc: CourseDriveFile) => {
    setSelectedDriveFileId(doc.id);
    let realFile = getFileBlob(doc.id, courseId, doc.name);
    if (!realFile) {
      realFile = (await fetchFileBlobAsync(doc.id, courseId, doc.name)) ?? undefined;
    }

    if (realFile && realFile.size > 0) {
      setFile(realFile);
      setPaste('');
      setPasteError(null);
      notifyToast(`Selected "${doc.name}" from Course Drive for ingestion`);
    } else {
      notifyToast(
        `Please drop or browse "${doc.name}" from your computer to load its data.`,
        'info',
      );
      const fileInput = document.getElementById('excel-upload-file') as HTMLInputElement | null;
      fileInput?.click();
    }
  };

  const handleDeleteDriveFile = (fileId: string) => {
    if (courseId) {
      deleteFile(courseId, fileId);
      if (selectedDriveFileId === fileId) {
        setSelectedDriveFileId(null);
        setFile(null);
      }
      notifyToast('File deleted from Course Drive');
    }
  };

  const handleReparseDriveFile = async (fileId: string) => {
    if (courseId) {
      notifyToast('Re-parsing file data...');
      await reparseFile(courseId, fileId);
      notifyToast('File re-parsed successfully!');
    }
  };

  const handleCreateExcelFromPaste = async () => {
    if (!paste || !paste.trim()) {
      notifyToast('Please paste tabular data into the box first.', 'info');
      return;
    }
    if (!isTabularPaste(paste)) {
      setPasteError('Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.');
      notifyToast('Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.', 'error');
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
        await handleUploadNewFile(excelFile);
        notifyToast(`Created Excel file "${filename}" and added to Course Drive!`);
        return;
      }
    } catch {
      // fallback
    }
    const csvFile = new File([paste], `pasted_table_${timestamp}.csv`, { type: 'text/csv' });
    await handleUploadNewFile(csvFile);
    notifyToast(`Created spreadsheet file "${csvFile.name}" and added to Course Drive!`);
  };

  const handleDownloadExcelFromPaste = async () => {
    if (!paste || !paste.trim()) {
      notifyToast('Please paste tabular data into the box first.', 'info');
      return;
    }
    if (!isTabularPaste(paste)) {
      setPasteError('Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.');
      notifyToast('Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.', 'error');
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

  const continueToCourse = () => {
    if (file) {
      if (file.size === 0) {
        notify('The selected file is empty (0 bytes). Please browse or drop the valid spreadsheet.', 'error');
        return;
      }
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
    notify('Please select a file, choose an existing document, or paste tabular data first.', 'error');
  };

  const currentProgress = activeFileId ? uploadingProgress[activeFileId] ?? 70 : 0;

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mb: 4, color: 'text.secondary', fontSize: '1rem', maxWidth: 840 }}
      >
        Select an existing document from this course&apos;s repository, drop a new spreadsheet
        (.xlsx, .csv), or paste tabular grade rows directly from your clipboard.
        The 5-step wizard validates students, resolves study programs, maps columns, and imports grades.
      </Typography>

      {/* Section 1: Course Documents Hub */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderSharedOutlinedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" fontWeight="700">
              Course Documents Repository
            </Typography>
          </Box>
          {driveFiles.length > 0 && (
            <Chip
              label={`${driveFiles.length} ${driveFiles.length === 1 ? 'file' : 'files'} stored`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {driveFiles.length === 0 ? (
          <CourseDriveEmptyState
            onUploadClick={() => {
              const fileInput = document.getElementById('excel-upload-file') as HTMLInputElement | null;
              fileInput?.click();
            }}
          />
        ) : (
          <CourseDriveTable
            files={driveFiles}
            selectedFileId={selectedDriveFileId}
            onSelect={handleSelectDriveFile}
            onDelete={handleDeleteDriveFile}
            onReparse={handleReparseDriveFile}
          />
        )}
      </Box>

      {/* Section 2: Upload Drop Zone */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1.5 }}>
          Upload New Spreadsheet Document
        </Typography>
        <CourseDriveDropZone
          onUpload={handleUploadNewFile}
          isUploading={isUploading}
          uploadProgress={currentProgress}
          currentFileName={uploadingFileName}
          selectedFileName={file?.name}
          fileInputId="excel-upload-file"
        />
        {file && (
          <Typography variant="body1" color="success.main" fontWeight="600" sx={{ mt: 1, mb: 1 }}>
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      {/* Section 3: Tabular Paste Section */}
      <Divider sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ ...fieldLabel, mb: 0 }}>
          or paste tabular data
        </Typography>
      </Divider>

      <Box
        sx={{
          ...dropZone(hasPaste),
          p: 3,
          mb: 5,
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
            if (e.target.value) {
              setFile(null);
              setSelectedDriveFileId(null);
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
          <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<TableChartOutlinedIcon />}
              onClick={handleCreateExcelFromPaste}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Convert to Excel (.xlsx) &amp; Add to Course Drive / Drag &amp; Drop
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleDownloadExcelFromPaste}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Download as .xlsx
            </Button>
            <Typography variant="caption" color="text.secondary">
              (Turns your pasted table into an Excel document in Course Drive)
            </Typography>
          </Box>
        )}
      </Box>

      {/* Section 4: Continue Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={continueToCourse}
          sx={{ px: 4, py: 1.25, fontWeight: 700 }}
        >
          Continue to Course Info &rarr;
        </Button>
      </Box>
    </Box>
  );
};
