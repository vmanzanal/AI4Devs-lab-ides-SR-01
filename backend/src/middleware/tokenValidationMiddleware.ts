import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/IUser';
import { IApiResponse } from '../interfaces/IFileService';
import { tokenBlacklist } from '../services/tokenBlacklistService';

/**
 * Specialized middleware for advanced token validation scenarios
 */
export class TokenValidationMiddleware {
  constructor(private authService: IAuthService) {}

  /**
   * Middleware that checks if token is blacklisted before validating
   */
  checkTokenBlacklist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromRequest(req);
      
      if (token && tokenBlacklist.isTokenBlacklisted(token)) {
        res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED',
          timestamp: new Date().toISOString()
        } as IApiResponse);
        return;
      }
      
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Token validation failed',
        code: 'VALIDATION_ERROR'
      } as IApiResponse);
    }
  };

  /**
   * Middleware that validates token signature without checking user status
   * Useful for logout operations where we need to validate the token but don't need user details
   */
  validateTokenSignatureOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractTokenFromRequest(req);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token is required',
          code: 'TOKEN_REQUIRED'
        } as IApiResponse);
        return;
      }

      // Just validate the token signature, don't check user status
      try {
        await this.authService.validateToken(token);
        req.token = token;
        next();
      } catch (error: any) {
        res.status(401).json({
          success: false,
          error: 'Invalid token signature',
          code: 'INVALID_TOKEN_SIGNATURE'
        } as IApiResponse);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Token validation failed'
      } as IApiResponse);
    }
  };

  /**
   * Middleware for refresh token scenarios
   */
  validateRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let refreshToken: string | null = null;

      // Check for refresh token in various locations
      if (req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
      } else if (req.cookies.refreshToken) {
        refreshToken = req.cookies.refreshToken;
      } else if (req.headers['x-refresh-token']) {
        refreshToken = req.headers['x-refresh-token'] as string;
      }
      
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token is required',
          code: 'REFRESH_TOKEN_MISSING',
          timestamp: new Date().toISOString()
        } as IApiResponse);
        return;
      }

      // Validate refresh token using auth service
      const user = await this.authService.validateRefreshToken(refreshToken);
      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (error: any) {
      let errorCode = 'REFRESH_TOKEN_INVALID';
      if (error.message.includes('expired')) {
        errorCode = 'REFRESH_TOKEN_EXPIRED';
      } else if (error.message.includes('reuse') || error.message.includes('not found')) {
        errorCode = 'REFRESH_TOKEN_REVOKED';
      }
      
      res.status(401).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  /**
   * Rate limiting middleware for authentication attempts
   */
  rateLimitAuth = (() => {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    const maxAttempts = 10;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = this.getClientIP(req);
      const now = Date.now();
      
      const clientAttempts = attempts.get(clientIP);
      
      if (clientAttempts) {
        if (now > clientAttempts.resetTime) {
          // Reset the window
          attempts.set(clientIP, { count: 1, resetTime: now + windowMs });
        } else if (clientAttempts.count >= maxAttempts) {
          res.status(429).json({
            success: false,
            error: 'Too many authentication attempts. Please try again later.',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
          } as IApiResponse);
          return;
        } else {
          clientAttempts.count++;
        }
      } else {
        attempts.set(clientIP, { count: 1, resetTime: now + windowMs });
      }
      
      next();
    };
  })();

  /**
   * Extract token from request (similar to AuthMiddleware but standalone)
   */
  private extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    const customHeader = req.headers['x-access-token'];
    if (customHeader && typeof customHeader === 'string') {
      return customHeader;
    }

    return null;
  }

  /**
   * Get client IP address for rate limiting
   */
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (req.headers['x-real-ip'] as string) ||
           'unknown';
  }
}

/**
 * Factory function to create token validation middleware
 */
export const createTokenValidationMiddleware = (authService: IAuthService) => {
  const middleware = new TokenValidationMiddleware(authService);
  
  return {
    checkBlacklist: middleware.checkTokenBlacklist,
    validateSignatureOnly: middleware.validateTokenSignatureOnly,
    validateRefreshToken: middleware.validateRefreshToken,
    rateLimitAuth: middleware.rateLimitAuth
  };
};
