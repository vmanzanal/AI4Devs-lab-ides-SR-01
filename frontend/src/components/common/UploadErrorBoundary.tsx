// Upload Error Boundary Component
// Catches and handles upload-related errors gracefully

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon
} from '@mui/icons-material';

interface UploadErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

interface UploadErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  fallback?: ReactNode;
  showDetails?: boolean;
}

export class UploadErrorBoundary extends Component<UploadErrorBoundaryProps, UploadErrorBoundaryState> {
  constructor(props: UploadErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<UploadErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `upload_error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('Upload Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo, this.state.errorId);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create error report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
      alert('Error report copied to clipboard. Please share this with support.');
    }).catch(() => {
      console.error('Failed to copy error report:', errorReport);
      alert('Failed to copy error report. Please check the console for details.');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
          <Stack spacing={2}>
            {/* Error Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              <Typography variant="h6" color="error">
                Upload Error
              </Typography>
            </Box>

            {/* Error Message */}
            <Alert severity="error" variant="outlined">
              <Typography variant="body2">
                An unexpected error occurred during the upload process. This might be due to:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>Network connectivity issues</li>
                <li>File corruption or invalid format</li>
                <li>Server-side processing errors</li>
                <li>Browser compatibility issues</li>
              </Box>
            </Alert>

            {/* Error Details */}
            {this.props.showDetails && this.state.error && (
              <Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Technical Details (Error ID: {this.state.errorId})
                </Typography>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1, 
                    border: '1px solid', 
                    borderColor: 'grey.200',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {'\n\nStack Trace:\n'}
                        {this.state.error.stack}
                      </>
                    )}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<BugIcon />}
                  onClick={this.handleReportError}
                  size="small"
                >
                  Report Error
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Error ID: {this.state.errorId}
              </Typography>
            </Box>

            {/* Help Text */}
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              If this problem persists, try refreshing the page or using a different browser.
              For urgent issues, please contact support with the error ID above.
            </Typography>
          </Stack>
        </Paper>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper for functional components
export const withUploadErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<UploadErrorBoundaryProps, 'children'>
) => {
  return (props: P) => (
    <UploadErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </UploadErrorBoundary>
  );
};

export default UploadErrorBoundary;
