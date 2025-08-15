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
import { uploadCV } from '../config/multer';
import { UserRole } from '../interfaces/IUser';
import { IAuthService } from '../interfaces/IUser';

export const createCandidateRoutes = (
  candidateController: CandidateController,
  authController: AuthController,
  authService: IAuthService
): Router => {
  const router = Router();
  
  // Create enhanced middleware instances
  const authMiddlewares = createAuthMiddlewares(authService);
  const tokenValidation = createTokenValidationMiddleware(authService);

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

  // POST /api/candidates/:id/cv - Upload CV
  router.post('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.UPLOAD_CV]),
    uploadCV,
    candidateController.uploadCV
  );

  // GET /api/candidates/:id/cv - Download CV
  router.get('/:id/cv', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    permissionMiddleware([Permission.DOWNLOAD_CV]),
    candidateController.downloadCV
  );

  return router;
};
