import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { ROUTES } from './navigation';
import { Dashboard } from '../routes/Dashboard';
import { BatchUpload } from '../routes/BatchUpload';
import { Courses } from '../routes/Courses';
import { CourseDetail } from '../routes/CourseDetail';
import { Students } from '../routes/Students';
import { StudentDetail } from '../routes/StudentDetail';
import { NotFound } from '../routes/NotFound';

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'upload', element: <BatchUpload /> },
      { path: 'courses', element: <Courses /> },
      { path: 'courses/:courseId', element: <CourseDetail /> },
      { path: 'students', element: <Students /> },
      { path: 'students/:studentId', element: <StudentDetail /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
