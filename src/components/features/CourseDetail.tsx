import { useMemo, useState } from 'react';
import { Box, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Course, CourseMark, TranscriptEntry } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useApiMutations } from '../../hooks/useApi';
import { CourseFormDialog } from '../forms/CourseFormDialog';
import {
  ALL_EXAMS,
  ALL_SEMESTERS,
  examsOf,
  filterLabel,
  filterMarks,
  semestersOf,
  summariseMarks,
} from '../../utils/courseMarks';
import { CourseAnalytics } from './courseDetail/CourseAnalytics';
import { CourseHeader } from './courseDetail/CourseHeader';
import { CourseMarksTable } from './courseDetail/CourseMarksTable';
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

  const allMarks = useMemo(() => course.marks ?? [], [course.marks]);
  const semesterOptions = useMemo(() => semestersOf(allMarks), [allMarks]);

  // Sittings available inside the chosen semester. Two or more means the
  // lecturer can narrow further; one means there is nothing to choose between.
  const examOptions = useMemo(
    () => (semesterFilter === ALL_SEMESTERS ? [] : examsOf(allMarks, semesterFilter)),
    [allMarks, semesterFilter],
  );

  const marks = useMemo(
    () => filterMarks(allMarks, semesterFilter, examFilter),
    [allMarks, semesterFilter, examFilter],
  );

  // Recomputed from what is visible: course.avg_grade and friends describe
  // every semester at once, so they would contradict a filtered table.
  const summary = useMemo(() => summariseMarks(marks), [marks]);
  const activeFilter = filterLabel(semesterFilter, examFilter);

  const selectSemester = (value: string) => {
    setSemesterFilter(value);
    // "Exam 2" in one semester is a different sitting from "Exam 2" in the
    // next, and may not exist there at all, so the choice does not carry over.
    setExamFilter(ALL_EXAMS);
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
        <CourseAnalytics
          marks={marks}
          allMarks={allMarks}
          student={analyticsStudent}
          studentTranscript={analyticsStudentTranscript}
        />
        <CourseMarksTable
          marks={marks}
          semesterOptions={semesterOptions}
          examOptions={examOptions}
          semesterFilter={semesterFilter}
          examFilter={examFilter}
          activeFilter={activeFilter}
          onSelectSemester={selectSemester}
          onSelectExam={setExamFilter}
          onSelectStudent={selectAnalyticsStudent}
          onRefresh={onRefresh}
        />
      </Box>
    </Fade>
  );
};
