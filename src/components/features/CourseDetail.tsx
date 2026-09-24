import { useMemo, useState } from 'react';
import { Box, Fade, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Course, CourseMark, TranscriptEntry } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useApiMutations } from '../../hooks/useApi';
import { CourseFormDialog } from '../forms/CourseFormDialog';
import {
  ALL_EXAMS,
  ALL_SEMESTERS,
  EMPTY_SELECTION,
  filterLabel,
  filterMarks,
  summariseMarks,
} from '../../utils/courseMarks';
import type { ExamSelection } from '../../utils/courseMarks';
import { CourseAnalytics } from './courseDetail/CourseAnalytics';
import { CourseFilterBar } from './courseDetail/CourseFilterBar';
import type { ComparePair, CompareSide, CourseViewMode } from './courseDetail/CourseFilterBar';
import { CourseHeader } from './courseDetail/CourseHeader';
import { CourseMarksTable } from './courseDetail/CourseMarksTable';
import { ExamComparison } from './courseDetail/ExamComparison';
import { ImportSuccessBanner } from './courseDetail/ImportSuccessBanner';

interface CourseDetailProps {
  /** Resolved from :courseId by the route before this screen is mounted. */
  course: Course;
  /** Reloads course details and marks after an in-place edit or lecture-view grade save. */
  onRefresh: () => Promise<void>;
}

export const CourseDetail = ({ course, onRefresh }: CourseDetailProps) => {
  const { loadTranscript } = useApiMutations();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  // Which student out of this roster is plotted against the cohort. Only this
  // screen cares, so it stays here.
  const [analyticsStudent, setAnalyticsStudent] = useState<CourseMark | null>(null);
  const [analyticsStudentTranscript, setAnalyticsStudentTranscript] = useState<
    TranscriptEntry[]
  >([]);

  // Which offering of this course is on screen. The course row carries every
  // sitting ever recorded, so without this the tables and the headline figures
  // mix semesters together and no single sitting can be read on its own.
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL_SEMESTERS);
  const [examFilter, setExamFilter] = useState<string>(ALL_EXAMS);

  // Comparison mode is a second reading of the same course, not a second
  // filter: it names two sittings of its own and leaves the one above alone,
  // so returning to the single view lands back where the lecturer left it.
  const [mode, setMode] = useState<CourseViewMode>('single');
  const [compare, setCompare] = useState<ComparePair>({
    left: EMPTY_SELECTION,
    right: EMPTY_SELECTION,
  });

  const allMarks = useMemo(() => course.marks ?? [], [course.marks]);

  const marks = useMemo(
    () => filterMarks(allMarks, semesterFilter, examFilter),
    [allMarks, semesterFilter, examFilter],
  );

  // Recomputed from what is visible: course.avg_grade and friends describe
  // every semester at once, so they would contradict a filtered table.
  const summary = useMemo(() => summariseMarks(marks), [marks]);
  const activeFilter = filterLabel(semesterFilter, examFilter);
  const hasSubmissions = course.total_attempts > 0;

  const selectSemester = (value: string) => {
    setSemesterFilter(value);
    // "Exam 2" in one semester is a different sitting from "Exam 2" in the
    // next, and may not exist there at all, so the choice does not carry over.
    setExamFilter(ALL_EXAMS);
  };

  const selectCompare = (side: CompareSide, selection: ExamSelection) => {
    setCompare((current) => ({ ...current, [side]: selection }));
  };

  const selectAnalyticsStudent = (mark: CourseMark) => {
    setAnalyticsStudent(mark);
    setAnalyticsStudentTranscript([]);
    if (mark.student_id == null) return;
    void loadTranscript(mark.student_id).then(setAnalyticsStudentTranscript);
  };

  const returnToList = () => {
    setAnalyticsStudent(null);
    setAnalyticsStudentTranscript([]);
    void navigate(ROUTES.courses);
  };

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        {editing && (
          <CourseFormDialog
            course={course}
            onClose={() => setEditing(false)}
            onSaved={(savedCourseId) => {
              void onRefresh().then(() => {
                if (savedCourseId !== String(course.course_id)) {
                  void navigate(ROUTES.courseDetail(savedCourseId), { replace: true });
                }
              });
            }}
          />
        )}
        <ImportSuccessBanner />
        <CourseHeader
          course={course}
          summary={summary}
          activeFilter={activeFilter}
          onSelectSemester={selectSemester}
          onEdit={() => setEditing(true)}
          onBack={returnToList}
        />
        <CourseFilterBar
          allMarks={allMarks}
          mode={mode}
          onSelectMode={setMode}
          semesterFilter={semesterFilter}
          examFilter={examFilter}
          onSelectSemester={selectSemester}
          onSelectExam={setExamFilter}
          compare={compare}
          onSelectCompare={selectCompare}
        />
        {hasSubmissions ? (
          mode === 'single' ? (
            <CourseAnalytics
              marks={marks}
              allMarks={allMarks}
              student={analyticsStudent}
              studentTranscript={analyticsStudentTranscript}
            />
          ) : (
            <ExamComparison allMarks={allMarks} left={compare.left} right={compare.right} />
          )
        ) : (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="700" mb={0.5}>
              No submissions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload exam data to see the pass rate, grade distribution and other statistics.
            </Typography>
          </Paper>
        )}
        {/* The table stays on the filter above it whichever mode is showing:
            comparing is a reading of the course, not a change to the roster. */}
        <CourseMarksTable
          marks={marks}
          activeFilter={activeFilter}
          onSelectStudent={selectAnalyticsStudent}
          onRefresh={onRefresh}
        />
      </Box>
    </Fade>
  );
};
