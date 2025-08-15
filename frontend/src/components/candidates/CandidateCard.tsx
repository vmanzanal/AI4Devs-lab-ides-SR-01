// Candidate Card Component
// Displays candidate information in a card format with actions

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { Candidate, ExperienceLevel } from '../../types/candidate.types';
import { usePermissions } from '../../hooks';
import { Permission } from '../../types/user.types';

export interface CandidateCardProps {
  candidate: Candidate;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onEdit?: (candidate: Candidate) => void;
  onDelete?: (candidate: Candidate) => void;
  onView?: (candidate: Candidate) => void;
  onDownloadCV?: (candidate: Candidate) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  variant = 'default',
  showActions = true,
  onEdit,
  onDelete,
  onView,
  onDownloadCV
}) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Generate avatar initials
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get experience level color
  const getExperienceLevelColor = (level: ExperienceLevel): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (level) {
      case ExperienceLevel.ENTRY_LEVEL:
        return 'info';
      case ExperienceLevel.MID_LEVEL:
        return 'primary';
      case ExperienceLevel.SENIOR_LEVEL:
        return 'success';
      case ExperienceLevel.EXECUTIVE:
        return 'error';
      default:
        return 'default';
    }
  };

  // Format experience level text
  const formatExperienceLevel = (level: ExperienceLevel): string => {
    return level.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  // Action handlers
  const handleEdit = () => {
    if (onEdit) {
      onEdit(candidate);
    } else {
      navigate(`/candidates/edit/${candidate.id}`);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(candidate);
    } else {
      navigate(`/candidates/${candidate.id}`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(candidate);
    }
  };

  const handleDownloadCV = () => {
    if (onDownloadCV) {
      onDownloadCV(candidate);
    }
  };

  // Permission checks
  const canEdit = hasPermission(Permission.UPDATE_CANDIDATE);
  const canDelete = hasPermission(Permission.DELETE_CANDIDATE);
  const canView = hasPermission(Permission.READ_CANDIDATE);

  return (
    <Card
      elevation={2}
      sx={{
        height: variant === 'compact' ? 'auto' : '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        cursor: canView ? 'pointer' : 'default',
        '&:hover': {
          elevation: 8,
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
          '&::before': {
            opacity: 1,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        // Mobile responsiveness
        width: { xs: '100%', sm: 'auto' },
        minHeight: { xs: 'auto', md: variant === 'compact' ? 'auto' : '280px' },
      }}
      onClick={canView ? handleView : undefined}
    >
      <CardContent sx={{ flexGrow: 1, pb: variant === 'compact' ? 1 : 2 }}>
        {/* Header with Avatar and Basic Info */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            mb: { xs: 1.5, sm: 2 },
            gap: { xs: 1.5, sm: 2 }
          }}
        >
          <Avatar
            sx={{
              width: { xs: variant === 'compact' ? 36 : 48, sm: variant === 'compact' ? 40 : 56 },
              height: { xs: variant === 'compact' ? 36 : 48, sm: variant === 'compact' ? 40 : 56 },
              bgcolor: 'primary.main',
              fontSize: { xs: variant === 'compact' ? '0.875rem' : '1rem', sm: variant === 'compact' ? '1rem' : '1.25rem' },
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              boxShadow: 2,
            }}
          >
            {getInitials(candidate.firstName, candidate.lastName)}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant={variant === 'compact' ? 'subtitle1' : 'h6'}
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: { xs: variant === 'compact' ? '0.95rem' : '1.1rem', sm: 'inherit' },
                lineHeight: 1.3,
              }}
            >
              {candidate.firstName} {candidate.lastName}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontWeight: 500,
              }}
            >
              {candidate.position}
            </Typography>

            <Chip
              label={formatExperienceLevel(candidate.experienceLevel)}
              size="small"
              color={getExperienceLevelColor(candidate.experienceLevel)}
              variant="filled"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 20, sm: 24 },
                fontWeight: 500,
                borderRadius: 1.5,
              }}
            />
          </Box>
        </Box>

        {/* Contact Information - Only show in default/detailed view */}
        {variant !== 'compact' && (
          <Stack spacing={{ xs: 0.75, sm: 1 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 },
              p: { xs: 0.5, sm: 0 },
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              },
              transition: 'background-color 0.2s ease',
            }}>
              <EmailIcon sx={{ 
                fontSize: { xs: 14, sm: 16 }, 
                color: 'text.secondary',
                flexShrink: 0,
              }} />
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 400,
                }}
              >
                {candidate.email}
              </Typography>
            </Box>

            {candidate.phone && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 },
                p: { xs: 0.5, sm: 0 },
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s ease',
              }}>
                <PhoneIcon sx={{ 
                  fontSize: { xs: 14, sm: 16 }, 
                  color: 'text.secondary',
                  flexShrink: 0,
                }} />
                <Typography 
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 400,
                  }}
                >
                  {candidate.phone}
                </Typography>
              </Box>
            )}

            {candidate.address && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 1.5 },
                p: { xs: 0.5, sm: 0 },
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s ease',
              }}>
                <LocationIcon sx={{ 
                  fontSize: { xs: 14, sm: 16 }, 
                  color: 'text.secondary',
                  flexShrink: 0,
                }} />
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 400,
                  }}
                >
                  {candidate.address}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Additional Information - Only show in detailed view */}
        {variant === 'detailed' && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={1.5}>
              {candidate.skills && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Skills
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      pl: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {candidate.skills}
                  </Typography>
                </Box>
              )}

              {candidate.education && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <SchoolIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Education
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      pl: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {candidate.education}
                  </Typography>
                </Box>
              )}

              {candidate.workExperience && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Experience
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      pl: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {candidate.workExperience}
                  </Typography>
                </Box>
              )}
            </Stack>
          </>
        )}

        {/* Metadata */}
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              Added {formatDate(candidate.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions 
          sx={{ 
            px: { xs: 1.5, sm: 2 }, 
            pb: { xs: 1.5, sm: 2 }, 
            pt: 0, 
            justifyContent: 'space-between',
            borderTop: 1,
            borderColor: 'divider',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Box sx={{ display: 'flex', gap: { xs: 0.25, sm: 0.5 } }}>
            {canView && (
              <Tooltip title="View Details" arrow>
                <IconButton 
                  size={variant === 'compact' ? 'small' : 'medium'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView();
                  }}
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ViewIcon fontSize={variant === 'compact' ? 'small' : 'medium'} />
                </IconButton>
              </Tooltip>
            )}

            {canEdit && (
              <Tooltip title="Edit Candidate" arrow>
                <IconButton 
                  size={variant === 'compact' ? 'small' : 'medium'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  sx={{ 
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: 'success.light',
                      color: 'success.contrastText',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <EditIcon fontSize={variant === 'compact' ? 'small' : 'medium'} />
                </IconButton>
              </Tooltip>
            )}

            {candidate.cvFileName && (
              <Tooltip title="Download CV" arrow>
                <IconButton 
                  size={variant === 'compact' ? 'small' : 'medium'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadCV();
                  }}
                  sx={{ 
                    color: 'info.main',
                    '&:hover': {
                      backgroundColor: 'info.light',
                      color: 'info.contrastText',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DownloadIcon fontSize={variant === 'compact' ? 'small' : 'medium'} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {canDelete && (
            <Tooltip title="Delete Candidate" arrow>
              <IconButton 
                size={variant === 'compact' ? 'small' : 'medium'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <DeleteIcon fontSize={variant === 'compact' ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default CandidateCard;
