import { 
  ICandidate, 
  ICreateCandidateDto, 
  IUpdateCandidateDto, 
  ICandidateService,
  ICandidateRepository,
  ICandidateFilters,
  ICandidateListResponse
} from '../interfaces/ICandidate';
import { IValidationService } from '../interfaces/IFileService';

export class CandidateService implements ICandidateService {
  constructor(
    private candidateRepository: ICandidateRepository,
    private validationService: IValidationService
  ) {}

  async createCandidate(candidateData: ICreateCandidateDto, createdById: number): Promise<ICandidate> {
    // Validate candidate data
    const validation = await this.validationService.validateCandidateData(candidateData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for duplicate email
    const isDuplicate = await this.checkDuplicateEmail(candidateData.email);
    if (isDuplicate) {
      throw new Error('Candidate with this email already exists');
    }

    // Sanitize input data
    const sanitizedData: ICreateCandidateDto = {
      firstName: this.validationService.sanitizeInput(candidateData.firstName),
      lastName: this.validationService.sanitizeInput(candidateData.lastName),
      email: candidateData.email.trim().toLowerCase(),
      phone: this.validationService.sanitizeInput(candidateData.phone),
      experienceLevel: candidateData.experienceLevel,
      address: candidateData.address ? this.validationService.sanitizeInput(candidateData.address) : undefined,
      education: candidateData.education ? this.validationService.sanitizeInput(candidateData.education) : undefined,
      workExperience: candidateData.workExperience ? this.validationService.sanitizeInput(candidateData.workExperience) : undefined
    };

    // Create candidate
    return await this.candidateRepository.create({
      ...sanitizedData,
      createdById
    });
  }

  async getCandidateById(id: number): Promise<ICandidate> {
    if (!id || id <= 0) {
      throw new Error('Invalid candidate ID');
    }

    const candidate = await this.candidateRepository.findById(id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return candidate;
  }

  async getCandidates(filters?: ICandidateFilters): Promise<ICandidateListResponse> {
    // Validate pagination parameters
    if (filters?.page && filters.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (filters?.limit && (filters.limit < 1 || filters.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }

    return await this.candidateRepository.findAll(filters);
  }

  async updateCandidate(id: number, candidateData: IUpdateCandidateDto): Promise<ICandidate> {
    if (!id || id <= 0) {
      throw new Error('Invalid candidate ID');
    }

    // Check if candidate exists
    const existingCandidate = await this.candidateRepository.findById(id);
    if (!existingCandidate) {
      throw new Error('Candidate not found');
    }

    // Validate updated data (only for provided fields)
    if (candidateData.email) {
      if (!this.validationService.validateEmail(candidateData.email)) {
        throw new Error('Invalid email format');
      }

      // Check for duplicate email (excluding current candidate)
      const isDuplicate = await this.checkDuplicateEmail(candidateData.email, id);
      if (isDuplicate) {
        throw new Error('Another candidate with this email already exists');
      }
    }

    if (candidateData.phone && !this.validationService.validatePhone(candidateData.phone)) {
      throw new Error('Invalid phone number format');
    }

    // Sanitize input data
    const sanitizedData: IUpdateCandidateDto = {};
    
    if (candidateData.firstName) {
      sanitizedData.firstName = this.validationService.sanitizeInput(candidateData.firstName);
    }
    
    if (candidateData.lastName) {
      sanitizedData.lastName = this.validationService.sanitizeInput(candidateData.lastName);
    }
    
    if (candidateData.email) {
      sanitizedData.email = candidateData.email.trim().toLowerCase();
    }
    
    if (candidateData.phone) {
      sanitizedData.phone = this.validationService.sanitizeInput(candidateData.phone);
    }
    
    if (candidateData.experienceLevel) {
      sanitizedData.experienceLevel = candidateData.experienceLevel;
    }
    
    if (candidateData.address !== undefined) {
      sanitizedData.address = candidateData.address ? this.validationService.sanitizeInput(candidateData.address) : undefined;
    }
    
    if (candidateData.education !== undefined) {
      sanitizedData.education = candidateData.education ? this.validationService.sanitizeInput(candidateData.education) : undefined;
    }
    
    if (candidateData.workExperience !== undefined) {
      sanitizedData.workExperience = candidateData.workExperience ? this.validationService.sanitizeInput(candidateData.workExperience) : undefined;
    }

    return await this.candidateRepository.update(id, sanitizedData);
  }

  async deleteCandidate(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Invalid candidate ID');
    }

    // Check if candidate exists
    const existingCandidate = await this.candidateRepository.findById(id);
    if (!existingCandidate) {
      throw new Error('Candidate not found');
    }

    await this.candidateRepository.delete(id);
  }

  async checkDuplicateEmail(email: string, excludeId?: number): Promise<boolean> {
    const existingCandidate = await this.candidateRepository.findByEmail(email.trim().toLowerCase());
    
    if (!existingCandidate) {
      return false;
    }

    // If we're updating and the existing candidate is the same one, it's not a duplicate
    if (excludeId && existingCandidate.id === excludeId) {
      return false;
    }

    return true;
  }
}
