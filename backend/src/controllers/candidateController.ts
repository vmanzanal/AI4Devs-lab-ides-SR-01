import { Request, Response } from 'express';
import { ICandidateService, ICandidate } from '../interfaces/ICandidate';
import { IFileService } from '../interfaces/IFileService';
import { IApiResponse, IPaginatedResponse } from '../interfaces/IFileService';

export class CandidateController {
  constructor(
    private candidateService: ICandidateService,
    private fileService: IFileService
  ) {}

  createCandidate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        } as IApiResponse);
        return;
      }

      const candidate = await this.candidateService.createCandidate(req.body, userId);
      
      res.status(201).json({
        success: true,
        data: candidate
      } as IApiResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  getCandidates = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        experienceLevel: req.query.experienceLevel as any,
        search: req.query.search as string,
        createdById: req.query.createdById ? parseInt(req.query.createdById as string) : undefined,
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await this.candidateService.getCandidates(filters);
      
      res.status(200).json({
        success: true,
        data: result.candidates,
        pagination: {
          page: result.page,
          limit: filters.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      } as IPaginatedResponse<ICandidate[]>);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  getCandidateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await this.candidateService.getCandidateById(id);
      
      res.status(200).json({
        success: true,
        data: candidate
      } as IApiResponse);
    } catch (error: any) {
      const status = error.message === 'Candidate not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  updateCandidate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await this.candidateService.updateCandidate(id, req.body);
      
      res.status(200).json({
        success: true,
        data: candidate
      } as IApiResponse);
    } catch (error: any) {
      const status = error.message === 'Candidate not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  deleteCandidate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      await this.candidateService.deleteCandidate(id);
      
      res.status(200).json({
        success: true,
        data: { message: 'Candidate deleted successfully' }
      } as IApiResponse);
    } catch (error: any) {
      const status = error.message === 'Candidate not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  uploadCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'FILE_MISSING'
        } as IApiResponse);
        return;
      }

      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Get validation result from middleware
      const validationResult = (req as any).fileValidation;
      const malwareScanResult = (req as any).malwareScan;
      
      // Upload file with security processing
      const fileResult = await this.fileService.uploadCV({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      }, candidateId);

      // Log the upload activity
      console.log(`CV uploaded for candidate ${candidateId} by user ${userId}:`, {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        validationPassed: validationResult?.isValid,
        malwareScanPassed: malwareScanResult?.clean,
        uploadTime: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        data: {
          candidate: {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email
          },
          file: {
            fileName: fileResult.fileName,
            originalName: fileResult.originalName,
            size: fileResult.size,
            uploadedAt: new Date().toISOString()
          },
          upload: {
            validationResult: validationResult ? {
              isValid: validationResult.isValid,
              warnings: validationResult.warnings
            } : undefined,
            securityScan: malwareScanResult ? {
              scanned: malwareScanResult.scanned,
              clean: malwareScanResult.clean
            } : undefined
          }
        },
        message: 'CV uploaded successfully'
      } as IApiResponse);
    } catch (error: any) {
      console.error('CV upload error:', error);
      
      let status = 500;
      let code = 'UPLOAD_FAILED';
      
      if (error.message === 'Candidate not found') {
        status = 404;
        code = 'CANDIDATE_NOT_FOUND';
      } else if (error.message.includes('validation')) {
        status = 400;
        code = 'FILE_VALIDATION_FAILED';
      } else if (error.message.includes('storage')) {
        status = 500;
        code = 'STORAGE_ERROR';
      }
      
      res.status(status).json({
        success: false,
        error: error.message,
        code,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Bulk CV upload endpoint
  uploadBulkCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const userId = (req as any).user?.id;
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files uploaded',
          code: 'FILES_MISSING'
        } as IApiResponse);
        return;
      }

      const uploadResults = [];
      const errors = [];

      for (const file of files) {
        try {
          // Extract candidate ID from filename or metadata
          const candidateIdMatch = file.originalname.match(/candidate[_-](\d+)/i);
          const candidateId = candidateIdMatch ? parseInt(candidateIdMatch[1]) : null;

          if (!candidateId) {
            errors.push({
              fileName: file.originalname,
              error: 'Could not extract candidate ID from filename'
            });
            continue;
          }

          // Check if candidate exists
          const candidate = await this.candidateService.getCandidateById(candidateId);
          if (!candidate) {
            errors.push({
              fileName: file.originalname,
              error: `Candidate ${candidateId} not found`
            });
            continue;
          }

          // Upload file
          const fileResult = await this.fileService.uploadCV({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer
          }, candidateId);

          uploadResults.push({
            candidateId,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            file: {
              fileName: fileResult.fileName,
              originalName: fileResult.originalName,
              size: fileResult.size
            }
          });

        } catch (error: any) {
          errors.push({
            fileName: file.originalname,
            error: error.message
          });
        }
      }

      // Log bulk upload activity
      console.log(`Bulk CV upload by user ${userId}:`, {
        totalFiles: files.length,
        successful: uploadResults.length,
        failed: errors.length,
        uploadTime: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        data: {
          uploaded: uploadResults,
          errors: errors,
          summary: {
            total: files.length,
            successful: uploadResults.length,
            failed: errors.length
          }
        },
        message: `Bulk upload completed. ${uploadResults.length} successful, ${errors.length} failed.`
      } as IApiResponse);

    } catch (error: any) {
      console.error('Bulk CV upload error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Bulk upload failed',
        code: 'BULK_UPLOAD_FAILED',
        details: error.message,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Replace CV endpoint
  replaceCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const userId = (req as any).user?.id;
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          code: 'FILE_MISSING'
        } as IApiResponse);
        return;
      }

      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Delete existing CV if it exists
      try {
        await this.fileService.deleteCandidateCV(candidateId);
      } catch (deleteError) {
        // Log but don't fail - the old CV might not exist
        console.log(`No existing CV to delete for candidate ${candidateId}`);
      }

      // Upload new CV
      const fileResult = await this.fileService.uploadCV({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      }, candidateId);

      // Log the replacement activity
      console.log(`CV replaced for candidate ${candidateId} by user ${userId}:`, {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        replaceTime: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        data: {
          candidate: {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email
          },
          file: {
            fileName: fileResult.fileName,
            originalName: fileResult.originalName,
            size: fileResult.size,
            uploadedAt: new Date().toISOString()
          }
        },
        message: 'CV replaced successfully'
      } as IApiResponse);

    } catch (error: any) {
      console.error('CV replacement error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'CV_REPLACEMENT_FAILED',
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Delete CV endpoint
  deleteCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const userId = (req as any).user?.id;

      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Delete CV (method throws error if CV not found)
      try {
        await this.fileService.deleteCandidateCV(candidateId);
      } catch (deleteError: any) {
        if (deleteError.message && deleteError.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'No CV found for this candidate',
            code: 'CV_NOT_FOUND'
          } as IApiResponse);
          return;
        }
        throw deleteError; // Re-throw other errors
      }

      // Log the deletion activity
      console.log(`CV deleted for candidate ${candidateId} by user ${userId}:`, {
        deleteTime: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        data: {
          candidateId,
          candidateName: `${candidate.firstName} ${candidate.lastName}`
        },
        message: 'CV deleted successfully'
      } as IApiResponse);

    } catch (error: any) {
      console.error('CV deletion error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'CV_DELETION_FAILED',
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  downloadCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const downloadRequest = (req as any).downloadRequest;
      
      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Find CV files for the candidate
      const fs = require('fs').promises;
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
      
      let cvFiles: string[] = [];
      try {
        const files = await fs.readdir(uploadDir);
        cvFiles = files.filter((file: string) => 
          file.startsWith(`candidate_${candidateId}_`)
        );
      } catch (error) {
        console.error('Error reading upload directory:', error);
      }

      if (cvFiles.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No CV found for this candidate',
          code: 'CV_NOT_FOUND',
          details: {
            candidateId,
            candidateName: `${candidate.firstName} ${candidate.lastName}`
          }
        } as IApiResponse);
        return;
      }

      // Get the most recent CV file (assuming timestamp in filename)
      const latestCVFile = cvFiles.sort().pop() as string;
      const filePath = path.join(uploadDir, latestCVFile);

      // Get file information
      const fileStats = await fs.stat(filePath);
      const fileExtension = path.extname(latestCVFile).toLowerCase();
      
      // Determine content type
      const contentType = this.getContentType(fileExtension);
      
      // Create safe filename for download
      const safeFileName = this.createSafeDownloadFilename(
        candidate.firstName,
        candidate.lastName,
        fileExtension
      );

      // Set security and download headers
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileStats.size.toString());
      res.setHeader('X-File-Name', latestCVFile);
      res.setHeader('X-Candidate-ID', candidateId.toString());
      res.setHeader('X-Download-ID', this.generateDownloadId());

      // Log successful download initiation
      console.log(`CV download initiated for candidate ${candidateId} by user ${downloadRequest?.userId}:`, {
        fileName: latestCVFile,
        fileSize: fileStats.size,
        downloadId: res.getHeader('X-Download-ID'),
        timestamp: new Date().toISOString(),
        userAgent: downloadRequest?.userAgent,
        ipAddress: downloadRequest?.ipAddress
      });

      // Send file
      res.sendFile(filePath, (error) => {
        if (error) {
          console.error('File send error:', error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Failed to send file',
              code: 'FILE_SEND_ERROR'
            } as IApiResponse);
          }
        } else {
          console.log(`CV download completed for candidate ${candidateId}:`, {
            fileName: latestCVFile,
            downloadId: res.getHeader('X-Download-ID'),
            timestamp: new Date().toISOString()
          });
        }
      });

    } catch (error: any) {
      console.error('CV download error:', error);
      
      let status = 500;
      let code = 'DOWNLOAD_FAILED';
      
      if (error.message === 'Candidate not found') {
        status = 404;
        code = 'CANDIDATE_NOT_FOUND';
      } else if (error.code === 'ENOENT') {
        status = 404;
        code = 'FILE_NOT_FOUND';
      } else if (error.code === 'EACCES') {
        status = 403;
        code = 'ACCESS_DENIED';
      }
      
      res.status(status).json({
        success: false,
        error: error.message,
        code,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Preview CV (inline display)
  previewCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const downloadRequest = (req as any).downloadRequest;
      
      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Find CV files for the candidate
      const fs = require('fs').promises;
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
      
      let cvFiles: string[] = [];
      try {
        const files = await fs.readdir(uploadDir);
        cvFiles = files.filter((file: string) => 
          file.startsWith(`candidate_${candidateId}_`)
        );
      } catch (error) {
        console.error('Error reading upload directory:', error);
      }

      if (cvFiles.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No CV found for this candidate',
          code: 'CV_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Get the most recent CV file
      const latestCVFile = cvFiles.sort().pop() as string;
      const filePath = path.join(uploadDir, latestCVFile);
      const fileExtension = path.extname(latestCVFile).toLowerCase();

      // Only allow preview for PDFs (security consideration)
      if (fileExtension !== '.pdf') {
        res.status(400).json({
          success: false,
          error: 'Preview only available for PDF files',
          code: 'PREVIEW_NOT_SUPPORTED',
          details: {
            fileType: fileExtension,
            supportedTypes: ['.pdf']
          }
        } as IApiResponse);
        return;
      }

      // Get file information
      const fileStats = await fs.stat(filePath);
      
      // Set headers for inline display
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', fileStats.size.toString());
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Candidate-ID', candidateId.toString());
      res.setHeader('X-Preview-ID', this.generateDownloadId());

      // Log preview access
      console.log(`CV preview accessed for candidate ${candidateId} by user ${downloadRequest?.userId}:`, {
        fileName: latestCVFile,
        previewId: res.getHeader('X-Preview-ID'),
        timestamp: new Date().toISOString()
      });

      // Send file for inline display
      res.sendFile(filePath);

    } catch (error: any) {
      console.error('CV preview error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'PREVIEW_FAILED',
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Get CV info without downloading
  getCVInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      
      if (!candidateId || isNaN(candidateId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid candidate ID',
          code: 'INVALID_CANDIDATE_ID'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
          code: 'CANDIDATE_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Find CV files for the candidate
      const fs = require('fs').promises;
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
      
      let cvFiles: string[] = [];
      try {
        const files = await fs.readdir(uploadDir);
        cvFiles = files.filter((file: string) => 
          file.startsWith(`candidate_${candidateId}_`)
        );
      } catch (error) {
        console.error('Error reading upload directory:', error);
      }

      if (cvFiles.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No CV found for this candidate',
          code: 'CV_NOT_FOUND'
        } as IApiResponse);
        return;
      }

      // Get information about all CV files
      const fileInfos = await Promise.all(
        cvFiles.map(async (fileName) => {
          const filePath = path.join(uploadDir, fileName);
          const stats = await fs.stat(filePath);
          const extension = path.extname(fileName).toLowerCase();
          
          return {
            fileName,
            size: stats.size,
            uploadDate: stats.birthtime || stats.ctime,
            lastModified: stats.mtime,
            extension,
            mimeType: this.getContentType(extension),
            downloadUrl: `/api/candidates/${candidateId}/cv`,
            previewUrl: extension === '.pdf' ? `/api/candidates/${candidateId}/cv/preview` : null
          };
        })
      );

      // Sort by upload date (newest first)
      fileInfos.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

      res.status(200).json({
        success: true,
        data: {
          candidate: {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email
          },
          cvFiles: fileInfos,
          latest: fileInfos[0],
          count: fileInfos.length
        },
        message: 'CV information retrieved successfully'
      } as IApiResponse);

    } catch (error: any) {
      console.error('CV info error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'CV_INFO_FAILED',
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  // Helper methods
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return contentTypes[extension] || 'application/octet-stream';
  }

  private createSafeDownloadFilename(firstName: string, lastName: string, extension: string): string {
    const safeName = `${firstName}_${lastName}_CV`.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeName}${extension}`;
  }

  private generateDownloadId(): string {
    return `dl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}
