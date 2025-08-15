// Hooks Index
// Central export point for all custom React hooks

// Import hooks for organized access
import { useAuth, AuthProvider } from './useAuth';
import { 
  usePermissions, 
  useResourcePermissions, 
  useFeaturePermissions, 
  useNavigationPermissions 
} from './usePermissions';
import { 
  useAuthForms,
  useLoginForm,
  useRegistrationForm,
  useChangePasswordForm,
  useForgotPasswordForm,
  useResetPasswordForm
} from './useAuthForm';
import { 
  useProtectedRoute,
  useConditionalRender,
  useNavigationGuard,
  ProtectedRoute,
  AdminRoute,
  HiringManagerRoute,
  HRRecruiterRoute,
  AuthenticatedRoute,
  PublicRoute
} from './useProtectedRoute';

// Authentication Hooks
export {
  useAuth,
  AuthProvider,
  type AuthState,
  type AuthContextValue,
  type AuthProviderProps
} from './useAuth';

// Permission Hooks
export {
  usePermissions,
  useResourcePermissions,
  useFeaturePermissions,
  useNavigationPermissions,
  type PermissionHookResult,
  type ResourcePermissionOptions,
  type NavigationItem
} from './usePermissions';

// Authentication Form Hooks
export {
  useLoginForm,
  useRegistrationForm,
  useChangePasswordForm,
  useForgotPasswordForm,
  useResetPasswordForm,
  useAuthForms,
  type FormSubmissionState
} from './useAuthForm';

// Protected Route Hooks
export {
  useProtectedRoute,
  useConditionalRender,
  useNavigationGuard,
  ProtectedRoute,
  withProtectedRoute,
  AdminRoute,
  HiringManagerRoute,
  HRRecruiterRoute,
  AuthenticatedRoute,
  PublicRoute,
  type RouteProtectionOptions,
  type ProtectedRouteProps
} from './useProtectedRoute';

// Re-export for convenience
export const AuthHooks = {
  useAuth,
  usePermissions,
  useAuthForms,
  useProtectedRoute
};

// Hook categories for organized access
export const AuthenticationHooks = {
  useAuth,
  useLoginForm,
  useRegistrationForm,
  useChangePasswordForm,
  useForgotPasswordForm,
  useResetPasswordForm,
  useAuthForms
};

export const PermissionHooks = {
  usePermissions,
  useResourcePermissions,
  useFeaturePermissions,
  useNavigationPermissions
};

export const RouteProtectionHooks = {
  useProtectedRoute,
  useConditionalRender,
  useNavigationGuard
};

// Authentication components for convenience
export const AuthComponents = {
  AuthProvider,
  ProtectedRoute,
  AdminRoute,
  HiringManagerRoute,
  HRRecruiterRoute,
  AuthenticatedRoute,
  PublicRoute
};
