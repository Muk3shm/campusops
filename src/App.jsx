import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import StudentDashboard from '@/pages/StudentDashboard';
import ServiceRequestsPage from '@/pages/ServiceRequestsPage';
import CreateRequestPage from '@/pages/CreateRequestPage';
import RequestDetailsPage from '@/pages/RequestDetailsPage';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';
import TechnicianDashboard from '@/pages/TechnicianDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminKnowledgeReview from '@/pages/AdminKnowledgeReview';
import AdminManagementPages from '@/pages/AdminManagementPages';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Application Router with Role-Based Protection & Session Provider.
 */
const router = createBrowserRouter([
  // Public Entry Route (Login)
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Protected App Shell Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // Root '/' redirects unauthenticated users to /login (handled by ProtectedRoute),
      // and authenticated users to Student Dashboard by default.
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // Student / Staff Dashboard
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'STAFF']}>
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },

      // Shared Service Requests View (Filtered by role)
      {
        path: 'requests',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN']}>
            <ServiceRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests/new',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'ADMIN']}>
            <CreateRequestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests/:id',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN']}>
            <RequestDetailsPage />
          </ProtectedRoute>
        ),
      },

      // Knowledge Base (Accessible to all roles)
      {
        path: 'knowledge-base',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'TECHNICIAN', 'ADMIN']}>
            <KnowledgeBasePage />
          </ProtectedRoute>
        ),
      },

      // Technician Workspace (TECHNICIAN & ADMIN)
      {
        path: 'technician',
        element: (
          <ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        ),
      },

      // Admin Overview (ADMIN only)
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },

      // Admin Knowledge Review
      {
        path: 'admin/knowledge-review',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminKnowledgeReview />
          </ProtectedRoute>
        ),
      },

      // Admin Management Sub-Routes (ADMIN only)
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/technicians',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/categories',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/analytics',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit-log',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagementPages />
          </ProtectedRoute>
        ),
      },

      // Profile Page (All Roles)
      {
        path: 'profile',
        element: (
          <ProtectedRoute allowedRoles={['STUDENT', 'TECHNICIAN', 'ADMIN']}>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      // Catch-all
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
