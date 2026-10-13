import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  ContentPaste as ContentPasteIcon,
  FolderSharedOutlined as FolderSharedOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  CloudUploadOutlined as CloudUploadOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  PlaylistAdd as PlaylistAddIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import {
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
import { typography, radii } from '../../../styles/tokens';

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

  const [sourceTab, setSourceTab] = useState<'upload' | 'paste'>(paste.trim() ? 'paste' : 'upload');
  const [selectedDriveFileId, setSelectedDriveFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const hasPaste = Boolean(paste.trim());

  const detectedRowCount = useMemo(() => {
    if (!paste.trim()) return 0;
    const lines = paste.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.length > 1 ? lines.length - 1 : lines.length;
  }, [paste]);

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
      setSourceTab('upload');
      notifyToast(`Selected "${doc.name}" from Course Drive for ingestion`);
    } else {
      notifyToast(
        `Please drop or browse "${doc.name}" from your computer to load its data.`,
        'info',
      );
      setSourceTab('upload');
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

  const sampleData = `Matrikelnr\tName\tStudiengang\tFachsemester\tNote\n1012345\tMustermann, Max\tSoftware Engineering\t3\t1.7\n1012346\tMusterfrau, Anna\tInformatik\t2\t1.3\n1012347\tSchmidt, Lukas\tData Science\t4\t2.0`;

  const handleInsertSampleData = () => {
    setPaste(sampleData);
    setPasteError(null);
    setFile(null);
    setSelectedDriveFileId(null);
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
      setFile(null);
      setSelectedDriveFileId(null);
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
    if (sourceTab === 'upload') {
      if (file) {
        if (file.size === 0) {
          notifyToast('The selected file is empty (0 bytes). Please browse or drop a valid spreadsheet.', 'error');
          return;
        }
        setPasteError(null);
        setActiveStep(1);
        return;
      }
      if (hasPaste) {
        setSourceTab('paste');
        if (!isTabularPaste(paste)) {
          const message = 'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.';
          setPasteError(message);
          notifyToast(message, 'error');
          return;
        }
        setPasteError(null);
        setActiveStep(1);
        return;
      }
      notifyToast('Please select or browse a spreadsheet file first, or switch to the "Paste Data" tab.', 'error');
      return;
    }

    if (sourceTab === 'paste') {
      if (hasPaste) {
        if (!isTabularPaste(paste)) {
          const message = 'Pasted data is not tabular. Copy cells from a spreadsheet or paste CSV.';
          setPasteError(message);
          notifyToast(message, 'error');
          return;
        }
        setPasteError(null);
        setActiveStep(1);
        return;
      }
      if (file) {
        setSourceTab('upload');
        setPasteError(null);
        setActiveStep(1);
        return;
      }
      notifyToast('Please paste tabular rows or click "Insert Example" first.', 'error');
      return;
    }
  };

  const currentProgress = activeFileId ? uploadingProgress[activeFileId] ?? 70 : 0;

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{ mb: 3.5, color: 'text.secondary', fontSize: '1rem', maxWidth: 860 }}
      >
        Select an existing document from this course&apos;s repository, drop a new spreadsheet
        (.xlsx, .csv), or paste tabular grade rows directly from your clipboard.
        The 5-step wizard validates students, resolves study programs, maps columns, and imports grades.
      </Typography>

      {/* Section 1: Course Documents Repository */}
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
              setSourceTab('upload');
              const fileInput = document.getElementById('excel-upload-file') as HTMLInputElement | null;
              fileInput?.click();
            }}
          />
        ) : (
          <CourseDriveTable
            files={driveFiles}
            selectedFileId={selectedDriveFileId}
            onSelect={(doc) => { void handleSelectDriveFile(doc); }}
            onDelete={handleDeleteDriveFile}
            onReparse={(id) => { void handleReparseDriveFile(id); }}
          />
        )}
      </Box>

      {/* Section 2: Ingestion Source (Upload vs Paste Tabbed Card) */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: radii.lg,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, backgroundColor: 'action.hover' }}>
          <Tabs
            value={sourceTab}
            onChange={(_, val: 'upload' | 'paste') => setSourceTab(val)}
            textColor="primary"
            indicatorColor="primary"
            aria-label="Spreadsheet ingestion source tabs"
          >
            <Tab
              value="upload"
              icon={<CloudUploadOutlinedIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Upload Spreadsheet File"
              sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
            />
            <Tab
              value="paste"
              icon={<ContentPasteIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Paste Tabular Data</span>
                  {hasPaste && (
                    <Chip
                      size="small"
                      color="primary"
                      label={`${detectedRowCount} rows`}
                      sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  )}
                </Box>
              }
              sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Tab 1: File Upload Panel */}
        <Box
          sx={{
            p: 3,
            display: sourceTab === 'upload' ? 'block' : 'none',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag and drop your spreadsheet file (.xlsx, .xls, .csv) below or browse from your computer.
          </Typography>
          <CourseDriveDropZone
            onUpload={handleUploadNewFile}
            isUploading={isUploading}
            uploadProgress={currentProgress}
            currentFileName={uploadingFileName}
            fileInputId="excel-upload-file"
          />
          {file && (
            <Typography variant="body1" color="success.main" fontWeight="600" sx={{ mt: 1.5 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Box>

        {/* Tab 2: Paste Studio Panel */}
        <Box
          sx={{
            p: 3,
            display: sourceTab === 'paste' ? 'block' : 'none',
          }}
        >
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
      </Paper>

      {/* Section 3: Continue Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 1 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={continueToCourse}
          sx={{ px: 4, py: 1.25, fontWeight: 700, borderRadius: radii.md }}
        >
          Continue to Course Info &rarr;
        </Button>
      </Box>
    </Box>
  );
};
