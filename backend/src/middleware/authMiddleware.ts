import { Request, Response, NextFunction } from 'express';
import { IAuthService, IUser } from '../interfaces/IUser';
import { IApiResponse } from '../interfaces/IFileService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      refreshToken?: string;
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: IAuthService) {}

  /**
   * Main authentication middleware that validates JWT tokens
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        this.sendUnauthorizedResponse(res, 'Authentication token is required');
        return;
      }

      // Validate token and get user
      const user = await this.authService.validateToken(token);
      
      // Attach user and token to request for downstream use
      req.user = user;
      req.token = token;
      
      next();
    } catch (error: any) {
      this.handleAuthError(error, res);
    }
  };

  /**
   * Optional authentication middleware - allows requests without tokens
   * but validates tokens if present
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        try {
          const user = await this.authService.validateToken(token);
          req.user = user;
          req.token = token;
        } catch (error) {
          // For optional auth, we don't fail on invalid tokens
          // Just proceed without user context
        }
      }
      
      next();
    } catch (error: any) {
      // For optional auth, proceed even if there's an error
      next();
    }
  };

  /**
   * Middleware that requires the user to be active
   */
  requireActiveUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      this.sendUnauthorizedResponse(res, 'Authentication required');
      return;
    }

    if (!req.user.isActive) {
      this.sendForbiddenResponse(res, 'Account is disabled');
      return;
    }

    next();
  };

  /**
   * Extract JWT token from various sources
   */
  private extractToken(req: Request): string | null {
    // 1. Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // 2. Query parameter (for WebSocket or special cases)
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    // 3. Custom header (x-access-token)
    const customHeader = req.headers['x-access-token'];
    if (customHeader && typeof customHeader === 'string') {
      return customHeader;
    }

    // 4. Cookie (if using cookie-based auth)
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    return null;
  }

  /**
   * Handle authentication errors with specific error types
   */
  private handleAuthError(error: Error, res: Response): void {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('expired')) {
      this.sendUnauthorizedResponse(res, 'Token has expired', 'TOKEN_EXPIRED');
    } else if (errorMessage.includes('revoked') || errorMessage.includes('blacklisted')) {
      this.sendUnauthorizedResponse(res, 'Token has been revoked', 'TOKEN_REVOKED');
    } else if (errorMessage.includes('invalid')) {
      this.sendUnauthorizedResponse(res, 'Invalid token', 'TOKEN_INVALID');
    } else if (errorMessage.includes('disabled') || errorMessage.includes('inactive')) {
      this.sendForbiddenResponse(res, 'Account is disabled', 'ACCOUNT_DISABLED');
    } else if (errorMessage.includes('not found')) {
      this.sendUnauthorizedResponse(res, 'User not found', 'USER_NOT_FOUND');
    } else {
      this.sendUnauthorizedResponse(res, 'Authentication failed', 'AUTH_FAILED');
    }
  }

  /**
   * Send 401 Unauthorized response
   */
  private sendUnauthorizedResponse(res: Response, message: string, code?: string): void {
    res.status(401).json({
      success: false,
      error: message,
      code: code || 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    } as IApiResponse);
  }

  /**
   * Send 403 Forbidden response
   */
  private sendForbiddenResponse(res: Response, message: string, code?: string): void {
    res.status(403).json({
      success: false,
      error: message,
      code: code || 'FORBIDDEN',
      timestamp: new Date().toISOString()
    } as IApiResponse);
  }
}

/**
 * Factory function to create authentication middleware instances
 */
export const createAuthMiddleware = (authService: IAuthService) => {
  const authMiddleware = new AuthMiddleware(authService);
  return {
    authenticate: authMiddleware.authenticate,
    optionalAuthenticate: authMiddleware.optionalAuthenticate,
    requireActiveUser: authMiddleware.requireActiveUser
  };
};

/**
 * Convenience middleware for different authentication levels
 */
export const createAuthMiddlewares = (authService: IAuthService) => {
  const middleware = new AuthMiddleware(authService);
  
  return {
    // Standard authentication - requires valid token
    required: middleware.authenticate,
    
    // Optional authentication - validates token if present
    optional: middleware.optionalAuthenticate,
    
    // Requires authenticated and active user
    activeUserRequired: [
      middleware.authenticate,
      middleware.requireActiveUser
    ]
  };
};
