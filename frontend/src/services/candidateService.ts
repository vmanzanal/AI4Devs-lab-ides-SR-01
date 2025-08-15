// Candidate Service
// Handles all candidate-related API calls

import { apiClient } from './apiClient';
import {
  Candidate,
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateFilterDto,
  PaginatedCandidateResponse,
  CVUploadResponse,
  CVDownloadInfo
} from '../types/candidate.types';
import { ApiResponse, API_ENDPOINTS } from '../types/api.types';

export class CandidateService {
  /**
   * Get all candidates with pagination and filtering
   */
  async getCandidates(filters?: CandidateFilterDto): Promise<PaginatedCandidateResponse> {
    const response = await apiClient.get<PaginatedCandidateResponse>(
      API_ENDPOINTS.CANDIDATES.BASE,
      { params: filters }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch candidates');
  }

  /**
   * Get candidate by ID
   */
  async getCandidateById(id: number): Promise<Candidate> {
    const response = await apiClient.get<Candidate>(
      API_ENDPOINTS.CANDIDATES.BY_ID(id)
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch candidate');
  }

  /**
   * Create new candidate
   */
  async createCandidate(candidateData: CreateCandidateDto): Promise<Candidate> {
    const response = await apiClient.post<Candidate>(
      API_ENDPOINTS.CANDIDATES.BASE,
      candidateData
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create candidate');
  }

  /**
   * Update existing candidate
   */
  async updateCandidate(id: number, candidateData: UpdateCandidateDto): Promise<Candidate> {
    const response = await apiClient.put<Candidate>(
      API_ENDPOINTS.CANDIDATES.BY_ID(id),
      candidateData
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update candidate');
  }

  /**
   * Delete candidate
   */
  async deleteCandidate(id: number): Promise<void> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.CANDIDATES.BY_ID(id)
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete candidate');
    }
  }

  /**
   * Upload CV file for candidate
   */
  async uploadCV(candidateId: number, file: File): Promise<CVUploadResponse> {
    const response = await apiClient.uploadFile<CVUploadResponse>(
      API_ENDPOINTS.CANDIDATES.UPLOAD_CV(candidateId),
      file
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to upload CV');
  }

  /**
   * Download CV file for candidate
   */
  async downloadCV(candidateId: number, fileName?: string): Promise<void> {
    try {
      await apiClient.downloadFile(
        API_ENDPOINTS.CANDIDATES.DOWNLOAD_CV(candidateId),
        fileName
      );
    } catch (error) {
      throw new Error('Failed to download CV');
    }
  }

  /**
   * Get CV download information
   */
  async getCVInfo(candidateId: number): Promise<CVDownloadInfo> {
    const response = await apiClient.get<CVDownloadInfo>(
      API_ENDPOINTS.CANDIDATES.DOWNLOAD_CV(candidateId) + '/info'
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get CV information');
  }

  /**
   * Delete CV file for candidate
   */
  async deleteCV(candidateId: number): Promise<void> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.CANDIDATES.UPLOAD_CV(candidateId)
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete CV');
    }
  }

  /**
   * Search candidates with advanced filters
   */
  async searchCandidates(
    searchQuery: string, 
    filters?: Omit<CandidateFilterDto, 'search'>
  ): Promise<PaginatedCandidateResponse> {
    const searchParams: CandidateFilterDto = {
      search: searchQuery,
      ...filters
    };

    return this.getCandidates(searchParams);
  }

  /**
   * Get candidates by position
   */
  async getCandidatesByPosition(
    position: string, 
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedCandidateResponse> {
    return this.getCandidates({
      position,
      ...pagination
    });
  }

  /**
   * Get candidates by experience level
   */
  async getCandidatesByExperience(
    experienceLevel: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedCandidateResponse> {
    return this.getCandidates({
      experienceLevel: experienceLevel as any,
      ...pagination
    });
  }

  /**
   * Get candidates by skills
   */
  async getCandidatesBySkills(
    skills: string,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedCandidateResponse> {
    return this.getCandidates({
      skills,
      ...pagination
    });
  }

  /**
   * Get recent candidates
   */
  async getRecentCandidates(limit: number = 10): Promise<Candidate[]> {
    const response = await this.getCandidates({
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    return response.candidates;
  }

  /**
   * Get candidates created by specific user
   */
  async getCandidatesByCreator(
    createdById: number,
    pagination?: { page?: number; limit?: number }
  ): Promise<PaginatedCandidateResponse> {
    return this.getCandidates({
      createdById,
      ...pagination
    });
  }

  /**
   * Bulk delete candidates
   */
  async deleteCandidates(candidateIds: number[]): Promise<void> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.CANDIDATES.BASE,
      {
        data: { candidateIds }
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete candidates');
    }
  }

  /**
   * Export candidates to CSV/Excel
   */
  async exportCandidates(
    format: 'csv' | 'excel' = 'csv',
    filters?: CandidateFilterDto
  ): Promise<void> {
    try {
      await apiClient.downloadFile(
        `${API_ENDPOINTS.CANDIDATES.BASE}/export?format=${format}`,
        `candidates.${format === 'excel' ? 'xlsx' : 'csv'}`
      );
    } catch (error) {
      throw new Error('Failed to export candidates');
    }
  }

  /**
   * Get candidate statistics
   */
  async getCandidateStats(): Promise<{
    total: number;
    byExperienceLevel: Record<string, number>;
    byPosition: Record<string, number>;
    recentlyAdded: number;
    withCV: number;
    withoutCV: number;
  }> {
    const response = await apiClient.get<{
      total: number;
      byExperienceLevel: Record<string, number>;
      byPosition: Record<string, number>;
      recentlyAdded: number;
      withCV: number;
      withoutCV: number;
    }>(`${API_ENDPOINTS.CANDIDATES.BASE}/stats`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to get candidate statistics');
  }
}

// Create and export singleton instance
export const candidateService = new CandidateService();
