import { Request, Response, NextFunction } from 'express';
import { UserRole, IUser } from '../interfaces/IUser';
import { IApiResponse } from '../interfaces/IFileService';

/**
 * Permission definitions for different actions
 */
export enum Permission {
  // Candidate permissions
  CREATE_CANDIDATE = 'CREATE_CANDIDATE',
  READ_CANDIDATE = 'READ_CANDIDATE',
  UPDATE_CANDIDATE = 'UPDATE_CANDIDATE',
  DELETE_CANDIDATE = 'DELETE_CANDIDATE',
  UPLOAD_CV = 'UPLOAD_CV',
  DOWNLOAD_CV = 'DOWNLOAD_CV',
  
  // User management permissions
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  MANAGE_ROLES = 'MANAGE_ROLES',
  
  // System permissions
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  AUDIT_LOGS = 'AUDIT_LOGS'
}

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.HR_RECRUITER]: [
    Permission.CREATE_CANDIDATE,
    Permission.READ_CANDIDATE,
    Permission.UPDATE_CANDIDATE,
    Permission.UPLOAD_CV,
    Permission.DOWNLOAD_CV,
    Permission.READ_USER
  ],
  [UserRole.HIRING_MANAGER]: [
    Permission.CREATE_CANDIDATE,
    Permission.READ_CANDIDATE,
    Permission.UPDATE_CANDIDATE,
    Permission.UPLOAD_CV,
    Permission.DOWNLOAD_CV,
    Permission.READ_USER,
    Permission.VIEW_ANALYTICS
  ],
  [UserRole.ADMIN]: [
    Permission.CREATE_CANDIDATE,
    Permission.READ_CANDIDATE,
    Permission.UPDATE_CANDIDATE,
    Permission.DELETE_CANDIDATE,
    Permission.UPLOAD_CV,
    Permission.DOWNLOAD_CV,
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.MANAGE_ROLES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.AUDIT_LOGS
  ]
};

/**
 * Resource ownership types for access control
 */
export interface ResourceOwnership {
  userId?: number;
  createdById?: number;
  assignedTo?: number[];
}

/**
 * Advanced role-based authorization middleware
 */
export class RoleAuthorizationMiddleware {
  /**
   * Basic role checking middleware
   */
  static requireRoles(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.user;
        
        if (!user) {
          RoleAuthorizationMiddleware.sendUnauthorizedResponse(res, 'User not authenticated', 'USER_NOT_AUTHENTICATED');
          return;
        }

        if (!allowedRoles.includes(user.role)) {
          RoleAuthorizationMiddleware.sendForbiddenResponse(
            res, 
            `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            'INSUFFICIENT_ROLE',
            { requiredRoles: allowedRoles, userRole: user.role }
          );
          return;
        }

        next();
      } catch (error: any) {
        RoleAuthorizationMiddleware.sendForbiddenResponse(res, 'Authorization check failed', 'AUTHORIZATION_ERROR');
      }
    };
  }

  /**
   * Permission-based authorization middleware
   */
  static requirePermissions(requiredPermissions: Permission[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.user;
        
        if (!user) {
          RoleAuthorizationMiddleware.sendUnauthorizedResponse(res, 'User not authenticated', 'USER_NOT_AUTHENTICATED');
          return;
        }

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        const hasAllPermissions = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          const missingPermissions = requiredPermissions.filter(permission => 
            !userPermissions.includes(permission)
          );
          
          RoleAuthorizationMiddleware.sendForbiddenResponse(
            res,
            `Missing required permissions: ${missingPermissions.join(', ')}`,
            'INSUFFICIENT_PERMISSIONS',
            { 
              requiredPermissions,
              userPermissions,
              missingPermissions
            }
          );
          return;
        }

        next();
      } catch (error: any) {
        RoleAuthorizationMiddleware.sendForbiddenResponse(res, 'Permission check failed', 'PERMISSION_ERROR');
      }
    };
  }

  /**
   * Resource ownership authorization middleware
   */
  static requireOwnership(getResourceOwnership: (req: Request) => Promise<ResourceOwnership | null>) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = req.user;
        
        if (!user) {
          RoleAuthorizationMiddleware.sendUnauthorizedResponse(res, 'User not authenticated', 'USER_NOT_AUTHENTICATED');
          return;
        }

        // Admins can access any resource
        if (user.role === UserRole.ADMIN) {
          next();
          return;
        }

        const resourceOwnership = await getResourceOwnership(req);
        
        if (!resourceOwnership) {
          RoleAuthorizationMiddleware.sendForbiddenResponse(res, 'Resource not found or access denied', 'RESOURCE_NOT_FOUND');
          return;
        }

        const isOwner = RoleAuthorizationMiddleware.checkOwnership(user, resourceOwnership);
        
        if (!isOwner) {
          RoleAuthorizationMiddleware.sendForbiddenResponse(
            res,
            'Access denied. You can only access your own resources.',
            'RESOURCE_ACCESS_DENIED',
            { resourceOwnership: { ...resourceOwnership, userId: undefined } } // Don't expose sensitive data
          );
          return;
        }

        next();
      } catch (error: any) {
        RoleAuthorizationMiddleware.sendForbiddenResponse(res, 'Ownership check failed', 'OWNERSHIP_ERROR');
      }
    };
  }

  /**
   * Hierarchical role checking (role must be at least the minimum required level)
   */
  static requireMinimumRole(minimumRole: UserRole) {
    const roleHierarchy = {
      [UserRole.HR_RECRUITER]: 1,
      [UserRole.HIRING_MANAGER]: 2,
      [UserRole.ADMIN]: 3
    };

    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = req.user;
        
        if (!user) {
          RoleAuthorizationMiddleware.sendUnauthorizedResponse(res, 'User not authenticated', 'USER_NOT_AUTHENTICATED');
          return;
        }

        const userLevel = roleHierarchy[user.role];
        const requiredLevel = roleHierarchy[minimumRole];

        if (userLevel < requiredLevel) {
          RoleAuthorizationMiddleware.sendForbiddenResponse(
            res,
            `Access denied. Minimum role required: ${minimumRole}`,
            'INSUFFICIENT_ROLE_LEVEL',
            { minimumRole, userRole: user.role }
          );
          return;
        }

        next();
      } catch (error: any) {
        RoleAuthorizationMiddleware.sendForbiddenResponse(res, 'Role hierarchy check failed', 'ROLE_HIERARCHY_ERROR');
      }
    };
  }

  /**
   * Check if user owns or has access to a resource
   */
  private static checkOwnership(user: IUser, resourceOwnership: ResourceOwnership): boolean {
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
   * Send 401 Unauthorized response
   */
  private static sendUnauthorizedResponse(res: Response, message: string, code: string): void {
    res.status(401).json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    } as IApiResponse);
  }

  /**
   * Send 403 Forbidden response
   */
  private static sendForbiddenResponse(res: Response, message: string, code: string, details?: any): void {
    res.status(403).json({
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString()
    } as IApiResponse);
  }
}

/**
 * Convenience functions for common role checks
 */
export const roleMiddleware = RoleAuthorizationMiddleware.requireRoles;
export const permissionMiddleware = RoleAuthorizationMiddleware.requirePermissions;
export const ownershipMiddleware = RoleAuthorizationMiddleware.requireOwnership;
export const minimumRoleMiddleware = RoleAuthorizationMiddleware.requireMinimumRole;

/**
 * Pre-configured role middleware for common scenarios
 */
export const roleMiddlewares = {
  // Basic role requirements
  hrOnly: roleMiddleware([UserRole.HR_RECRUITER]),
  managerOnly: roleMiddleware([UserRole.HIRING_MANAGER]),
  adminOnly: roleMiddleware([UserRole.ADMIN]),
  
  // Combined role requirements
  hrOrManager: roleMiddleware([UserRole.HR_RECRUITER, UserRole.HIRING_MANAGER]),
  hrOrAdmin: roleMiddleware([UserRole.HR_RECRUITER, UserRole.ADMIN]),
  managerOrAdmin: roleMiddleware([UserRole.HIRING_MANAGER, UserRole.ADMIN]),
  anyAuthenticatedUser: roleMiddleware([UserRole.HR_RECRUITER, UserRole.HIRING_MANAGER, UserRole.ADMIN]),
  
  // Hierarchical requirements
  managerLevel: minimumRoleMiddleware(UserRole.HIRING_MANAGER),
  adminLevel: minimumRoleMiddleware(UserRole.ADMIN),
  
  // Permission-based requirements
  canCreateCandidate: permissionMiddleware([Permission.CREATE_CANDIDATE]),
  canReadCandidate: permissionMiddleware([Permission.READ_CANDIDATE]),
  canUpdateCandidate: permissionMiddleware([Permission.UPDATE_CANDIDATE]),
  canDeleteCandidate: permissionMiddleware([Permission.DELETE_CANDIDATE]),
  canManageUsers: permissionMiddleware([Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER]),
  canViewAnalytics: permissionMiddleware([Permission.VIEW_ANALYTICS]),
  canManageSystem: permissionMiddleware([Permission.MANAGE_SYSTEM])
};
