// Authentication Service
// Handles all authentication-related API calls

import { apiClient } from './apiClient';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponse, 
  User, 
  ChangePasswordDto, 
  TokenPair,
  RefreshTokenDto,
  PermissionSummary 
} from '../types/user.types';
import { ApiResponse, API_ENDPOINTS } from '../types/api.types';

export class AuthService {
  /**
   * User login
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    if (response.success && response.data) {
      // Store tokens
      apiClient.setTokens(
        response.data.token,
        response.data.refreshToken
      );
      
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * User registration
   */
  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );

    if (response.success && response.data) {
      // Store tokens
      apiClient.setTokens(
        response.data.token,
        response.data.refreshToken
      );
      
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      const token = apiClient.getAccessToken();
      
      if (token) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { token });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local tokens
      apiClient.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User; permissions: PermissionSummary }>(
      API_ENDPOINTS.AUTH.ME
    );

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.error || 'Failed to get user profile');
  }

  /**
   * Get current user with permissions
   */
  async getCurrentUserWithPermissions(): Promise<{ user: User; permissions: PermissionSummary }> {
    const response = await apiClient.get<{ user: User; permissions: PermissionSummary }>(
      API_ENDPOINTS.AUTH.ME
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get user profile');
  }

  /**
   * Change password
   */
  async changePassword(passwordData: ChangePasswordDto): Promise<void> {
    const response = await apiClient.put<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      passwordData
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to change password');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to request password reset');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, newPassword }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenPair> {
    const refreshToken = apiClient.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<TokenPair>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );

    if (response.success && response.data) {
      // Update stored tokens
      apiClient.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
      
      return response.data;
    }

    throw new Error(response.error || 'Failed to refresh token');
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ valid: boolean; userId: number; role: string }>(
        API_ENDPOINTS.AUTH.VALIDATE
      );

      return response.success && response.data?.valid === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return apiClient.getRefreshToken();
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    apiClient.clearTokens();
  }

  /**
   * Set authentication tokens manually
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    apiClient.setTokens(accessToken, refreshToken);
  }
}

// Create and export singleton instance
export const authService = new AuthService();
