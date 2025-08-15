// Services Index
// Central export point for all API services

// Import services for the services object
import { apiClient } from './apiClient';
import { authService } from './authService';
import { candidateService } from './candidateService';

// Core API Client
export { apiClient, ApiClient } from './apiClient';

// Authentication Service
export { authService, AuthService } from './authService';

// Candidate Service
export { candidateService, CandidateService } from './candidateService';

// Re-export for convenience
export const services = {
  api: apiClient,
  auth: authService,
  candidate: candidateService
};

// Service health check
export const checkServicesHealth = async (): Promise<{
  api: boolean;
  auth: boolean;
  overall: boolean;
}> => {
  try {
    const apiHealth = await apiClient.healthCheck();
    const authHealth = authService.isAuthenticated();

    return {
      api: apiHealth,
      auth: authHealth,
      overall: apiHealth && authHealth
    };
  } catch (error) {
    console.error('Services health check failed:', error);
    return {
      api: false,
      auth: false,
      overall: false
    };
  }
};
