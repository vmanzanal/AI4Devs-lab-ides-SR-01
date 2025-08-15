// Navigation Menu Component
// Role-based navigation with hierarchical menu items

import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Collapse,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Description as ReportsIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePermissions } from '../../hooks';
import { Permission, UserRole } from '../../types/user.types';

// Navigation item interface
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  permission?: Permission;
  role?: UserRole;
  minimumRole?: UserRole;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  children?: NavigationItem[];
  badge?: number | string;
  divider?: boolean;
  onClick?: () => void;
}

// Navigation menu configuration
const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />
  },
  {
    id: 'divider-main',
    label: '',
    divider: true
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: <PeopleIcon />,
    children: [
      {
        id: 'candidates-list',
        label: 'View All Candidates',
        path: '/candidates',
        icon: <SearchIcon />
      },
      {
        id: 'candidates-add',
        label: 'Add New Candidate',
        path: '/candidates/new',
        icon: <PersonAddIcon />,
        permission: Permission.CREATE_CANDIDATE
      },
      {
        id: 'candidates-upload',
        label: 'Bulk Upload',
        path: '/candidates/upload',
        icon: <UploadIcon />,
        permission: Permission.CREATE_CANDIDATE
      }
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: <AnalyticsIcon />,
    permission: Permission.VIEW_ANALYTICS,
    children: [
      {
        id: 'reports-overview',
        label: 'Overview',
        path: '/reports',
        icon: <ReportsIcon />,
        permission: Permission.VIEW_ANALYTICS
      },
      {
        id: 'reports-export',
        label: 'Export Data',
        path: '/reports/export',
        icon: <DownloadIcon />,
        permission: Permission.EXPORT_DATA
      }
    ]
  },
  {
    id: 'divider-admin',
    label: '',
    divider: true,
    minimumRole: UserRole.HIRING_MANAGER
  },
  {
    id: 'users',
    label: 'User Management',
    icon: <GroupIcon />,
    minimumRole: UserRole.HIRING_MANAGER,
    children: [
      {
        id: 'users-list',
        label: 'View Users',
        path: '/users',
        icon: <PersonIcon />,
        minimumRole: UserRole.HIRING_MANAGER
      },
      {
        id: 'users-add',
        label: 'Add User',
        path: '/users/new',
        icon: <PersonAddIcon />,
        permission: Permission.CREATE_USER
      }
    ]
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: <AdminIcon />,
    role: UserRole.ADMIN,
    children: [
      {
        id: 'admin-settings',
        label: 'System Settings',
        path: '/admin/settings',
        icon: <SettingsIcon />,
        permission: Permission.MANAGE_SYSTEM
      },
      {
        id: 'admin-company',
        label: 'Company Settings',
        path: '/admin/company',
        icon: <BusinessIcon />,
        permission: Permission.MANAGE_SYSTEM
      }
    ]
  }
];

export interface NavigationMenuProps {
  onItemClick?: (item: NavigationItem) => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  onItemClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();
  
  // Filter navigation items based on permissions
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      // Handle dividers - check if they should be shown based on role
      if (item.divider) {
        if (item.minimumRole && !permissions.hasMinimumRole(item.minimumRole)) {
          return false;
        }
        return true;
      }

      // Check single permission
      if (item.permission && !permissions.hasPermission(item.permission)) {
        return false;
      }

      // Check single role
      if (item.role && !permissions.hasRole(item.role)) {
        return false;
      }

      // Check minimum role
      if (item.minimumRole && !permissions.hasMinimumRole(item.minimumRole)) {
        return false;
      }

      // Check required permissions (all must be present)
      if (item.requiredPermissions && !permissions.hasAllPermissions(item.requiredPermissions)) {
        return false;
      }

      // Check required roles (any must be present)
      if (item.requiredRoles && !permissions.hasAnyRole(item.requiredRoles)) {
        return false;
      }

      return true;
    });
  };

  const allowedNavItems = filterNavigationItems(navigationConfig);
  
  // State for expanded menu items
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['candidates']));

  // Handle menu item expansion
  const handleExpand = (itemId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpanded(newExpanded);
  };

  // Handle navigation
  const handleNavigate = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    onItemClick?.(item);
  };

  // Check if path is active
  const isActivePath = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if parent has active child
  const hasActiveChild = (item: NavigationItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => 
      isActivePath(child.path) || hasActiveChild(child)
    );
  };

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    // Handle dividers
    if (item.divider) {
      return <Divider key={item.id} sx={{ my: 1 }} />;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.id);
    const isActive = isActivePath(item.path);
    const hasActiveChildItem = hasActiveChild(item);
    const isParentActive = isActive || hasActiveChildItem;

    // Filter children based on permissions
    const allowedChildren = item.children 
      ? filterNavigationItems(item.children)
      : [];

    // Don't render if no allowed children and item has children
    if (hasChildren && allowedChildren.length === 0) {
      return null;
    }

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpand(item.id);
              } else {
                handleNavigate(item);
              }
            }}
            selected={isParentActive}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                }
              }
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
            )}
            
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                variant: level === 0 ? 'body1' : 'body2',
                fontWeight: isParentActive ? 600 : 400
              }}
            />
            
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>

        {/* Render children */}
        {hasChildren && allowedChildren.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {allowedChildren.map(child => 
                renderNavigationItem(child, level + 1)
              )}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box>
      {/* Navigation Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Navigation
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {permissions.role && `Role: ${permissions.role}`}
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List component="nav" sx={{ px: 1 }}>
        {allowedNavItems.map(item => renderNavigationItem(item))}
      </List>

      {/* Footer Info */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Candidate Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default NavigationMenu;
