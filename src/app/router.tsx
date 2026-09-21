import { createBrowserRouter, Navigate } from 'react-router-dom';

import App from './App';
import { ROUTES } from './navigation';
import { GuestOnly, RequireAuth, SessionGate } from './SessionGate';
import { Dashboard } from '../routes/Dashboard';
import { BatchUpload } from '../routes/BatchUpload';
import { Courses } from '../routes/Courses';
import { CourseDetail } from '../routes/CourseDetail';
import { Login } from '../routes/Login';
import { Register } from '../routes/Register';
import { Students } from '../routes/Students';
import { StudentDetail } from '../routes/StudentDetail';
import { NotFound } from '../routes/NotFound';

/**
 * SessionGate wraps everything so the refresh-cookie exchange happens once,
 * before either branch below renders. The application routes then sit behind
 * RequireAuth as a group -- a new screen added to that list is protected
 * without anything else being remembered.
 */
export const routes = [
  {
    path: '/',
    element: <SessionGate />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
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
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
