import { useState } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
import type { Course } from '../../types';
import { radii } from '../../styles/tokens';
import { useAuthStore, useCourseDriveStore, useToastStore } from '../../stores';
import { CourseDriveTable } from './CourseDriveTable';
import { CourseDriveEmptyState } from './CourseDriveEmptyState';
import { CourseDriveDropZone } from './CourseDriveDropZone';

const FILE_INPUT_ID = 'course-drive-file';

interface CourseDriveViewProps {
  course: Course;
}

/**
 * Course Document Repository (Course Drive): file storage only.
 * Grade import stays on Upload Exam Data — this tab does not host the wizard.
 */
export const CourseDriveView = ({ course }: CourseDriveViewProps) => {
  const filesByCourse = useCourseDriveStore((s) => s.filesByCourse);
  const addFile = useCourseDriveStore((s) => s.addFile);
  const deleteFile = useCourseDriveStore((s) => s.deleteFile);
  const reparseFile = useCourseDriveStore((s) => s.reparseFile);
  const uploadingProgress = useCourseDriveStore((s) => s.uploadingProgress);
  const currentUser = useAuthStore((s) => s.user);
  const notifyToast = useToastStore((s) => s.notify);

  const courseId = course.course_id;
  const driveFiles = filesByCourse[String(courseId)] ?? [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');

  const uploadProgress = Object.values(uploadingProgress)[0] ?? 0;

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);
    try {
      const uploader = currentUser?.name || 'Dr. Instructor';
      await addFile(courseId, file, uploader, course.semester);
      notifyToast(`File "${file.name}" added to Course Drive`);
    } catch {
      notifyToast('Could not store file in Course Drive', 'error');
    } finally {
      setIsUploading(false);
      setUploadingFileName('');
    }
  };

  const handleDeleteDriveFile = (fileId: string) => {
    deleteFile(courseId, fileId);
    notifyToast('File deleted from Course Drive');
  };

  const handleReparseDriveFile = async (fileId: string) => {
    notifyToast('Re-parsing file data...');
    await reparseFile(courseId, fileId);
    notifyToast('File re-parsed successfully!');
  };

  const openFilePicker = () => {
    const fileInput = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    fileInput?.click();
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700">
          Course Document Repository
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Store and manage exam spreadsheets for {course.course_name} (ID: {course.course_id}).
          Import grades with Upload Exam Data.
        </Typography>
      </Box>

      <CourseDriveDropZone
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        currentFileName={uploadingFileName}
        fileInputId={FILE_INPUT_ID}
      />

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: radii.xl,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderSharedOutlinedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" fontWeight="700">
              Stored files
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

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download, re-parse, or remove spreadsheets kept for this course. File operations stay on this tab.
        </Typography>

        {driveFiles.length === 0 ? (
          <CourseDriveEmptyState onUploadClick={openFilePicker} />
        ) : (
          <CourseDriveTable
            files={driveFiles}
            onDelete={handleDeleteDriveFile}
            onReparse={(id) => { void handleReparseDriveFile(id); }}
          />
        )}
      </Paper>
    </Box>
  );
};
