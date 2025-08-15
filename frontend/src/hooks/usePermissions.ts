// Permission Management Hook
// Advanced permission checking and role-based access control

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { Permission, UserRole } from '../types/user.types';

export interface PermissionHookResult {
  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  
  // Role checking
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  
  // Convenience checks
  canCreateCandidate: boolean;
  canUpdateCandidate: boolean;
  canDeleteCandidate: boolean;
  canUploadCV: boolean;
  canDownloadCV: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
  
  // Role checks
  isAdmin: boolean;
  isHiringManager: boolean;
  isHRRecruiter: boolean;
  
  // Permission summary
  permissions: Permission[];
  role: UserRole | null;
}

export const usePermissions = (): PermissionHookResult => {
  const { user, permissions, hasPermission, hasRole, hasAnyRole, hasMinimumRole } = useAuth();

  // Memoized permission checks
  const permissionChecks = useMemo(() => {
    const checks = {
      // Permission checking functions
      hasPermission,
      hasAllPermissions: (perms: Permission[]) => perms.every(hasPermission),
      hasAnyPermission: (perms: Permission[]) => perms.some(hasPermission),
      
      // Role checking functions
      hasRole,
      hasAnyRole,
      hasMinimumRole,
      
      // Convenience permission checks
      canCreateCandidate: hasPermission(Permission.CREATE_CANDIDATE),
      canUpdateCandidate: hasPermission(Permission.UPDATE_CANDIDATE),
      canDeleteCandidate: hasPermission(Permission.DELETE_CANDIDATE),
      canUploadCV: hasPermission(Permission.UPLOAD_CV),
      canDownloadCV: hasPermission(Permission.DOWNLOAD_CV),
      canManageUsers: hasPermission(Permission.CREATE_USER) || hasPermission(Permission.UPDATE_USER),
      canViewAnalytics: hasPermission(Permission.VIEW_ANALYTICS),
      canManageSystem: hasPermission(Permission.MANAGE_SYSTEM),
      
      // Role convenience checks
      isAdmin: hasRole(UserRole.ADMIN),
      isHiringManager: hasRole(UserRole.HIRING_MANAGER),
      isHRRecruiter: hasRole(UserRole.HR_RECRUITER),
      
      // Current permissions and role
      permissions: permissions?.effectivePermissions || [],
      role: user?.role || null
    };

    return checks;
  }, [user, permissions, hasPermission, hasRole, hasAnyRole, hasMinimumRole]);

  return permissionChecks;
};

// Hook for checking specific resource ownership permissions
export interface ResourcePermissionOptions {
  resourceOwnerId?: number;
  currentUserId?: number;
  allowAdminOverride?: boolean;
}

export const useResourcePermissions = (options: ResourcePermissionOptions = {}) => {
  const { user } = useAuth();
  const { isAdmin, hasMinimumRole } = usePermissions();
  const { resourceOwnerId, currentUserId, allowAdminOverride = true } = options;

  const actualCurrentUserId = currentUserId || user?.id;

  return useMemo(() => {
    // Admin override
    if (allowAdminOverride && isAdmin) {
      return {
        canRead: true,
        canUpdate: true,
        canDelete: true,
        isOwner: false,
        isAdmin: true
      };
    }

    // Resource ownership check
    const isOwner = resourceOwnerId !== undefined && 
                   actualCurrentUserId !== undefined && 
                   resourceOwnerId === actualCurrentUserId;

    // Hiring manager and above can read all
    const canRead = hasMinimumRole(UserRole.HIRING_MANAGER) || isOwner;
    
    // Only owners and admins can update/delete (unless admin override is disabled)
    const canUpdate = isOwner || (allowAdminOverride && isAdmin);
    const canDelete = isOwner || (allowAdminOverride && isAdmin);

    return {
      canRead,
      canUpdate,
      canDelete,
      isOwner,
      isAdmin
    };
  }, [resourceOwnerId, actualCurrentUserId, isAdmin, hasMinimumRole, allowAdminOverride]);
};

// Hook for feature flags and conditional rendering
export const useFeaturePermissions = () => {
  const { permissions: allPermissions } = usePermissions();

  return useMemo(() => {
    const featureFlags = {
      // Candidate features
      showCandidateCreate: allPermissions.includes(Permission.CREATE_CANDIDATE),
      showCandidateUpdate: allPermissions.includes(Permission.UPDATE_CANDIDATE),
      showCandidateDelete: allPermissions.includes(Permission.DELETE_CANDIDATE),
      showCVUpload: allPermissions.includes(Permission.UPLOAD_CV),
      showCVDownload: allPermissions.includes(Permission.DOWNLOAD_CV),
      
      // User management features
      showUserManagement: allPermissions.includes(Permission.CREATE_USER) || 
                          allPermissions.includes(Permission.UPDATE_USER),
      showUserCreate: allPermissions.includes(Permission.CREATE_USER),
      showUserUpdate: allPermissions.includes(Permission.UPDATE_USER),
      showUserDelete: allPermissions.includes(Permission.DELETE_USER),
      
      // Analytics and reporting
      showAnalytics: allPermissions.includes(Permission.VIEW_ANALYTICS),
      showDataExport: allPermissions.includes(Permission.EXPORT_DATA),
      
      // System management
      showSystemSettings: allPermissions.includes(Permission.MANAGE_SYSTEM),
      
      // Combined features
      showAdvancedFeatures: allPermissions.includes(Permission.MANAGE_SYSTEM) ||
                           allPermissions.includes(Permission.VIEW_ANALYTICS),
      
      // Navigation items
      showAdminMenu: allPermissions.includes(Permission.MANAGE_SYSTEM) ||
                    allPermissions.includes(Permission.CREATE_USER),
      
      showReportsMenu: allPermissions.includes(Permission.VIEW_ANALYTICS) ||
                      allPermissions.includes(Permission.EXPORT_DATA)
    };

    return featureFlags;
  }, [allPermissions]);
};

// Hook for permission-based navigation filtering
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  permission?: Permission;
  role?: UserRole;
  minimumRole?: UserRole;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
}

export const useNavigationPermissions = (navigationItems: NavigationItem[]) => {
  const { hasPermission, hasRole, hasMinimumRole, hasAllPermissions, hasAnyRole } = usePermissions();

  return useMemo(() => {
    return navigationItems.filter(item => {
      // Check single permission
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }

      // Check single role
      if (item.role && !hasRole(item.role)) {
        return false;
      }

      // Check minimum role
      if (item.minimumRole && !hasMinimumRole(item.minimumRole)) {
        return false;
      }

      // Check required permissions (all must be present)
      if (item.requiredPermissions && !hasAllPermissions(item.requiredPermissions)) {
        return false;
      }

      // Check required roles (any must be present)
      if (item.requiredRoles && !hasAnyRole(item.requiredRoles)) {
        return false;
      }

      return true;
    });
  }, [navigationItems, hasPermission, hasRole, hasMinimumRole, hasAllPermissions, hasAnyRole]);
};

export default usePermissions;
