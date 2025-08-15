// API Response and Request Types
// Frontend types for API communication

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  timestamp?: string;
  details?: any;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Search and Filter Types
export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// File Upload Types
export interface FileUploadParams {
  file: File;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface FileUploadResponse {
  success: boolean;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FileDownloadParams {
  id: number;
  fileName: string;
}

// Request Configuration
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withAuth?: boolean;
}

// Error Codes
export enum ApiErrorCode {
  // Authentication Errors
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  REFRESH_TOKEN_MISSING = 'REFRESH_TOKEN_MISSING',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  REFRESH_TOKEN_REVOKED = 'REFRESH_TOKEN_REVOKED',
  
  // Authorization Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  
  // File Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Rate Limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  TOO_MANY_AUTH_ATTEMPTS = 'TOO_MANY_AUTH_ATTEMPTS',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// HTTP Status Codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    CHANGE_PASSWORD: '/api/auth/change-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VALIDATE: '/api/auth/validate'
  },
  
  // Candidates
  CANDIDATES: {
    BASE: '/api/candidates',
    BY_ID: (id: number) => `/api/candidates/${id}`,
    UPLOAD_CV: (id: number) => `/api/candidates/${id}/cv`,
    DOWNLOAD_CV: (id: number) => `/api/candidates/${id}/cv`
  },
  
  // Files
  FILES: {
    BASE: '/api/files',
    BY_NAME: (fileName: string) => `/api/files/${fileName}`
  },
  
  // Health
  HEALTH: '/health'
} as const;

// Request Methods
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

// Content Types
export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  URL_ENCODED = 'application/x-www-form-urlencoded',
  TEXT = 'text/plain'
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  withCredentials: boolean;
}

// Request Interceptor Types
export interface RequestInterceptor {
  onRequest?: (config: any) => any;
  onRequestError?: (error: any) => any;
}

export interface ResponseInterceptor {
  onResponse?: (response: any) => any;
  onResponseError?: (error: any) => any;
}
