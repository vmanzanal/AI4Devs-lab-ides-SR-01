import { Request, Response, NextFunction } from 'express';
import { handleMulterError, FILE_UPLOAD_CONFIG } from '../config/multer';
import { IFileService } from '../interfaces/IFileService';
import { IApiResponse } from '../interfaces/IFileService';

// Extended file validation interface
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  securityRisk: 'low' | 'medium' | 'high';
  fileInfo: {
    originalName: string;
    size: number;
    mimeType: string;
    extension: string;
  };
}

// File upload security middleware
export class FileUploadMiddleware {
  constructor(private fileService: IFileService) {}

  // Comprehensive file validation middleware
  validateUploadedFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'FILE_MISSING'
        } as IApiResponse);
        return;
      }

      // Convert multer file to our interface format
      const uploadedFile = {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };

      // Perform comprehensive validation using FileService
      const validationResult = await this.fileService.validateFile(uploadedFile);
      
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: validationResult.error || 'File validation failed',
          code: 'FILE_VALIDATION_FAILED',
          details: {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
          }
        } as IApiResponse);
        return;
      }

      // Add validation result to request for use in controller
      (req as any).fileValidation = validationResult;
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File validation error',
        code: 'FILE_VALIDATION_ERROR',
        details: error.message
      } as IApiResponse);
    }
  };

  // Security headers middleware
  setSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Prevent file execution
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
    
    // Prevent caching of uploaded files
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
  };

  // Rate limiting for file uploads
  rateLimitFileUpload = (maxUploadsPerHour: number = 10) => {
    const uploadCounts = new Map<string, { count: number; resetTime: number }>();
    
    return (req: Request, res: Response, next: NextFunction): void => {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as IApiResponse);
        return;
      }

      const now = Date.now();
      const userKey = `upload_${userId}`;
      const resetTime = now + (60 * 60 * 1000); // 1 hour from now
      
      const userRecord = uploadCounts.get(userKey);
      
      if (!userRecord || now > userRecord.resetTime) {
        // Reset or create new record
        uploadCounts.set(userKey, { count: 1, resetTime });
        next();
        return;
      }
      
      if (userRecord.count >= maxUploadsPerHour) {
        res.status(429).json({
          success: false,
          error: `Upload limit exceeded. Maximum ${maxUploadsPerHour} uploads per hour`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
        } as IApiResponse);
        return;
      }
      
      // Increment count
      userRecord.count++;
      uploadCounts.set(userKey, userRecord);
      next();
    };
  };

  // File size validation middleware
  validateFileSize = (maxSize?: number) => {
    const sizeLimit = maxSize || FILE_UPLOAD_CONFIG.MAX_FILE_SIZE;
    
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.file) {
        next();
        return;
      }

      if (req.file.size > sizeLimit) {
        res.status(400).json({
          success: false,
          error: `File too large. Maximum size is ${Math.round(sizeLimit / (1024 * 1024))}MB`,
          code: 'FILE_TOO_LARGE',
          details: {
            fileSize: req.file.size,
            maxSize: sizeLimit,
            fileName: req.file.originalname
          }
        } as IApiResponse);
        return;
      }

      next();
    };
  };

  // MIME type validation middleware
  validateMimeType = (allowedTypes?: string[]) => {
    const allowedMimeTypes = allowedTypes || FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES;
    
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.file) {
        next();
        return;
      }

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
          details: {
            receivedType: req.file.mimetype,
            allowedTypes: allowedMimeTypes,
            fileName: req.file.originalname
          }
        } as IApiResponse);
        return;
      }

      next();
    };
  };

  // Candidate ownership validation
  validateCandidateOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Admin users can upload to any candidate
      if (userRole === 'ADMIN') {
        next();
        return;
      }

      // For non-admin users, validate candidate exists and check ownership if needed
      // This would require the candidate service to check ownership
      // For now, we'll allow all authenticated users to upload (can be enhanced later)
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Ownership validation failed',
        code: 'OWNERSHIP_VALIDATION_ERROR',
        details: error.message
      } as IApiResponse);
    }
  };

  // Virus/malware scanning placeholder
  scanForMalware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        next();
        return;
      }

      // Placeholder for malware scanning
      // In production, integrate with ClamAV, VirusTotal API, or similar service
      
      // Basic suspicious pattern detection
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.scr$/i,
        /\.vbs$/i,
        /\.js$/i,
        /\.jar$/i
      ];

      const fileName = req.file.originalname.toLowerCase();
      const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(fileName));
      
      if (hasSuspiciousPattern) {
        res.status(400).json({
          success: false,
          error: 'File appears to be suspicious and cannot be uploaded',
          code: 'SUSPICIOUS_FILE_DETECTED',
          details: {
            fileName: req.file.originalname,
            reason: 'File extension matches suspicious pattern'
          }
        } as IApiResponse);
        return;
      }

      // Add scan result to request
      (req as any).malwareScan = { 
        scanned: true, 
        clean: true, 
        scanner: 'basic-pattern-detection' 
      };
      
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Malware scanning failed',
        code: 'MALWARE_SCAN_ERROR',
        details: error.message
      } as IApiResponse);
    }
  };

  // Handle multer errors
  handleUploadErrors = (error: any, req: Request, res: Response, next: NextFunction): void => {
    if (error) {
      const errorInfo = handleMulterError(error);
      res.status(errorInfo.status).json({
        success: false,
        error: errorInfo.message,
        code: 'UPLOAD_ERROR'
      } as IApiResponse);
      return;
    }
    next();
  };

  // Comprehensive upload middleware chain
  createSecureUploadChain = (options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxUploadsPerHour?: number;
    enableMalwareScanning?: boolean;
    validateOwnership?: boolean;
  } = {}) => {
    const middlewares = [
      this.setSecurityHeaders,
      this.rateLimitFileUpload(options.maxUploadsPerHour),
      this.validateFileSize(options.maxSize),
      this.validateMimeType(options.allowedTypes),
    ];

    if (options.validateOwnership) {
      middlewares.push(this.validateCandidateOwnership);
    }

    if (options.enableMalwareScanning) {
      middlewares.push(this.scanForMalware);
    }

    middlewares.push(this.validateUploadedFile);

    return middlewares;
  };
}

// Factory function to create middleware instance
export const createFileUploadMiddleware = (fileService: IFileService): FileUploadMiddleware => {
  return new FileUploadMiddleware(fileService);
};

export default FileUploadMiddleware;
