import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const authConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    algorithm: 'HS256' as jwt.Algorithm,
    issuer: process.env.JWT_ISSUER || 'lti-ats',
    audience: process.env.JWT_AUDIENCE || 'lti-users'
  },

  // Bcrypt Configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    maxPasswordLength: 128 // Maximum password length for security
  },

  // Session Configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    refreshTokenRotation: process.env.REFRESH_TOKEN_ROTATION === 'true' || true, // Enable refresh token rotation
    refreshTokenReuseDetection: process.env.REFRESH_TOKEN_REUSE_DETECTION === 'true' || true // Enable reuse detection
  },

  // Security Configuration
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '300000', 10), // 5 minutes in ms
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    passwordRequireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
  }
};

// Validation function to ensure required environment variables are set
export const validateAuthConfig = (): void => {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      console.warn(`⚠️  Missing environment variables (using defaults): ${missingVars.join(', ')}`);
    }
  }

  // Validate JWT secret strength in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }

  // Validate bcrypt rounds
  if (authConfig.bcrypt.saltRounds < 10 || authConfig.bcrypt.saltRounds > 15) {
    console.warn(`⚠️  BCRYPT_ROUNDS should be between 10 and 15. Current: ${authConfig.bcrypt.saltRounds}`);
  }
};

// Export individual configs for easier imports
export const jwtConfig = authConfig.jwt;
export const bcryptConfig = authConfig.bcrypt;
export const sessionConfig = authConfig.session;
export const securityConfig = authConfig.security;
