// Candidate Management Types
// Frontend types matching backend interfaces

export enum ExperienceLevel {
  ENTRY_LEVEL = 'ENTRY_LEVEL',
  MID_LEVEL = 'MID_LEVEL',
  SENIOR_LEVEL = 'SENIOR_LEVEL',
  EXECUTIVE = 'EXECUTIVE'
}

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  position: string;
  experienceLevel: ExperienceLevel;
  skills: string | null;
  education: string | null;
  workExperience: string | null;
  cvFileName: string | null;
  cvFilePath: string | null;
  notes: string | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  position: string;
  experienceLevel: ExperienceLevel;
  skills?: string | null;
  education?: string | null;
  workExperience?: string | null;
  notes?: string | null;
}

export interface UpdateCandidateDto {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  position?: string;
  experienceLevel?: ExperienceLevel;
  skills?: string | null;
  education?: string | null;
  workExperience?: string | null;
  notes?: string | null;
}

export interface CandidateFilterDto {
  search?: string;
  position?: string;
  experienceLevel?: ExperienceLevel;
  skills?: string;
  createdById?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCandidateResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Form Types
export interface CandidateFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  experienceLevel: ExperienceLevel | '';
  skills: string;
  education: string;
  workExperience: string;
  notes: string;
  cvFile?: File;
}

export interface CandidateSearchFormData {
  search: string;
  position: string;
  experienceLevel: ExperienceLevel | '';
  skills: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Display Types
export interface CandidateListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  position: string;
  experienceLevel: ExperienceLevel;
  hasCV: boolean;
  createdAt: Date;
}

export interface CandidateDetails extends Candidate {
  createdBy?: {
    id: number;
    name: string | null;
    email: string;
  };
}

// CV File Types
export interface CVUploadResponse {
  message: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

export interface CVDownloadInfo {
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  uploadedAt: Date;
}

// Statistics Types
export interface CandidateStats {
  total: number;
  byExperienceLevel: {
    [key in ExperienceLevel]: number;
  };
  byPosition: {
    [position: string]: number;
  };
  recentlyAdded: number;
  withCV: number;
  withoutCV: number;
}

// Validation Types
export interface CandidateValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  experienceLevel?: string;
  skills?: string;
  education?: string;
  workExperience?: string;
  cvFile?: string;
}

// Experience Level Display
export const ExperienceLevelLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.ENTRY_LEVEL]: 'Entry Level (0-2 years)',
  [ExperienceLevel.MID_LEVEL]: 'Mid Level (3-5 years)', 
  [ExperienceLevel.SENIOR_LEVEL]: 'Senior Level (6-10 years)',
  [ExperienceLevel.EXECUTIVE]: 'Executive (10+ years)'
};

// Sort Options
export const CandidateSortOptions = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'position', label: 'Position' },
  { value: 'experienceLevel', label: 'Experience Level' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'updatedAt', label: 'Last Modified' }
] as const;
