import { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import type { CourseHistoryRow } from '../../../utils/courseMarks';
import type { CourseMark } from '../../../types';
import { radii } from '../../../styles/tokens';
import { chart, gradeOutcomeColor } from '../../../styles/colors';
import { formatGrade, outcomeLabel } from '../../../utils/gradeOutcome';
import { compareSemesters } from '../../../utils/semester';

interface StudentAttemptsDialogProps {
  open: boolean;
  historyRow: CourseHistoryRow | null;
  courseName?: string;
  onClose: () => void;
  onEditAttempt: (mark: CourseMark) => void;
}

export const StudentAttemptsDialog = ({
  open,
  historyRow,
  courseName,
  onClose,
  onEditAttempt,
}: StudentAttemptsDialogProps) => {
  const marks = useMemo(() => {
    const raw = historyRow?.marks || [];
    return [...raw].sort((a, b) => {
      const semDiff = compareSemesters(a.semester, b.semester);
      if (semDiff !== 0) return semDiff;
      if (a.attempt_type === 'Exam 1' && b.attempt_type === 'Exam 2') return -1;
      if (a.attempt_type === 'Exam 2' && b.attempt_type === 'Exam 1') return 1;
      return (a.result_id || 0) - (b.result_id || 0);
    });
  }, [historyRow]);

  if (!historyRow) return null;
  const bestMarkText = formatGrade(historyRow.best_grade, historyRow.best_absence);
  const isPassed = historyRow.final_status === 'Passed';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: radii.xl,
          p: 1,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: radii.md,
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
              display: 'flex',
            }}
          >
            <HistoryEduIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Exam Attempts History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {historyRow.student_name} (ID: {historyRow.student_id}) · {historyRow.program}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={isPassed ? 'Final Status: Passed' : 'Final Status: Failed'}
          color={isPassed ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        {/* Course & Best Mark Highlight */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: radii.md,
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              Course Context
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {courseName || 'Course'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Recorded Attempts: <strong>{marks.length}</strong>
            </Typography>
          </Box>

          <Box sx={{ textAlign: { sm: 'right', xs: 'left' } }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              Best Academic Mark
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
              <Chip
                label={bestMarkText}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  bgcolor: isPassed ? `${chart.pass}22` : `${chart.fail}22`,
                  color: isPassed ? chart.pass : chart.fail,
                  border: `1px solid ${isPassed ? chart.pass : chart.fail}`,
                }}
              />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {historyRow.best_attempt_label || 'Registered Sitting'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Detailed Attempts Breakdown Table */}
        <Paper variant="outlined" sx={{ borderRadius: radii.md, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 70 }}>Attempt</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sitting / Exam Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mark</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Outcome</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marks.map((m, idx) => {
                const markGradeText = formatGrade(m.grade, m.absence_code);
                const markPassed = m.passed || m.outcome === 'passed';
                const isBest =
                  (m.grade != null && m.grade === historyRow.best_grade) ||
                  (m.absence_code && m.absence_code === historyRow.best_absence);

                return (
                  <TableRow
                    key={m.result_id || `${m.semester}-${idx}`}
                    hover
                    sx={{
                      bgcolor: isBest
                        ? (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(76, 175, 80, 0.08)'
                              : 'rgba(76, 175, 80, 0.04)'
                        : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        #{idx + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {m.semester}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={m.attempt_type || 'Other'}
                        variant={m.attempt_type === 'Exam 1' ? 'filled' : 'outlined'}
                        color={m.attempt_type === 'Exam 1' ? 'primary' : 'default'}
                        sx={{ fontSize: '0.72rem', height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {markGradeText}
                        </Typography>
                        {isBest && (
                          <Chip
                            label="Best"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: gradeOutcomeColor(m.outcome || (markPassed ? 'passed' : 'failed')) }}
                      >
                        {outcomeLabel(m.outcome, markPassed)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon sx={{ fontSize: '0.85rem' }} />}
                        onClick={() => {
                          onEditAttempt(m);
                        }}
                        sx={{
                          py: 0.25,
                          px: 1,
                          fontSize: '0.72rem',
                          textTransform: 'none',
                          borderRadius: radii.sm,
                          fontWeight: 700,
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
