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
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        } as IApiResponse);
        return;
      }

      // Check if candidate exists
      const candidate = await this.candidateService.getCandidateById(candidateId);
      
      // Upload file
      const fileResult = await this.fileService.uploadCV({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      }, candidateId);

      // Update candidate with file info (this would need to be added to candidate service)
      // For now, we'll just return the file upload result
      
      res.status(200).json({
        success: true,
        data: {
          candidate: candidate,
          file: fileResult
        }
      } as IApiResponse);
    } catch (error: any) {
      const status = error.message === 'Candidate not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };

  downloadCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const candidateId = parseInt(req.params.id);
      const candidate = await this.candidateService.getCandidateById(candidateId);
      
      if (!candidate.cvFilePath) {
        res.status(404).json({
          success: false,
          error: 'CV not found for this candidate'
        } as IApiResponse);
        return;
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.cvFileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      // Send file
      res.sendFile(candidate.cvFilePath);
    } catch (error: any) {
      const status = error.message === 'Candidate not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message
      } as IApiResponse);
    }
  };
}
