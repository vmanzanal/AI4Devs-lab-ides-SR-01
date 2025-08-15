// Type Definitions Index
// Central export point for all TypeScript types

// User and Authentication Types
export * from './user.types';

// Candidate Management Types
export * from './candidate.types';

// API Communication Types
export * from './api.types';

// UI Component Types
export * from './ui.types';

// Import types for extended interfaces
import type { User, PermissionSummary } from './user.types';
import type { Notification } from './ui.types';
import type { ApiResponse } from './api.types';

// Re-export commonly used types with aliases for convenience
export type {
  User,
  UserRole,
  LoginDto,
  RegisterDto,
  AuthResponse,
  PermissionSummary
} from './user.types';

export type {
  Candidate,
  ExperienceLevel,
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateFormData,
  PaginatedCandidateResponse
} from './candidate.types';

export type {
  ApiResponse,
  ApiError,
  ApiSuccess,
  PaginatedResponse,
  ApiErrorCode
} from './api.types';

export type {
  ButtonProps,
  InputProps,
  SelectProps,
  ModalProps,
  NotificationType,
  Notification,
  LoadingState,
  AsyncState
} from './ui.types';

// Application-specific combined types
export interface AppUser extends User {
  permissions: PermissionSummary;
  isAuthenticated: boolean;
}

export interface AppState {
  user: AppUser | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: {
    global: boolean;
    auth: boolean;
    candidates: boolean;
  };
}

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = void> = () => T;
export type ParameterizedEventHandler<P, T = void> = (param: P) => T;
export type AsyncEventHandler<T = void> = () => Promise<T>;
export type AsyncParameterizedEventHandler<P, T = void> = (param: P) => Promise<T>;

// Form types
export type FormSubmitHandler<T> = (data: T) => void | Promise<void>;
export type FormErrorHandler = (errors: Record<string, any>) => void;

// API types
export type ApiHandler<T, R = void> = (data: T) => Promise<R>;
export type ApiCall<T = any> = () => Promise<ApiResponse<T>>;

// Component lifecycle types
export type ComponentMountHandler = () => void | (() => void);
export type ComponentUpdateHandler<T> = (prevProps: T) => void;

// Validation types
export type ValidationRule<T> = (value: T) => string | undefined;
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// State management types
export type StateUpdater<T> = (prevState: T) => T;
export type StateAction<T, P = any> = {
  type: string;
  payload?: P;
};

export type StateReducer<T, A = StateAction<T>> = (state: T, action: A) => T;

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}
