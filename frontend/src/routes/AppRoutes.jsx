import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import AcceptInvitePage from '../pages/auth/AcceptInvitePage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import InternDashboard from '../pages/intern/InternDashboard';
import MyTasksPage from '../pages/intern/MyTasksPage';
import MyReportsPage from '../pages/intern/MyReportsPage';
import CloudIDEPage from '../pages/intern/CloudIDEPage';

import ManagerDashboard from '../pages/manager/ManagerDashboard';
import AssignTaskPage from '../pages/manager/AssignTaskPage';
import ReviewReportsPage from '../pages/manager/ReviewReportsPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsersPage from '../pages/admin/ManageUsersPage';
import ManageProjectsPage from '../pages/admin/ManageProjectsPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Intern Routes (Protected to intern only) */}
      <Route element={<ProtectedRoute allowedRoles={['intern']} />}>
        <Route path="/intern/dashboard" element={<InternDashboard />} />
        <Route path="/intern/tasks" element={<MyTasksPage />} />
        <Route path="/intern/reports" element={<MyReportsPage />} />
        <Route path="/intern/ide" element={<CloudIDEPage />} />
      </Route>

      {/* Manager Routes (Protected to manager only) */}
      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/assign-task" element={<AssignTaskPage />} />
        <Route path="/manager/review-reports" element={<ReviewReportsPage />} />
      </Route>

      {/* Admin Routes (Protected to superadmin only) */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/projects" element={<ManageProjectsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
