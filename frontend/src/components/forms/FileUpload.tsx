// File Upload Component
// Enhanced file upload with drag-and-drop, validation, and preview

import React, { useCallback, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
  SxProps,
  Theme,
  Tooltip,
  CircularProgress,
  Stack,
  Fade
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { FILE_VALIDATION } from '../../validation/candidateValidation';
import { useFileUpload } from '../../hooks/useFileUpload';
import { 
  validateFile as comprehensiveValidateFile, 
  quickValidateFile, 
  FileValidationResult,
  formatFileSize as utilFormatFileSize
} from '../../utils/fileValidation';
import FileValidationDisplay from '../common/FileValidationDisplay';
import UploadProgress from '../common/UploadProgress';
import UploadErrorBoundary from '../common/UploadErrorBoundary';

export interface FileUploadProps {
  // File handling
  file?: File | null;
  existingFile?: {
    fileName: string;
    fileSize: number;
    downloadUrl?: string;
  };
  onFileChange: (file: File | null) => void;
  onExistingFileDelete?: () => void;
  
  // Validation
  accept?: string;
  maxSize?: number;
  allowedTypes?: string[];
  
  // UI customization
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  showPreview?: boolean;
  
  // Upload state
  uploading?: boolean;
  uploadProgress?: number;
  
  // Auto upload functionality
  autoUpload?: boolean;
  candidateId?: number;
  
  // Validation options
  enableComprehensiveValidation?: boolean;
  showValidationDetails?: boolean;
  customValidationOptions?: any;
  
  // Progress options
  showUploadProgress?: boolean;
  showProgressDetails?: boolean;
  
  // Styling
  sx?: SxProps<Theme>;
  
  // Callbacks
  onError?: (error: string) => void;
  onSuccess?: (file: File) => void;
  onUploadComplete?: (fileInfo: any) => void;
  onUploadStart?: () => void;
  onValidationResult?: (result: FileValidationResult) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  existingFile,
  onFileChange,
  onExistingFileDelete,
  accept = '.pdf,.doc,.docx',
  maxSize = FILE_VALIDATION.MAX_SIZE,
  allowedTypes = FILE_VALIDATION.ALLOWED_TYPES,
  label = 'Upload CV/Resume',
  helperText = 'Drag and drop your CV here, or click to browse. Max size: 5MB. Formats: PDF, DOC, DOCX',
  error = false,
  errorText,
  disabled = false,
  required = false,
  compact = false,
  showPreview = true,
  uploading: externalUploading = false,
  uploadProgress: externalUploadProgress,
  autoUpload = false,
  candidateId,
  enableComprehensiveValidation = true,
  showValidationDetails = false,
  customValidationOptions = {},
  showUploadProgress = true,
  showProgressDetails = true,
  sx,
  onError,
  onSuccess,
  onUploadComplete,
  onUploadStart,
  onValidationResult
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use file upload hook for auto-upload functionality
  const fileUploadHook = useFileUpload({
    maxSize,
    allowedTypes: [...allowedTypes], // Convert readonly array to mutable array
    onSuccess: (fileInfo) => {
      onUploadComplete?.(fileInfo);
    },
    onError: (error) => {
      setValidationError(error);
      onError?.(error);
    }
  });

  // Determine current upload state
  const uploading = externalUploading || fileUploadHook.uploading;
  const uploadProgress = externalUploadProgress ?? fileUploadHook.uploadProgress;

  // Format file size (use utility function)
  const formatFileSize = utilFormatFileSize;

  // Get appropriate file icon
  const getFileIcon = (fileName: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const extension = fileName.toLowerCase().split('.').pop();
    const iconProps = {
      sx: { 
        fontSize: size === 'small' ? 20 : size === 'medium' ? 32 : 48,
        color: extension === 'pdf' ? 'error.main' : 'primary.main'
      }
    };

    switch (extension) {
      case 'pdf':
        return <PdfIcon {...iconProps} />;
      case 'doc':
      case 'docx':
        return <DocIcon {...iconProps} />;
      default:
        return <FileIcon {...iconProps} />;
    }
  };

  // Handle file retry (for failed uploads)
  const handleRetry = useCallback(async () => {
    if (file && autoUpload) {
      setValidationError(null);
      fileUploadHook.clearError();
      onUploadStart?.();
      await fileUploadHook.retryUpload(file, candidateId);
    }
  }, [file, autoUpload, candidateId, fileUploadHook, onUploadStart]);

  // Handle upload cancel
  const handleCancel = useCallback(() => {
    fileUploadHook.reset();
    setValidationError(null);
    setValidationResult(null);
  }, [fileUploadHook]);

  // Validate file
  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    if (enableComprehensiveValidation) {
      // Use comprehensive validation
      const result = await comprehensiveValidateFile(file, {
        maxSize,
        allowedTypes: [...allowedTypes],
        allowedExtensions: FILE_VALIDATION.ALLOWED_EXTENSIONS,
        strictTypeChecking: true,
        checkMagicNumbers: true,
        preventDoubleExtensions: true,
        checkSuspiciousNames: true,
        ...customValidationOptions
      });
      
      setValidationResult(result);
      onValidationResult?.(result);
      
      if (!result.isValid) {
        return result.errors[0]; // Return first error
      }
      
      return null;
    } else {
      // Use quick validation for backward compatibility
      const result = quickValidateFile(file);
      if (!result.isValid) {
        return result.error || 'File validation failed';
      }
      return null;
    }
  }, [maxSize, allowedTypes, enableComprehensiveValidation, customValidationOptions, onValidationResult]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setValidationError(null);
    setValidationResult(null);
    fileUploadHook.clearError();
    
    const validationError = await validateFile(selectedFile);
    if (validationError) {
      setValidationError(validationError);
      onError?.(validationError);
      return;
    }

    onFileChange(selectedFile);
    onSuccess?.(selectedFile);

    // Auto-upload if enabled
    if (autoUpload) {
      onUploadStart?.();
      await fileUploadHook.uploadFile(selectedFile, candidateId);
    }
  }, [validateFile, onFileChange, onError, onSuccess, autoUpload, candidateId, fileUploadHook, onUploadStart]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setDragActive(false);
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [disabled, uploading, handleFileSelect]);

  // Handle file removal
  const handleFileRemove = () => {
    setValidationError(null);
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Handle existing file download
  const handleExistingFileDownload = () => {
    if (existingFile?.downloadUrl) {
      window.open(existingFile.downloadUrl, '_blank');
    }
  };

  // Handle existing file delete
  const handleExistingFileDelete = () => {
    onExistingFileDelete?.();
  };

  // Handle browse click
  const handleBrowseClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click();
    }
  };

  // Current error to display
  const displayError = errorText || validationError || fileUploadHook.error;

  return (
    <UploadErrorBoundary
      onError={(error, errorInfo, errorId) => {
        console.error('FileUpload Error:', { error, errorInfo, errorId });
        onError?.(error.message);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <Box sx={sx}>
        {/* Label */}
        <Typography variant="subtitle2" gutterBottom>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Typography>

      {/* Existing file display */}
      {existingFile && !file && (
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'success.50',
            border: '1px solid',
            borderColor: 'success.main',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getFileIcon(existingFile.fileName, 'small')}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {existingFile.fileName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(existingFile.fileSize)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {existingFile.downloadUrl && (
                <IconButton
                  size="small"
                  onClick={handleExistingFileDownload}
                  title="Download file"
                >
                  <DownloadIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={handleExistingFileDelete}
                color="error"
                title="Remove file"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Upload area */}
      <Paper
        elevation={dragActive ? 3 : 1}
        sx={{
          p: compact ? 2 : 3,
          border: '2px dashed',
          borderColor: error ? 'error.main' : 
                      dragActive ? 'primary.main' : 
                      file ? 'success.main' : 'grey.300',
          backgroundColor: error ? 'error.50' : 
                          dragActive ? 'primary.50' : 
                          file ? 'success.50' : 'grey.50',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 2,
          opacity: disabled ? 0.6 : 1,
          minHeight: compact ? 80 : 120,
          '&:hover': {
            borderColor: !disabled && !uploading ? 'primary.main' : undefined,
            backgroundColor: !disabled && !uploading ? 'primary.50' : undefined,
          }
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />

        {/* Upload content */}
        {!file ? (
          <Box sx={{ textAlign: 'center' }}>
            <UploadIcon
              sx={{
                fontSize: compact ? 32 : 48,
                color: error ? 'error.main' : 
                       dragActive ? 'primary.main' : 'grey.400',
                mb: compact ? 1 : 2,
                transition: 'all 0.3s ease'
              }}
            />
            <Typography variant={compact ? "body1" : "h6"} gutterBottom>
              {dragActive ? 'Drop file here' : 
               compact ? 'Drop or click to browse' : 'Drop file here or click to browse'}
            </Typography>
            {!compact && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {helperText}
              </Typography>
            )}
            <Button
              variant="outlined"
              size={compact ? "small" : "medium"}
              disabled={disabled || uploading}
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              Browse Files
            </Button>
          </Box>
        ) : (
          <Fade in={!!file}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getFileIcon(file.name)}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {file.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                  {showPreview && file.type === 'application/pdf' && (
                    <Typography variant="caption" color="primary.main" sx={{ cursor: 'pointer' }}>
                      • Preview available
                    </Typography>
                  )}
                </Stack>
              </Box>
              
              {/* Status indicators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {uploading ? (
                  <CircularProgress size={20} />
                ) : fileUploadHook.isSuccess || (!autoUpload && file) ? (
                  <Chip
                    label={autoUpload ? "Uploaded" : "Selected"}
                    color="success"
                    size="small"
                    icon={<SuccessIcon />}
                  />
                ) : fileUploadHook.hasError ? (
                  <Tooltip title="Upload failed - click to retry">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry();
                      }}
                      disabled={!autoUpload}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileRemove();
                  }}
                  color="error"
                  size="small"
                  disabled={disabled || uploading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Enhanced Upload Progress */}
        {showUploadProgress && (uploading || fileUploadHook.hasError || fileUploadHook.isSuccess) && (
          <Box sx={{ mt: 2 }}>
            <UploadProgress
              uploading={uploading}
              progress={uploadProgress || 0}
              stage={fileUploadHook.stage}
              uploadSpeed={fileUploadHook.uploadSpeed}
              estimatedTimeRemaining={fileUploadHook.estimatedTimeRemaining}
              error={fileUploadHook.error}
              lastError={fileUploadHook.lastError}
              retryCount={fileUploadHook.retryCount}
              fileName={file?.name}
              fileSize={file?.size}
              onRetry={handleRetry}
              onCancel={uploading ? handleCancel : undefined}
              onClose={() => fileUploadHook.reset()}
              compact={compact}
              showDetails={showProgressDetails}
              showFileInfo={false} // File info already shown above
            />
          </Box>
        )}
      </Paper>

      {/* Validation Results */}
      {enableComprehensiveValidation && validationResult && file && (
        <Box sx={{ mt: 2 }}>
          <FileValidationDisplay
            validationResult={validationResult}
            file={file}
            showDetails={showValidationDetails}
            compact={compact}
          />
        </Box>
      )}

      {/* Error message */}
      {displayError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          icon={<ErrorIcon />}
        >
          {displayError}
        </Alert>
      )}

      {/* Helper text */}
      {!displayError && helperText && !file && compact && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
      </Box>
    </UploadErrorBoundary>
  );
};

export default FileUpload;
