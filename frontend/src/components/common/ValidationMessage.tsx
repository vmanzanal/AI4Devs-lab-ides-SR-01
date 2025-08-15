// Validation Message Component
// Displays validation errors, warnings, and success messages

import React from 'react';
import {
  Alert,
  AlertProps,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  SxProps,
  Theme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Circle as BulletIcon
} from '@mui/icons-material';

export interface ValidationMessageProps {
  // Message content
  message?: string;
  messages?: string[];
  
  // Message type
  type?: 'error' | 'warning' | 'success' | 'info';
  severity?: AlertProps['severity']; // Alternative prop name for type
  
  // Display options
  variant?: 'filled' | 'outlined' | 'standard';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  closable?: boolean;
  
  // Animation
  animate?: boolean;
  
  // Styling
  sx?: SxProps<Theme>;
  
  // Handlers
  onClose?: () => void;
  
  // Custom rendering
  title?: string;
  action?: React.ReactNode;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  messages = [],
  type = 'error',
  severity,
  variant = 'filled',
  size = 'medium',
  showIcon = true,
  closable = false,
  animate = true,
  sx,
  onClose,
  title,
  action
}) => {
  // Use severity prop if provided, otherwise use type
  const alertSeverity = severity || type;
  
  // Combine single message with messages array
  const allMessages = message ? [message, ...messages] : messages;
  
  // Don't render if no messages
  if (allMessages.length === 0) {
    return null;
  }

  // Get icon based on severity
  const getIcon = () => {
    if (!showIcon) return undefined;
    
    switch (alertSeverity) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Render single message
  const renderSingleMessage = () => (
    <Alert
      severity={alertSeverity}
      variant={variant}
      icon={getIcon()}
      onClose={closable ? onClose : undefined}
      action={action}
      sx={{
        alignItems: 'center',
        ...(size === 'small' && {
          fontSize: '0.875rem',
          '& .MuiAlert-icon': {
            fontSize: '1.25rem'
          }
        }),
        ...sx
      }}
    >
      {title && (
        <Typography
          variant={size === 'small' ? 'subtitle2' : 'subtitle1'}
          component="div"
          sx={{ fontWeight: 600, mb: title && allMessages.length > 0 ? 0.5 : 0 }}
        >
          {title}
        </Typography>
      )}
      {allMessages[0]}
    </Alert>
  );

  // Render multiple messages
  const renderMultipleMessages = () => (
    <Alert
      severity={alertSeverity}
      variant={variant}
      icon={getIcon()}
      onClose={closable ? onClose : undefined}
      action={action}
      sx={{
        '& .MuiAlert-message': {
          width: '100%'
        },
        ...(size === 'small' && {
          fontSize: '0.875rem',
          '& .MuiAlert-icon': {
            fontSize: '1.25rem'
          }
        }),
        ...sx
      }}
    >
      <Box>
        {title && (
          <Typography
            variant={size === 'small' ? 'subtitle2' : 'subtitle1'}
            component="div"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {title}
          </Typography>
        )}
        <List
          dense
          sx={{
            py: 0,
            '& .MuiListItem-root': {
              py: 0.25,
              px: 0,
              alignItems: 'flex-start'
            }
          }}
        >
          {allMessages.map((msg, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 20, mt: 0.25 }}>
                <BulletIcon sx={{ fontSize: '0.5rem' }} />
              </ListItemIcon>
              <ListItemText
                primary={msg}
                primaryTypographyProps={{
                  variant: size === 'small' ? 'body2' : 'body1'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Alert>
  );

  // Render appropriate message format
  const content = allMessages.length === 1 ? renderSingleMessage() : renderMultipleMessages();

  // Wrap with animation if enabled
  if (animate) {
    return (
      <Fade in timeout={300}>
        <Box>{content}</Box>
      </Fade>
    );
  }

  return content;
};

// Preset validation message components for common use cases
export const ErrorMessage: React.FC<Omit<ValidationMessageProps, 'type' | 'severity'>> = (props) => (
  <ValidationMessage type="error" {...props} />
);

export const WarningMessage: React.FC<Omit<ValidationMessageProps, 'type' | 'severity'>> = (props) => (
  <ValidationMessage type="warning" {...props} />
);

export const SuccessMessage: React.FC<Omit<ValidationMessageProps, 'type' | 'severity'>> = (props) => (
  <ValidationMessage type="success" {...props} />
);

export const InfoMessage: React.FC<Omit<ValidationMessageProps, 'type' | 'severity'>> = (props) => (
  <ValidationMessage type="info" {...props} />
);

// Form validation helper component
export interface FormValidationSummaryProps {
  errors: Record<string, string | string[]>;
  title?: string;
  showIcon?: boolean;
  variant?: 'filled' | 'outlined' | 'standard';
  sx?: SxProps<Theme>;
}

export const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  errors,
  title = 'Please correct the following errors:',
  showIcon = true,
  variant = 'filled',
  sx
}) => {
  // Extract all error messages
  const errorMessages = Object.values(errors).flat().filter(Boolean);
  
  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <ValidationMessage
      type="error"
      title={title}
      messages={errorMessages}
      showIcon={showIcon}
      variant={variant}
      sx={sx}
    />
  );
};

// Field-specific validation message
export interface FieldValidationProps {
  error?: string | string[] | boolean;
  warning?: string | string[];
  success?: string | string[];
  touched?: boolean;
  showOnlyWhenTouched?: boolean;
  sx?: SxProps<Theme>;
}

export const FieldValidation: React.FC<FieldValidationProps> = ({
  error,
  warning,
  success,
  touched = true,
  showOnlyWhenTouched = true,
  sx
}) => {
  // Don't show if field hasn't been touched and showOnlyWhenTouched is true
  if (showOnlyWhenTouched && !touched) {
    return null;
  }

  // Determine what to show (priority: error > warning > success)
  if (error) {
    const errorMessages = Array.isArray(error) ? error : typeof error === 'string' ? [error] : [];
    if (errorMessages.length > 0) {
      return (
        <ValidationMessage
          type="error"
          messages={errorMessages}
          size="small"
          variant="standard"
          sx={{ mt: 0.5, ...sx }}
        />
      );
    }
  }

  if (warning) {
    const warningMessages = Array.isArray(warning) ? warning : [warning];
    return (
      <ValidationMessage
        type="warning"
        messages={warningMessages}
        size="small"
        variant="standard"
        sx={{ mt: 0.5, ...sx }}
      />
    );
  }

  if (success) {
    const successMessages = Array.isArray(success) ? success : [success];
    return (
      <ValidationMessage
        type="success"
        messages={successMessages}
        size="small"
        variant="standard"
        sx={{ mt: 0.5, ...sx }}
      />
    );
  }

  return null;
};

export default ValidationMessage;
