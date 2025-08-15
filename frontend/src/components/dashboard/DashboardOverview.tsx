// Dashboard Overview Component
// Main overview section with statistics cards

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Skeleton
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Description as CVIcon,
  TrendingUp as TrendingUpIcon,
  Business as PositionIcon,
  School as EducationIcon,
  AccessTime as RecentIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

import { DashboardCard } from './DashboardCard';
import { usePermissions } from '../../hooks';
import { candidateService } from '../../services';
import { CandidateStats, ExperienceLevel } from '../../types/candidate.types';

export interface DashboardOverviewProps {
  onCardClick?: (cardType: string) => void;
}

// Mock statistics (will be replaced with real API calls)
const getMockStatistics = (): CandidateStats => ({
  total: 127,
  byExperienceLevel: {
    [ExperienceLevel.ENTRY_LEVEL]: 45,
    [ExperienceLevel.MID_LEVEL]: 38,
    [ExperienceLevel.SENIOR_LEVEL]: 32,
    [ExperienceLevel.EXECUTIVE]: 12
  },
  byPosition: {
    'Software Engineer': 35,
    'Product Manager': 18,
    'Data Scientist': 22,
    'UX Designer': 15,
    'DevOps Engineer': 12,
    'Other': 25
  },
  recentlyAdded: 8,
  withCV: 89,
  withoutCV: 38
});

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onCardClick
}) => {
  const { canCreateCandidate, canViewAnalytics, isAdmin } = usePermissions();
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load statistics
  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For now, use mock data
        // TODO: Replace with actual API call when backend is ready
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        const mockStats = getMockStatistics();
        setStats(mockStats);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  // Handle card clicks
  const handleCardClick = (cardType: string) => {
    onCardClick?.(cardType);
  };

  // Calculate trends (mock data)
  const getTrendData = () => {
    return {
      totalCandidates: { direction: 'up' as const, value: '+12%', label: 'vs last month' },
      recentlyAdded: { direction: 'up' as const, value: '+3', label: 'this week' },
      withCV: { direction: 'neutral' as const, value: '70%', label: 'completion rate' },
      positions: { direction: 'up' as const, value: '+5', label: 'new positions' }
    };
  };

  const trends = getTrendData();

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Key metrics and statistics for candidate management
        </Typography>
      </Box>

      {/* Statistics Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr',
            lg: '1fr 1fr 1fr 1fr'
          },
          mb: 4
        }}
      >
        {/* Total Candidates */}
        <DashboardCard
          title="Total Candidates"
          value={loading ? 0 : stats?.total || 0}
          subtitle="All candidates in database"
          icon={<PeopleIcon />}
          color="primary"
          trend={trends.totalCandidates}
          loading={loading}
          onClick={() => handleCardClick('total-candidates')}
        />

        {/* Recently Added */}
        <DashboardCard
          title="Recently Added"
          value={loading ? 0 : stats?.recentlyAdded || 0}
          subtitle="New candidates this week"
          icon={<PersonAddIcon />}
          color="success"
          trend={trends.recentlyAdded}
          loading={loading}
          onClick={() => handleCardClick('recent-candidates')}
        />

        {/* CV Upload Rate */}
        <DashboardCard
          title="With CV/Resume"
          value={loading ? 0 : stats?.withCV || 0}
          subtitle={`${loading ? 0 : stats?.withoutCV || 0} without CV`}
          icon={<CVIcon />}
          color="info"
          trend={trends.withCV}
          loading={loading}
          onClick={() => handleCardClick('cv-stats')}
        />

        {/* Unique Positions */}
        <DashboardCard
          title="Active Positions"
          value={loading ? 0 : Object.keys(stats?.byPosition || {}).length}
          subtitle="Different job positions"
          icon={<PositionIcon />}
          color="warning"
          trend={trends.positions}
          loading={loading}
          onClick={() => handleCardClick('positions')}
        />
      </Box>

      {/* Experience Level Breakdown */}
      {canViewAnalytics && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Experience Level Distribution
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr 1fr'
              }
            }}
          >
            {Object.entries(stats?.byExperienceLevel || {}).map(([level, count]) => (
              <DashboardCard
                key={level}
                title={level.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                value={loading ? 0 : count}
                subtitle="candidates"
                icon={<EducationIcon />}
                color="secondary"
                loading={loading}
                onClick={() => handleCardClick(`experience-${level.toLowerCase()}`)}
                elevation={0}
                sx={{ bgcolor: 'grey.50' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Actions - Only for users with create permissions */}
      {canCreateCandidate && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              }
            }}
          >
            <DashboardCard
              title="Add New Candidate"
              value="Create"
              subtitle="Add a new candidate profile"
              icon={<PersonAddIcon />}
              color="primary"
              onClick={() => handleCardClick('add-candidate')}
              elevation={2}
            />

            <DashboardCard
              title="Bulk Import"
              value="Upload"
              subtitle="Import multiple candidates"
              icon={<CVIcon />}
              color="info"
              onClick={() => handleCardClick('bulk-import')}
              elevation={2}
            />

            {canViewAnalytics && (
              <DashboardCard
                title="View Reports"
                value="Analyze"
                subtitle="Generate detailed reports"
                icon={<AnalyticsIcon />}
                color="success"
                onClick={() => handleCardClick('reports')}
                elevation={2}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Development Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Development Note:</strong> Statistics are currently using mock data. 
          Real API integration will be implemented when the backend statistics endpoints are available.
        </Typography>
      </Alert>
    </Box>
  );
};

export default DashboardOverview;
