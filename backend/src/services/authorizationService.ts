import { UserRole, IUser } from '../interfaces/IUser';
import { Permission, ROLE_PERMISSIONS, ResourceOwnership } from '../middleware/roleMiddleware';

/**
 * Service for managing authorization logic and dynamic permissions
 */
export class AuthorizationService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(user: IUser, permission: Permission): boolean {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(user: IUser, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(user: IUser, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Get all permissions for a user's role
   */
  static getUserPermissions(user: IUser): Permission[] {
    return ROLE_PERMISSIONS[user.role] || [];
  }

  /**
   * Check if a user can access a resource based on ownership
   */
  static canAccessResource(user: IUser, resourceOwnership: ResourceOwnership): boolean {
    // Admins have access to everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check direct ownership
    if (resourceOwnership.userId && resourceOwnership.userId === user.id) {
      return true;
    }

    // Check if user created the resource
    if (resourceOwnership.createdById && resourceOwnership.createdById === user.id) {
      return true;
    }

    // Check if user is assigned to the resource
    if (resourceOwnership.assignedTo && resourceOwnership.assignedTo.includes(user.id)) {
      return true;
    }

    return false;
  }

  /**
   * Check role hierarchy - if user role is at least the required level
   */
  static hasMinimumRole(user: IUser, minimumRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.HR_RECRUITER]: 1,
      [UserRole.HIRING_MANAGER]: 2,
      [UserRole.ADMIN]: 3
    };

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[minimumRole];

    return userLevel >= requiredLevel;
  }

  /**
   * Get the effective permissions for a user (considering role hierarchy)
   */
  static getEffectivePermissions(user: IUser): Permission[] {
    const basePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Higher roles inherit permissions from lower roles
    const inheritedPermissions: Permission[] = [];
    
    if (user.role === UserRole.HIRING_MANAGER || user.role === UserRole.ADMIN) {
      inheritedPermissions.push(...ROLE_PERMISSIONS[UserRole.HR_RECRUITER]);
    }
    
    if (user.role === UserRole.ADMIN) {
      inheritedPermissions.push(...ROLE_PERMISSIONS[UserRole.HIRING_MANAGER]);
    }

    // Remove duplicates and return
    const allPermissions = [...basePermissions, ...inheritedPermissions];
    const uniquePermissions = allPermissions.filter((permission, index) => 
      allPermissions.indexOf(permission) === index
    );
    return uniquePermissions;
  }

  /**
   * Check if a user can perform an action on a candidate
   */
  static canPerformCandidateAction(
    user: IUser, 
    action: 'create' | 'read' | 'update' | 'delete' | 'upload_cv' | 'download_cv',
    candidateId?: number,
    candidateCreatedById?: number
  ): boolean {
    const permissionMap = {
      create: Permission.CREATE_CANDIDATE,
      read: Permission.READ_CANDIDATE,
      update: Permission.UPDATE_CANDIDATE,
      delete: Permission.DELETE_CANDIDATE,
      upload_cv: Permission.UPLOAD_CV,
      download_cv: Permission.DOWNLOAD_CV
    };

    const requiredPermission = permissionMap[action];
    
    // Check if user has the basic permission
    if (!this.hasPermission(user, requiredPermission)) {
      return false;
    }

    // For delete actions, additional checks
    if (action === 'delete') {
      // Only admins can delete candidates
      return user.role === UserRole.ADMIN;
    }

    // For update actions, check ownership if candidate exists
    if (action === 'update' && candidateCreatedById) {
      // Admins can update any candidate
      if (user.role === UserRole.ADMIN) {
        return true;
      }
      
      // Others can only update candidates they created
      return candidateCreatedById === user.id;
    }

    return true;
  }

  /**
   * Check if a user can perform an action on another user
   */
  static canPerformUserAction(
    user: IUser,
    action: 'create' | 'read' | 'update' | 'delete' | 'manage_roles',
    targetUserId?: number,
    targetUserRole?: UserRole
  ): boolean {
    const permissionMap = {
      create: Permission.CREATE_USER,
      read: Permission.READ_USER,
      update: Permission.UPDATE_USER,
      delete: Permission.DELETE_USER,
      manage_roles: Permission.MANAGE_ROLES
    };

    const requiredPermission = permissionMap[action];
    
    // Check if user has the basic permission
    if (!this.hasPermission(user, requiredPermission)) {
      return false;
    }

    // Additional business rules
    if (action === 'delete' || action === 'manage_roles') {
      // Only admins can delete users or manage roles
      return user.role === UserRole.ADMIN;
    }

    if (action === 'update' && targetUserId) {
      // Users can update themselves (basic info)
      if (targetUserId === user.id) {
        return true;
      }
      
      // Admins can update anyone
      if (user.role === UserRole.ADMIN) {
        return true;
      }
      
      // Managers can update HR recruiters
      if (user.role === UserRole.HIRING_MANAGER && targetUserRole === UserRole.HR_RECRUITER) {
        return true;
      }
    }

    return true;
  }

  /**
   * Generate a permission summary for a user (useful for frontend)
   */
  static generatePermissionSummary(user: IUser): {
    role: UserRole;
    permissions: Permission[];
    canManageCandidates: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
    canManageSystem: boolean;
  } {
    const permissions = this.getEffectivePermissions(user);
    
    return {
      role: user.role,
      permissions,
      canManageCandidates: this.hasAnyPermission(user, [
        Permission.CREATE_CANDIDATE,
        Permission.UPDATE_CANDIDATE,
        Permission.DELETE_CANDIDATE
      ]),
      canManageUsers: this.hasAnyPermission(user, [
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER
      ]),
      canViewAnalytics: this.hasPermission(user, Permission.VIEW_ANALYTICS),
      canManageSystem: this.hasPermission(user, Permission.MANAGE_SYSTEM)
    };
  }

  /**
   * Check if an operation is allowed based on business rules
   */
  static isOperationAllowed(
    user: IUser,
    operation: string,
    context: Record<string, any> = {}
  ): { allowed: boolean; reason?: string } {
    // Custom business rules can be added here
    
    // Example: Block operations during maintenance (if implemented)
    if (context.maintenanceMode && user.role !== UserRole.ADMIN) {
      return { allowed: false, reason: 'System is in maintenance mode' };
    }

    // Example: Limit operations based on time (if needed)
    if (context.businessHoursOnly && !this.isBusinessHours() && user.role !== UserRole.ADMIN) {
      return { allowed: false, reason: 'Operation only allowed during business hours' };
    }

    // Example: Check if user account is active
    if (!user.isActive) {
      return { allowed: false, reason: 'User account is inactive' };
    }

    return { allowed: true };
  }

  /**
   * Helper to check if current time is within business hours
   */
  private static isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Business hours: Monday-Friday, 9 AM - 6 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }
}
