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
  Theme
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { FILE_VALIDATION } from '../../validation/candidateValidation';

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
  
  // Upload state
  uploading?: boolean;
  uploadProgress?: number;
  
  // Styling
  sx?: SxProps<Theme>;
  
  // Callbacks
  onError?: (error: string) => void;
  onSuccess?: (file: File) => void;
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
  uploading = false,
  uploadProgress,
  sx,
  onError,
  onSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type as any)) {
      const allowedExtensions = accept.split(',').map(ext => ext.trim()).join(', ');
      return `File type not allowed. Please use: ${allowedExtensions}`;
    }

    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `File extension not allowed. Please use: ${allowedExtensions.join(', ')}`;
    }

    return null;
  }, [maxSize, allowedTypes, accept]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    setValidationError(null);
    
    const validationResult = validateFile(selectedFile);
    if (validationResult) {
      setValidationError(validationResult);
      onError?.(validationResult);
      return;
    }

    onFileChange(selectedFile);
    onSuccess?.(selectedFile);
  }, [validateFile, onFileChange, onError, onSuccess]);

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
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
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
  const displayError = errorText || validationError;

  return (
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
            <FileIcon color="success" />
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
          p: 3,
          border: '2px dashed',
          borderColor: error ? 'error.main' : 
                      dragActive ? 'primary.main' : 
                      file ? 'success.main' : 'grey.300',
          backgroundColor: error ? 'error.50' : 
                          dragActive ? 'primary.50' : 
                          file ? 'success.50' : 'grey.50',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: 2,
          opacity: disabled ? 0.6 : 1
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
                fontSize: 48,
                color: error ? 'error.main' : 
                       dragActive ? 'primary.main' : 'grey.400',
                mb: 2
              }}
            />
            <Typography variant="h6" gutterBottom>
              {dragActive ? 'Drop file here' : 'Drop file here or click to browse'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {helperText}
            </Typography>
            <Button
              variant="outlined"
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileIcon color="success" sx={{ fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            <Chip
              label="Selected"
              color="success"
              size="small"
              icon={<SuccessIcon />}
            />
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
        )}

        {/* Upload progress */}
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant={uploadProgress !== undefined ? 'determinate' : 'indeterminate'}
              value={uploadProgress}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {uploadProgress !== undefined
                ? `Uploading... ${Math.round(uploadProgress)}%`
                : 'Uploading...'
              }
            </Typography>
          </Box>
        )}
      </Paper>

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
      {!displayError && helperText && !file && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
