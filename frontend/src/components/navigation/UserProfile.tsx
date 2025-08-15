// User Profile Component
// User information and profile actions in the app bar

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Settings,
  Person,
  Security
} from '@mui/icons-material';

import { useAuth } from '../../hooks';
import { UserRole } from '../../types/user.types';

// Role color mapping
const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'error';
    case UserRole.HIRING_MANAGER:
      return 'warning';
    case UserRole.HR_RECRUITER:
      return 'info';
    default:
      return 'default';
  }
};

// Role display names
const getRoleDisplayName = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.HIRING_MANAGER:
      return 'Hiring Manager';
    case UserRole.HR_RECRUITER:
      return 'HR Recruiter';
    default:
      return role;
  }
};

export interface UserProfileProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onProfileClick,
  onSettingsClick,
  onLogout
}) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle menu open/close
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = async () => {
    handleClose();
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Handle profile click
  const handleProfile = () => {
    handleClose();
    onProfileClick?.();
  };

  // Handle settings click
  const handleSettings = () => {
    handleClose();
    onSettingsClick?.();
  };

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const initials = getInitials(user.name, user.email);

  return (
    <>
      {/* User Info Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* User Details - Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
          <Typography variant="body2" color="inherit" sx={{ lineHeight: 1.2 }}>
            {user.name || user.email}
          </Typography>
          <Chip
            label={getRoleDisplayName(user.role)}
            size="small"
            color={getRoleColor(user.role)}
            sx={{ 
              height: 16, 
              fontSize: '0.65rem',
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>

        {/* User Avatar Button */}
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            p: 0,
            border: 2,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)'
            }
          }}
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: 'secondary.main',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            {initials}
          </Avatar>
        </IconButton>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {user.email}
          </Typography>
          <Chip
            label={getRoleDisplayName(user.role)}
            size="small"
            color={getRoleColor(user.role)}
            sx={{ 
              mt: 0.5,
              height: 18, 
              fontSize: '0.7rem',
            }}
          />
        </Box>

        {/* Menu Items */}
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserProfile;
