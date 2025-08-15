import { Router } from 'express';
import { CandidateController } from '../controllers/candidateController';
import { AuthController } from '../controllers/authController';
import { createAuthMiddlewares } from '../middleware/authMiddleware';
import { createTokenValidationMiddleware } from '../middleware/tokenValidationMiddleware';
import { 
  roleMiddleware, 
  permissionMiddleware, 
  roleMiddlewares,
  Permission
} from '../middleware/roleMiddleware';
import { 
  validateCandidate, 
  validateCandidateUpdate, 
  handleValidationErrors 
} from '../middleware/validationMiddleware';
import { uploadCV, uploadMultipleCVs } from '../config/multer';
import { UserRole } from '../interfaces/IUser';
import { IAuthService } from '../interfaces/IUser';
import { createFileUploadMiddleware } from '../middleware/fileUploadMiddleware';
import { createFileServingMiddleware } from '../middleware/fileServingMiddleware';
import { IFileService } from '../interfaces/IFileService';

export const createCandidateRoutes = (
  candidateController: CandidateController,
  authController: AuthController,
  authService: IAuthService,
  fileService: IFileService
): Router => {
  const router = Router();
  
  // Create enhanced middleware instances
  const authMiddlewares = createAuthMiddlewares(authService);
  const tokenValidation = createTokenValidationMiddleware(authService);
  const fileUploadMiddleware = createFileUploadMiddleware(fileService);
  const fileServingMiddleware = createFileServingMiddleware(fileService);

  // GET /api/candidates - List candidates with filtering
  router.get('/', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.canReadCandidate,
    candidateController.getCandidates
  );

  // POST /api/candidates - Create new candidate
  router.post('/', 
    tokenValidation.rateLimitAuth,
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.canCreateCandidate,
    validateCandidate,
    handleValidationErrors,
    candidateController.createCandidate
  );

  // GET /api/candidates/:id - Get specific candidate
  router.get('/:id', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.canReadCandidate,
    candidateController.getCandidateById
  );

  // PUT /api/candidates/:id - Update candidate
  router.put('/:id', 
    tokenValidation.rateLimitAuth,
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.canUpdateCandidate,
    validateCandidateUpdate,
    handleValidationErrors,
    candidateController.updateCandidate
  );

  // DELETE /api/candidates/:id - Delete candidate (Admin only)
  router.delete('/:id', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.adminOnly,
    roleMiddlewares.canDeleteCandidate,
    candidateController.deleteCandidate
  );

  // POST /api/candidates/:id/cv - Upload CV with enhanced security
  router.post('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.UPLOAD_CV]),
    uploadCV,
    ...fileUploadMiddleware.createSecureUploadChain({
      maxUploadsPerHour: 20,
      enableMalwareScanning: true,
      validateOwnership: true
    }),
    candidateController.uploadCV
  );

  // PUT /api/candidates/:id/cv - Replace existing CV
  router.put('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.UPLOAD_CV]),
    uploadCV,
    ...fileUploadMiddleware.createSecureUploadChain({
      maxUploadsPerHour: 10,
      enableMalwareScanning: true,
      validateOwnership: true
    }),
    candidateController.replaceCV
  );

  // DELETE /api/candidates/:id/cv - Delete CV
  router.delete('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.UPLOAD_CV]), // Using UPLOAD_CV permission for delete as well
    candidateController.deleteCV
  );

  // POST /api/candidates/bulk/cv - Bulk CV upload (Admin only)
  router.post('/bulk/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    roleMiddlewares.adminOnly,
    uploadMultipleCVs,
    fileUploadMiddleware.setSecurityHeaders,
    fileUploadMiddleware.rateLimitFileUpload(5), // Stricter rate limit for bulk upload
    candidateController.uploadBulkCV
  );

  // GET /api/candidates/:id/cv - Download CV with enhanced security
  router.get('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.DOWNLOAD_CV]),
    ...fileServingMiddleware.createSecureDownloadChain({
      maxDownloadsPerHour: 100,
      enableLogging: true
    }),
    candidateController.downloadCV
  );

  // GET /api/candidates/:id/cv/preview - Preview CV (inline display)
  router.get('/:id/cv/preview', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.DOWNLOAD_CV]),
    ...fileServingMiddleware.createSecureDownloadChain({
      maxDownloadsPerHour: 200, // Higher limit for previews
      enableLogging: true
    }),
    candidateController.previewCV
  );

  // GET /api/candidates/:id/cv/info - Get CV information
  router.get('/:id/cv/info', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.DOWNLOAD_CV]),
    fileServingMiddleware.rateLimitDownloads(300), // Very high limit for info requests
    candidateController.getCVInfo
  );

  return router;
};
