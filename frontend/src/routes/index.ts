// Routes Index
// Central export point for all routing-related components and utilities

// Import components for organized access
import { AppRouter } from './AppRouter';
import { PlaceholderPage } from './PlaceholderPage';
// Import utilities for re-export
import {
  getRoute,
  getRoutesByGroup,
  getImplementedRoutes,
  getUnimplementedRoutes,
  getPublicRoutes,
  getProtectedRoutes,
  getBreadcrumbs
} from './routeConfig';

// Main router
export { AppRouter } from './AppRouter';

// Components
export { PlaceholderPage } from './PlaceholderPage';
export type { PlaceholderPageProps } from './PlaceholderPage';

// Route configuration
export {
  routes,
  routeGroups,
  getRoute,
  getRoutesByGroup,
  getImplementedRoutes,
  getUnimplementedRoutes,
  getPublicRoutes,
  getProtectedRoutes,
  getBreadcrumbs
} from './routeConfig';
export type { RouteConfig } from './routeConfig';

// Re-export for convenience
export const RouterComponents = {
  AppRouter,
  PlaceholderPage
};

// Route utilities
export const RouteUtils = {
  getRoute,
  getRoutesByGroup,
  getImplementedRoutes,
  getUnimplementedRoutes,
  getPublicRoutes,
  getProtectedRoutes,
  getBreadcrumbs
};
