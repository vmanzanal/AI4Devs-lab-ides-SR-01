// Route Configuration
// Centralized route definitions and access control

import { Permission, UserRole } from '../types/user.types';

export interface RouteConfig {
  path: string;
  title: string;
  description?: string;
  permission?: Permission;
  role?: UserRole;
  minimumRole?: UserRole;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  isPublic?: boolean;
  isImplemented?: boolean;
}

// Application routes configuration
export const routes: Record<string, RouteConfig> = {
  // Public routes
  login: {
    path: '/login',
    title: 'Login',
    description: 'User authentication',
    isPublic: true,
    isImplemented: false
  },
  register: {
    path: '/register',
    title: 'Register',
    description: 'New user registration',
    isPublic: true,
    isImplemented: false
  },
  forgotPassword: {
    path: '/forgot-password',
    title: 'Forgot Password',
    description: 'Password reset request',
    isPublic: true,
    isImplemented: false
  },

  // Dashboard routes
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Main dashboard overview',
    isImplemented: true
  },

  // Candidate routes
  candidates: {
    path: '/candidates',
    title: 'Candidates',
    description: 'View all candidates',
    isImplemented: false
  },
  candidatesNew: {
    path: '/candidates/new',
    title: 'Add Candidate',
    description: 'Create new candidate',
    permission: Permission.CREATE_CANDIDATE,
    isImplemented: true
  },
  candidatesEdit: {
    path: '/candidates/edit/:id',
    title: 'Edit Candidate',
    description: 'Edit existing candidate',
    permission: Permission.UPDATE_CANDIDATE,
    isImplemented: true
  },
  candidatesUpload: {
    path: '/candidates/upload',
    title: 'Bulk Upload',
    description: 'Upload multiple candidates',
    permission: Permission.CREATE_CANDIDATE,
    isImplemented: false
  },

  // Reports routes
  reports: {
    path: '/reports',
    title: 'Reports',
    description: 'Analytics and reports',
    permission: Permission.VIEW_ANALYTICS,
    isImplemented: false
  },
  reportsExport: {
    path: '/reports/export',
    title: 'Export Data',
    description: 'Export candidate data',
    permission: Permission.EXPORT_DATA,
    isImplemented: false
  },

  // User management routes
  users: {
    path: '/users',
    title: 'Users',
    description: 'Manage users',
    minimumRole: UserRole.HIRING_MANAGER,
    isImplemented: false
  },
  usersNew: {
    path: '/users/new',
    title: 'Add User',
    description: 'Create new user',
    permission: Permission.CREATE_USER,
    isImplemented: false
  },

  // Administration routes
  adminSettings: {
    path: '/admin/settings',
    title: 'System Settings',
    description: 'System configuration',
    role: UserRole.ADMIN,
    isImplemented: false
  },
  adminCompany: {
    path: '/admin/company',
    title: 'Company Settings',
    description: 'Company configuration',
    permission: Permission.MANAGE_SYSTEM,
    isImplemented: false
  },

  // User profile routes
  profile: {
    path: '/profile',
    title: 'My Profile',
    description: 'User profile management',
    isImplemented: false
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    description: 'User preferences',
    isImplemented: false
  },

  // Error routes
  unauthorized: {
    path: '/unauthorized',
    title: 'Access Denied',
    description: 'Insufficient permissions',
    isPublic: true,
    isImplemented: true
  },
  notFound: {
    path: '/not-found',
    title: 'Page Not Found',
    description: 'Page does not exist',
    isPublic: true,
    isImplemented: true
  }
};

// Route groups for organization
export const routeGroups = {
  public: ['login', 'register', 'forgotPassword', 'unauthorized', 'notFound'],
  dashboard: ['dashboard'],
  candidates: ['candidates', 'candidatesNew', 'candidatesEdit', 'candidatesUpload'],
  reports: ['reports', 'reportsExport'],
  users: ['users', 'usersNew'],
  admin: ['adminSettings', 'adminCompany'],
  profile: ['profile', 'settings']
};

// Helper functions
export const getRoute = (routeKey: string): RouteConfig | undefined => {
  return routes[routeKey];
};

export const getRoutesByGroup = (groupKey: keyof typeof routeGroups): RouteConfig[] => {
  const group = routeGroups[groupKey];
  return group.map(key => routes[key]).filter(Boolean);
};

export const getImplementedRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => route.isImplemented);
};

export const getUnimplementedRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => !route.isImplemented);
};

export const getPublicRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => route.isPublic);
};

export const getProtectedRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => !route.isPublic);
};

// Navigation breadcrumbs helper
export const getBreadcrumbs = (pathname: string): RouteConfig[] => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: RouteConfig[] = [];
  
  // Always start with dashboard if not on public route
  const currentRoute = Object.values(routes).find(route => 
    route.path === pathname || route.path.replace(':id', '[id]') === pathname
  );
  
  if (currentRoute && !currentRoute.isPublic) {
    breadcrumbs.push(routes.dashboard);
    if (currentRoute !== routes.dashboard) {
      breadcrumbs.push(currentRoute);
    }
  }
  
  return breadcrumbs;
};

export default routes;
