import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  ContentPaste as ContentPasteIcon,
  CloudUploadOutlined as CloudUploadOutlinedIcon,
} from '@mui/icons-material';
import { useUploadWizard } from './uploadWizardContext';
import {
  useCourseDriveStore,
  useAuthStore,
  useToastStore,
} from '../../../stores';
import { CourseDriveDropZone } from '../../drive/CourseDriveDropZone';
import { isTabularPaste } from '../../../utils/tabularPaste';
import { radii } from '../../../styles/tokens';
import { PasteTabularPanel } from './PasteTabularPanel';

interface SelectFileStepProps {
  hideRepository?: boolean;
}

export const SelectFileStep = ({ hideRepository: _hideRepository = false }: SelectFileStepProps) => {
  const {
    file,
    setFile,
    paste,
    setPaste,
    setStep: setActiveStep,
    courseInfo,
  } = useUploadWizard();

  const {
    addFile,
    uploadingProgress,
  } = useCourseDriveStore();

  const currentUser = useAuthStore((s) => s.user);
  const notifyToast = useToastStore((s) => s.notify);

  const courseId = courseInfo?.courseId;

  const [sourceTab, setSourceTab] = useState<'upload' | 'paste'>(paste.trim() ? 'paste' : 'upload');
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
    setPasteError(null);

    // 2. Persist to Course Drive history for this course
    if (courseId) {
      setIsUploading(true);
      setUploadingFileName(droppedOrSelectedFile.name);
      try {
        const uploader = currentUser?.name || 'Dr. Instructor';
        const created = await addFile(courseId, droppedOrSelectedFile, uploader, courseInfo?.semester);
        setActiveFileId(created.id);
        notifyToast(`File "${droppedOrSelectedFile.name}" selected for upload`);
      } catch {
        notifyToast('Could not store file in Course Drive history', 'error');
      } finally {
        setIsUploading(false);
        setActiveFileId(null);
        setUploadingFileName('');
      }
    }
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
      notifyToast('Please paste tabular rows into the input field first.', 'error');
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
        Drop a new spreadsheet (.xlsx, .csv) or paste tabular grade rows directly from your clipboard.
        The 5-step wizard validates students, resolves study programs, maps columns, and imports grades.
      </Typography>

      {/* Ingestion Source (Upload vs Paste Tabbed Card) */}
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
            selectedFileName={file?.name}
            onClear={() => {
              setFile(null);
              setIsUploading(false);
              setUploadingFileName('');
              setActiveFileId(null);
            }}
            fileInputId="excel-upload-file"
          />
        </Box>

        {/* Tab 2: Paste Studio Panel */}
        <Box
          sx={{
            display: sourceTab === 'paste' ? 'block' : 'none',
          }}
        >
          <PasteTabularPanel
            paste={paste}
            setPaste={setPaste}
            pasteError={pasteError}
            setPasteError={setPasteError}
            onFileGenerated={handleUploadNewFile}
            onClearOtherSources={() => {
              setFile(null);
            }}
          />
        </Box>
      </Paper>

      {/* Continue Navigation */}
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
