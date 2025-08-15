// Protected Route Hook and Component
// Route protection based on authentication and permissions

import React, { useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { Permission, UserRole } from '../types/user.types';
import { Loading } from '../components/common';

// Route protection options
export interface RouteProtectionOptions {
  requireAuth?: boolean;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  minimumRole?: UserRole;
  requireAllPermissions?: boolean; // true = all permissions required, false = any permission required
  redirectTo?: string;
  loadingComponent?: React.ComponentType;
  unauthorizedComponent?: React.ComponentType;
}

// Protected route component props
export interface ProtectedRouteProps extends RouteProtectionOptions {
  children: React.ReactNode;
}

// Hook for route protection logic
export const useProtectedRoute = (options: RouteProtectionOptions = {}) => {
  const {
    requireAuth = true,
    permission,
    permissions = [],
    role,
    roles = [],
    minimumRole,
    requireAllPermissions = true,
    redirectTo = '/login'
  } = options;

  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    hasMinimumRole
  } = usePermissions();

  const location = useLocation();

  // Check if still initializing
  if (!isInitialized || isLoading) {
    return {
      isAllowed: false,
      isLoading: true,
      shouldRedirect: false,
      redirectPath: ''
    };
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return {
      isAllowed: false,
      isLoading: false,
      shouldRedirect: true,
      redirectPath: redirectTo,
      state: { from: location.pathname }
    };
  }

  // Skip further checks if not authenticated and auth is not required
  if (!isAuthenticated && !requireAuth) {
    return {
      isAllowed: true,
      isLoading: false,
      shouldRedirect: false,
      redirectPath: ''
    };
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return {
      isAllowed: false,
      isLoading: false,
      shouldRedirect: true,
      redirectPath: '/unauthorized'
    };
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return {
        isAllowed: false,
        isLoading: false,
        shouldRedirect: true,
        redirectPath: '/unauthorized'
      };
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return {
      isAllowed: false,
      isLoading: false,
      shouldRedirect: true,
      redirectPath: '/unauthorized'
    };
  }

  // Check multiple roles
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return {
      isAllowed: false,
      isLoading: false,
      shouldRedirect: true,
      redirectPath: '/unauthorized'
    };
  }

  // Check minimum role
  if (minimumRole && !hasMinimumRole(minimumRole)) {
    return {
      isAllowed: false,
      isLoading: false,
      shouldRedirect: true,
      redirectPath: '/unauthorized'
    };
  }

  // All checks passed
  return {
    isAllowed: true,
    isLoading: false,
    shouldRedirect: false,
    redirectPath: ''
  };
};

// Protected Route Component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  loadingComponent: LoadingComponent = () => <Loading fullScreen text="Loading..." />,
  unauthorizedComponent: UnauthorizedComponent,
  ...options
}) => {
  const { isAllowed, isLoading, shouldRedirect, redirectPath, state } = useProtectedRoute(options);

  // Show loading while checking permissions
  if (isLoading) {
    return <LoadingComponent />;
  }

  // Redirect if not allowed
  if (shouldRedirect) {
    return <Navigate to={redirectPath} state={state} replace />;
  }

  // Show unauthorized component if provided and not allowed
  if (!isAllowed && UnauthorizedComponent) {
    return <UnauthorizedComponent />;
  }

  // Render children if allowed
  if (isAllowed) {
    return <>{children}</>;
  }

  // Fallback (shouldn't reach here)
  return <Navigate to="/unauthorized" replace />;
};

// Higher-order component for route protection
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options: RouteProtectionOptions = {}
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
};

// Preset protected route components for common scenarios
export const AdminRoute: React.FC<Omit<ProtectedRouteProps, 'role'>> = (props) => (
  <ProtectedRoute role={UserRole.ADMIN} {...props} />
);

export const HiringManagerRoute: React.FC<Omit<ProtectedRouteProps, 'minimumRole'>> = (props) => (
  <ProtectedRoute minimumRole={UserRole.HIRING_MANAGER} {...props} />
);

export const HRRecruiterRoute: React.FC<Omit<ProtectedRouteProps, 'minimumRole'>> = (props) => (
  <ProtectedRoute minimumRole={UserRole.HR_RECRUITER} {...props} />
);

export const AuthenticatedRoute: React.FC<Omit<ProtectedRouteProps, 'requireAuth'>> = (props) => (
  <ProtectedRoute requireAuth {...props} />
);

export const PublicRoute: React.FC<Omit<ProtectedRouteProps, 'requireAuth'>> = (props) => (
  <ProtectedRoute requireAuth={false} {...props} />
);

// Hook for conditional rendering based on permissions
export const useConditionalRender = () => {
  const { hasPermission, hasRole, hasMinimumRole } = usePermissions();

  const renderIf = {
    hasPermission: (permission: Permission, component: React.ReactNode) =>
      hasPermission(permission) ? component : null,
    
    hasRole: (role: UserRole, component: React.ReactNode) =>
      hasRole(role) ? component : null,
    
    hasMinimumRole: (minimumRole: UserRole, component: React.ReactNode) =>
      hasMinimumRole(minimumRole) ? component : null,
    
    isAdmin: (component: React.ReactNode) =>
      hasRole(UserRole.ADMIN) ? component : null,
    
    isHiringManager: (component: React.ReactNode) =>
      hasMinimumRole(UserRole.HIRING_MANAGER) ? component : null,
    
    canCreateCandidates: (component: React.ReactNode) =>
      hasPermission(Permission.CREATE_CANDIDATE) ? component : null,
    
    canManageUsers: (component: React.ReactNode) =>
      hasPermission(Permission.CREATE_USER) || hasPermission(Permission.UPDATE_USER) ? component : null
  };

  return renderIf;
};

// Hook for navigation protection
export const useNavigationGuard = () => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, hasRole, hasMinimumRole } = usePermissions();

  const canNavigateTo = useCallback((path: string, options: RouteProtectionOptions = {}) => {
    // Since we can't use hooks inside regular functions, we'll implement a simplified check
    if (!isAuthenticated && options.requireAuth !== false) {
      return false;
    }
    
    if (options.permission && !hasPermission(options.permission)) {
      return false;
    }
    
    if (options.role && !hasRole(options.role)) {
      return false;
    }
    
    if (options.minimumRole && !hasMinimumRole(options.minimumRole)) {
      return false;
    }
    
    return true;
  }, [isAuthenticated, hasPermission, hasRole, hasMinimumRole]);

  return {
    canNavigateTo,
    
    getProtectedPaths: () => ({
      admin: hasRole(UserRole.ADMIN) ? ['/admin', '/users', '/settings'] : [],
      hiringManager: hasMinimumRole(UserRole.HIRING_MANAGER) ? ['/dashboard', '/candidates', '/reports'] : [],
      hrRecruiter: hasMinimumRole(UserRole.HR_RECRUITER) ? ['/dashboard', '/candidates'] : [],
      authenticated: isAuthenticated ? ['/profile', '/logout'] : [],
      public: ['/login', '/register', '/forgot-password']
    })
  };
};

export default useProtectedRoute;
