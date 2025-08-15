// Loading Component
// Various loading states and spinners for the application

import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Backdrop,
  Card,
  CardContent,
  SxProps,
  Theme
} from '@mui/material';

export interface LoadingProps {
  // Loading type
  type?: 'circular' | 'linear' | 'skeleton' | 'overlay' | 'inline';
  
  // Size options
  size?: 'small' | 'medium' | 'large' | number;
  
  // Loading text
  text?: string;
  subText?: string;
  
  // Progress value (for determinate progress)
  progress?: number;
  
  // Overlay options
  overlay?: boolean;
  backdrop?: boolean;
  
  // Styling
  color?: 'primary' | 'secondary' | 'inherit';
  sx?: SxProps<Theme>;
  
  // Skeleton options
  skeletonCount?: number;
  skeletonHeight?: number | string;
  skeletonVariant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  
  // Layout
  fullScreen?: boolean;
  fullWidth?: boolean;
  centered?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  type = 'circular',
  size = 'medium',
  text,
  subText,
  progress,
  overlay = false,
  backdrop = false,
  color = 'primary',
  sx,
  skeletonCount = 3,
  skeletonHeight = 40,
  skeletonVariant = 'text',
  fullScreen = false,
  fullWidth = false,
  centered = true
}) => {
  // Get size value
  const getSizeValue = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 40;
    }
  };

  // Render circular loading
  const renderCircular = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        ...sx
      }}
    >
      <CircularProgress
        size={getSizeValue()}
        color={color}
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {text && (
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {text}
        </Typography>
      )}
      {subText && (
        <Typography variant="caption" color="textSecondary" textAlign="center">
          {subText}
        </Typography>
      )}
    </Box>
  );

  // Render linear loading
  const renderLinear = () => (
    <Box sx={{ width: fullWidth ? '100%' : 200, ...sx }}>
      {text && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {text}
        </Typography>
      )}
      <LinearProgress
        color={color}
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {subText && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
          {subText}
        </Typography>
      )}
    </Box>
  );

  // Render skeleton loading
  const renderSkeleton = () => (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      {text && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {text}
        </Typography>
      )}
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Skeleton
          key={index}
          variant={skeletonVariant}
          height={skeletonHeight}
          sx={{ mb: 1 }}
        />
      ))}
    </Box>
  );

  // Render inline loading
  const renderInline = () => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        ...sx
      }}
    >
      <CircularProgress size={getSizeValue()} color={color} />
      {text && (
        <Typography variant="body2" color="textSecondary">
          {text}
        </Typography>
      )}
    </Box>
  );

  // Get loading content based on type
  const getLoadingContent = () => {
    switch (type) {
      case 'linear':
        return renderLinear();
      case 'skeleton':
        return renderSkeleton();
      case 'inline':
        return renderInline();
      case 'overlay':
      case 'circular':
      default:
        return renderCircular();
    }
  };

  const content = getLoadingContent();

  // Render with overlay/backdrop
  if (overlay || backdrop || fullScreen) {
    return (
      <Backdrop
        open
        sx={{
          zIndex: (theme) => theme.zIndex.modal,
          backgroundColor: backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          ...(fullScreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          })
        }}
      >
        <Card
          sx={{
            p: 3,
            minWidth: 200,
            textAlign: 'center'
          }}
        >
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </Backdrop>
    );
  }

  // Render centered
  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: fullWidth ? '100%' : 'auto',
          height: fullScreen ? '100vh' : 'auto',
          py: fullScreen ? 0 : 4
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

// Preset loading components for common use cases
export const CircularLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="circular" {...props} />
);

export const LinearLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="linear" {...props} />
);

export const SkeletonLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="skeleton" {...props} />
);

export const InlineLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="inline" {...props} />
);

export const OverlayLoading: React.FC<Omit<LoadingProps, 'type' | 'overlay'>> = (props) => (
  <Loading type="overlay" overlay {...props} />
);

export const FullScreenLoading: React.FC<Omit<LoadingProps, 'type' | 'fullScreen'>> = (props) => (
  <Loading type="circular" fullScreen {...props} />
);

// Page loading component
export interface PageLoadingProps {
  text?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  text = 'Loading...',
  showProgress = false,
  progress
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      gap: 3
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="h6" color="textSecondary">
      {text}
    </Typography>
    {showProgress && (
      <Box sx={{ width: 200 }}>
        <LinearProgress
          variant={progress !== undefined ? 'determinate' : 'indeterminate'}
          value={progress}
        />
        {progress !== undefined && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
    )}
  </Box>
);

// Table loading skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="rectangular"
            height={40}
            sx={{ flex: 1 }}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{
  count?: number;
}> = ({ count = 3 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" height={24} width="60%" />
          <Skeleton variant="text" height={20} />
          <Skeleton variant="text" height={20} />
          <Skeleton variant="rectangular" height={120} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    ))}
  </Box>
);

export default Loading;
