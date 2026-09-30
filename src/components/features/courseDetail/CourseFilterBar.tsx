import {
  Box,
  Chip,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { CourseMark } from '../../../types';
import { chart } from '../../../styles/colors';
import { radii } from '../../../styles/tokens';
import { fieldLabel } from '../../../styles/mixins';
import { ALL_EXAMS, ALL_SEMESTERS, examsOf, sittingCount } from '../../../utils/courseMarks';
import type { ExamSelection } from '../../../utils/courseMarks';
import { SemesterExamFilter } from './SemesterExamFilter';

/** Which question the screen is answering: one sitting, or two against each other. */
export type CourseViewMode = 'single' | 'compare';

export interface ComparePair {
  left: ExamSelection;
  right: ExamSelection;
}

export type CompareSide = keyof ComparePair;

interface SittingPickerProps {
  /** "A" or "B", tinted to match the side's bars in the comparison below. */
  badge: string;
  color: string;
  /** Prefixes the dropdown labels, so the two sides have distinct names. */
  name: string;
  selection: ExamSelection;
  semesterOptions: readonly string[];
  /** The sittings held in the chosen semester, for the second dropdown. */
  examOptions: readonly string[];
  onChange: (selection: ExamSelection) => void;
}

const SittingPicker = ({
  badge,
  color,
  name,
  selection,
  semesterOptions,
  examOptions,
  onChange,
}: SittingPickerProps) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
    <Chip
      label={badge}
      size="small"
      sx={{ fontWeight: 700, bgcolor: color, color: 'common.white' }}
    />
    <TextField
      select
      size="small"
      label={`Semester ${name}`}
      value={selection.semester}
      onChange={(event) =>
        // "Exam 2" in one semester is a different sitting from "Exam 2" in
        // the next, and may not exist there at all, so it does not carry over.
        onChange({ semester: event.target.value, exam: ALL_EXAMS })
      }
      sx={{ width: 200 }}
    >
      <MenuItem value="">Select a semester…</MenuItem>
      {semesterOptions.map((semester) => (
        <MenuItem key={semester} value={semester}>
          {semester}
        </MenuItem>
      ))}
    </TextField>

    {/* Only worth offering once a semester actually held more than one
        sitting -- otherwise there is nothing to choose between. */}
    {examOptions.length > 1 && (
      <TextField
        select
        size="small"
        label={`Exam ${name}`}
        value={selection.exam}
        onChange={(event) => onChange({ ...selection, exam: event.target.value })}
        sx={{ width: 170 }}
      >
        <MenuItem value={ALL_EXAMS}>Whole semester</MenuItem>
        {examOptions.map((exam) => (
          <MenuItem key={exam} value={exam}>
            {exam}
          </MenuItem>
        ))}
      </TextField>
    )}
  </Box>
);

interface CourseFilterBarProps {
  /** Every sitting ever recorded, which is what both modes choose from. */
  allMarks: readonly CourseMark[];
  /** Options for the single-exam filter, shared with the marks table's copy. */
  semesterOptions: readonly string[];
  examOptions: readonly string[];
  mode: CourseViewMode;
  onSelectMode: (mode: CourseViewMode) => void;
  /** Single mode: the filter the figures, charts and marks table follow. */
  semesterFilter: string;
  examFilter: string;
  onSelectSemester: (value: string) => void;
  onSelectExam: (value: string) => void;
  /** Compare mode: the two sittings put against each other. */
  compare: ComparePair;
  onSelectCompare: (side: CompareSide, selection: ExamSelection) => void;
}

export const CourseFilterBar = ({
  allMarks,
  semesterOptions,
  examOptions,
  mode,
  onSelectMode,
  semesterFilter,
  examFilter,
  onSelectSemester,
  onSelectExam,
  compare,
  onSelectCompare,
}: CourseFilterBarProps) => {
  // One sitting is nothing to compare against, so the mode is not offered
  // until the course has held a second exam.
  const canCompare = sittingCount(allMarks) > 1;
  // A semester that is not chosen yet has no sittings to offer -- asking
  // examsOf anyway would answer with every sitting of every semester.
  const sittingsIn = (semester: string): string[] =>
    !semester || semester === ALL_SEMESTERS ? [] : examsOf(allMarks, semester);

  return (
    <Paper
      component="section"
      // Named so the mirrored copy in the marks table below is a separate,
      // addressable control rather than an indistinguishable duplicate.
      aria-label="Course filters"
      sx={{ p: 2.5, mb: 3, borderRadius: radii.xxl }}
    >
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        {canCompare && (
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, next: CourseViewMode | null) => {
              if (next) onSelectMode(next);
            }}
          >
            <ToggleButton value="single">Single exam</ToggleButton>
            <ToggleButton value="compare">Compare exams</ToggleButton>
          </ToggleButtonGroup>
        )}

        {mode === 'single' ? (
          <SemesterExamFilter
            semesterOptions={semesterOptions}
            examOptions={examOptions}
            semester={semesterFilter}
            exam={examFilter}
            onSelectSemester={onSelectSemester}
            onSelectExam={onSelectExam}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="caption" sx={fieldLabel} mb={0}>
              Compare two sittings
            </Typography>
            <SittingPicker
              badge="A"
              color={chart.cohort}
              name="A"
              selection={compare.left}
              semesterOptions={semesterOptions}
              examOptions={sittingsIn(compare.left.semester)}
              onChange={(selection) => onSelectCompare('left', selection)}
            />
            <SittingPicker
              badge="B"
              color={chart.highlight}
              name="B"
              selection={compare.right}
              semesterOptions={semesterOptions}
              examOptions={sittingsIn(compare.right.semester)}
              onChange={(selection) => onSelectCompare('right', selection)}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};
