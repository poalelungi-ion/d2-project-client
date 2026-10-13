import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import type { SvgIconComponent } from '@mui/icons-material';

export const ROUTES = {
  login: '/login',
  register: '/register',
  upload: '/upload',
  courses: '/courses',
  courseDetail: (courseId: number | string) => `/courses/${courseId}`,
  students: '/students',
  studentDetail: (studentId: number | string) => `/students/${studentId}`,
  logs: '/logs',
} as const;

/** One entry in the permanent navigation drawer. */
export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Courses', path: ROUTES.courses, icon: SchoolIcon },
  { label: 'Students', path: ROUTES.students, icon: PersonIcon },
];

export const isNavItemActive = (item: NavItem, pathname: string): boolean =>
  pathname === item.path || pathname.startsWith(`${item.path}/`);
