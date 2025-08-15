// Application Router
// Main routing configuration with protected routes

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '../hooks';
import { ProtectedRoute, PublicRoute } from '../hooks/useProtectedRoute';
import { Permission, UserRole } from '../types/user.types';

// Page Components
import { Dashboard } from '../components/dashboard';
import { CandidateFormContainer } from '../components/forms';

// Placeholder components for routes that don't exist yet
import { PlaceholderPage } from './PlaceholderPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <PlaceholderPage 
                  title="Login" 
                  message="Login page will be implemented in future tasks"
                  suggestedAction="For now, authentication is handled automatically"
                />
              </PublicRoute>
            }
          />
          
          <Route
            path="/register"
            element={
              <PublicRoute>
                <PlaceholderPage 
                  title="Register" 
                  message="Registration page will be implemented in future tasks"
                  suggestedAction="For now, users are managed by administrators"
                />
              </PublicRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <PlaceholderPage 
                  title="Forgot Password" 
                  message="Password reset page will be implemented in future tasks"
                />
              </PublicRoute>
            }
          />

          {/* Protected Routes - Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAuth>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Candidates */}
          <Route
            path="/candidates"
            element={
              <ProtectedRoute requireAuth>
                <PlaceholderPage 
                  title="Candidates List" 
                  message="Candidate list page will be implemented in task 4.8"
                  suggestedAction="Navigate back to Dashboard to see overview"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidates/new"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.CREATE_CANDIDATE}
                redirectTo="/unauthorized"
              >
                <CandidateFormContainer
                  mode="create"
                  title="Add New Candidate"
                  successRedirectPath="/candidates"
                  cancelRedirectPath="/candidates"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidates/edit/:id"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.UPDATE_CANDIDATE}
                redirectTo="/unauthorized"
              >
                <CandidateFormContainer
                  mode="edit"
                  title="Edit Candidate"
                  successRedirectPath="/candidates"
                  cancelRedirectPath="/candidates"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidates/upload"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.CREATE_CANDIDATE}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="Bulk Upload" 
                  message="Bulk candidate upload page will be implemented in future tasks"
                  suggestedAction="Use 'Add New Candidate' for individual entries"
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Reports & Analytics */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.VIEW_ANALYTICS}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="Reports & Analytics" 
                  message="Analytics and reporting page will be implemented in future tasks"
                  suggestedAction="Check dashboard overview for basic statistics"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/export"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.EXPORT_DATA}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="Export Data" 
                  message="Data export functionality will be implemented in future tasks"
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - User Management */}
          <Route
            path="/users"
            element={
              <ProtectedRoute 
                requireAuth 
                minimumRole={UserRole.HIRING_MANAGER}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="User Management" 
                  message="User management page will be implemented in future tasks"
                  suggestedAction="Contact system administrator for user management needs"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/new"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.CREATE_USER}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="Add New User" 
                  message="User creation page will be implemented in future tasks"
                />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Administration */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute 
                requireAuth 
                role={UserRole.ADMIN}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="System Settings" 
                  message="System settings page will be implemented in future tasks"
                  suggestedAction="Contact system administrator for configuration changes"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/company"
            element={
              <ProtectedRoute 
                requireAuth 
                permission={Permission.MANAGE_SYSTEM}
                redirectTo="/unauthorized"
              >
                <PlaceholderPage 
                  title="Company Settings" 
                  message="Company settings page will be implemented in future tasks"
                />
              </ProtectedRoute>
            }
          />

          {/* User Profile Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireAuth>
                <PlaceholderPage 
                  title="My Profile" 
                  message="User profile page will be implemented in future tasks"
                  suggestedAction="Profile management features coming soon"
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute requireAuth>
                <PlaceholderPage 
                  title="User Settings" 
                  message="User settings page will be implemented in future tasks"
                />
              </ProtectedRoute>
            }
          />

          {/* Error Routes */}
          <Route
            path="/unauthorized"
            element={
              <PlaceholderPage 
                title="Access Denied" 
                message="You don't have permission to access this page"
                suggestedAction="Contact your administrator if you believe this is an error"
                severity="error"
              />
            }
          />

          <Route
            path="/not-found"
            element={
              <PlaceholderPage 
                title="Page Not Found" 
                message="The page you're looking for doesn't exist"
                suggestedAction="Return to dashboard or check the URL"
                severity="warning"
              />
            }
          />

          {/* Default Routes */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Catch-all route */}
          <Route
            path="*"
            element={<Navigate to="/not-found" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
