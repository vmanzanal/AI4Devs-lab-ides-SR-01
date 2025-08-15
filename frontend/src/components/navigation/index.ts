// Navigation Components Index
// Central export point for all navigation-related components

// Import components for organized access
import { NavigationMenu } from './NavigationMenu';
import { UserProfile } from './UserProfile';

// Navigation Components
export { NavigationMenu } from './NavigationMenu';
export type { NavigationMenuProps, NavigationItem } from './NavigationMenu';

export { UserProfile } from './UserProfile';
export type { UserProfileProps } from './UserProfile';

// Re-export for convenience
export const NavigationComponents = {
  NavigationMenu,
  UserProfile
};

// Component categories for organized access
export const MenuComponents = {
  NavigationMenu
};

export const ProfileComponents = {
  UserProfile
};
