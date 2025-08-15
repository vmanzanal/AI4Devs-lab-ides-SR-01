import { IValidationService } from '../interfaces/IFileService';
import { ICreateCandidateDto, ExperienceLevel } from '../interfaces/ICandidate';

export class ValidationService implements IValidationService {
  async validateCandidateData(data: ICreateCandidateDto): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!data.email || data.email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (!data.phone || data.phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!this.validatePhone(data.phone)) {
      errors.push('Invalid phone number format');
    }

    if (!data.experienceLevel) {
      errors.push('Experience level is required');
    } else if (!Object.values(ExperienceLevel).includes(data.experienceLevel)) {
      errors.push('Invalid experience level');
    }

    // Validate string lengths
    if (data.firstName && data.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }

    if (data.lastName && data.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }

    if (data.email && data.email.length > 100) {
      errors.push('Email must be less than 100 characters');
    }

    if (data.phone && data.phone.length > 20) {
      errors.push('Phone number must be less than 20 characters');
    }

    if (data.address && data.address.length > 500) {
      errors.push('Address must be less than 500 characters');
    }

    if (data.education && data.education.length > 1000) {
      errors.push('Education must be less than 1000 characters');
    }

    if (data.workExperience && data.workExperience.length > 2000) {
      errors.push('Work experience must be less than 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validatePhone(phone: string): boolean {
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone.trim());
  }

  sanitizeInput(input: string): string {
    return input.trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .substring(0, 1000); // Limit length
  }
}
