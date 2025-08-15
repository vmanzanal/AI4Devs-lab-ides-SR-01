import { ExperienceLevel } from '@prisma/client';

export { ExperienceLevel };

export interface ICandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experienceLevel: ExperienceLevel;
  address: string | null;
  education: string | null;
  workExperience: string | null;
  cvFileName: string | null;
  cvFilePath: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  createdBy?: {
    id: number;
    email: string;
    name: string | null;
  };
}

export interface ICreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experienceLevel: ExperienceLevel;
  address?: string;
  education?: string;
  workExperience?: string;
}

export interface IUpdateCandidateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  experienceLevel?: ExperienceLevel;
  address?: string;
  education?: string;
  workExperience?: string;
}

export interface ICandidateFilters {
  experienceLevel?: ExperienceLevel;
  search?: string; // For searching in name, email, etc.
  createdById?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
}

export interface ICandidateListResponse {
  candidates: ICandidate[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ICandidateReader {
  findById(id: number): Promise<ICandidate | null>;
  findByEmail(email: string): Promise<ICandidate | null>;
  findAll(filters?: ICandidateFilters): Promise<ICandidateListResponse>;
}

export interface ICandidateWriter {
  create(data: ICreateCandidateDto & { createdById: number }): Promise<ICandidate>;
  update(id: number, data: IUpdateCandidateDto): Promise<ICandidate>;
  delete(id: number): Promise<void>;
  updateCVInfo(id: number, cvFileName: string, cvFilePath: string): Promise<ICandidate>;
}

export interface ICandidateRepository extends ICandidateReader, ICandidateWriter {}

export interface ICandidateService {
  createCandidate(candidateData: ICreateCandidateDto, createdById: number): Promise<ICandidate>;
  getCandidateById(id: number): Promise<ICandidate>;
  getCandidates(filters?: ICandidateFilters): Promise<ICandidateListResponse>;
  updateCandidate(id: number, candidateData: IUpdateCandidateDto): Promise<ICandidate>;
  deleteCandidate(id: number): Promise<void>;
  checkDuplicateEmail(email: string, excludeId?: number): Promise<boolean>;
}
