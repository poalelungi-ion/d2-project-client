import { useState, useCallback, useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import {
  getStats,
  listCourses,
  createCourse,
  updateCourse,
  setCourseArchived,
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  updateStudentStatus,
  addStudentGrade,
  saveGrades,
  uploadFile,
  previewUpload,
  confirmUpload,
} from '../api/index';
import type {
  CourseCreatePayload,
  CourseUpdatePayload,
  StudentCreatePayload,
  StudentUpdatePayload,
} from '../api/index';
import type {
  AddGradeFormValues,
  ApiError,
  Course,
  CourseFormErrors,
  CourseFormValues,
  CourseMark,
  CoursesSortBy,
  FormMode,
  NameSplitRule,
  PreviewRecord,
  Stats,
  Student,
  StudentDetails,
  StudentFormErrors,
  StudentFormValues,
  StudentStatus,
  ThemeMode,
  Toast,
  TranscriptEntry,
  UploadConfirmResponse,
  UploadCourseInfo,
  UploadFormValues,
  UploadPreviewResponse,
  ViewMode,
} from '../types';

/**
 * Pulls `detail` out of a FastAPI error body without assuming the response is
 * JSON at all -- a 502 from a proxy in front of the API is plain HTML.
 */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    return body.detail ?? `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export function useAppLogic() {
  // === STATE DEFINITIONS & HOOKS ===
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const [activeTab, setActiveTab] = useState('Analysis Hub');
  const [coursesData, setCoursesData] = useState<Course[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetails | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [analyticsStudent, setAnalyticsStudent] = useState<CourseMark | null>(null);
  const [analyticsStudentTranscript, setAnalyticsStudentTranscript] = useState<
    TranscriptEntry[]
  >([]);

  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [courseFormMode, setCourseFormMode] = useState<FormMode>('create');
  const [courseForm, setCourseForm] = useState<CourseFormValues>({
    course_id: '',
    course_name: '',
    semester: '',
    study_program: '',
    professor: '',
  });
  const [courseFormErrors, setCourseFormErrors] = useState<CourseFormErrors>({});
  const [editCourseVersion, setEditCourseVersion] = useState(1);

  const [addGradeDialogOpen, setAddGradeDialogOpen] = useState(false);
  const [addGradeForm, setAddGradeForm] = useState<AddGradeFormValues>({
    course_id: '',
    semester: 'WiSe23/24',
    grade: 1.0,
  });
  const [archiveTab, setArchiveTab] = useState(0);

  const [newCourseName, setNewCourseName] = useState('');
  const [uploadForm, setUploadForm] = useState<UploadFormValues>({
    semester: '',
    course: '',
    file: null,
  });
  const [previewData, setPreviewData] = useState<PreviewRecord[]>([]);
  const [gridApi, setGridApi] = useState<GridApi<PreviewRecord> | null>(null);
  const [uploadPreview, setUploadPreview] = useState<unknown>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDemoFile, setSelectedDemoFile] = useState('Klausur_DBS_WS2425.xlsx');

  // Batch Data Upload UI State
  const [uploadCourseInfo, setUploadCourseInfo] = useState<UploadCourseInfo>({
    courseNumber: '3545',
    courseName: 'SE Tools Lab',
    ects: '6',
    examDate: '1st date',
    semester: 'WiSe 2024/25',
  });
  const [nameSplitRule, setNameSplitRule] = useState<NameSplitRule>('Last, First');
  const [stats, setStats] = useState<Stats>({ kpis: {}, toughest_courses: [], atRisk: [] });
  const [toast, setToast] = useState<Toast>({ open: false, message: '', severity: 'success' });

  // Columns for student-specific grid
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesSortBy, setCoursesSortBy] = useState<CoursesSortBy>('name');
  const [studentViewMode, setStudentViewMode] = useState<ViewMode>('table');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState<FormMode>('create');
  const [studentForm, setStudentForm] = useState<StudentFormValues>({
    student_id: '',
    first_name: '',
    last_name: '',
    program: '',
    status: 'active',
  });
  const [studentFormErrors, setStudentFormErrors] = useState<StudentFormErrors>({});
  const [editStudentVersion, setEditStudentVersion] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [newCourseId, setNewCourseId] = useState('');
  const [studentColumnDefs] = useState<ColDef<TranscriptEntry>[]>([
    { field: 'result_id', headerName: 'ID', hide: true },
    { field: 'attempt', headerName: 'Attempt #', editable: false, flex: 0.8 },
    { field: 'semester', headerName: 'Semester', editable: false, flex: 1 },
    { field: 'course', headerName: 'Course', editable: false, flex: 2 },
    {
      field: 'grade',
      headerName: 'Grade (1.0-5.0)',
      editable: true,
      flex: 1,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold', backgroundColor: 'rgba(0, 0, 0, 0.05)' },
    },
    {
      field: 'passed',
      headerName: 'Passed?',
      editable: true,
      flex: 1,
      cellEditor: 'agCheckboxCellEditor',
    },
  ]);

  // === API DATA FETCHING ===
  /**
   * Fetches global KPI stats, courses, and students data from the backend.
   * Populates the primary dashboard and grid tables.
   */
  const fetchData = useCallback(async () => {
    try {
      const [statRes, courseRes, studentRes] = await Promise.all([
        getStats(),
        listCourses(),
        listStudents(),
      ]);
      setStats((await statRes.json()) as Stats);
      setCoursesData((await courseRes.json()) as Course[]);
      setStudentsData((await studentRes.json()) as Student[]);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const fetchStudentTranscript = useCallback(async (student_id: number) => {
    try {
      const res = await getStudent(student_id);
      const data = (await res.json()) as StudentDetails;
      setSelectedStudent(data);
    } catch (e) {
      console.error('Failed to fetch transcript', e);
    }
  }, []);

  /**
   * Reads every row back out of the grid -- including inline edits that have
   * not left the client yet -- and persists the batch.
   */
  const saveGradesToDB = async (
    gridReference: RefObject<AgGridReact<TranscriptEntry> | null>,
  ) => {
    const api = gridReference.current?.api;
    if (!api) return;

    const rowDataArray: TranscriptEntry[] = [];
    api.forEachNode((node) => {
      if (node.data) rowDataArray.push(node.data);
    });

    try {
      const res = await saveGrades(rowDataArray);
      if (res.ok) {
        setToast({ open: true, message: 'Database updated successfully!', severity: 'success' });
        void fetchData();
        if (selectedStudent) void fetchStudentTranscript(selectedStudent.student_id);
      } else {
        setToast({
          open: true,
          message:
            res.status === 409
              ? 'Update failed: Data was modified by another user. Please refresh.'
              : `Validation Error: ${await errorDetail(res)}`,
          severity: 'error',
        });
        if (res.status === 409) void fetchData(); // Auto refresh
      }
    } catch {
      setToast({ open: true, message: 'Network error occurred', severity: 'error' });
    }
  };

  const openCourseForm = (course: Course | null = null) => {
    if (course) {
      setCourseFormMode('edit');
      setCourseForm({
        course_id: course.course_id?.toString() ?? '',
        course_name: course.course_name || '',
        semester: course.semester || '',
        study_program: course.study_program || '',
        professor: course.assigned_professor || '',
      });
      setEditCourseVersion(course.version || 1);
    } else {
      setCourseFormMode('create');
      setCourseForm({
        course_id: '',
        course_name: '',
        semester: '',
        study_program: '',
        professor: '',
      });
    }
    setCourseFormErrors({});
    setCourseFormOpen(true);
  };

  const courseColumnDefs = useMemo<ColDef<Course>[]>(
    () => [
      { field: 'course_id', headerName: 'ID', flex: 0.8 },
      { field: 'course_name', headerName: 'Name', flex: 2 },
      { field: 'semester', headerName: 'Semester', flex: 1 },
      { field: 'assigned_professor', headerName: 'Professor', flex: 1.5 },
      { field: 'total_attempts', headerName: 'Submissions', flex: 1 },
      {
        field: 'pass_rate',
        headerName: 'Pass Rate',
        flex: 1,
        cellRenderer: (params: ICellRendererParams<Course, number>) => {
          const color = (params.value ?? 0) > 50 ? '#2E7D32' : '#D32F2F';
          return <span style={{ color: color, fontWeight: 'bold' }}>{params.value}%</span>;
        },
      },
      { field: 'avg_grade', headerName: 'Avg Grade', flex: 1 },
      {
        headerName: 'Actions',
        colId: 'actions',
        flex: 0.8,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Course>) => (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (params.data) openCourseForm(params.data);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [],
  );

  /**
   * Opens the unified Create/Edit Student Profile dialog.
   * For editing, it pre-populates fields and cleanly splits the full name into first/last name.
   */
  const openStudentForm = (student: Student | null = null) => {
    if (student) {
      setStudentFormMode('edit');
      const nameParts = (student.name || '').split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      setStudentForm({
        student_id: student.student_id?.toString() ?? '',
        first_name: first_name,
        last_name: last_name,
        program: student.program || '',
        status: student.status || 'active',
      });
      setEditStudentVersion(student.version || 1);
    } else {
      setStudentFormMode('create');
      setStudentForm({
        student_id: '',
        first_name: '',
        last_name: '',
        program: '',
        status: 'active',
      });
    }
    setStudentFormErrors({});
    setStudentFormOpen(true);
  };

  const validateStudentForm = (): boolean => {
    const errors: StudentFormErrors = {};
    if (!studentForm.first_name.trim()) errors.first_name = 'First Name is mandatory';
    if (!studentForm.last_name.trim()) errors.last_name = 'Last Name is mandatory';
    if (!studentForm.student_id.trim()) errors.student_id = 'Student ID is mandatory';
    if (!studentForm.program.trim()) errors.program = 'Study Program is mandatory';
    setStudentFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * [User Story: Profile Creation] & [User Story: Profile Editing]
   * Validates mandatory frontend fields (First Name, Last Name, Student ID, Program).
   * Concatenates First & Last name into a single string for backend compatibility.
   * Triggers success toast notifications matching the explicit Acceptance Criteria.
   */
  const handleSaveStudent = async () => {
    if (!validateStudentForm()) return;

    const isEdit = studentFormMode === 'edit';
    const studentId = parseInt(studentForm.student_id, 10);
    const name = `${studentForm.first_name.trim()} ${studentForm.last_name.trim()}`;

    try {
      let res: Response;
      if (isEdit) {
        const payload: StudentUpdatePayload = {
          student_id: studentId,
          new_student_id: studentId,
          name,
          program: studentForm.program,
          status: studentForm.status,
          version: editStudentVersion,
        };
        res = await updateStudent(studentId, payload);
      } else {
        const payload: StudentCreatePayload = {
          student_id: studentId,
          name,
          program: studentForm.program,
          status: studentForm.status,
        };
        res = await createStudent(payload);
      }

      if (res.ok) {
        setToast({
          open: true,
          message: isEdit ? 'Student profile updated' : 'Student profile created',
          severity: 'success',
        });
        setStudentFormOpen(false);
        void fetchData();
      } else {
        setToast({ open: true, message: `Error: ${await errorDetail(res)}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const studentRosterColumnDefs = useMemo<ColDef<Student>[]>(
    () => [
      { field: 'student_id', headerName: 'ID', flex: 1 },
      { field: 'name', headerName: 'Name', flex: 2 },
      { field: 'program', headerName: 'Study Program', flex: 2 },
      { field: 'total_exams', headerName: 'Exams Taken', flex: 1 },
      { field: 'avg_grade', headerName: 'Avg Grade', flex: 1 },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        cellRenderer: (params: ICellRendererParams<Student, StudentStatus>) => {
          const color =
            params.value === 'active'
              ? '#1976D2'
              : params.value === 'graduated'
                ? '#2E7D32'
                : '#D32F2F';
          return (
            <span style={{ color, fontWeight: 'bold' }}>{params.value?.toUpperCase()}</span>
          );
        },
      },
      {
        headerName: 'Actions',
        colId: 'actions',
        flex: 1,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Student>) => (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (params.data) openStudentForm(params.data);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [],
  );

  const validateCourseForm = (): boolean => {
    const errors: CourseFormErrors = {};
    if (!courseForm.course_name.trim()) errors.course_name = 'Course Name is mandatory';
    if (!courseForm.course_id.trim()) errors.course_id = 'Course ID is mandatory';
    if (!courseForm.semester.trim()) errors.semester = 'Semester is mandatory';
    if (!courseForm.study_program.trim()) errors.study_program = 'Study Program is mandatory';
    setCourseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCourse = async () => {
    if (!validateCourseForm()) return;

    const isEdit = courseFormMode === 'edit';
    const base: CourseCreatePayload = {
      course_id: courseForm.course_id,
      course_name: courseForm.course_name,
      semester: courseForm.semester,
      study_program: courseForm.study_program,
      professor: courseForm.professor || 'Not Assigned',
    };

    try {
      let res: Response;
      if (isEdit) {
        const payload: CourseUpdatePayload = {
          ...base,
          new_course_id: parseInt(courseForm.course_id, 10),
          version: editCourseVersion,
        };
        res = await updateCourse(courseForm.course_id, payload);
      } else {
        res = await createCourse(base);
      }

      if (res.ok) {
        setToast({
          open: true,
          message: `Course successfully ${isEdit ? 'updated' : 'created'}`,
          severity: 'success',
        });
        setCourseFormOpen(false);
        void fetchData();
      } else {
        setToast({ open: true, message: `Error: ${await errorDetail(res)}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  // === FILE UPLOAD & PREVIEW (STEP 2 -> 3) ===
  /**
   * [User Story: File Upload & Format Support]
   * Submits the chosen file (Excel/CSV/etc.) to the backend for preview generation.
   */
  const handleUploadSubmit = async () => {
    if (!uploadForm.file || !uploadForm.semester || !uploadForm.course) {
      setToast({
        open: true,
        message: 'Please fill all fields and select a file.',
        severity: 'warning',
      });
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('semester', uploadForm.semester);
    formData.append('course', uploadForm.course);

    try {
      const res = await uploadFile(formData);
      if (res.ok) {
        const data = (await res.json()) as { preview?: unknown };
        setToast({
          open: true,
          message: 'Excel file uploaded and processed successfully!',
          severity: 'success',
        });
        setUploadPreview(data.preview ?? null);
        setUploadForm({ semester: '', course: '', file: null });
        void fetchData();
      } else {
        setToast({
          open: true,
          message: `Upload Error: ${await errorDetail(res)}`,
          severity: 'error',
        });
      }
    } catch {
      setToast({
        open: true,
        message: 'Network error occurred during upload',
        severity: 'error',
      });
    }
  };

  const updateStudentProgram = async () => {
    if (!selectedStudent) return;
    try {
      const res = await updateStudent(selectedStudent.student_id, {
        program: selectedStudent.program,
        version: selectedStudent.version,
      });
      if (res.ok) {
        setToast({
          open: true,
          message: 'Student program updated successfully!',
          severity: 'success',
        });
        void fetchData();
      } else {
        setToast({ open: true, message: 'Failed to update program', severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const handleArchiveCourse = async (course_id: number, is_archived: boolean) => {
    if (!selectedCourse) return;
    try {
      const res = await setCourseArchived(course_id, {
        is_archived,
        version: selectedCourse.version,
      });
      if (res.ok) {
        setToast({
          open: true,
          message: is_archived
            ? 'Course archived successfully!'
            : 'Course restored successfully!',
          severity: 'success',
        });
        setSelectedCourse(null);
        void fetchData();
      } else {
        setToast({ open: true, message: `Error: ${await errorDetail(res)}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const handleStudentStatus = async (student_id: number, status: StudentStatus) => {
    if (!selectedStudent) return;
    try {
      const res = await updateStudentStatus(student_id, {
        status,
        version: selectedStudent.version,
      });
      if (res.ok) {
        setToast({ open: true, message: `Student marked as ${status}!`, severity: 'success' });
        setSelectedStudent(null);
        void fetchData();
      } else {
        setToast({ open: true, message: `Error: ${await errorDetail(res)}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const handleAddGrade = async () => {
    if (!selectedStudent) return;
    if (addGradeForm.course_id === '') {
      setToast({ open: true, message: 'Please select a course', severity: 'warning' });
      return;
    }
    try {
      const res = await addStudentGrade(selectedStudent.student_id, {
        course_id: addGradeForm.course_id,
        semester: addGradeForm.semester,
        grade: addGradeForm.grade,
      });
      if (res.ok) {
        setToast({ open: true, message: 'Grade added successfully!', severity: 'success' });
        setAddGradeDialogOpen(false);
        void fetchStudentTranscript(selectedStudent.student_id);
      } else {
        setToast({ open: true, message: `Error: ${await errorDetail(res)}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      setToast({ open: true, message: 'Please select a file first.', severity: 'error' });
      return;
    }

    // For demo purposes, if selectedDemoFile is chosen, we just upload the dummy file anyway
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('course', uploadCourseInfo.courseNumber);
    formData.append('courseName', uploadCourseInfo.courseName);
    formData.append('ects', uploadCourseInfo.ects);
    formData.append('semester', uploadCourseInfo.semester);

    // Mapping matches the table in Step 3
    const mapping: Record<string, string> = {
      Name: 'name',
      'Full Name': 'name',
      'First Name': 'first_name',
      'Last Name': 'last_name',
      Vorname: 'first_name',
      Nachname: 'last_name',
      Fachsemester: 'semester',
      Semester: 'semester',
      Matrikelnr: 'student_id',
      MatrNr: 'student_id',
      'Matrikelnr.': 'student_id',
      Studiengang: 'program',
      Program: 'program',
      'Study Program': 'program',
      Note: 'grade',
      Grade: 'grade',
    };
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('nameSplitRule', nameSplitRule);

    try {
      const res = await previewUpload(formData);
      const data = (await res.json()) as UploadPreviewResponse;
      if (res.ok) {
        setPreviewData(data.preview_data ?? []);
        setActiveStep(3); // Move to Review step
      } else {
        setToast({ open: true, message: `Error: ${data.detail}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  // === FINAL IMPORT CONFIRMATION (STEP 4 -> 5) ===
  /**
   * [User Story: Permanent Archive & No Partial Saves]
   * Sends the vetted, potentially edited records from the grid directly to the DB.
   * Includes atomic transaction enforcement on the backend.
   */
  const handleConfirmUpload = async () => {
    if (!gridApi) return;
    const selectedRows = gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      setToast({ open: true, message: 'No rows selected for import!', severity: 'error' });
      return;
    }

    try {
      const res = await confirmUpload({
        course: uploadCourseInfo.courseNumber,
        courseName: uploadCourseInfo.courseName,
        ects: uploadCourseInfo.ects,
        semester: uploadCourseInfo.semester,
        records: selectedRows,
      });
      const data = (await res.json()) as UploadConfirmResponse;
      if (res.ok) {
        setToast({
          open: true,
          message: data.message ?? 'Upload successful!',
          severity: 'success',
        });
        setActiveStep(4); // Move to Success step
        void fetchData(); // Refresh data
      } else {
        setToast({ open: true, message: `Error: ${data.detail}`, severity: 'error' });
      }
    } catch {
      setToast({ open: true, message: 'Network error', severity: 'error' });
    }
  };

  /**
   * [User Story 6: Visual Analytics Dashboard]
   * Fetches the complete grade history for a student picked out of a course
   * roster, so their trend can be plotted against the cohort.
   */
  const fetchAnalyticsStudentTranscript = async (student: CourseMark) => {
    setAnalyticsStudent(student);
    if (student.student_id == null) return;
    try {
      const res = await getStudent(student.student_id, { auth: true });
      if (res.ok) {
        const data = (await res.json()) as StudentDetails;
        setAnalyticsStudentTranscript(data.transcript || []);
      }
    } catch (e) {
      console.error('Failed to fetch student transcript for analytics', e);
    }
  };

  return {
    themeMode,
    setThemeMode,
    activeTab,
    setActiveTab,
    coursesData,
    setCoursesData,
    studentsData,
    setStudentsData,
    selectedStudent,
    setSelectedStudent,
    selectedCourse,
    setSelectedCourse,
    analyticsStudent,
    setAnalyticsStudent,
    analyticsStudentTranscript,
    setAnalyticsStudentTranscript,
    courseFormOpen,
    setCourseFormOpen,
    courseFormMode,
    setCourseFormMode,
    courseForm,
    setCourseForm,
    courseFormErrors,
    setCourseFormErrors,
    editCourseVersion,
    setEditCourseVersion,
    addGradeDialogOpen,
    setAddGradeDialogOpen,
    addGradeForm,
    setAddGradeForm,
    archiveTab,
    setArchiveTab,
    newCourseName,
    setNewCourseName,
    uploadForm,
    setUploadForm,
    previewData,
    setPreviewData,
    gridApi,
    setGridApi,
    uploadPreview,
    setUploadPreview,
    activeStep,
    setActiveStep,
    selectedDemoFile,
    setSelectedDemoFile,
    uploadCourseInfo,
    setUploadCourseInfo,
    nameSplitRule,
    setNameSplitRule,
    stats,
    setStats,
    toast,
    setToast,
    loadingCourses,
    setLoadingCourses,
    coursesSortBy,
    setCoursesSortBy,
    studentViewMode,
    setStudentViewMode,
    studentSearchQuery,
    setStudentSearchQuery,
    studentFormOpen,
    setStudentFormOpen,
    studentFormMode,
    setStudentFormMode,
    studentForm,
    setStudentForm,
    studentFormErrors,
    setStudentFormErrors,
    editStudentVersion,
    setEditStudentVersion,
    searchQuery,
    setSearchQuery,
    coursesPage,
    setCoursesPage,
    viewMode,
    setViewMode,
    newCourseId,
    setNewCourseId,
    studentColumnDefs,
    courseColumnDefs,
    studentRosterColumnDefs,
    toggleTheme,
    fetchData,
    fetchStudentTranscript,
    fetchAnalyticsStudentTranscript,
    saveGradesToDB,
    openCourseForm,
    openStudentForm,
    validateStudentForm,
    handleSaveStudent,
    validateCourseForm,
    handleSaveCourse,
    handleUploadSubmit,
    updateStudentProgram,
    handleArchiveCourse,
    handleStudentStatus,
    handleAddGrade,
    handleUpload,
    handleConfirmUpload,
  };
}

/**
 * Everything `useAppLogic` hands back. Derived from the hook rather than
 * declared separately so the two can never drift; feature components take this
 * whole object as their props.
 */
export type AppState = ReturnType<typeof useAppLogic>;
