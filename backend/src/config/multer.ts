import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import crypto from 'crypto';

// File upload configuration constants
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ] as string[],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'] as string[],
  UPLOAD_PATH: path.join(process.cwd(), 'uploads', 'cvs')
} as const;

// Configure multer for memory storage (we'll handle file saving in FileService)
const storage = multer.memoryStorage();

// Enhanced file filter for CV uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Check MIME type
    if (!FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Only ${FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')} files are allowed`));
    }

    // Check file extension as additional security
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return cb(new Error(`Invalid file extension. Only ${FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')} files are allowed`));
    }

    // Additional security: Check if file has a name
    if (!file.originalname || file.originalname.trim() === '') {
      return cb(new Error('File must have a valid name'));
    }

    // All checks passed
    cb(null, true);
  } catch (error) {
    cb(new Error('File validation failed'));
  }
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string, candidateId?: number): string => {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  
  if (candidateId) {
    return `candidate_${candidateId}_${baseName}_${timestamp}_${randomId}${extension}`;
  }
  
  return `cv_${baseName}_${timestamp}_${randomId}${extension}`;
};

// Base multer configuration
const baseConfig: multer.Options = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: 1,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024, // 1MB for text fields
    parts: 10 // Maximum number of non-file fields
  }
};

// Multer configurations for different use cases
export const uploadConfig = multer(baseConfig);

// Specific upload configurations
export const uploadCV = uploadConfig.single('cv');
export const uploadCVWithFields = uploadConfig.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'candidateData', maxCount: 1 }
]);

// For bulk operations (if needed in future)
export const uploadMultipleCVs = uploadConfig.array('cvs', 5);

// Error handler for multer errors
export const handleMulterError = (error: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          status: 400,
          message: `File too large. Maximum size is ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
      case 'LIMIT_FILE_COUNT':
        return {
          status: 400,
          message: 'Too many files. Only 1 file is allowed'
        };
      case 'LIMIT_UNEXPECTED_FILE':
        return {
          status: 400,
          message: 'Unexpected file field'
        };
      default:
        return {
          status: 400,
          message: `Upload error: ${error.message}`
        };
    }
  }
  
  // Custom file filter errors
  if (error.message) {
    return {
      status: 400,
      message: error.message
    };
  }
  
  return {
    status: 500,
    message: 'Unknown upload error'
  };
};
