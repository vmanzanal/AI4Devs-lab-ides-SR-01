import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  IUser, 
  IAuthService, 
  ILoginDto, 
  ILogoutDto,
  IRegisterDto,
  IChangePasswordDto,
  IResetPasswordDto,
  IAuthResponse,
  IRefreshTokenDto,
  ITokenPair,
  IUserRepository 
} from '../interfaces/IUser';
import { jwtConfig, bcryptConfig, securityConfig, sessionConfig } from '../config/auth';
import { tokenBlacklist } from './tokenBlacklistService';
import { PasswordUtils } from '../utils/passwordUtils';

export class AuthService implements IAuthService {
  constructor(private userRepository: IUserRepository) {
    // Configuration validation is handled in the main application startup
  }

  async login(credentials: ILoginDto): Promise<IAuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Check if account is locked
    if (this.checkAccountLocked(user)) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      await this.incrementLoginAttempts(user.id);
      throw new Error('Invalid email or password');
    }

    // Reset login attempts and update last login
    await this.resetLoginAttempts(user.id);
    await (this.userRepository as any).updateLastLogin(user.id);

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as IUser,
      token
    };
  }

  async logout(logoutData: ILogoutDto): Promise<void> {
    const { token } = logoutData;
    
    if (!token) {
      throw new Error('Token is required for logout');
    }

    // Add token to blacklist
    tokenBlacklist.blacklistToken(token);
  }

  async register(userData: IRegisterDto): Promise<IAuthResponse> {
    const { email, password, name, role } = userData;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const newUser = await this.userRepository.create({
      email: email.toLowerCase().trim(),
      name,
      password: hashedPassword,
      role,
      isActive: true
    });

    // Generate JWT token
    const token = this.generateToken(newUser);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword as IUser,
      token
    };
  }

  async changePassword(userId: number, passwordData: IChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = passwordData;

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal whether user exists for security
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await (this.userRepository as any).setPasswordResetToken(user.id, resetToken, resetExpires);

    // In a real application, you would send an email here
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(resetData: IResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetData;

    // Find user by reset token
    const user = await (this.userRepository as any).findByPasswordResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await this.userRepository.update(user.id, { password: hashedPassword });
    await (this.userRepository as any).clearPasswordResetToken(user.id);
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      // Check if token is blacklisted
      if (tokenBlacklist.isTokenBlacklisted(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as any;
      
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active');
      }
      throw new Error('Token validation failed');
    }
  }

  async getCurrentUser(req: any): Promise<IUser> {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  async hashPassword(password: string): Promise<string> {
    // Validate password length for security
    if (password.length > bcryptConfig.maxPasswordLength) {
      throw new Error(`Password too long. Maximum length is ${bcryptConfig.maxPasswordLength} characters`);
    }
    
    return await bcrypt.hash(password, bcryptConfig.saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  checkAccountLocked(user: IUser): boolean {
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return true;
    }

    // Check if max login attempts exceeded
    if (user.loginAttempts >= securityConfig.maxLoginAttempts) {
      return true;
    }

    return false;
  }

  async incrementLoginAttempts(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    
    // Lock account if max attempts reached
    if (newAttempts >= securityConfig.maxLoginAttempts) {
      const lockUntil = new Date(Date.now() + securityConfig.lockoutDuration);
      await (this.userRepository as any).lockAccount(userId, lockUntil);
    } else {
      await (this.userRepository as any).incrementLoginAttempts(userId);
    }
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    await this.userRepository.update(userId, { 
      loginAttempts: 0,
      lockedUntil: null
    });
  }

  generateToken(user: IUser): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      iss: jwtConfig.issuer,
      aud: jwtConfig.audience
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm
    } as jwt.SignOptions);
  }

  generateRefreshToken(user: IUser): string {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      type: 'refresh',
      tokenFamily: crypto.randomUUID() // Unique family for token rotation
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: sessionConfig.refreshTokenExpiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    } as jwt.SignOptions);
  }

  generateTokenPair(user: IUser): ITokenPair {
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: jwtConfig.expiresIn,
      refreshTokenExpiresIn: sessionConfig.refreshTokenExpiresIn
    };
  }

  async refreshTokens(refreshTokenData: IRefreshTokenDto): Promise<ITokenPair> {
    const { refreshToken } = refreshTokenData;

    try {
      // Verify refresh token signature
      const decoded = jwt.verify(refreshToken, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as any;

      // Check if it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user by refresh token in database
      const user = await this.userRepository.findByRefreshToken(refreshToken);
      if (!user) {
        // Possible token reuse attack - revoke all tokens in family
        if (decoded.tokenFamily && sessionConfig.refreshTokenReuseDetection) {
          await this.userRepository.revokeRefreshTokenFamily(decoded.tokenFamily);
        }
        throw new Error('Refresh token not found or expired');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new Error('User account is disabled');
      }

      // Generate new token pair
      const newTokenPair = this.generateTokenPair(user);

      // If rotation is enabled, update the refresh token in database
      if (sessionConfig.refreshTokenRotation) {
        const newRefreshTokenDecoded = jwt.decode(newTokenPair.refreshToken) as any;
        const expiresAt = new Date(newRefreshTokenDecoded.exp * 1000);
        
        await this.userRepository.setRefreshToken(
          user.id,
          newTokenPair.refreshToken,
          expiresAt,
          newRefreshTokenDecoded.tokenFamily
        );

        // Blacklist the old access token if it exists
        if (user.refreshToken) {
          tokenBlacklist.blacklistToken(user.refreshToken);
        }
      }

      return newTokenPair;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<IUser> {
    try {
      // Verify token signature and decode
      const decoded = jwt.verify(refreshToken, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }) as any;

      // Check token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user by refresh token
      const user = await this.userRepository.findByRefreshToken(refreshToken);
      if (!user) {
        throw new Error('Refresh token not found or expired');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('User account is disabled');
      }

      return user;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      // Decode token to get user info
      const decoded = jwt.decode(refreshToken) as any;
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid refresh token');
      }

      const userId = parseInt(decoded.sub, 10);
      
      // Clear refresh token from database
      await this.userRepository.clearRefreshToken(userId);

      // If token family exists, revoke all tokens in family
      if (decoded.tokenFamily && sessionConfig.refreshTokenReuseDetection) {
        await this.userRepository.revokeRefreshTokenFamily(decoded.tokenFamily);
      }

    } catch (error: any) {
      console.error('Error revoking refresh token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }
}
