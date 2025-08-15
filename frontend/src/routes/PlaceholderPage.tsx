// Placeholder Page Component
// Used for routes that are not yet implemented

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { DashboardLayout } from '../components/dashboard';

export interface PlaceholderPageProps {
  title: string;
  message: string;
  suggestedAction?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  showBackButton?: boolean;
  showDashboardButton?: boolean;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  message,
  suggestedAction,
  severity = 'info',
  showBackButton = true,
  showDashboardButton = true
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout title={title}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 600,
            width: '100%'
          }}
        >
          {/* Icon */}
          <Box sx={{ mb: 3 }}>
            <ConstructionIcon
              sx={{
                fontSize: 64,
                color: severity === 'error' ? 'error.main' : 
                       severity === 'warning' ? 'warning.main' : 
                       'text.secondary'
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>

          {/* Message */}
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 3 }}
          >
            {message}
          </Typography>

          {/* Alert with suggested action */}
          {suggestedAction && (
            <Alert severity={severity} sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Suggestion:</strong> {suggestedAction}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {showBackButton && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
              >
                Go Back
              </Button>
            )}

            {showDashboardButton && (
              <Button
                variant="contained"
                startIcon={<DashboardIcon />}
                onClick={handleDashboard}
              >
                Dashboard
              </Button>
            )}
          </Box>

          {/* Development info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled">
              This page is part of the candidate management system development roadmap.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default PlaceholderPage;
