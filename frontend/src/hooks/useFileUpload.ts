import { useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { FILE_VALIDATION } from '../validation/candidateValidation';

export interface FileUploadState {
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  success: boolean;
  stage: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';
  estimatedTimeRemaining?: number;
  uploadSpeed?: number;
  retryCount: number;
  lastError?: {
    code?: string;
    message: string;
    timestamp: Date;
    retryable: boolean;
  };
}

export interface UploadedFileInfo {
  fileName: string;
  originalName: string;
  size: number;
  downloadUrl?: string;
}

export interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  onSuccess?: (fileInfo: UploadedFileInfo) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxSize = FILE_VALIDATION.MAX_SIZE,
    allowedTypes = FILE_VALIDATION.ALLOWED_TYPES,
    onSuccess,
    onError,
    onProgress
  } = options;

  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    uploadProgress: 0,
    error: null,
    success: false,
    stage: 'idle',
    retryCount: 0
  });

  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type as any)) {
      return `File type not allowed. Allowed types: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    const hasValidExtension = FILE_VALIDATION.ALLOWED_EXTENSIONS.some(ext => 
      fileName.endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return `File extension not allowed. Allowed extensions: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check for empty file
    if (file.size === 0) {
      return 'File cannot be empty';
    }

    return null;
  }, [maxSize, allowedTypes]);

  // Upload file to candidate with enhanced progress tracking
  const uploadFile = useCallback(async (file: File, candidateId?: number): Promise<UploadedFileInfo | null> => {
    const startTime = Date.now();
    
    // Reset state
    setState({
      uploading: true,
      uploadProgress: 0,
      error: null,
      success: false,
      stage: 'validating',
      retryCount: 0
    });

    try {
      // Stage 1: Validation
      setState(prev => ({ ...prev, stage: 'validating' }));
      
      const validationError = validateFile(file);
      if (validationError) {
        const errorInfo = {
          code: 'VALIDATION_ERROR',
          message: validationError,
          timestamp: new Date(),
          retryable: false
        };
        
        setState(prev => ({
          ...prev,
          uploading: false,
          error: validationError,
          stage: 'error',
          lastError: errorInfo
        }));
        
        onError?.(validationError);
        return null;
      }

      // Stage 2: Uploading
      setState(prev => ({ ...prev, stage: 'uploading', uploadProgress: 10 }));

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('cv', file);
      if (candidateId) {
        formData.append('candidateId', candidateId.toString());
      }

      // Create promise for XMLHttpRequest
      const uploadPromise = new Promise<UploadedFileInfo>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 90 + 10; // 10-100%
            const elapsed = Date.now() - startTime;
            const uploadSpeed = event.loaded / (elapsed / 1000); // bytes per second
            const remaining = event.total - event.loaded;
            const estimatedTimeRemaining = remaining / uploadSpeed;

            setState(prev => ({
              ...prev,
              uploadProgress: Math.round(percentComplete),
              uploadSpeed,
              estimatedTimeRemaining
            }));

            onProgress?.(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (parseError) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error || `HTTP ${xhr.status}: ${xhr.statusText}`));
            } catch (parseError) {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'));
        });

        // Get token for authentication
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout
        xhr.open('POST', candidateId ? `/api/candidates/${candidateId}/cv` : '/api/files/upload');
        xhr.send(formData);
      });

      // Stage 3: Processing
      setState(prev => ({ ...prev, stage: 'processing', uploadProgress: 95 }));
      
      const fileInfo = await uploadPromise;
      
      // Stage 4: Completed
      setUploadedFile(fileInfo);
      setState(prev => ({
        ...prev,
        uploading: false,
        uploadProgress: 100,
        error: null,
        success: true,
        stage: 'completed'
      }));
      
      onSuccess?.(fileInfo);
      return fileInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const isRetryable = !errorMessage.includes('validation') && 
                         !errorMessage.includes('file type') && 
                         !errorMessage.includes('file size');
      
      const errorInfo = {
        code: getErrorCode(errorMessage),
        message: errorMessage,
        timestamp: new Date(),
        retryable: isRetryable
      };

      setState(prev => ({
        ...prev,
        uploading: false,
        uploadProgress: 0,
        error: errorMessage,
        success: false,
        stage: 'error',
        lastError: errorInfo
      }));
      
      onError?.(errorMessage);
      return null;
    }
  }, [validateFile, onSuccess, onError, onProgress]);

  // Delete uploaded file
  const deleteFile = useCallback(async (fileName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const response = await apiClient.delete(`/api/files/${fileName}`);
      
      if (response.success) {
        setUploadedFile(null);
        setState(prev => ({ ...prev, success: false }));
        return true;
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return false;
    }
  }, [onError]);

  // Download file
  const downloadFile = useCallback(async (fileName: string, originalName?: string) => {
    try {
      await apiClient.downloadFile(`/api/files/${fileName}`, originalName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [onError]);

  // Retry upload with exponential backoff
  const retryUpload = useCallback(async (file: File, candidateId?: number): Promise<UploadedFileInfo | null> => {
    if (!state.lastError?.retryable) {
      onError?.('This error cannot be retried');
      return null;
    }

    const newRetryCount = state.retryCount + 1;
    const maxRetries = 3;
    
    if (newRetryCount > maxRetries) {
      onError?.('Maximum retry attempts exceeded');
      return null;
    }

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000); // Max 10 seconds
    
    setState(prev => ({ 
      ...prev, 
      retryCount: newRetryCount,
      stage: 'idle'
    }));

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return uploadFile(file, candidateId);
  }, [state.lastError, state.retryCount, uploadFile, onError]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      uploading: false,
      uploadProgress: 0,
      error: null,
      success: false,
      stage: 'idle',
      retryCount: 0
    });
    setUploadedFile(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    uploadedFile,
    
    // Actions
    uploadFile,
    retryUpload,
    deleteFile,
    downloadFile,
    validateFile,
    reset,
    clearError,
    
    // Helpers
    isUploading: state.uploading,
    hasError: !!state.error,
    isSuccess: state.success,
    hasFile: !!uploadedFile
  };
};

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get error codes
const getErrorCode = (errorMessage: string): string => {
  if (errorMessage.includes('network') || errorMessage.includes('Network')) return 'NETWORK_ERROR';
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) return 'TIMEOUT_ERROR';
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) return 'AUTH_ERROR';
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) return 'PERMISSION_ERROR';
  if (errorMessage.includes('413') || errorMessage.includes('too large')) return 'FILE_TOO_LARGE';
  if (errorMessage.includes('415') || errorMessage.includes('file type')) return 'INVALID_FILE_TYPE';
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) return 'RATE_LIMIT_ERROR';
  if (errorMessage.includes('500') || errorMessage.includes('server')) return 'SERVER_ERROR';
  if (errorMessage.includes('validation')) return 'VALIDATION_ERROR';
  return 'UNKNOWN_ERROR';
};

export default useFileUpload;

