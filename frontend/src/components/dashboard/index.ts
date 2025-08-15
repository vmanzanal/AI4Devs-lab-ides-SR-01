// Dashboard Components Index
// Central export point for all dashboard-related components

// Import components for organized access
import { DashboardLayout } from './DashboardLayout';
import { Dashboard } from './Dashboard';
import { DashboardCard } from './DashboardCard';
import { DashboardOverview } from './DashboardOverview';
import { DashboardChart } from './DashboardChart';

// Layout Components
export { DashboardLayout } from './DashboardLayout';
export type { DashboardLayoutProps } from './DashboardLayout';

// Dashboard Components
export { Dashboard } from './Dashboard';
export type { DashboardProps } from './Dashboard';

export { DashboardCard } from './DashboardCard';
export type { DashboardCardProps } from './DashboardCard';

export { DashboardOverview } from './DashboardOverview';
export type { DashboardOverviewProps } from './DashboardOverview';

export { DashboardChart } from './DashboardChart';
export type { DashboardChartProps, ChartDataItem } from './DashboardChart';

// Re-export for convenience
export const DashboardComponents = {
  DashboardLayout,
  Dashboard,
  DashboardCard,
  DashboardOverview,
  DashboardChart
};

// Component categories for organized access
export const LayoutComponents = {
  DashboardLayout
};

export const PageComponents = {
  Dashboard
};

export const ChartComponents = {
  DashboardCard,
  DashboardOverview,
  DashboardChart
};
