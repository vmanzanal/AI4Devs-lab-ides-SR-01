// UI Component and State Types
// Frontend-specific UI types

import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/material';
import { ApiErrorCode } from './api.types';

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  sx?: SxProps<Theme>;
  children?: ReactNode;
}

// Button Types
export type ButtonVariant = 'text' | 'outlined' | 'contained';
export type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// Input Types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputVariant = 'outlined' | 'filled' | 'standard';

export interface InputProps extends BaseComponentProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: InputType;
  variant?: InputVariant;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Select Types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends BaseComponentProps {
  name: string;
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  multiple?: boolean;
  onChange?: (value: string | number | (string | number)[]) => void;
}

// Form Types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: Record<string, FormFieldError>;
}

// Modal Types
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
}

// Dialog Types
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => ReactNode;
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: string[] | number[];
  onRowSelect?: (selectedRows: string[] | number[]) => void;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  permission?: string;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

// Error Display Types
export interface ErrorDisplayProps {
  error: string | Error | null;
  code?: ApiErrorCode;
  retry?: () => void;
  fullPage?: boolean;
}

// File Upload Types
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  preview?: boolean;
  onFileSelect: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
}

export interface FilePreview {
  file: File;
  url?: string;
  error?: string;
}

// Search Types
export interface SearchBarProps extends BaseComponentProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
}

// Filter Types
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'boolean';
  options?: SelectOption[];
  multiple?: boolean;
}

export interface FilterValue {
  [key: string]: any;
}

export interface FilterPanelProps extends BaseComponentProps {
  filters: FilterOption[];
  values: FilterValue;
  onFiltersChange: (values: FilterValue) => void;
  onReset: () => void;
  loading?: boolean;
}

// Layout Types
export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  maxWidth?: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number | string;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  permission?: string;
  layout?: React.ComponentType<any>;
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
  };
}
