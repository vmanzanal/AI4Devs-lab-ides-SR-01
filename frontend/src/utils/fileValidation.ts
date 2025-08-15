// File Validation Utilities
// Enhanced file validation for frontend uploads

import { FILE_VALIDATION } from '../validation/candidateValidation';

// File validation result interface
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
    isSupported: boolean;
    securityRisk: 'low' | 'medium' | 'high';
  };
}

// File size validation options
export interface FileSizeOptions {
  maxSize?: number;
  minSize?: number;
  recommendedMaxSize?: number;
}

// File type validation options
export interface FileTypeOptions {
  allowedTypes?: string[];
  allowedExtensions?: string[];
  strictTypeChecking?: boolean;
}

// Security validation options
export interface SecurityOptions {
  checkMagicNumbers?: boolean;
  preventDoubleExtensions?: boolean;
  checkSuspiciousNames?: boolean;
  maxFileNameLength?: number;
}

// Comprehensive file validation options
export interface FileValidationOptions extends FileSizeOptions, FileTypeOptions, SecurityOptions {
  customValidators?: ((file: File) => Promise<string | null>)[];
}

// Magic number signatures for file types
const MAGIC_NUMBERS = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  doc: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // MS Office
  docx: [0x50, 0x4B, 0x03, 0x04], // ZIP-based (DOCX)
  zip: [0x50, 0x4B, 0x03, 0x04], // ZIP
} as const;

// Suspicious file patterns
const SUSPICIOUS_PATTERNS = [
  /\.(exe|bat|cmd|scr|vbs|js|jar|com|pif)$/i,
  /\.(php|asp|jsp|py|rb|pl)$/i,
  /\..*\.(exe|bat|cmd|scr)$/i, // Double extension
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
];

// Format file size helper
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().split('.').pop() || '';
};

// Check if file has suspicious patterns
export const hasSuspiciousPattern = (fileName: string): boolean => {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(fileName));
};

// Validate file name
export const validateFileName = (fileName: string, maxLength: number = 255): string[] => {
  const errors: string[] = [];
  
  if (!fileName || fileName.trim() === '') {
    errors.push('File name cannot be empty');
  }
  
  if (fileName.length > maxLength) {
    errors.push(`File name too long (max: ${maxLength} characters)`);
  }
  
  if (hasSuspiciousPattern(fileName)) {
    errors.push('File name contains suspicious patterns');
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    errors.push('File name contains invalid characters');
  }
  
  return errors;
};

// Validate file size
export const validateFileSize = (file: File, options: FileSizeOptions = {}): string[] => {
  const {
    maxSize = FILE_VALIDATION.MAX_SIZE,
    minSize = 1024, // 1KB minimum
    recommendedMaxSize = FILE_VALIDATION.MAX_SIZE * 0.8 // 80% of max as recommendation
  } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (file.size === 0) {
    errors.push('File cannot be empty');
  } else if (file.size < minSize) {
    errors.push(`File too small (minimum: ${formatFileSize(minSize)})`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File too large (maximum: ${formatFileSize(maxSize)})`);
  } else if (file.size > recommendedMaxSize) {
    warnings.push(`Large file size (${formatFileSize(file.size)}). Consider compressing for faster upload.`);
  }
  
  return [...errors, ...warnings];
};

// Validate file type
export const validateFileType = (file: File, options: FileTypeOptions = {}): string[] => {
  const {
    allowedTypes = FILE_VALIDATION.ALLOWED_TYPES,
    allowedExtensions = FILE_VALIDATION.ALLOWED_EXTENSIONS,
    strictTypeChecking = true
  } = options;
  
  const errors: string[] = [];
  const extension = getFileExtension(file.name);
  
  // Check MIME type
  if (strictTypeChecking && !allowedTypes.includes(file.type as any)) {
    errors.push(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file extension
  if (!allowedExtensions.some(ext => ext.toLowerCase() === `.${extension}`)) {
    errors.push(`Invalid file extension: .${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }
  
  // Check for type/extension mismatch
  if (strictTypeChecking) {
    const expectedMimeTypes: Record<string, string[]> = {
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    
    const expectedTypes = expectedMimeTypes[extension];
    if (expectedTypes && !expectedTypes.includes(file.type)) {
      errors.push(`File type mismatch: .${extension} files should have MIME type ${expectedTypes.join(' or ')}, but got ${file.type}`);
    }
  }
  
  return errors;
};

// Check magic numbers (file header validation)
export const validateMagicNumbers = async (file: File): Promise<string[]> => {
  const errors: string[] = [];
  
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const extension = getFileExtension(file.name);
    
    const expectedMagic = MAGIC_NUMBERS[extension as keyof typeof MAGIC_NUMBERS];
    if (expectedMagic) {
      const fileHeader = Array.from(bytes.slice(0, expectedMagic.length));
      const isValid = Array.from(expectedMagic).every((byte, index) => fileHeader[index] === byte);
      
      if (!isValid) {
        errors.push(`File header doesn't match expected format for .${extension} files`);
      }
    }
  } catch (error) {
    errors.push('Unable to read file header for validation');
  }
  
  return errors;
};

// Security validation
export const validateSecurity = (file: File, options: SecurityOptions = {}): string[] => {
  const {
    preventDoubleExtensions = true,
    checkSuspiciousNames = true,
    maxFileNameLength = 255
  } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check file name
  const nameErrors = validateFileName(file.name, maxFileNameLength);
  errors.push(...nameErrors);
  
  // Check for double extensions
  if (preventDoubleExtensions) {
    const parts = file.name.toLowerCase().split('.');
    if (parts.length > 2) {
      const suspiciousExtensions = ['exe', 'bat', 'cmd', 'scr', 'vbs', 'js'];
      const hasDoubleExtension = parts.some(part => suspiciousExtensions.includes(part));
      if (hasDoubleExtension) {
        errors.push('File has suspicious double extension');
      }
    }
  }
  
  // Check for suspicious names
  if (checkSuspiciousNames && hasSuspiciousPattern(file.name)) {
    errors.push('File name matches suspicious pattern');
  }
  
  return [...errors, ...warnings];
};

// Comprehensive file validation
export const validateFile = async (
  file: File, 
  options: FileValidationOptions = {}
): Promise<FileValidationResult> => {
  const {
    customValidators = [],
    checkMagicNumbers = true,
    ...validationOptions
  } = options;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validations
  const sizeErrors = validateFileSize(file, validationOptions);
  const typeErrors = validateFileType(file, validationOptions);
  const securityErrors = validateSecurity(file, validationOptions);
  
  errors.push(...sizeErrors.filter(err => !err.includes('Consider')));
  warnings.push(...sizeErrors.filter(err => err.includes('Consider')));
  errors.push(...typeErrors);
  errors.push(...securityErrors);
  
  // Magic number validation (async)
  if (checkMagicNumbers) {
    const magicErrors = await validateMagicNumbers(file);
    errors.push(...magicErrors);
  }
  
  // Custom validators
  for (const validator of customValidators) {
    try {
      const result = await validator(file);
      if (result) {
        errors.push(result);
      }
    } catch (error) {
      errors.push(`Custom validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Determine security risk level
  const extension = getFileExtension(file.name);
  let securityRisk: 'low' | 'medium' | 'high' = 'low';
  
  if (hasSuspiciousPattern(file.name) || errors.some(err => err.includes('suspicious'))) {
    securityRisk = 'high';
  } else if (file.size > FILE_VALIDATION.MAX_SIZE * 0.9 || warnings.length > 0) {
    securityRisk = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension,
      isSupported: FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(`.${extension}` as any),
      securityRisk
    }
  };
};

// Quick validation for basic use cases
export const quickValidateFile = (file: File): { isValid: boolean; error?: string } => {
  // File size check
  if (file.size === 0) {
    return { isValid: false, error: 'File cannot be empty' };
  }
  
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    return { 
      isValid: false, 
      error: `File too large (${formatFileSize(file.size)}). Maximum allowed: ${formatFileSize(FILE_VALIDATION.MAX_SIZE)}` 
    };
  }
  
  // File type check
  const extension = getFileExtension(file.name);
  if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(`.${extension}` as any)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }
  
  // MIME type check
  if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type as any)) {
    return { 
      isValid: false, 
      error: `Invalid MIME type: ${file.type}` 
    };
  }
  
  // Security check
  if (hasSuspiciousPattern(file.name)) {
    return { 
      isValid: false, 
      error: 'File name contains suspicious patterns' 
    };
  }
  
  return { isValid: true };
};

// Export validation constants for reuse
export { FILE_VALIDATION } from '../validation/candidateValidation';

export default {
  validateFile,
  quickValidateFile,
  validateFileSize,
  validateFileType,
  validateSecurity,
  validateMagicNumbers,
  formatFileSize,
  getFileExtension,
  hasSuspiciousPattern
};
