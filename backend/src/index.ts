import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Import configuration and dependencies
import prisma from './config/database';
import { validateAuthConfig } from './config/auth';
import { createCandidateRoutes } from './routes/candidateRoutes';
import { createAuthRoutes } from './routes/authRoutes';

// Import services and controllers
import { UserRepository } from './repositories/userRepository';
import { CandidateRepository } from './repositories/candidateRepository';
import { AuthService } from './services/authService';
import { CandidateService } from './services/candidateService';
import { ValidationService } from './services/validationService';
import { FileService } from './services/fileService';
import { AuthController } from './controllers/authController';
import { CandidateController } from './controllers/candidateController';

// Load environment variables
dotenv.config();

// Validate authentication configuration
try {
  validateAuthConfig();
  console.log('✅ Authentication configuration validated successfully');
} catch (error: any) {
  console.error('❌ Authentication configuration validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  console.warn('⚠️  Continuing with default configuration in development mode');
}

// Initialize repositories
const userRepository = new UserRepository(prisma);
const candidateRepository = new CandidateRepository(prisma);

// Initialize services
const authService = new AuthService(userRepository);
const validationService = new ValidationService();
const fileService = new FileService();
const candidateService = new CandidateService(candidateRepository, validationService);

// Initialize controllers
const authController = new AuthController(authService);
const candidateController = new CandidateController(candidateService, fileService);

// Create Express app
export const app = express();
export default prisma;

const port = process.env.PORT || 3010;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Token', 'X-Refresh-Token']
};

// Middleware setup
app.use(cors(corsOptions));
app.use(cookieParser()); // For cookie-based authentication support
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Powered-By', ''); // Remove X-Powered-By header
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'LTI Backend'
  });
});

// API routes
app.use('/api/auth', createAuthRoutes(authController, authService));
app.use('/api/candidates', createCandidateRoutes(candidateController, authController, authService));

// Serve uploaded files
app.use('/api/files', express.static(path.join(process.cwd(), 'uploads')));

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'LTI - Sistema de Seguimiento de Talento API',
    version: '1.0.0',
    description: 'Professional Talent Tracking System with JWT Authentication',
    endpoints: {
      auth: {
        base: '/api/auth',
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        changePassword: 'PUT /api/auth/change-password',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        validate: 'GET /api/auth/validate',
        refresh: 'POST /api/auth/refresh'
      },
      candidates: {
        base: '/api/candidates',
        list: 'GET /api/candidates',
        create: 'POST /api/candidates',
        get: 'GET /api/candidates/:id',
        update: 'PUT /api/candidates/:id',
        delete: 'DELETE /api/candidates/:id',
        uploadCV: 'POST /api/candidates/:id/cv',
        downloadCV: 'GET /api/candidates/:id/cv'
      },
      files: '/api/files',
      health: '/health'
    },
    features: [
      'JWT Authentication with role-based authorization',
      'Secure password management with bcrypt',
      'Token blacklisting for secure logout',
      'Rate limiting for authentication endpoints',
      'File upload and management for CVs',
      'Advanced candidate filtering and search',
      'Comprehensive input validation'
    ]
  });
});

// Error handling middleware (must be last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field.'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(port, () => {
  console.log('\n🚀 ====================================');
  console.log('   LTI TALENT TRACKING SYSTEM API   ');
  console.log('====================================🚀\n');
  
  console.log(`🌐 Server is running at http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  
  console.log('\n🔐 Authentication Endpoints:');
  console.log(`   📝 Register: POST http://localhost:${port}/api/auth/register`);
  console.log(`   🔑 Login: POST http://localhost:${port}/api/auth/login`);
  console.log(`   👤 Profile: GET http://localhost:${port}/api/auth/me`);
  console.log(`   🚪 Logout: POST http://localhost:${port}/api/auth/logout`);
  
  console.log('\n👥 Candidate Management:');
  console.log(`   📋 List: GET http://localhost:${port}/api/candidates`);
  console.log(`   ➕ Create: POST http://localhost:${port}/api/candidates`);
  console.log(`   📄 CV Upload: POST http://localhost:${port}/api/candidates/:id/cv`);
  
  console.log('\n📁 Static Files:');
  console.log(`   📂 Uploads: http://localhost:${port}/api/files/`);
  
  console.log('\n✨ Features:');
  console.log('   ✅ JWT Authentication with Role-based Authorization');
  console.log('   ✅ Secure Password Management (bcrypt)');
  console.log('   ✅ Token Blacklisting for Secure Logout');
  console.log('   ✅ Rate Limiting Protection');
  console.log('   ✅ File Upload/Download Management');
  console.log('   ✅ Advanced Search and Filtering');
  console.log('   ✅ Input Validation and Sanitization');
  
  console.log('\n🔒 Environment:');
  console.log(`   🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️  Using default'}`);
  console.log(`   🗄️  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '⚠️  Using default'}`);
  
  console.log('\n🎯 Ready to handle requests!\n');
});
