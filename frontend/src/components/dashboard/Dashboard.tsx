// Dashboard Component
// Main dashboard page with overview and statistics

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { DashboardLayout } from './DashboardLayout';
import { DashboardOverview } from './DashboardOverview';
import { DashboardChart } from './DashboardChart';
import { useAuth, usePermissions } from '../../hooks';

export interface DashboardProps {
  title?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  title = 'Dashboard'
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { canCreateCandidate, canManageUsers, isAdmin, canViewAnalytics } = usePermissions();

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  // Handle dashboard card clicks
  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'total-candidates':
      case 'recent-candidates':
      case 'cv-stats':
        navigate('/candidates');
        break;
      case 'add-candidate':
        navigate('/candidates/new');
        break;
      case 'bulk-import':
        navigate('/candidates/upload');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'positions':
        navigate('/candidates?view=positions');
        break;
      default:
        console.log('Card clicked:', cardType);
    }
  };

  // Sample chart data for positions
  const positionChartData = [
    { label: 'Software Engineer', value: 35 },
    { label: 'Data Scientist', value: 22 },
    { label: 'Product Manager', value: 18 },
    { label: 'UX Designer', value: 15 },
    { label: 'DevOps Engineer', value: 12 },
    { label: 'Other', value: 25 }
  ];

  return (
    <DashboardLayout title={title}>
      <Box>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <DashboardIcon />
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name || user?.email}! Here's what's happening today.
          </Typography>
        </Box>

        {/* Dashboard Overview */}
        <DashboardOverview onCardClick={handleCardClick} />

        {/* Additional Charts - Only for users with analytics permissions */}
        {canViewAnalytics && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Detailed Analytics
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr'
                }
              }}
            >
              <DashboardChart
                title="Top Positions"
                data={positionChartData}
                type="list"
                showPercentages={true}
              />
              <DashboardChart
                title="Position Distribution"
                data={positionChartData}
                type="bar"
                showPercentages={true}
              />
            </Box>
          </Box>
        )}

        {/* Development Info */}
        <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Development Status
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current user: {user?.email} ({user?.role})<br/>
            Authentication: {isAuthenticated ? 'Active' : 'Inactive'}<br/>
            Permissions: Create={canCreateCandidate.toString()}, Manage Users={canManageUsers.toString()}, Admin={isAdmin.toString()}, Analytics={canViewAnalytics.toString()}
          </Typography>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
