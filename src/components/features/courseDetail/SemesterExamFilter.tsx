import { Box, MenuItem, TextField } from '@mui/material';
import { ALL_EXAMS, ALL_SEMESTERS } from '../../../utils/courseMarks';

interface SemesterExamFilterProps {
  /** Every semester this course has been offered in. */
  semesterOptions: readonly string[];
  /** Sittings held in the chosen semester, empty while none is chosen. */
  examOptions: readonly string[];
  semester: string;
  exam: string;
  onSelectSemester: (value: string) => void;
  onSelectExam: (value: string) => void;
}

export const SemesterExamFilter = ({
  semesterOptions,
  examOptions,
  semester,
  exam,
  onSelectSemester,
  onSelectExam,
}: SemesterExamFilterProps) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <TextField
      select
      size="small"
      label="Semester"
      value={semester}
      onChange={(event) => onSelectSemester(event.target.value)}
      disabled={semesterOptions.length === 0}
      sx={{ width: 200 }}
    >
      <MenuItem value={ALL_SEMESTERS}>All semesters</MenuItem>
      {semesterOptions.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>

    {/* Only worth offering once a semester actually held more than one
        sitting -- otherwise there is nothing to choose between. */}
    {examOptions.length > 1 && (
      <TextField
        select
        size="small"
        label="Exam"
        value={exam}
        onChange={(event) => onSelectExam(event.target.value)}
        sx={{ width: 170 }}
      >
        <MenuItem value={ALL_EXAMS}>All exams</MenuItem>
        {examOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    )}
  </Box>
);
