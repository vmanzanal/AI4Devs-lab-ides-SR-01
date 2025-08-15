import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { createAuthMiddlewares } from '../middleware/authMiddleware';
import { createTokenValidationMiddleware } from '../middleware/tokenValidationMiddleware';
import { roleMiddlewares } from '../middleware/roleMiddleware';
import { 
  validateLoginRequest,
  validateRegistrationRequest,
  validateChangePasswordRequest,
  validatePasswordResetRequest,
  validatePasswordResetConfirm,
  handleValidationErrors 
} from '../middleware/validationMiddleware';
import { IAuthService } from '../interfaces/IUser';

export const createAuthRoutes = (
  authController: AuthController,
  authService: IAuthService
): Router => {
  const router = Router();

  // Create enhanced middleware instances
  const authMiddlewares = createAuthMiddlewares(authService);
  const tokenValidation = createTokenValidationMiddleware(authService);

  // POST /api/auth/login - User login
  router.post('/login', 
    tokenValidation.rateLimitAuth,
    validateLoginRequest,
    handleValidationErrors,
    authController.login
  );

  // POST /api/auth/register - User registration  
  router.post('/register',
    tokenValidation.rateLimitAuth,
    validateRegistrationRequest,
    handleValidationErrors,
    authController.register
  );

  // GET /api/auth/me - Get current user info
  router.get('/me', 
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    authController.getCurrentUser
  );

  // POST /api/auth/logout - User logout
  router.post('/logout', 
    tokenValidation.validateSignatureOnly, // Only validate signature for logout
    authController.logout
  );

  // PUT /api/auth/change-password - Change password
  router.put('/change-password',
    tokenValidation.checkBlacklist,
    authMiddlewares.activeUserRequired,
    validateChangePasswordRequest,
    handleValidationErrors,
    authController.changePassword
  );

  // POST /api/auth/forgot-password - Request password reset
  router.post('/forgot-password',
    tokenValidation.rateLimitAuth,
    validatePasswordResetRequest,
    handleValidationErrors,
    authController.requestPasswordReset
  );

  // POST /api/auth/reset-password - Reset password with token
  router.post('/reset-password',
    tokenValidation.rateLimitAuth,
    validatePasswordResetConfirm,
    handleValidationErrors,
    authController.resetPassword
  );

  // POST /api/auth/refresh - Refresh token (future implementation)
  router.post('/refresh',
    tokenValidation.validateRefreshToken,
    authController.refreshToken
  );

  // GET /api/auth/validate - Validate token
  router.get('/validate',
    tokenValidation.checkBlacklist,
    authMiddlewares.required,
    authController.validateToken
  );

  return router;
};
