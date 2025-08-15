import { Request, Response, NextFunction } from 'express';
import { IFileService } from '../interfaces/IFileService';
import { IApiResponse } from '../interfaces/IFileService';
import path from 'path';
import fs from 'fs';

// File serving security middleware
export class FileServingMiddleware {
  constructor(private fileService: IFileService) {}

  // Security headers for file downloads
  setDownloadSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Prevent files from being executed in browser
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Control caching
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add download timestamp header
    res.setHeader('X-Download-Time', new Date().toISOString());
    
    next();
  };

  // Rate limiting for downloads
  rateLimitDownloads = (maxDownloadsPerHour: number = 50) => {
    const downloadCounts = new Map<string, { count: number; resetTime: number }>();
    
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
      const userKey = `download_${userId}`;
      const resetTime = now + (60 * 60 * 1000); // 1 hour from now
      
      const userRecord = downloadCounts.get(userKey);
      
      if (!userRecord || now > userRecord.resetTime) {
        // Reset or create new record
        downloadCounts.set(userKey, { count: 1, resetTime });
        next();
        return;
      }
      
      if (userRecord.count >= maxDownloadsPerHour) {
        res.status(429).json({
          success: false,
          error: `Download limit exceeded. Maximum ${maxDownloadsPerHour} downloads per hour`,
          code: 'DOWNLOAD_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
        } as IApiResponse);
        return;
      }
      
      // Increment count
      userRecord.count++;
      downloadCounts.set(userKey, userRecord);
      next();
    };
  };

  // Validate file existence and permissions
  validateFileAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      // Add candidate and user info to request for controller use
      (req as any).downloadRequest = {
        candidateId,
        userId,
        userRole,
        requestTime: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      };

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'File access validation failed',
        code: 'FILE_ACCESS_VALIDATION_ERROR',
        details: error.message
      } as IApiResponse);
    }
  };

  // Log download activity
  logDownloadActivity = (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    const originalSendFile = res.sendFile;
    
    // Override send to log successful downloads
    res.send = function(data: any) {
      const downloadRequest = (req as any).downloadRequest;
      if (downloadRequest && res.statusCode === 200) {
        console.log('File download:', {
          candidateId: downloadRequest.candidateId,
          userId: downloadRequest.userId,
          userRole: downloadRequest.userRole,
          timestamp: downloadRequest.requestTime,
          userAgent: downloadRequest.userAgent,
          ipAddress: downloadRequest.ipAddress,
          success: true
        });
      }
      return originalSend.call(this, data);
    };

    // Override sendFile to log file downloads
    res.sendFile = function(path: string, options?: any, callback?: any) {
      const downloadRequest = (req as any).downloadRequest;
      if (downloadRequest) {
        console.log('File download initiated:', {
          candidateId: downloadRequest.candidateId,
          userId: downloadRequest.userId,
          userRole: downloadRequest.userRole,
          filePath: path,
          timestamp: downloadRequest.requestTime,
          userAgent: downloadRequest.userAgent,
          ipAddress: downloadRequest.ipAddress
        });
      }
      return originalSendFile.call(this, path, options, callback);
    };

    next();
  };

  // Sanitize file path to prevent directory traversal
  sanitizeFilePath = (req: Request, res: Response, next: NextFunction): void => {
    const fileName = req.params.fileName;
    
    if (fileName) {
      // Check for directory traversal attempts
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        res.status(400).json({
          success: false,
          error: 'Invalid file name',
          code: 'INVALID_FILE_NAME'
        } as IApiResponse);
        return;
      }

      // Sanitize filename
      const sanitizedFileName = path.basename(fileName);
      if (sanitizedFileName !== fileName) {
        res.status(400).json({
          success: false,
          error: 'File name contains invalid characters',
          code: 'INVALID_FILE_NAME'
        } as IApiResponse);
        return;
      }
    }

    next();
  };

  // Check file size before serving
  validateFileSize = (maxDownloadSize: number = 10 * 1024 * 1024) => { // 10MB default
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const fileName = req.params.fileName;
        if (fileName) {
          const fileInfo = await this.fileService.getFileInfo(fileName);
          
          if (!fileInfo.exists) {
            res.status(404).json({
              success: false,
              error: 'File not found',
              code: 'FILE_NOT_FOUND'
            } as IApiResponse);
            return;
          }

          if (fileInfo.size && fileInfo.size > maxDownloadSize) {
            res.status(413).json({
              success: false,
              error: 'File too large for download',
              code: 'FILE_TOO_LARGE',
              details: {
                fileSize: fileInfo.size,
                maxSize: maxDownloadSize
              }
            } as IApiResponse);
            return;
          }
        }

        next();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'File size validation failed',
          code: 'FILE_SIZE_VALIDATION_ERROR',
          details: error.message
        } as IApiResponse);
      }
    };
  };

  // Handle download errors
  handleDownloadErrors = (error: any, req: Request, res: Response, next: NextFunction): void => {
    if (error) {
      const downloadRequest = (req as any).downloadRequest;
      
      // Log error
      console.error('Download error:', {
        candidateId: downloadRequest?.candidateId,
        userId: downloadRequest?.userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      let status = 500;
      let code = 'DOWNLOAD_ERROR';
      let message = 'Download failed';

      if (error.code === 'ENOENT') {
        status = 404;
        code = 'FILE_NOT_FOUND';
        message = 'File not found';
      } else if (error.code === 'EACCES') {
        status = 403;
        code = 'FILE_ACCESS_DENIED';
        message = 'Access denied';
      } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
        status = 503;
        code = 'SERVER_BUSY';
        message = 'Server temporarily unavailable';
      }

      res.status(status).json({
        success: false,
        error: message,
        code,
        timestamp: new Date().toISOString()
      } as IApiResponse);
      return;
    }
    next();
  };

  // Create secure download middleware chain
  createSecureDownloadChain = (options: {
    maxDownloadsPerHour?: number;
    maxDownloadSize?: number;
    enableLogging?: boolean;
  } = {}) => {
    const middlewares = [
      this.setDownloadSecurityHeaders,
      this.rateLimitDownloads(options.maxDownloadsPerHour),
      this.validateFileAccess,
    ];

    if (options.enableLogging !== false) {
      middlewares.push(this.logDownloadActivity);
    }

    if (options.maxDownloadSize) {
      middlewares.push(this.validateFileSize(options.maxDownloadSize));
    }

    return middlewares;
  };

  // Create secure static file serving middleware
  createSecureStaticServing = (options: {
    maxDownloadSize?: number;
    enableLogging?: boolean;
  } = {}) => {
    const middlewares = [
      this.setDownloadSecurityHeaders,
      this.sanitizeFilePath,
    ];

    if (options.enableLogging !== false) {
      middlewares.push(this.logDownloadActivity);
    }

    if (options.maxDownloadSize) {
      middlewares.push(this.validateFileSize(options.maxDownloadSize));
    }

    // Note: handleDownloadErrors should be added as error middleware at the app level

    return middlewares;
  };
}

// Factory function to create middleware instance
export const createFileServingMiddleware = (fileService: IFileService): FileServingMiddleware => {
  return new FileServingMiddleware(fileService);
};

export default FileServingMiddleware;
