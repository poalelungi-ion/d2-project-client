import DashboardIcon from '@mui/icons-material/Dashboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import type { SvgIconComponent } from '@mui/icons-material';

export const ROUTES = {
  dashboard: '/dashboard',
  upload: '/upload',
  courses: '/courses',
  courseDetail: (courseId: number | string) => `/courses/${courseId}`,
  students: '/students',
  studentDetail: (studentId: number | string) => `/students/${studentId}`,
} as const;

/** One entry in the permanent navigation drawer. */
export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: DashboardIcon },
  { label: 'Batch Upload', path: ROUTES.upload, icon: TableChartIcon },
  { label: 'Courses', path: ROUTES.courses, icon: SchoolIcon },
  { label: 'Students', path: ROUTES.students, icon: PersonIcon },
];

export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
  pathname === item.path || pathname.startsWith(`${item.path}/`);
