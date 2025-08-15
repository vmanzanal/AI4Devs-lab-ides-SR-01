// API Client Service
// Centralized HTTP client with authentication, interceptors, and error handling

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { 
  ApiResponse, 
  ApiError, 
  ApiErrorCode, 
  HttpStatusCode,
  API_ENDPOINTS 
} from '../types/api.types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// API Client Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3010',
  timeout: 30000, // 30 seconds
  withCredentials: true, // For HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.handleApiError(error));
      }
    );

    // Response interceptor - Handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for debugging
        const startTime = response.config.metadata?.startTime;
        if (startTime) {
          const duration = Date.now() - startTime;
          console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url}: ${duration}ms`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Token refresh logic
        if (error.response?.status === HttpStatusCode.UNAUTHORIZED && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request while refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.axiosInstance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(newToken, null);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(null, refreshError);
            this.handleTokenRefreshFailure();
            return Promise.reject(this.handleApiError(error));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private processQueue(token: string | null, error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      this.setTokens(accessToken, newRefreshToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  private handleTokenRefreshFailure(): void {
    this.clearTokens();
    // Emit event for auth context to handle logout
    window.dispatchEvent(new CustomEvent('auth:token-refresh-failed'));
  }

  private handleApiError(error: AxiosError): ApiError {
    const response = error.response;
    const request = error.request;

    // Network error
    if (!response && request) {
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        code: ApiErrorCode.NETWORK_ERROR,
        timestamp: new Date().toISOString()
      };
    }

    // No response at all
    if (!response) {
      return {
        success: false,
        error: 'Request failed. Please try again.',
        code: ApiErrorCode.UNKNOWN_ERROR,
        timestamp: new Date().toISOString()
      };
    }

    // Server responded with error
    const errorData = response.data as ApiError;
    
    return {
      success: false,
      error: errorData.error || 'An unexpected error occurred',
      code: errorData.code || ApiErrorCode.UNKNOWN_ERROR,
      timestamp: errorData.timestamp || new Date().toISOString(),
      details: {
        status: response.status,
        statusText: response.statusText,
        url: error.config?.url,
        method: error.config?.method
      }
    };
  }

  // Token management methods
  public setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // HTTP Methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error; // Error already handled by interceptor
    }
  }

  public async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  public async patch<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // File upload method
  public async uploadFile<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // File download method
  public async downloadFile(url: string, fileName?: string): Promise<void> {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Extract filename from response headers or use provided name
      const contentDisposition = response.headers['content-disposition'];
      let downloadFileName = fileName;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch) {
          downloadFileName = fileNameMatch[1];
        }
      }
      
      link.download = downloadFileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error;
    }
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Request cancellation
  public createCancelToken() {
    return axios.CancelToken.source();
  }

  public isCancel(error: any): boolean {
    return axios.isCancel(error);
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export { ApiClient };

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
