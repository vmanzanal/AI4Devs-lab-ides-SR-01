// Custom Input Component
// Enhanced Material-UI TextField with validation and consistent styling

import React, { forwardRef, useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  SxProps,
  Theme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

export interface InputProps extends Omit<TextFieldProps, 'variant' | 'color'> {
  // Enhanced props
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  suggestion?: string;
  
  // Input types
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  
  // Variants
  variant?: 'outlined' | 'filled' | 'standard';
  
  // Validation states
  error?: boolean;
  success?: boolean;
  showSuccess?: boolean;
  
  // Loading state
  loading?: boolean;
  
  // Size options
  size?: 'small' | 'medium';
  
  // Custom styling
  sx?: SxProps<Theme>;
  
  // Password visibility toggle
  showPasswordToggle?: boolean;
  
  // Character counter
  showCharacterCount?: boolean;
  maxLength?: number;
  minLength?: number;
  
  // Real-time validation
  enableRealTimeValidation?: boolean;
  validationStrength?: 'weak' | 'medium' | 'strong';
  showValidationStrength?: boolean;
  
  // Custom adornments
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  
  // Event handlers
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLDivElement, InputProps>(({
  name,
  label,
  placeholder,
  helperText,
  errorText,
  successText,
  suggestion,
  type = 'text',
  variant = 'outlined',
  error = false,
  success = false,
  showSuccess = true,
  loading = false,
  size = 'medium',
  fullWidth = true,
  required = false,
  disabled = false,
  multiline = false,
  rows,
  maxRows,
  sx,
  showPasswordToggle = false,
  showCharacterCount = false,
  maxLength,
  minLength,
  enableRealTimeValidation = false,
  validationStrength,
  showValidationStrength = false,
  startAdornment,
  endAdornment,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  onKeyPress,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  // Determine actual input type
  const actualType = type === 'password' && showPassword ? 'text' : type;

  // Calculate character count
  const currentLength = typeof value === 'string' ? value.length : 
                       typeof defaultValue === 'string' ? defaultValue.length : 0;
  
  // Character count validation
  const isOverLimit = maxLength && currentLength > maxLength;
  const isUnderMin = minLength && currentLength > 0 && currentLength < minLength;
  
  // Validation strength color mapping
  const getStrengthColor = (strength?: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak': return 'error.main';
      case 'medium': return 'warning.main';
      case 'strong': return 'success.main';
      default: return 'text.disabled';
    }
  };

  // Determine helper text to display
  const getHelperText = () => {
    if (errorText && error) return errorText;
    if (successText && success && showSuccess) return successText;
    if (suggestion && focused && !error) return suggestion;
    if (isOverLimit) return `Character limit exceeded (${currentLength}/${maxLength})`;
    if (isUnderMin) return `Minimum ${minLength} characters required`;
    return helperText;
  };

  // Handle password visibility toggle
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Handle focus events
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(event);
  };

  // Build input adornments
  const buildStartAdornment = () => {
    if (!startAdornment) return undefined;
    return <InputAdornment position="start">{startAdornment}</InputAdornment>;
  };

  const buildEndAdornment = () => {
    const elements: React.ReactNode[] = [];

    // Add custom end adornment
    if (endAdornment) {
      elements.push(endAdornment);
    }

    // Add password toggle
    if (type === 'password' && showPasswordToggle) {
      elements.push(
        <IconButton
          key="password-toggle"
          onClick={handleTogglePassword}
          edge="end"
          size="small"
          tabIndex={-1}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      );
    }

    // Add validation icons
    if (error) {
      elements.push(
        <ErrorIcon
          key="error-icon"
          color="error"
          sx={{ fontSize: size === 'small' ? 20 : 24 }}
        />
      );
    } else if (success) {
      elements.push(
        <SuccessIcon
          key="success-icon"
          color="success"
          sx={{ fontSize: size === 'small' ? 20 : 24 }}
        />
      );
    }

    if (elements.length === 0) return undefined;

    return (
      <InputAdornment position="end">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {elements}
        </Box>
      </InputAdornment>
    );
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      <TextField
        {...props}
        ref={ref}
        name={name}
        label={label}
        placeholder={placeholder}
        type={actualType}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        required={required}
        disabled={disabled || loading}
        multiline={multiline}
        rows={rows}
        maxRows={maxRows}
        value={value}
        defaultValue={defaultValue}
        error={error || !!isOverLimit}
        helperText={getHelperText()}
        inputProps={{
          maxLength,
          ...props.inputProps
        }}
        InputProps={{
          startAdornment: buildStartAdornment(),
          endAdornment: buildEndAdornment(),
          ...props.InputProps
        }}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyPress={onKeyPress}
        sx={{
          // Base styles
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
          
          // Success state styling
          ...(success && !error && {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'success.main',
              },
              '&:hover fieldset': {
                borderColor: 'success.dark',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'success.main',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: 'success.main',
              },
            },
          }),
          
          // Loading state styling
          ...(loading && {
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'action.hover',
            },
          }),
        }}
      />
      
      {/* Validation strength indicator */}
      {showValidationStrength && validationStrength && currentLength > 0 && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
            <Box
              sx={{
                height: '100%',
                borderRadius: 2,
                bgcolor: getStrengthColor(validationStrength),
                width: validationStrength === 'weak' ? '33%' : validationStrength === 'medium' ? '66%' : '100%',
                transition: 'all 0.3s ease',
              }}
            />
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: getStrengthColor(validationStrength),
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {validationStrength}
          </Typography>
        </Box>
      )}

      {/* Character counter */}
      {showCharacterCount && maxLength && (
        <Typography
          variant="caption"
          color={isOverLimit ? 'error' : isUnderMin ? 'warning' : currentLength > maxLength * 0.8 ? 'warning.main' : 'text.secondary'}
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            fontSize: '0.75rem',
            fontWeight: isOverLimit || isUnderMin ? 600 : 400
          }}
        >
          {currentLength}/{maxLength}
          {minLength && currentLength < minLength && ` (min: ${minLength})`}
        </Typography>
      )}
      
      {/* Real-time validation suggestion */}
      {suggestion && focused && !error && currentLength > 0 && (
        <Typography 
          variant="caption" 
          color="info.main"
          sx={{ 
            display: 'block', 
            mt: 0.5,
            fontStyle: 'italic',
            fontSize: '0.75rem'
          }}
        >
          💡 {suggestion}
        </Typography>
      )}
    </Box>
  );
});

Input.displayName = 'Input';

// Preset input variants for common use cases
export const PasswordInput: React.FC<Omit<InputProps, 'type' | 'showPasswordToggle'>> = (props) => (
  <Input type="password" showPasswordToggle {...props} />
);

export const EmailInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="email" {...props} />
);

export const NumberInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="number" {...props} />
);

export const PhoneInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="tel" {...props} />
);

export const SearchInput: React.FC<Omit<InputProps, 'type'>> = (props) => (
  <Input type="search" {...props} />
);

export const TextArea: React.FC<Omit<InputProps, 'multiline'>> = (props) => (
  <Input multiline rows={4} {...props} />
);

export default Input;
