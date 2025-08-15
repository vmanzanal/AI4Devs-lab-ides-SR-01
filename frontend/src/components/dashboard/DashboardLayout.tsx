// Dashboard Layout Component
// Main layout container with navigation and content area

import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon
} from '@mui/icons-material';

import { useAuth } from '../../hooks';
import { NavigationMenu, UserProfile } from '../navigation';

// Navigation width constants
const DRAWER_WIDTH = 280;
const MOBILE_DRAWER_WIDTH = 280;

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Candidate Management System',
  showNavigation = true,
  maxWidth = 'xl'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  // Navigation state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  // Handle navigation toggle
  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  // This function is no longer needed as UserProfile handles logout

  // Navigation content
  const navigationContent = (
    <NavigationMenu
      onItemClick={(item) => {
        // Close mobile drawer when item is clicked
        if (isMobile) {
          setMobileOpen(false);
        }
      }}
    />
  );

  // App bar content
  const appBarContent = (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        ...(showNavigation && !isMobile && desktopOpen && {
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`
        })
      }}
    >
      <Toolbar>
        {showNavigation && (
          <IconButton
            color="inherit"
            aria-label="toggle navigation"
            edge="start"
            onClick={isMobile ? handleMobileToggle : handleDesktopToggle}
            sx={{
              mr: 2,
              ...(showNavigation && !isMobile && desktopOpen && { display: 'none' })
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        
        {user && (
          <UserProfile
            onLogout={() => {
              // Additional logout logic if needed
            }}
          />
        )}
      </Toolbar>
    </AppBar>
  );

  // Desktop navigation drawer
  const desktopDrawer = !isMobile && showNavigation && (
    <Drawer
      variant="persistent"
      anchor="left"
      open={desktopOpen}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box'
        }
      }}
    >
      <Toolbar /> {/* Spacer for app bar */}
      {navigationContent}
    </Drawer>
  );

  // Mobile navigation drawer
  const mobileDrawer = isMobile && showNavigation && (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileOpen}
      onClose={handleMobileToggle}
      ModalProps={{
        keepMounted: true // Better mobile performance
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: MOBILE_DRAWER_WIDTH,
          boxSizing: 'border-box'
        }
      }}
    >
      <Toolbar /> {/* Spacer for app bar */}
      {navigationContent}
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      {appBarContent}

      {/* Navigation Drawers */}
      {desktopDrawer}
      {mobileDrawer}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ...(showNavigation && !isMobile && desktopOpen && {
            width: `calc(100% - ${DRAWER_WIDTH}px)`
          })
        }}
      >
        {/* Spacer for app bar */}
        <Toolbar />
        
        {/* Content Area */}
        <Box sx={{ flexGrow: 1, py: 3 }}>
          <Container maxWidth={maxWidth}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
