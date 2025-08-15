// Dashboard Chart Component
// Simple chart components for displaying data visually

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  SxProps,
  Theme
} from '@mui/material';

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface DashboardChartProps {
  title: string;
  data: ChartDataItem[];
  type?: 'bar' | 'progress' | 'list';
  maxValue?: number;
  showPercentages?: boolean;
  sx?: SxProps<Theme>;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  data,
  type = 'bar',
  maxValue,
  showPercentages = true,
  sx
}) => {
  // Calculate max value if not provided
  const calculatedMaxValue = maxValue || Math.max(...data.map(item => item.value));
  
  // Calculate percentages
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: calculatedMaxValue > 0 ? (item.value / calculatedMaxValue) * 100 : 0
  }));

  // Color palette for chart items
  const defaultColors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#795548', // Brown
    '#607D8B'  // Blue Grey
  ];

  // Render bar chart
  const renderBarChart = () => (
    <Box>
      {dataWithPercentages.map((item, index) => (
        <Box key={item.label} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.value}
              {showPercentages && ` (${item.percentage?.toFixed(1)}%)`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={item.percentage || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: item.color || defaultColors[index % defaultColors.length],
                borderRadius: 4
              }
            }}
          />
        </Box>
      ))}
    </Box>
  );

  // Render progress chart (circular-style representation)
  const renderProgressChart = () => (
    <Box>
      {dataWithPercentages.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            p: 1,
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'grey.50'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: item.color || defaultColors[index % defaultColors.length]
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {item.value}
            </Typography>
            {showPercentages && (
              <Chip
                label={`${item.percentage?.toFixed(1)}%`}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );

  // Render list chart
  const renderListChart = () => (
    <Box>
      {dataWithPercentages
        .sort((a, b) => b.value - a.value) // Sort by value descending
        .map((item, index) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1,
              px: 1.5,
              mb: 0.5,
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.200',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  minWidth: 20,
                  textAlign: 'center'
                }}
              >
                #{index + 1}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {item.label}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {item.value}
              </Typography>
              {showPercentages && (
                <Typography variant="caption" color="text.secondary">
                  ({item.percentage?.toFixed(1)}%)
                </Typography>
              )}
            </Box>
          </Box>
        ))}
    </Box>
  );

  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case 'progress':
        return renderProgressChart();
      case 'list':
        return renderListChart();
      case 'bar':
      default:
        return renderBarChart();
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3, ...sx }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>
      {data.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No data available
        </Typography>
      ) : (
        renderChart()
      )}
    </Paper>
  );
};

export default DashboardChart;
