// Custom Button Component
// Enhanced Material-UI Button with loading states and consistent styling

import React from 'react';
import {
  Button as MuiButton,
  CircularProgress,
  Box,
  SxProps,
  Theme
} from '@mui/material';
import { ButtonProps as MuiButtonProps } from '@mui/material/Button';

export interface ButtonProps extends Omit<MuiButtonProps, 'color' | 'size' | 'variant'> {
  // Enhanced props
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  
  // Custom color options
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
  
  // Custom size options
  size?: 'small' | 'medium' | 'large';
  
  // Additional styling
  sx?: SxProps<Theme>;
  
  // Custom variants (including our custom gradient)
  variant?: 'text' | 'outlined' | 'contained' | 'gradient';
  
  // Action handlers
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  loadingText,
  icon,
  iconPosition = 'start',
  disabled,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  sx,
  onClick,
  ...props
}) => {
  // Determine if button should be disabled
  const isDisabled = disabled || loading;

  // Handle gradient variant
  const getVariantProps = () => {
    if (variant === 'gradient') {
      return {
        variant: 'contained' as const,
        sx: {
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #1CA0D3 90%)',
          },
          '&:disabled': {
            background: 'rgba(0, 0, 0, 0.12)',
            boxShadow: 'none',
          },
          ...sx
        }
      };
    }
    return { variant, sx };
  };

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <CircularProgress
      size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
      color="inherit"
      sx={{ 
        mr: loadingText || children ? 1 : 0,
        ml: iconPosition === 'end' && (loadingText || children) ? 1 : 0
      }}
    />
  );

  // Render icon
  const renderIcon = () => {
    if (loading) return renderLoadingSpinner();
    if (!icon) return null;
    
    return (
      <Box
        component="span"
        sx={{
          display: 'flex',
          alignItems: 'center',
          mr: iconPosition === 'start' && children ? 1 : 0,
          ml: iconPosition === 'end' && children ? 1 : 0
        }}
      >
        {icon}
      </Box>
    );
  };

  // Render button content
  const renderContent = () => {
    const text = loading && loadingText ? loadingText : children;
    const shouldShowIcon = icon || loading;

    if (!shouldShowIcon) {
      return text;
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {iconPosition === 'start' && renderIcon()}
        {text}
        {iconPosition === 'end' && renderIcon()}
      </Box>
    );
  };

  const variantProps = getVariantProps();

  return (
    <MuiButton
      {...props}
      {...variantProps}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onClick={onClick}
      sx={{
        // Base styles
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: 2,
        minHeight: size === 'small' ? 32 : size === 'large' ? 48 : 40,
        
        // Loading state styles
        ...(loading && {
          pointerEvents: 'none',
        }),
        
        // Size-specific padding
        ...(size === 'small' && {
          px: 2,
          py: 0.5,
          fontSize: '0.875rem',
        }),
        ...(size === 'large' && {
          px: 4,
          py: 1.5,
          fontSize: '1rem',
        }),
        ...(size === 'medium' && {
          px: 3,
          py: 1,
          fontSize: '0.875rem',
        }),
        
        // Ensure custom sx is applied last
        ...variantProps.sx,
      }}
    >
      {renderContent()}
    </MuiButton>
  );
};

// Preset button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'color' | 'variant'>> = (props) => (
  <Button color="primary" variant="contained" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'color' | 'variant'>> = (props) => (
  <Button color="secondary" variant="outlined" {...props} />
);

export const ErrorButton: React.FC<Omit<ButtonProps, 'color' | 'variant'>> = (props) => (
  <Button color="error" variant="contained" {...props} />
);

export const WarningButton: React.FC<Omit<ButtonProps, 'color' | 'variant'>> = (props) => (
  <Button color="warning" variant="contained" {...props} />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'color' | 'variant'>> = (props) => (
  <Button color="success" variant="contained" {...props} />
);

export const TextButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="text" {...props} />
);

export const GradientButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="gradient" {...props} />
);

export default Button;
