// User and Authentication Types
// Frontend types matching backend interfaces

export enum UserRole {
  HR_RECRUITER = 'HR_RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name?: string | null;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  name?: string | null;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  permissions?: PermissionSummary;
  loginTime?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  tokenType?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Permission Types
export enum Permission {
  // Candidate Management
  CREATE_CANDIDATE = 'CREATE_CANDIDATE',
  READ_CANDIDATE = 'READ_CANDIDATE',
  UPDATE_CANDIDATE = 'UPDATE_CANDIDATE',
  DELETE_CANDIDATE = 'DELETE_CANDIDATE',
  
  // File Management
  UPLOAD_CV = 'UPLOAD_CV',
  DOWNLOAD_CV = 'DOWNLOAD_CV',
  DELETE_CV = 'DELETE_CV',
  
  // User Management (Admin only)
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  
  // System Management
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  EXPORT_DATA = 'EXPORT_DATA'
}

export interface PermissionSummary {
  role: UserRole;
  effectivePermissions: Permission[];
  canManageCandidates?: boolean;
  canManageUsers?: boolean;
  canViewAnalytics?: boolean;
  canManageSystem?: boolean;
}

// Form validation types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
