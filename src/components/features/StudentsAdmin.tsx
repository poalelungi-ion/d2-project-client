import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Avatar,
  Fade,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { RowClickedEvent } from 'ag-grid-community';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Student, ViewMode } from '../../types';
import { ROUTES } from '../../app/navigation';
import { useStudents } from '../../hooks/useApi';
import { useQueryParam } from '../../hooks/useQueryParam';
import { VIEW_MODES } from '../../utils/constants';
import { formatGrade } from '../../utils/gradeOutcome';
import { semantic } from '../../styles/colors';
import { borders, radii, shadows } from '../../styles/tokens';
import { gridContainer, pageSubtitle, pageTitle } from '../../styles/mixins';
import { studentColumns } from './columns';
import { StudentFormDialog } from '../forms/StudentFormDialog';

export const StudentsAdmin = () => {
  const { students, refetch } = useStudents();
  const [studentSearchQuery, setStudentSearchQuery] = useQueryParam<string>('q', '');
  const [studentViewMode, setStudentViewMode] = useQueryParam<ViewMode>(
    'view',
    'table',
    VIEW_MODES,
  );
  // `null` while closed; when open it holds the student being edited, or null
  // inside the wrapper for a create.
  const [form, setForm] = useState<{ student: Student | null } | null>(null);
  const openStudentForm = useCallback(
    (student: Student | null = null) => setForm({ student }),
    [],
  );

  const navigate = useNavigate();
  const studentRosterColumnDefs = useMemo(
    () => studentColumns(openStudentForm),
    [openStudentForm],
  );

  const activeStudents = useMemo(() => {
    if (!studentSearchQuery) return students;
    const query = studentSearchQuery.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(query) || s.student_id.toString().includes(query),
    );
  }, [students, studentSearchQuery]);

  const existingStudentIds = useMemo(
    () => students.map((s) => s.student_id),
    [students],
  );

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ flexGrow: 1 }}>
        {form && (
          <StudentFormDialog
            student={form.student}
            existingStudentIds={existingStudentIds}
            onClose={() => setForm(null)}
            onSaved={() => void refetch()}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            width: '100%',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h3" gutterBottom sx={pageTitle}>
              LSF Student Roster
            </Typography>
            <Typography variant="h6" sx={pageSubtitle}>
              Manage the student directory and view individual marks.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              value={studentViewMode}
              exclusive
              onChange={(_e, v: ViewMode | null) => v && setStudentViewMode(v)}
              size="small"
            >
              <ToggleButton value="grid">Grid</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              size="small"
              placeholder="Search students..."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              sx={{ bgcolor: 'background.paper' }}
            />

            <Button variant="cta" startIcon={<AddIcon />} onClick={() => openStudentForm()}>
              Add Student
            </Button>
          </Box>
        </Box>

        {studentViewMode === 'grid' ? (
          <Grid container spacing={3} sx={{ width: '100%' }}>
            {activeStudents.map((student) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={student.student_id}>
                <Card
                  variant="interactive"
                  sx={{
                    position: 'relative',
                    border:
                      student.program === 'Unknown'
                        ? borders.emphasis(semantic.warning)
                        : undefined,
                  }}
                  onClick={() => void navigate(ROUTES.studentDetail(student.student_id))}
                >
                  <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudentForm(student);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {student.program === 'Unknown' && (
                    <Box sx={{ position: 'absolute', top: 12, left: 12, color: 'warning.main' }}>
                      <WarningAmberIcon />
                    </Box>
                  )}
                  <CardContent
                    sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <Avatar
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: 'grey.800',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        mb: 2,
                        boxShadow: shadows.avatar,
                      }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: '700', textAlign: 'center' }}>
                      {student.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', mb: 2, fontWeight: 600 }}>
                      {student.student_id}
                    </Typography>
                    <Divider sx={{ width: '100%', mb: 2, opacity: 0.5 }} />
                    <Box
                      sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', px: 1 }}
                    >
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Exams: <strong>{student.total_exams}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Avg: <strong>{formatGrade(student.avg_grade)}</strong>
                      </Typography>
                    </Box>
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
              <AgGridReact<Student>
                domLayout="autoHeight"
                rowData={activeStudents}
                columnDefs={studentRosterColumnDefs}
                defaultColDef={{ resizable: true, sortable: true, filter: true }}
                animateRows={true}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 20, 50]}
                onRowClicked={(e: RowClickedEvent<Student>) => {
                  if (e.data) void navigate(ROUTES.studentDetail(e.data.student_id));
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Fade>
  );
};

