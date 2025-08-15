// Error Handler Utility
// Centralized error handling and user-friendly error messages

import { ApiError, ApiErrorCode } from '../types/api.types';

export interface ProcessedError {
  title: string;
  message: string;
  code?: string;
  severity: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    handler: () => void;
  };
}

export class ErrorHandler {
  /**
   * Process API error into user-friendly format
   */
  static processApiError(error: ApiError | Error | string): ProcessedError {
    // Handle string errors
    if (typeof error === 'string') {
      return {
        title: 'Error',
        message: error,
        severity: 'error'
      };
    }

    // Handle generic Error objects
    if (error instanceof Error && !('success' in error)) {
      return {
        title: 'Unexpected Error',
        message: error.message || 'An unexpected error occurred',
        severity: 'error'
      };
    }

    // Handle API errors
    const apiError = error as ApiError;
    
    return {
      title: this.getErrorTitle(apiError.code),
      message: this.getErrorMessage(apiError.code, apiError.error),
      code: apiError.code,
      severity: this.getErrorSeverity(apiError.code)
    };
  }

  /**
   * Get user-friendly error title based on error code
   */
  private static getErrorTitle(code?: string): string {
    if (!code) return 'Error';

    switch (code) {
      // Authentication Errors
      case ApiErrorCode.TOKEN_EXPIRED:
        return 'Session Expired';
      case ApiErrorCode.TOKEN_INVALID:
      case ApiErrorCode.TOKEN_MISSING:
        return 'Authentication Required';
      case ApiErrorCode.REFRESH_TOKEN_EXPIRED:
        return 'Session Expired';
      case ApiErrorCode.REFRESH_TOKEN_INVALID:
        return 'Authentication Error';

      // Authorization Errors
      case ApiErrorCode.INSUFFICIENT_PERMISSIONS:
        return 'Access Denied';
      case ApiErrorCode.RESOURCE_ACCESS_DENIED:
        return 'Access Denied';
      case ApiErrorCode.ACCOUNT_LOCKED:
        return 'Account Locked';
      case ApiErrorCode.ACCOUNT_DISABLED:
        return 'Account Disabled';

      // Validation Errors
      case ApiErrorCode.VALIDATION_ERROR:
      case ApiErrorCode.MISSING_REQUIRED_FIELDS:
        return 'Validation Error';
      case ApiErrorCode.INVALID_EMAIL_FORMAT:
        return 'Invalid Email';
      case ApiErrorCode.PASSWORD_TOO_WEAK:
        return 'Weak Password';

      // Resource Errors
      case ApiErrorCode.RESOURCE_NOT_FOUND:
        return 'Not Found';
      case ApiErrorCode.RESOURCE_ALREADY_EXISTS:
      case ApiErrorCode.DUPLICATE_EMAIL:
        return 'Already Exists';

      // File Upload Errors
      case ApiErrorCode.FILE_TOO_LARGE:
        return 'File Too Large';
      case ApiErrorCode.INVALID_FILE_TYPE:
        return 'Invalid File Type';
      case ApiErrorCode.FILE_UPLOAD_FAILED:
        return 'Upload Failed';

      // Server Errors
      case ApiErrorCode.INTERNAL_SERVER_ERROR:
        return 'Server Error';
      case ApiErrorCode.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      case ApiErrorCode.DATABASE_ERROR:
        return 'Database Error';

      // Rate Limiting
      case ApiErrorCode.TOO_MANY_REQUESTS:
      case ApiErrorCode.TOO_MANY_AUTH_ATTEMPTS:
        return 'Too Many Attempts';

      // Network Errors
      case ApiErrorCode.NETWORK_ERROR:
        return 'Connection Error';

      default:
        return 'Error';
    }
  }

  /**
   * Get user-friendly error message based on error code
   */
  private static getErrorMessage(code?: string, originalMessage?: string): string {
    if (!code) return originalMessage || 'An unexpected error occurred';

    switch (code) {
      // Authentication Errors
      case ApiErrorCode.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ApiErrorCode.TOKEN_INVALID:
      case ApiErrorCode.TOKEN_MISSING:
        return 'Please log in to continue.';
      case ApiErrorCode.REFRESH_TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ApiErrorCode.REFRESH_TOKEN_INVALID:
        return 'Authentication failed. Please log in again.';

      // Authorization Errors
      case ApiErrorCode.INSUFFICIENT_PERMISSIONS:
        return 'You don\'t have permission to perform this action.';
      case ApiErrorCode.RESOURCE_ACCESS_DENIED:
        return 'You don\'t have access to this resource.';
      case ApiErrorCode.ACCOUNT_LOCKED:
        return 'Your account has been temporarily locked due to multiple failed login attempts.';
      case ApiErrorCode.ACCOUNT_DISABLED:
        return 'Your account has been disabled. Please contact support.';

      // Validation Errors
      case ApiErrorCode.VALIDATION_ERROR:
        return originalMessage || 'Please check your input and try again.';
      case ApiErrorCode.MISSING_REQUIRED_FIELDS:
        return 'Please fill in all required fields.';
      case ApiErrorCode.INVALID_EMAIL_FORMAT:
        return 'Please enter a valid email address.';
      case ApiErrorCode.PASSWORD_TOO_WEAK:
        return 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.';

      // Resource Errors
      case ApiErrorCode.RESOURCE_NOT_FOUND:
        return 'The requested resource could not be found.';
      case ApiErrorCode.RESOURCE_ALREADY_EXISTS:
        return 'This resource already exists.';
      case ApiErrorCode.DUPLICATE_EMAIL:
        return 'An account with this email address already exists.';

      // File Upload Errors
      case ApiErrorCode.FILE_TOO_LARGE:
        return 'File is too large. Maximum size is 5MB.';
      case ApiErrorCode.INVALID_FILE_TYPE:
        return 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
      case ApiErrorCode.FILE_UPLOAD_FAILED:
        return 'Failed to upload file. Please try again.';

      // Server Errors
      case ApiErrorCode.INTERNAL_SERVER_ERROR:
        return 'A server error occurred. Please try again later.';
      case ApiErrorCode.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later.';
      case ApiErrorCode.DATABASE_ERROR:
        return 'A database error occurred. Please try again later.';

      // Rate Limiting
      case ApiErrorCode.TOO_MANY_REQUESTS:
        return 'Too many requests. Please wait a moment before trying again.';
      case ApiErrorCode.TOO_MANY_AUTH_ATTEMPTS:
        return 'Too many login attempts. Please wait before trying again.';

      // Network Errors
      case ApiErrorCode.NETWORK_ERROR:
        return 'Connection error. Please check your internet connection and try again.';

      default:
        return originalMessage || 'An unexpected error occurred';
    }
  }

  /**
   * Get error severity based on error code
   */
  private static getErrorSeverity(code?: string): 'error' | 'warning' | 'info' {
    if (!code) return 'error';

    switch (code) {
      case ApiErrorCode.TOKEN_EXPIRED:
      case ApiErrorCode.REFRESH_TOKEN_EXPIRED:
        return 'warning';
      
      case ApiErrorCode.VALIDATION_ERROR:
      case ApiErrorCode.MISSING_REQUIRED_FIELDS:
      case ApiErrorCode.INVALID_EMAIL_FORMAT:
      case ApiErrorCode.PASSWORD_TOO_WEAK:
      case ApiErrorCode.FILE_TOO_LARGE:
      case ApiErrorCode.INVALID_FILE_TYPE:
        return 'warning';

      case ApiErrorCode.TOO_MANY_REQUESTS:
      case ApiErrorCode.TOO_MANY_AUTH_ATTEMPTS:
        return 'warning';

      default:
        return 'error';
    }
  }

  /**
   * Check if error requires user to re-authenticate
   */
  static requiresReauth(error: ApiError): boolean {
    return [
      ApiErrorCode.TOKEN_EXPIRED,
      ApiErrorCode.TOKEN_INVALID,
      ApiErrorCode.TOKEN_MISSING,
      ApiErrorCode.REFRESH_TOKEN_EXPIRED,
      ApiErrorCode.REFRESH_TOKEN_INVALID
    ].includes(error.code as ApiErrorCode);
  }

  /**
   * Check if error is a validation error
   */
  static isValidationError(error: ApiError): boolean {
    return [
      ApiErrorCode.VALIDATION_ERROR,
      ApiErrorCode.MISSING_REQUIRED_FIELDS,
      ApiErrorCode.INVALID_EMAIL_FORMAT,
      ApiErrorCode.PASSWORD_TOO_WEAK
    ].includes(error.code as ApiErrorCode);
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    return [
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      ApiErrorCode.DATABASE_ERROR
    ].includes(error.code as ApiErrorCode);
  }

  /**
   * Get retry delay in milliseconds based on error type
   */
  static getRetryDelay(error: ApiError, attempt: number = 1): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    if (!this.isRetryable(error)) return 0;

    // Exponential backoff
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return delay + jitter;
  }
}

// Export singleton for convenience
export const errorHandler = ErrorHandler;
