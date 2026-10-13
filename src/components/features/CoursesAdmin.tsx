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
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
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
import { gridContainer, metaChip, pageSubtitle, pageTitle } from '../../styles/mixins';
import { courseColumns } from './columns';
import { CourseFormDialog } from '../forms/CourseFormDialog';
import { compareSemesters } from '../../utils/semester';

const ITEMS_PER_PAGE = 20;

export const CoursesAdmin = () => {
  const { courses, loading: loadingCourses, refetch } = useCourses();
  const [searchQuery, setSearchQuery] = useQueryParam<string>('q', '');
  const [coursesSortBy, setCoursesSortBy] = useQueryParam<CoursesSortBy>(
    'sort',
    'name',
    COURSE_SORTS,
  );
  const [viewMode, setViewMode] = useQueryParam<ViewMode>('view', 'table', VIEW_MODES);
  // `null` while closed; when open it holds the course being edited, or null
  // inside the wrapper for a create.
  const [form, setForm] = useState<{ course: Course | null } | null>(null);
  const openCourseForm = useCallback((course: Course | null = null) => setForm({ course }), []);

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
          <Box>
            <Typography variant="h3" gutterBottom sx={{ ...pageTitle, m: 0 }}>
              Analysis Hub
            </Typography>
            <Typography variant="h6" sx={{ ...pageSubtitle, mt: 1 }}>
              Select a course to view detailed analytics.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
              <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'background.paper' }}>
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
                      <Typography variant="caption" sx={metaChip}>
                        {course.assigned_professor}
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
          <Box className="ag-theme-alpine" sx={gridContainer}>
            <AgGridReact<Course>
              rowData={activeCourses}
              columnDefs={courseColumnDefs}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
              onRowClicked={(e: RowClickedEvent<Course>) => {
                if (e.data) void navigate(ROUTES.courseDetail(e.data.course_id));
              }}
            />
          </Box>
        )}
      </Box>
    </Fade>
  );
};

