// Enhanced Upload Progress Component
// Displays detailed upload progress with stage indicators, speed, and error handling

import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Chip,
  Stack,
  Alert,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CloudUpload as UploadIcon,
  Speed as SpeedIcon,
  Schedule as TimeIcon,
  Refresh as RetryIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';

export interface UploadProgressProps {
  // Progress state
  uploading: boolean;
  progress: number;
  stage: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';
  
  // Speed and time info
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  
  // Error handling
  error?: string | null;
  lastError?: {
    code?: string;
    message: string;
    timestamp: Date;
    retryable: boolean;
  };
  retryCount?: number;
  
  // File info
  fileName?: string;
  fileSize?: number;
  
  // Actions
  onRetry?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  
  // UI options
  compact?: boolean;
  showDetails?: boolean;
  showFileInfo?: boolean;
  sx?: any;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  uploading,
  progress,
  stage,
  uploadSpeed,
  estimatedTimeRemaining,
  error,
  lastError,
  retryCount = 0,
  fileName,
  fileSize,
  onRetry,
  onCancel,
  onClose,
  compact = false,
  showDetails = true,
  showFileInfo = true,
  sx
}) => {
  const [expanded, setExpanded] = React.useState(!compact);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  // Get stage info
  const getStageInfo = () => {
    const stages = {
      idle: { label: 'Ready', color: 'default', icon: <UploadIcon /> },
      validating: { label: 'Validating', color: 'info', icon: <CheckIcon /> },
      uploading: { label: 'Uploading', color: 'primary', icon: <UploadIcon /> },
      processing: { label: 'Processing', color: 'secondary', icon: <CircularProgress size={16} /> },
      completed: { label: 'Completed', color: 'success', icon: <CheckIcon /> },
      error: { label: 'Error', color: 'error', icon: <ErrorIcon /> }
    };
    return stages[stage] || stages.idle;
  };

  // Get progress color
  const getProgressColor = () => {
    if (stage === 'error') return 'error';
    if (stage === 'completed') return 'success';
    if (stage === 'processing') return 'secondary';
    return 'primary';
  };

  const stageInfo = getStageInfo();

  if (!uploading && !error && stage === 'idle') {
    return null; // Don't show when idle
  }

  return (
    <Paper elevation={1} sx={{ p: compact ? 1.5 : 2, borderRadius: 2, ...sx }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 1 : 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {stageInfo.icon}
          <Typography variant={compact ? "body2" : "subtitle2"} fontWeight={600}>
            {uploading ? 'Upload Progress' : stage === 'completed' ? 'Upload Complete' : 'Upload Failed'}
          </Typography>
          <Chip
            label={stageInfo.label}
            color={stageInfo.color as any}
            size="small"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showDetails && (
            <Tooltip title={expanded ? 'Hide details' : 'Show details'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* File Info */}
      {showFileInfo && fileName && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {fileName}
            {fileSize && ` (${formatFileSize(fileSize)})`}
          </Typography>
        </Box>
      )}

      {/* Progress Bar */}
      {uploading && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant={progress > 0 ? 'determinate' : 'indeterminate'}
            value={progress}
            color={getProgressColor() as any}
            sx={{ 
              height: compact ? 6 : 8, 
              borderRadius: 3,
              backgroundColor: 'grey.200'
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {progress > 0 ? `${Math.round(progress)}%` : 'Starting...'}
            </Typography>
            {uploadSpeed && uploadSpeed > 0 && (
              <Typography variant="caption" color="text.secondary">
                {formatSpeed(uploadSpeed)}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: expanded ? 1.5 : 0 }}
          action={
            lastError?.retryable && onRetry ? (
              <Button
                color="inherit"
                size="small"
                onClick={onRetry}
                startIcon={<RetryIcon />}
                disabled={uploading}
              >
                Retry {retryCount > 0 && `(${retryCount}/3)`}
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* Success Message */}
      {stage === 'completed' && !error && (
        <Alert severity="success" sx={{ mb: expanded ? 1.5 : 0 }}>
          File uploaded successfully!
        </Alert>
      )}

      {/* Detailed Information */}
      <Collapse in={expanded && showDetails}>
        {uploading && (
          <Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1.5}>
              {/* Stage Progress */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Upload Stages
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {['validating', 'uploading', 'processing', 'completed'].map((stageName) => {
                    const isActive = stage === stageName;
                    const isCompleted = ['validating', 'uploading', 'processing', 'completed'].indexOf(stage) > 
                                      ['validating', 'uploading', 'processing', 'completed'].indexOf(stageName);
                    
                    return (
                      <Chip
                        key={stageName}
                        label={stageName.charAt(0).toUpperCase() + stageName.slice(1)}
                        size="small"
                        color={isCompleted ? 'success' : isActive ? 'primary' : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                      />
                    );
                  })}
                </Stack>
              </Box>

              {/* Speed and Time Info */}
              {(uploadSpeed || estimatedTimeRemaining) && (
                <Box>
                  <Stack direction="row" spacing={2}>
                    {uploadSpeed && uploadSpeed > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SpeedIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {formatSpeed(uploadSpeed)}
                        </Typography>
                      </Box>
                    )}
                    {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption">
                          {formatTimeRemaining(estimatedTimeRemaining)} remaining
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {/* Error Details */}
        {error && lastError && (
          <Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Error Details
              </Typography>
              <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography variant="caption" display="block">
                  <strong>Code:</strong> {lastError.code || 'UNKNOWN_ERROR'}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Time:</strong> {lastError.timestamp.toLocaleTimeString()}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Retryable:</strong> {lastError.retryable ? 'Yes' : 'No'}
                </Typography>
                {retryCount > 0 && (
                  <Typography variant="caption" display="block">
                    <strong>Retry Attempts:</strong> {retryCount}/3
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}
      </Collapse>

      {/* Actions */}
      {(onCancel || onRetry) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
          {onCancel && uploading && (
            <Button
              size="small"
              onClick={onCancel}
              color="inherit"
            >
              Cancel
            </Button>
          )}
          {onRetry && error && lastError?.retryable && !uploading && (
            <Button
              size="small"
              onClick={onRetry}
              color="primary"
              variant="outlined"
              startIcon={<RetryIcon />}
            >
              Retry Upload
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default UploadProgress;
