// Candidate Form Validation Schema
// Yup validation schemas for candidate forms

import * as yup from 'yup';
import { ExperienceLevel } from '../types/candidate.types';

// File validation constants
export const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx']
} as const;

// Phone number validation regex (international format)
const PHONE_REGEX = /^(\+\d{1,3}[- ]?)?\d{10,15}$/;

// Email validation (more permissive than default)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;

// Skills validation (letters, numbers, spaces, common punctuation)
const SKILLS_REGEX = /^[a-zA-Z0-9\s\-,.+#/\\()[\]&@$%^*!]+$/;

// Position validation (letters, numbers, spaces, common punctuation)
const POSITION_REGEX = /^[a-zA-Z0-9\s\-/().,&]+$/;

// File validation helper
const validateFile = (file: File | undefined) => {
  if (!file) return true; // File is optional
  
  // Check file size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return false;
  }
  
  // Check file type
  if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type as any)) {
    return false;
  }
  
  // Check file extension as fallback
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_VALIDATION.ALLOWED_EXTENSIONS.some(ext => 
    fileName.endsWith(ext)
  );
  
  return hasValidExtension;
};

// Base candidate schema (for both create and update)
export const baseCandidateSchema = {
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(NAME_REGEX, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),

  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(NAME_REGEX, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),

  email: yup
    .string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters')
    .lowercase()
    .trim(),

  phone: yup
    .string()
    .nullable()
    .notRequired()
    .test('phone-validation', 'Please enter a valid phone number', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      return PHONE_REGEX.test(value.trim()) && value.trim().length >= 10 && value.trim().length <= 15;
    }),

  address: yup
    .string()
    .nullable()
    .notRequired()
    .test('address-validation', 'Address must be between 10 and 500 characters', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      return value.trim().length >= 10 && value.trim().length <= 500;
    }),

  position: yup
    .string()
    .required('Position is required')
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must not exceed 100 characters')
    .matches(POSITION_REGEX, 'Position contains invalid characters')
    .trim(),

  experienceLevel: yup
    .string()
    .required('Experience level is required')
    .oneOf(
      Object.values(ExperienceLevel),
      'Please select a valid experience level'
    ),

  skills: yup
    .string()
    .nullable()
    .notRequired()
    .test('skills-validation', 'Skills must be between 5 and 1000 characters and contain valid characters', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      const trimmed = value.trim();
      return trimmed.length >= 5 && trimmed.length <= 1000 && SKILLS_REGEX.test(trimmed);
    }),

  education: yup
    .string()
    .nullable()
    .notRequired()
    .test('education-validation', 'Education must be between 10 and 1000 characters', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      return value.trim().length >= 10 && value.trim().length <= 1000;
    }),

  workExperience: yup
    .string()
    .nullable()
    .notRequired()
    .test('workExperience-validation', 'Work experience must be between 10 and 2000 characters', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      return value.trim().length >= 10 && value.trim().length <= 2000;
    }),

  notes: yup
    .string()
    .nullable()
    .notRequired()
    .test('notes-validation', 'Notes must not exceed 1000 characters', function(value) {
      if (!value || !value.trim()) return true; // Optional field
      return value.trim().length <= 1000;
    })
};

// Create candidate validation schema
export const createCandidateSchema = yup.object().shape({
  ...baseCandidateSchema,
  
  cvFile: yup
    .mixed<File>()
    .nullable()
    .notRequired()
    .test('fileSize', 'File size must be less than 5MB', (file) => {
      if (!file) return true;
      return file.size <= FILE_VALIDATION.MAX_SIZE;
    })
    .test('fileType', 'Only PDF, DOC, and DOCX files are allowed', (file) => {
      if (!file) return true;
      return validateFile(file);
    })
});

// Update candidate validation schema (all fields optional except id)
export const updateCandidateSchema = yup.object().shape({
  id: yup.number().required('Candidate ID is required'),
  
  firstName: baseCandidateSchema.firstName.notRequired(),
  lastName: baseCandidateSchema.lastName.notRequired(),
  email: baseCandidateSchema.email.notRequired(),
  phone: baseCandidateSchema.phone,
  address: baseCandidateSchema.address,
  position: baseCandidateSchema.position.notRequired(),
  experienceLevel: baseCandidateSchema.experienceLevel.notRequired(),
  skills: baseCandidateSchema.skills,
  education: baseCandidateSchema.education,
  workExperience: baseCandidateSchema.workExperience,
  notes: baseCandidateSchema.notes,
  
  cvFile: yup
    .mixed<File>()
    .nullable()
    .notRequired()
    .test('fileSize', 'File size must be less than 5MB', (file) => {
      if (!file) return true;
      return file.size <= FILE_VALIDATION.MAX_SIZE;
    })
    .test('fileType', 'Only PDF, DOC, and DOCX files are allowed', (file) => {
      if (!file) return true;
      return validateFile(file);
    })
});

// Search form validation schema
export const candidateSearchSchema = yup.object().shape({
  search: yup
    .string()
    .nullable()
    .notRequired()
    .max(100, 'Search term must not exceed 100 characters'),
    
  position: yup
    .string()
    .nullable()
    .notRequired()
    .max(100, 'Position must not exceed 100 characters'),
    
  experienceLevel: yup
    .string()
    .nullable()
    .notRequired()
    .oneOf(
      ['', ...Object.values(ExperienceLevel)],
      'Please select a valid experience level'
    ),
    
  skills: yup
    .string()
    .nullable()
    .notRequired()
    .max(100, 'Skills must not exceed 100 characters'),
    
  sortBy: yup
    .string()
    .required('Sort field is required')
    .oneOf(
      ['firstName', 'lastName', 'email', 'position', 'experienceLevel', 'createdAt', 'updatedAt'],
      'Invalid sort field'
    ),
    
  sortOrder: yup
    .string()
    .required('Sort order is required')
    .oneOf(['asc', 'desc'], 'Sort order must be ascending or descending')
});

// Form default values
export const defaultCandidateFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  position: '',
  experienceLevel: '' as ExperienceLevel | '',
  skills: '',
  education: '',
  workExperience: '',
  notes: '',
  cvFile: undefined
};

export const defaultSearchFormValues = {
  search: '',
  position: '',
  experienceLevel: '' as ExperienceLevel | '',
  skills: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as 'asc' | 'desc'
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_DUPLICATE: 'This email is already registered',
  PHONE_INVALID: 'Please enter a valid phone number',
  FILE_TOO_LARGE: 'File size must be less than 5MB',
  FILE_INVALID_TYPE: 'Only PDF, DOC, and DOCX files are allowed',
  NAME_INVALID: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  SKILLS_INVALID: 'Skills can only contain letters, numbers, spaces, and common punctuation',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`
} as const;

// Field validation helpers
export const validateEmail = async (email: string, candidateId?: number): Promise<boolean> => {
  // This would typically make an API call to check email uniqueness
  // For now, return true (valid)
  return true;
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return true; // Optional field
  return PHONE_REGEX.test(phone.trim());
};

export const validateFileSize = (file: File): boolean => {
  return file.size <= FILE_VALIDATION.MAX_SIZE;
};

export const validateFileType = (file: File): boolean => {
  return validateFile(file);
};

// Real-time validation utilities
export const validateFieldInRealTime = (
  fieldName: keyof typeof baseCandidateSchema,
  value: any
): { isValid: boolean; error?: string; suggestion?: string } => {
  try {
    const schema = baseCandidateSchema[fieldName];
    schema.validateSync(value);
    return { isValid: true };
  } catch (error: any) {
    let suggestion: string | undefined;
    
    // Provide helpful suggestions
    switch (fieldName) {
      case 'email':
        if (!value?.includes('@')) {
          suggestion = 'Email must contain @ symbol';
        } else if (!value?.includes('.')) {
          suggestion = 'Email must contain a domain (e.g., .com)';
        }
        break;
      case 'phone':
        if (value && !/\d/.test(value)) {
          suggestion = 'Phone number must contain digits';
        } else if (value && value.length < 10) {
          suggestion = 'Phone number should be at least 10 digits';
        }
        break;
      case 'firstName':
      case 'lastName':
        if (value && !/^[a-zA-Z]/.test(value)) {
          suggestion = 'Name should start with a letter';
        }
        break;
      case 'position':
        if (value && value.length < 2) {
          suggestion = 'Position should be more descriptive';
        }
        break;
    }
    
    return {
      isValid: false,
      error: error.message,
      suggestion
    };
  }
};

// Form field validation states with enhanced feedback
export const getFieldValidationState = (
  fieldName: string,
  value: any,
  errors: Record<string, any>,
  touched: Record<string, any>
) => {
  const hasError = touched[fieldName] && errors[fieldName];
  const hasValue = value && value.toString().trim() !== '';
  const isTouched = touched[fieldName];
  
  // Real-time validation for immediate feedback
  let realTimeValidation: { isValid: boolean; error?: string; suggestion?: string } | null = null;
  if (hasValue && isTouched && fieldName in baseCandidateSchema) {
    realTimeValidation = validateFieldInRealTime(fieldName as keyof typeof baseCandidateSchema, value);
  }
  
  // Determine validation state
  const hasRealTimeError = realTimeValidation && !realTimeValidation.isValid;
  const isSuccess = isTouched && !hasError && !hasRealTimeError && hasValue;
  
  return {
    error: !!hasError || !!hasRealTimeError,
    success: isSuccess,
    helperText: hasError 
      ? errors[fieldName]?.message || errors[fieldName] 
      : hasRealTimeError 
        ? realTimeValidation?.error 
        : undefined,
    suggestion: realTimeValidation?.suggestion,
    showSuccess: isSuccess
  };
};

// Field strength indicators
export const getFieldStrength = (
  fieldName: keyof typeof baseCandidateSchema,
  value: any
): 'weak' | 'medium' | 'strong' => {
  if (!value || !value.toString().trim()) return 'weak';
  
  const val = value.toString().trim();
  
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      if (val.length >= 3 && NAME_REGEX.test(val)) return 'strong';
      if (val.length >= 2) return 'medium';
      return 'weak';
      
    case 'email':
      if (EMAIL_REGEX.test(val) && val.includes('.') && val.length > 8) return 'strong';
      if (val.includes('@') && val.includes('.')) return 'medium';
      return 'weak';
      
    case 'phone':
      if (PHONE_REGEX.test(val) && val.length >= 12) return 'strong';
      if (/\d{10,}/.test(val)) return 'medium';
      return 'weak';
      
    case 'position':
      if (val.length >= 3 && POSITION_REGEX.test(val)) return 'strong';
      if (val.length >= 2) return 'medium';
      return 'weak';
      
    case 'skills':
      if (val.length >= 20 && SKILLS_REGEX.test(val)) return 'strong';
      if (val.length >= 10) return 'medium';
      return 'weak';
      
    default:
      if (val.length >= 10) return 'strong';
      if (val.length >= 5) return 'medium';
      return 'weak';
  }
};

// Character count helper with validation
export const getCharacterCountInfo = (
  value: string,
  maxLength: number,
  minLength?: number
) => {
  const length = value?.length || 0;
  const remaining = maxLength - length;
  const isOverLimit = length > maxLength;
  const isUnderMin = minLength && length > 0 && length < minLength;
  
  return {
    current: length,
    max: maxLength,
    min: minLength,
    remaining,
    isOverLimit,
    isUnderMin,
    percentage: (length / maxLength) * 100,
    status: isOverLimit ? 'error' : isUnderMin ? 'warning' : length > maxLength * 0.8 ? 'warning' : 'normal'
  };
};

export type CandidateFormValidation = yup.InferType<typeof createCandidateSchema>;
export type CandidateUpdateValidation = yup.InferType<typeof updateCandidateSchema>;
export type CandidateSearchValidation = yup.InferType<typeof candidateSearchSchema>;
