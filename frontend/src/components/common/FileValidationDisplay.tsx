// File Validation Display Component
// Shows detailed file validation results with visual indicators

import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  Stack,
  Collapse,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Security as SecurityIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { FileValidationResult, formatFileSize } from '../../utils/fileValidation';

export interface FileValidationDisplayProps {
  validationResult: FileValidationResult | null;
  file?: File | null;
  showDetails?: boolean;
  compact?: boolean;
  sx?: any;
}

export const FileValidationDisplay: React.FC<FileValidationDisplayProps> = ({
  validationResult,
  file,
  showDetails = false,
  compact = false,
  sx
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);

  if (!validationResult || !file) {
    return null;
  }

  const { isValid, errors, warnings, fileInfo } = validationResult;
  const hasIssues = errors.length > 0 || warnings.length > 0;

  // Get security risk color
  const getSecurityColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  // Get validation status
  const getValidationStatus = () => {
    if (errors.length > 0) return { icon: <ErrorIcon />, color: 'error', text: 'Validation Failed' };
    if (warnings.length > 0) return { icon: <WarningIcon />, color: 'warning', text: 'Has Warnings' };
    return { icon: <CheckIcon />, color: 'success', text: 'Valid File' };
  };

  const status = getValidationStatus();

  if (compact) {
    return (
      <Box sx={{ ...sx }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={status.icon}
            label={status.text}
            color={status.color as any}
            size="small"
            variant={isValid ? "filled" : "outlined"}
          />
          {fileInfo && (
            <Chip
              icon={<SecurityIcon />}
              label={`${fileInfo.securityRisk.toUpperCase()} Risk`}
              color={getSecurityColor(fileInfo.securityRisk) as any}
              size="small"
              variant="outlined"
            />
          )}
          {hasIssues && (
            <Tooltip title="Click to see details">
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 1 }}>
            {errors.map((error, index) => (
              <Alert key={`error-${index}`} severity="error" sx={{ mb: 0.5 }}>
                {error}
              </Alert>
            ))}
            {warnings.map((warning, index) => (
              <Alert key={`warning-${index}`} severity="warning" sx={{ mb: 0.5 }}>
                {warning}
              </Alert>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box sx={{ ...sx }}>
      {/* File Info Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FileIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {file.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(file.size)} • {file.type}
          </Typography>
        </Box>
        <Chip
          icon={status.icon}
          label={status.text}
          color={status.color as any}
          variant={isValid ? "filled" : "outlined"}
        />
      </Box>

      {/* Validation Summary */}
      {fileInfo && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={`Type: ${fileInfo.extension.toUpperCase()}`}
              size="small"
              color={fileInfo.isSupported ? 'success' : 'error'}
              variant="outlined"
            />
            <Chip
              label={`Size: ${formatFileSize(fileInfo.size)}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<SecurityIcon />}
              label={`${fileInfo.securityRisk.toUpperCase()} Risk`}
              size="small"
              color={getSecurityColor(fileInfo.securityRisk) as any}
              variant="outlined"
            />
          </Stack>
        </Box>
      )}

      {/* Validation Progress */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Validation Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isValid ? '100%' : `${Math.round((1 - errors.length / (errors.length + warnings.length + 1)) * 100)}%`}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={isValid ? 100 : Math.round((1 - errors.length / (errors.length + warnings.length + 1)) * 100)}
          color={isValid ? 'success' : errors.length > 0 ? 'error' : 'warning'}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>

      {/* Errors */}
      {errors.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="error" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon fontSize="small" />
            Errors ({errors.length})
          </Typography>
          <Stack spacing={1}>
            {errors.map((error, index) => (
              <Alert key={`error-${index}`} severity="error" variant="outlined">
                {error}
              </Alert>
            ))}
          </Stack>
        </Box>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon fontSize="small" />
            Warnings ({warnings.length})
          </Typography>
          <Stack spacing={1}>
            {warnings.map((warning, index) => (
              <Alert key={`warning-${index}`} severity="warning" variant="outlined">
                {warning}
              </Alert>
            ))}
          </Stack>
        </Box>
      )}

      {/* Success State */}
      {isValid && errors.length === 0 && warnings.length === 0 && (
        <Alert severity="success" variant="outlined" icon={<CheckIcon />}>
          File passed all validation checks and is ready for upload.
        </Alert>
      )}

      {/* Additional Details Toggle */}
      {hasIssues && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: 'text.secondary' }}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {expanded ? 'Hide Details' : 'Show Details'}
              </Typography>
            </IconButton>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'text-bottom', mr: 0.5 }} />
                Detailed Validation Information
              </Typography>
              
              {fileInfo && (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>File Name:</strong> {fileInfo.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>File Size:</strong> {formatFileSize(fileInfo.size)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>MIME Type:</strong> {fileInfo.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Extension:</strong> .{fileInfo.extension}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Supported:</strong> {fileInfo.isSupported ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Security Risk:</strong> {fileInfo.securityRisk.toUpperCase()}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default FileValidationDisplay;
