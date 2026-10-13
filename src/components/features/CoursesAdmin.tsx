import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Fade,
  Divider,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Link as MuiLink,
  Paper,
  Chip,
  Collapse,
  Menu,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { RowClickedEvent } from 'ag-grid-community';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course, CoursesSortBy, ViewMode } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useCourses } from '../../hooks/useApi';
import { useQueryParam } from '../../hooks/useQueryParam';
import { COURSE_SORTS, VIEW_MODES } from '../../utils/constants';
import { formatGrade } from '../../utils/gradeOutcome';
import { passRateColor } from '../../styles/colors';
import { gridContainer, metaChip } from '../../styles/mixins';
import { radii } from '../../styles/tokens';
import { courseColumns } from './columns';
import { CourseFormDialog } from '../forms/CourseFormDialog';
import { compareSemesters } from '../../utils/semester';
import { attemptsBySemester } from '../../utils/courseMarks';
import { ExamsHeatmap, type HeatmapRow } from './ExamsHeatmap';

const ITEMS_PER_PAGE = 20;

const PLACEHOLDER_SEMESTER_DISTRIBUTION: HeatmapRow[] = [
  {
    semester: 'WiSe 2023/24',
    total_students: 48,
    distribution: { 0: 2, 1: 18, 2: 16, 3: 8, 4: 3, 5: 1 },
  },
  {
    semester: 'SoSe 2024',
    total_students: 52,
    distribution: { 0: 1, 1: 14, 2: 20, 3: 11, 4: 4, 5: 2 },
  },
  {
    semester: 'WiSe 2024/25',
    total_students: 65,
    distribution: { 0: 3, 1: 22, 2: 24, 3: 12, 4: 3, 5: 1 },
  },
  {
    semester: 'SoSe 2025',
    total_students: 58,
    distribution: { 0: 1, 1: 17, 2: 22, 3: 13, 4: 4, 5: 1 },
  },
];

export const CoursesAdmin = () => {
  const { courses, loading: loadingCourses, refetch } = useCourses();
  const [searchQuery, setSearchQuery] = useQueryParam<string>('q', '');
  const [coursesSortBy, setCoursesSortBy] = useQueryParam<CoursesSortBy>(
    'sort',
    'name',
    COURSE_SORTS,
  );
  const [viewMode, setViewMode] = useQueryParam<ViewMode>('view', 'table', VIEW_MODES);
  const [showDistribution, setShowDistribution] = useState(true);

  // `null` while closed; when open it holds the course being edited, or null
  // inside the wrapper for a create.
  const [form, setForm] = useState<{ course: Course | null } | null>(null);
  const openCourseForm = useCallback((course: Course | null = null) => setForm({ course }), []);

  const [courseNavAnchor, setCourseNavAnchor] = useState<null | HTMLElement>(null);
  const isCourseNavOpen = Boolean(courseNavAnchor);

  const navigate = useNavigate();
  const courseColumnDefs = useMemo(() => courseColumns(openCourseForm), [openCourseForm]);

  const activeCourses = useMemo(() => {
    let result = courses.filter((c) => !c.is_archived);
    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.course_id.toString().includes(searchQuery),
      );
    }
    // Copied above, so sorting in place does not mutate the store's array.
    if (coursesSortBy === 'name') {
      result.sort((a, b) => a.course_name.localeCompare(b.course_name));
    } else if (coursesSortBy === 'semester') {
      result.sort((a, b) => compareSemesters(a.semester || '', b.semester || ''));
    }
    return result;
  }, [courses, searchQuery, coursesSortBy]);

  // Compute live activity distribution across all subjects/courses if marks are available, otherwise use placeholder sample
  const allMarks = useMemo(() => courses.flatMap((c) => c.marks || []), [courses]);
  const liveHeatmap = useMemo(() => attemptsBySemester(allMarks), [allMarks]);

  const { semesterHeatmapData, isUsingPlaceholder } = useMemo(() => {
    if (liveHeatmap.length > 0) {
      return { semesterHeatmapData: liveHeatmap, isUsingPlaceholder: false };
    }
    return { semesterHeatmapData: PLACEHOLDER_SEMESTER_DISTRIBUTION, isUsingPlaceholder: true };
  }, [liveHeatmap]);

  // The card view shows only the first page; the table view paginates itself.
  const paginatedCourses = activeCourses.slice(0, ITEMS_PER_PAGE);

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1 }}>
        {form && (
          <CourseFormDialog
            course={form.course}
            onClose={() => setForm(null)}
            onSaved={() => void refetch()}
          />
        )}

        {/* Top Header: Address-Bar Navigation & Control Toolbar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Address Bar-style Navigation (replacing big "Analysis Hub" text) */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              py: 0.4,
              px: 1.25,
              borderRadius: radii.md,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <MuiLink
              component="button"
              underline="none"
              onClick={() => {
                setSearchQuery('');
                setCourseNavAnchor(null);
                void navigate(ROUTES.courses);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                p: 0,
                color: 'text.secondary',
                transition: 'color 0.15s ease',
                '&:hover': { color: 'primary.main' },
              }}
            >
              Courses
            </MuiLink>

            <NavigateNextIcon sx={{ fontSize: 16, color: 'text.disabled', mx: 0.3 }} />

            {/* Slick Professional Dropdown Button */}
            <Button
              size="small"
              variant="text"
              onClick={(e) => setCourseNavAnchor(e.currentTarget)}
              endIcon={
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: '18px !important',
                    transition: 'transform 0.2s ease',
                    transform: isCourseNavOpen ? 'rotate(180deg)' : 'none',
                    color: 'text.secondary',
                  }}
                />
              }
              sx={{
                py: 0.2,
                px: 0.8,
                minWidth: 0,
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'text.primary',
                borderRadius: radii.sm,
                bgcolor: isCourseNavOpen
                  ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                  : 'transparent',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                },
              }}
            >
              All Courses ({activeCourses.length})
            </Button>

            <Menu
              anchorEl={courseNavAnchor}
              open={isCourseNavOpen}
              onClose={() => setCourseNavAnchor(null)}
              PaperProps={{
                elevation: 4,
                sx: {
                  mt: 0.75,
                  minWidth: 260,
                  maxWidth: 360,
                  maxHeight: 380,
                  borderRadius: radii.md,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 12px 32px rgba(0,0,0,0.7)'
                      : '0 12px 32px rgba(0,0,0,0.12)',
                },
              }}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            >
              <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Quick Jump to Course
                </Typography>
              </Box>

              <MenuItem
                selected={true}
                onClick={() => {
                  setCourseNavAnchor(null);
                  setSearchQuery('');
                  void navigate(ROUTES.courses);
                }}
                sx={{
                  py: 1,
                  px: 1.5,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 18 }} />
                  <span>All Courses (Overview)</span>
                </Box>
                <Chip
                  label={activeCourses.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }}
                />
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              {activeCourses.map((c) => (
                <MenuItem
                  key={c.course_id}
                  onClick={() => {
                    setCourseNavAnchor(null);
                    void navigate(ROUTES.courseDetail(c.course_id));
                  }}
                  sx={{
                    py: 0.85,
                    px: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.25,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
                    {c.course_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                      {c.semester || 'No semester'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>
                      • ID: {c.course_id}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BarChartIcon fontSize="small" />}
              endIcon={
                showDistribution ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )
              }
              onClick={() => setShowDistribution((prev) => !prev)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: radii.md,
                fontSize: '0.85rem',
              }}
            >
              {showDistribution ? 'Hide Distribution' : 'Show Distribution'}
            </Button>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_e, newMode: ViewMode | null) => {
                if (newMode) setViewMode(newMode);
              }}
              size="small"
            >
              <ToggleButton value="grid">Grid</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              size="small"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            />
            {viewMode === 'grid' && (
              <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'background.paper' }}>
                <InputLabel id="courses-sort-label">Sort By</InputLabel>
                <Select
                  labelId="courses-sort-label"
                  id="courses-sort"
                  value={coursesSortBy}
                  label="Sort By"
                  onChange={(e) => setCoursesSortBy(e.target.value as CoursesSortBy)}
                >
                  <MenuItem value="name">Course Name (A-Z)</MenuItem>
                  <MenuItem value="semester">Semester (Chronological)</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button variant="cta" startIcon={<AddIcon />} onClick={() => openCourseForm()}>
              Create New Course
            </Button>
          </Box>
        </Box>

        {/* Section: Semester Exams Distribution Table for All Subjects */}
        <Collapse in={showDistribution} timeout={300}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3.5,
              borderRadius: radii.lg,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="700">
                  Semester Exams Distribution (All Subjects)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track student exam completions and cohort distribution per semester across all subjects.
                </Typography>
              </Box>
              {isUsingPlaceholder && (
                <Chip
                  label="Placeholder Sample"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
                />
              )}
            </Box>

            <ExamsHeatmap
              heatmapData={semesterHeatmapData}
              title=""
              subtitle=""
              minColumns={6}
            />
          </Paper>
        </Collapse>

        {/* Course Catalog (Grid or AgGrid Table) */}
        {loadingCourses ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))}
          </Grid>
        ) : activeCourses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" color="text.secondary">
              No courses are currently available.
            </Typography>
          </Box>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {paginatedCourses.map((course) => (
              <Grid item xs={12} md={6} lg={4} key={course.course_id}>
                <Card
                  variant="interactive"
                  onClick={() => void navigate(ROUTES.courseDetail(course.course_id))}
                >
                  <CardContent sx={{ p: 3, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCourseForm(course);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: '700', mb: 1.5, mt: 0.5 }}>
                      {course.course_name}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        mb: 2,
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="caption" sx={metaChip}>
                        {course.semester}
                      </Typography>
                      <Typography variant="caption" sx={metaChip}>
                        ID: {course.course_id}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2, opacity: 0.5 }} />
                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                    >
                      Submissions: <strong>{course.total_attempts}</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                    >
                      Pass Rate:{' '}
                      <strong style={{ color: passRateColor(course.pass_rate) }}>
                        {course.pass_rate}%
                      </strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      Avg Grade: <strong>{formatGrade(course.avg_grade)}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            elevation={0}
            sx={{
              ...gridContainer,
              borderRadius: radii.xl,
              overflow: 'hidden',
              border: (theme) => `1px solid ${theme.app.surface.panelBorder}`,
            }}
          >
            <Box className="ag-theme-alpine" sx={{ width: '100%' }}>
              <AgGridReact<Course>
                domLayout="autoHeight"
                rowData={activeCourses}
                columnDefs={courseColumnDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                animateRows={true}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 20, 50]}
                onRowClicked={(e: RowClickedEvent<Course>) => {
                  if (e.data) void navigate(ROUTES.courseDetail(e.data.course_id));
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Fade>
  );
};
