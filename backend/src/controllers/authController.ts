import { Request, Response } from 'express';
import { IAuthService, UserRole } from '../interfaces/IUser';
import { IApiResponse } from '../interfaces/IFileService';
import { AuthorizationService } from '../services/authorizationService';

export class AuthController {
  constructor(private authService: IAuthService) {}

  /**
   * User login endpoint
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, rememberMe } = req.body;

      // Input validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        } as IApiResponse);
        return;
      }

      // Attempt login
      const authResult = await this.authService.login({ email, password });
      
      // Generate permission summary for frontend
      const permissionSummary = AuthorizationService.generatePermissionSummary(authResult.user);
      
      // Set secure HTTP-only cookie if remember me is enabled
      if (rememberMe) {
        res.cookie('refreshToken', authResult.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            name: authResult.user.name,
            role: authResult.user.role,
            isActive: authResult.user.isActive,
            lastLoginAt: authResult.user.lastLoginAt,
            createdAt: authResult.user.createdAt
          },
          token: authResult.token,
          permissions: permissionSummary,
          loginTime: new Date().toISOString()
        },
        message: 'Login successful'
      } as IApiResponse);
    } catch (error: any) {
      // Handle specific error types
      let statusCode = 401;
      let errorCode = 'LOGIN_FAILED';

      if (error.message.includes('locked')) {
        statusCode = 423; // Locked
        errorCode = 'ACCOUNT_LOCKED';
      } else if (error.message.includes('disabled')) {
        statusCode = 403; // Forbidden
        errorCode = 'ACCOUNT_DISABLED';
      } else if (error.message.includes('not found')) {
        errorCode = 'INVALID_CREDENTIALS';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  /**
   * User registration endpoint
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, role } = req.body;

      // Input validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
          code: 'MISSING_REQUIRED_FIELDS'
        } as IApiResponse);
        return;
      }

      // Default role for registration
      const userRole = role || UserRole.HR_RECRUITER;

      // Register user
      const authResult = await this.authService.register({
        email,
        password,
        name,
        role: userRole
      });

      // Generate permission summary
      const permissionSummary = AuthorizationService.generatePermissionSummary(authResult.user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: authResult.user.id,
            email: authResult.user.email,
            name: authResult.user.name,
            role: authResult.user.role,
            isActive: authResult.user.isActive,
            createdAt: authResult.user.createdAt
          },
          token: authResult.token,
          permissions: permissionSummary
        },
        message: 'Registration successful'
      } as IApiResponse);
    } catch (error: any) {
      let statusCode = 400;
      let errorCode = 'REGISTRATION_FAILED';

      if (error.message.includes('already exists')) {
        statusCode = 409; // Conflict
        errorCode = 'EMAIL_ALREADY_EXISTS';
      } else if (error.message.includes('validation')) {
        errorCode = 'VALIDATION_ERROR';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  /**
   * Get current authenticated user
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        } as IApiResponse);
        return;
      }

      // Generate permission summary
      const permissionSummary = AuthorizationService.generatePermissionSummary(user);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt
          },
          permissions: permissionSummary
        }
      } as IApiResponse);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'USER_FETCH_FAILED'
      } as IApiResponse);
    }
  };

  /**
   * User logout endpoint
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.token;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided for logout',
          code: 'NO_TOKEN'
        } as IApiResponse);
        return;
      }

      // Logout using the auth service (token blacklisting)
      await this.authService.logout({ token });

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString()
      } as IApiResponse);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: 'LOGOUT_FAILED'
      } as IApiResponse);
    }
  };

  /**
   * Change password endpoint
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        } as IApiResponse);
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
          code: 'MISSING_PASSWORDS'
        } as IApiResponse);
        return;
      }

      // Change password
      await this.authService.changePassword(user.id, {
        currentPassword,
        newPassword
      });

      res.status(200).json({
        success: true,
        data: { message: 'Password changed successfully' },
        timestamp: new Date().toISOString()
      } as IApiResponse);
    } catch (error: any) {
      let statusCode = 400;
      let errorCode = 'PASSWORD_CHANGE_FAILED';

      if (error.message.includes('incorrect')) {
        statusCode = 401;
        errorCode = 'INCORRECT_CURRENT_PASSWORD';
      } else if (error.message.includes('validation')) {
        errorCode = 'PASSWORD_VALIDATION_ERROR';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode
      } as IApiResponse);
    }
  };

  /**
   * Request password reset endpoint
   */
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        } as IApiResponse);
        return;
      }

      // Request password reset
      await this.authService.requestPasswordReset(email);

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        success: true,
        data: { 
          message: 'If the email exists, a password reset link has been sent'
        },
        timestamp: new Date().toISOString()
      } as IApiResponse);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
        code: 'PASSWORD_RESET_ERROR'
      } as IApiResponse);
    }
  };

  /**
   * Reset password with token endpoint
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Reset token and new password are required',
          code: 'MISSING_RESET_DATA'
        } as IApiResponse);
        return;
      }

      // Reset password
      await this.authService.resetPassword({ token, newPassword });

      res.status(200).json({
        success: true,
        data: { message: 'Password reset successful' },
        timestamp: new Date().toISOString()
      } as IApiResponse);
    } catch (error: any) {
      let statusCode = 400;
      let errorCode = 'PASSWORD_RESET_FAILED';

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        statusCode = 401;
        errorCode = 'INVALID_RESET_TOKEN';
      } else if (error.message.includes('validation')) {
        errorCode = 'PASSWORD_VALIDATION_ERROR';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode
      } as IApiResponse);
    }
  };

  /**
   * Refresh token endpoint
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        } as IApiResponse);
        return;
      }

      // Generate new token pair
      const tokenPair = await this.authService.refreshTokens({ refreshToken });

      // Set new refresh token in cookie if requested
      if (req.cookies.refreshToken) {
        res.cookie('refreshToken', tokenPair.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          accessTokenExpiresIn: tokenPair.accessTokenExpiresIn,
          refreshTokenExpiresIn: tokenPair.refreshTokenExpiresIn,
          tokenType: 'Bearer'
        },
        message: 'Tokens refreshed successfully',
        timestamp: new Date().toISOString()
      } as IApiResponse);
    } catch (error: any) {
      let statusCode = 401;
      let errorCode = 'REFRESH_TOKEN_INVALID';

      if (error.message.includes('expired')) {
        errorCode = 'REFRESH_TOKEN_EXPIRED';
      } else if (error.message.includes('reuse') || error.message.includes('not found')) {
        statusCode = 403;
        errorCode = 'REFRESH_TOKEN_REVOKED';
      } else if (error.message.includes('disabled')) {
        statusCode = 403;
        errorCode = 'ACCOUNT_DISABLED';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      } as IApiResponse);
    }
  };

  /**
   * Validate token endpoint (for frontend to check token validity)
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        } as IApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: { 
          valid: true,
          userId: user.id,
          role: user.role,
          isActive: user.isActive
        }
      } as IApiResponse);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Token validation failed',
        code: 'TOKEN_VALIDATION_FAILED'
      } as IApiResponse);
    }
  };
}
