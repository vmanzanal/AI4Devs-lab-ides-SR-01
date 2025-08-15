// Dashboard Card Component
// Reusable card component for displaying statistics and metrics

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  IconButton,
  Tooltip,
  SxProps,
  Theme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  MoreVert,
  InfoOutlined
} from '@mui/icons-material';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface DashboardCardProps {
  // Content
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  
  // Visual elements
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  
  // Trend information
  trend?: {
    direction: TrendDirection;
    value: string | number;
    label?: string;
  };
  
  // State
  loading?: boolean;
  error?: string;
  
  // Actions
  onClick?: () => void;
  onMenuClick?: () => void;
  
  // Styling
  sx?: SxProps<Theme>;
  elevation?: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  description,
  icon,
  color = 'primary',
  trend,
  loading = false,
  error,
  onClick,
  onMenuClick,
  sx,
  elevation = 1
}) => {
  // Get color for trend
  const getTrendColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  // Get trend icon
  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  // Handle card click
  const handleClick = () => {
    if (onClick && !loading && !error) {
      onClick();
    }
  };

  return (
    <Card
      elevation={elevation}
      sx={{
        cursor: onClick && !loading && !error ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick && !loading && !error ? {
          elevation: elevation + 2,
          transform: 'translateY(-2px)'
        } : {},
        ...sx
      }}
      onClick={handleClick}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: `${color}.main`,
                  color: `${color}.contrastText`
                }}
              >
                {icon}
              </Box>
            )}
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontWeight: 500, lineHeight: 1.2 }}
              >
                {title}
              </Typography>
              {description && (
                <Tooltip title={description}>
                  <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', ml: 0.5 }} />
                </Tooltip>
              )}
            </Box>
          </Box>

          {onMenuClick && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMenuClick(); }}>
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Main Content */}
        <Box>
          {loading ? (
            <>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={20} />
            </>
          ) : error ? (
            <Box>
              <Typography variant="h6" color="error.main">
                Error
              </Typography>
              <Typography variant="caption" color="error.main">
                {error}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Value */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0.5,
                  lineHeight: 1.2
                }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>

              {/* Subtitle and Trend */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}

                {trend && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: getTrendColor(trend.direction)
                    }}
                  >
                    {getTrendIcon(trend.direction)}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: getTrendColor(trend.direction)
                      }}
                    >
                      {trend.value}
                    </Typography>
                    {trend.label && (
                      <Typography variant="caption" color="text.secondary">
                        {trend.label}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
