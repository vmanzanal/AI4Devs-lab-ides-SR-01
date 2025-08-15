// Authentication Context and Hook
// Centralized authentication state management with React Context

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { errorHandler } from '../utils/errorHandler';
import {
  User,
  LoginDto,
  RegisterDto,
  AuthResponse,
  PermissionSummary,
  ChangePasswordDto,
  Permission,
  UserRole
} from '../types/user.types';
import { ApiError } from '../types/api.types';

// Authentication State
export interface AuthState {
  user: User | null;
  permissions: PermissionSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Authentication Actions
type AuthAction =
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS'; payload: { user: User; permissions: PermissionSummary } }
  | { type: 'INITIALIZE_FAILURE'; payload: string }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; permissions: PermissionSummary } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT_START' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'LOGOUT_FAILURE'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; permissions: PermissionSummary } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'TOKEN_REFRESH_FAILED' };

// Initial State
const initialState: AuthState = {
  user: null,
  permissions: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INITIALIZE_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'INITIALIZE_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null
      };

    case 'INITIALIZE_FAILURE':
      return {
        ...state,
        user: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: action.payload
      };

    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case 'LOGOUT_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'LOGOUT_SUCCESS':
      return {
        ...state,
        user: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case 'LOGOUT_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'TOKEN_REFRESH_FAILED':
      return {
        ...state,
        user: null,
        permissions: null,
        isAuthenticated: false,
        error: 'Session expired. Please log in again.'
      };

    default:
      return state;
  }
};

// Context Interface
export interface AuthContextValue extends AuthState {
  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePasswordDto) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;

  // Permission helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
}

// Create Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider Props
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  const initialize = useCallback(async () => {
    dispatch({ type: 'INITIALIZE_START' });

    try {
      // Check if user has a valid token
      if (!authService.isAuthenticated()) {
        throw new Error('No authentication token found');
      }

      // Validate token and get user data
      const userData = await authService.getCurrentUserWithPermissions();
      
      dispatch({
        type: 'INITIALIZE_SUCCESS',
        payload: {
          user: userData.user,
          permissions: userData.permissions
        }
      });
    } catch (error) {
      // Clear any invalid tokens
      authService.clearAuthData();
      
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'INITIALIZE_FAILURE', payload: processedError.message });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginDto) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const authResponse: AuthResponse = await authService.login(credentials);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResponse.user,
          permissions: authResponse.permissions!
        }
      });
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'LOGIN_FAILURE', payload: processedError.message });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterDto) => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const authResponse: AuthResponse = await authService.register(userData);
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          user: authResponse.user,
          permissions: authResponse.permissions!
        }
      });
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'REGISTER_FAILURE', payload: processedError.message });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    dispatch({ type: 'LOGOUT_START' });

    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT_SUCCESS' });
    } catch (error) {
      // Even if logout fails on server, clear local state
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'LOGOUT_FAILURE', payload: processedError.message });
      
      // Clear local auth data anyway
      authService.clearAuthData();
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData: ChangePasswordDto) => {
    try {
      await authService.changePassword(passwordData);
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'SET_ERROR', payload: processedError.message });
      throw error;
    }
  }, []);

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const userData = await authService.getCurrentUserWithPermissions();
      dispatch({
        type: 'UPDATE_USER',
        payload: userData.user
      });
    } catch (error) {
      const processedError = errorHandler.processApiError(error as ApiError);
      dispatch({ type: 'SET_ERROR', payload: processedError.message });
    }
  }, [state.isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Permission helper functions
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!state.permissions) return false;
    return state.permissions.effectivePermissions.includes(permission);
  }, [state.permissions]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false;
    return state.user.role === role;
  }, [state.user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  }, [state.user]);

  const hasMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      [UserRole.HR_RECRUITER]: 1,
      [UserRole.HIRING_MANAGER]: 2,
      [UserRole.ADMIN]: 3
    };
    
    const userLevel = roleHierarchy[state.user.role];
    const requiredLevel = roleHierarchy[minimumRole];
    
    return userLevel >= requiredLevel;
  }, [state.user]);

  // Listen for token refresh failures
  useEffect(() => {
    const handleTokenRefreshFailed = () => {
      dispatch({ type: 'TOKEN_REFRESH_FAILED' });
    };

    window.addEventListener('auth:token-refresh-failed', handleTokenRefreshFailed);
    
    return () => {
      window.removeEventListener('auth:token-refresh-failed', handleTokenRefreshFailed);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Context value
  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    changePassword,
    refreshUserData,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasMinimumRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
