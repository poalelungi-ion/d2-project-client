import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

import type { CourseDriveFile } from '../../types';
import { radii } from '../../styles/tokens';
import { useToastStore, useCourseDriveStore } from '../../stores';

interface CourseDriveTableProps {
  files: CourseDriveFile[];
  onDelete: (fileId: string) => void;
  onReparse: (fileId: string) => void;
  onSelect?: (file: CourseDriveFile) => void;
  selectedFileId?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const CourseDriveTable = ({
  files,
  onDelete,
  onReparse,
  onSelect,
  selectedFileId,
}: CourseDriveTableProps) => {
  const notify = useToastStore((s) => s.notify);

  const handleDownload = (file: CourseDriveFile) => {
    notify(`Downloading "${file.name}"...`);
    const existing = useCourseDriveStore.getState().getFileBlob(file.id, file.course_id, file.name);
    let blob: Blob;
    if (existing && existing.size > 0) {
      blob = existing;
    } else {
      const sampleCsv = [
        'Student ID,Name,Study Program,Grade,Attempt',
        '1001,Anna Chiriciuc,SE Master,1.3,Exam 1',
        '1002,Ion Poalelungi,SE Master,1.7,Exam 1',
        '1003,Jacqueline Denise,SE Master,2.3,Exam 1',
        '1005,Erika Musterfrau,SE Master,1.7,Exam 1',
        '1006,Lukas Schmidt,SE Master,2.7,Exam 1',
        '1007,Sophie Wagner,SE Master,2.0,Exam 1',
        '1008,Leon Becker,Data Science Master,2.3,Exam 1',
      ].join('\n');
      blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8' });
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? file.name : `${file.name}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: radii.xl, overflow: 'hidden' }}
    >
      <Table size="medium">
        <TableHead
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Upload Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Uploaded By</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => {
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

              const isSelected = file.id === selectedFileId;

              return (
                <TableRow
                  key={file.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    transition: 'background-color 0.15s ease',
                    bgcolor: isSelected
                      ? (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(34, 197, 94, 0.12)'
                            : 'rgba(34, 197, 94, 0.06)'
                      : undefined,
                  }}
                >
                {/* File Name with type icon */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: radii.md,
                        bgcolor: isExcel ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isExcel ? '#10b981' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isExcel ? (
                        <TableChartOutlinedIcon fontSize="small" />
                      ) : (
                        <InsertDriveFileOutlinedIcon fontSize="small" />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight="600">
                        {file.name}
                      </Typography>
                      {file.status_message && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', maxWidth: 360, textOverflow: 'ellipsis', overflow: 'hidden' }}
                        >
                          {file.status_message}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                {/* Upload Date */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(file.uploaded_at)}
                  </Typography>
                </TableCell>

                {/* Size */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(file.size_bytes)}
                  </Typography>
                </TableCell>

                {/* Uploaded By */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {file.uploaded_by}
                  </Typography>
                </TableCell>

                {/* Status Badge (US-02 & US-04) */}
                <TableCell>
                  {file.status === 'parsed' ? (
                    <Chip
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      label="Parsed Successfully"
                      color="success"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderRadius: radii.sm,
                        bgcolor: 'rgba(34, 197, 94, 0.12)',
                        color: '#16a34a',
                        borderColor: 'rgba(34, 197, 94, 0.3)',
                      }}
                      variant="outlined"
                    />
                  ) : file.status === 'parsing' ? (
                    <Chip
                      icon={<HourglassEmptyIcon fontSize="small" />}
                      label="Parsing..."
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: radii.sm }}
                      variant="outlined"
                    />
                  ) : file.status === 'uploading' ? (
                    <Chip
                      label="Uploading..."
                      color="info"
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: radii.sm }}
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      icon={<ErrorOutlineIcon fontSize="small" />}
                      label="Parsing Error"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: radii.sm }}
                      variant="outlined"
                    />
                  )}
                </TableCell>

                {/* Action buttons */}
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                    {onSelect && (
                      <Button
                        variant={isSelected ? 'contained' : 'outlined'}
                        size="small"
                        color={isSelected ? 'success' : 'primary'}
                        onClick={() => onSelect(file)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          py: 0.25,
                          px: 1.5,
                          mr: 1,
                          borderRadius: radii.md,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSelected ? 'Selected for Ingestion' : 'Select for Ingestion'}
                      </Button>
                    )}
                    <Tooltip title="Download file">
                      <IconButton size="small" onClick={() => handleDownload(file)}>
                        <DownloadOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Re-parse file">
                      <IconButton size="small" onClick={() => onReparse(file.id)}>
                        <RefreshOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete from Course Drive">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(file.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
