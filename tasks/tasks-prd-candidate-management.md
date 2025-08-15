# Task List: Candidate Management System

Based on PRD: `prd-candidate-management.md` and Technical Implementation Plan: `technical-implementation-plan.md`

## Relevant Files

### Backend Files
- `backend/prisma/schema.prisma` - Updated database schema with User roles and Candidate model
- `backend/src/interfaces/IUser.ts` - User interface definitions and role types
- `backend/src/interfaces/ICandidate.ts` - Candidate interface definitions and DTOs
- `backend/src/interfaces/IFileService.ts` - File service interface for CV uploads
- `backend/src/repositories/userRepository.ts` - User data access layer
- `backend/src/repositories/candidateRepository.ts` - Candidate data access layer
- `backend/src/services/authService.ts` - Authentication business logic
- `backend/src/services/candidateService.ts` - Candidate management business logic
- `backend/src/services/fileService.ts` - File upload and management logic
- `backend/src/services/validationService.ts` - Data validation business logic
- `backend/src/controllers/authController.ts` - Authentication request handlers
- `backend/src/controllers/candidateController.ts` - Candidate request handlers
- `backend/src/middleware/authMiddleware.ts` - JWT authentication middleware
- `backend/src/middleware/roleMiddleware.ts` - Role-based authorization middleware
- `backend/src/middleware/validationMiddleware.ts` - Request validation middleware
- `backend/src/routes/authRoutes.ts` - Authentication API routes
- `backend/src/routes/candidateRoutes.ts` - Candidate API routes
- `backend/src/config/database.ts` - Database configuration
- `backend/src/config/multer.ts` - File upload configuration
- `backend/src/config/auth.ts` - JWT and bcrypt authentication configuration
- `backend/src/utils/fileUtils.ts` - File handling utilities
- `backend/src/utils/validationUtils.ts` - Validation helper functions
- `backend/src/utils/passwordUtils.ts` - Password validation and security utilities
- `backend/src/services/tokenBlacklistService.ts` - JWT token blacklist management for logout functionality
- `backend/src/middleware/tokenValidationMiddleware.ts` - Advanced token validation middleware with rate limiting and blacklist checking
- `backend/src/middleware/resourceOwnershipMiddleware.ts` - Resource ownership checking middleware for fine-grained access control
- `backend/src/services/authorizationService.ts` - Authorization service with permission checking and business rule validation

### Backend Test Files
- `backend/src/tests/services/candidateService.test.ts` - Unit tests for candidate service
- `backend/src/tests/services/authService.test.ts` - Unit tests for auth service
- `backend/src/tests/services/fileService.test.ts` - Unit tests for file service
- `backend/src/tests/controllers/candidateController.test.ts` - Unit tests for candidate controller
- `backend/src/tests/controllers/authController.test.ts` - Unit tests for auth controller
- `backend/src/tests/repositories/candidateRepository.test.ts` - Unit tests for candidate repository
- `backend/src/tests/middleware/authMiddleware.test.ts` - Unit tests for auth middleware
- `backend/src/tests/integration/candidateApi.test.ts` - Integration tests for candidate APIs

### Frontend Files
- `frontend/src/types/User.ts` - User TypeScript type definitions
- `frontend/src/types/Candidate.ts` - Candidate TypeScript type definitions
- `frontend/src/types/API.ts` - API response type definitions
- `frontend/src/services/apiClient.ts` - Axios HTTP client configuration
- `frontend/src/services/authService.ts` - Frontend authentication service
- `frontend/src/services/candidateService.ts` - Frontend candidate API service
- `frontend/src/hooks/useAuth.ts` - Authentication custom hook
- `frontend/src/hooks/useCandidates.ts` - Candidate management custom hook
- `frontend/src/hooks/useFileUpload.ts` - File upload custom hook
- `frontend/src/components/common/Button/Button.tsx` - Reusable button component
- `frontend/src/components/common/Input/Input.tsx` - Reusable input component
- `frontend/src/components/common/FileUpload/FileUpload.tsx` - File upload component
- `frontend/src/components/common/ValidationMessage/ValidationMessage.tsx` - Validation message component
- `frontend/src/components/layout/Header/Header.tsx` - Application header component
- `frontend/src/components/layout/Dashboard/Dashboard.tsx` - Main dashboard component
- `frontend/src/components/candidate/CandidateForm/CandidateForm.tsx` - Candidate creation form
- `frontend/src/components/candidate/CandidateList/CandidateList.tsx` - Candidate listing component
- `frontend/src/components/candidate/CandidateCard/CandidateCard.tsx` - Individual candidate card
- `frontend/src/utils/validation.ts` - Frontend validation utilities
- `frontend/src/utils/formatters.ts` - Data formatting utilities

### Frontend Test Files
- `frontend/src/tests/components/CandidateForm.test.tsx` - Unit tests for candidate form
- `frontend/src/tests/components/common/Button.test.tsx` - Unit tests for button component
- `frontend/src/tests/components/common/Input.test.tsx` - Unit tests for input component
- `frontend/src/tests/components/common/FileUpload.test.tsx` - Unit tests for file upload
- `frontend/src/tests/hooks/useAuth.test.ts` - Unit tests for auth hook
- `frontend/src/tests/hooks/useCandidates.test.ts` - Unit tests for candidates hook
- `frontend/src/tests/services/candidateService.test.ts` - Unit tests for candidate service

### Configuration Files
- `backend/.env.example` - Environment variables template
- `backend/uploads/` - Directory for CV file storage
- `frontend/package.json` - Add new dependencies (react-hook-form, axios)
- `backend/package.json` - Add new dependencies (multer, express-validator, jsonwebtoken)

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests in backend
- Use `npm test` to run frontend tests with React Testing Library
- CV files will be stored in `backend/uploads/cvs/` directory with unique identifiers
- Follow TDD approach: write tests first, then implement functionality

## Tasks

- [x] 1.0 Database Schema and Migration Setup
  - [x] 1.1 Update Prisma schema with UserRole and ExperienceLevel enums
  - [x] 1.2 Add role field to existing User model with default HR_RECRUITER
  - [x] 1.3 Create Candidate model with all required fields and relationships
  - [x] 1.4 Generate Prisma client and run database migration
  - [x] 1.5 Create performance indexes for email, experience level, and created date
  - [x] 1.6 Test database connectivity and model relationships

- [x] 2.0 Backend Architecture and API Implementation
  - [x] 2.1 Create TypeScript interfaces for User, Candidate, and services
  - [x] 2.2 Implement repository pattern for User and Candidate data access
  - [x] 2.3 Build service layer with business logic (CandidateService, ValidationService)
  - [x] 2.4 Create controller layer for handling HTTP requests
  - [x] 2.5 Set up API routes for candidates with proper middleware chain
  - [x] 2.6 Configure Express app with JSON parsing, CORS, and error handling
  - [x] 2.7 Implement duplicate email check in candidate creation
  - [x] 2.8 Add candidate filtering and search functionality

- [x] 3.0 Authentication and Authorization System
  - [x] 3.1 Install and configure JWT and bcrypt dependencies
  - [x] 3.2 Create authentication service with login/logout functionality
  - [x] 3.3 Implement JWT middleware for token validation
  - [x] 3.4 Build role-based authorization middleware
  - [x] 3.5 Create auth controller with login endpoint
  - [x] 3.6 Set up auth routes and integrate with main app
  - [x] 3.7 Add password hashing for user authentication
  - [x] 3.8 Implement session management and token refresh

- [x] 4.0 Frontend Components and User Interface
  - [x] 4.1 Install required dependencies (react-hook-form, axios)
  - [x] 4.2 Create TypeScript type definitions for all entities
  - [x] 4.3 Set up API client service with authentication headers
  - [x] 4.4 Build reusable common components (Button, Input, ValidationMessage)
  - [x] 4.5 Create authentication hooks and context
  - [x] 4.6 Implement CandidateForm component with validation
  - [x] 4.7 Build Dashboard component with navigation
  - [x] 4.8 Create CandidateList and CandidateCard components
  - [x] 4.9 Add responsive styling and modern UI design
  - [x] 4.10 Implement form validation with real-time feedback

- [x] 5.0 File Upload and Management System
  - [x] 5.1 Install and configure Multer for file uploads
  - [x] 5.2 Create file service with PDF validation and size limits
  - [x] 5.3 Set up secure file storage directory structure
  - [x] 5.4 Implement FileUpload React component with drag-and-drop
  - [x] 5.5 Add file type and size validation on frontend
  - [x] 5.6 Create CV upload API endpoint with security checks
  - [x] 5.7 Implement file serving endpoint for CV downloads
  - [x] 5.8 Add upload progress indicators and error handling

- [ ] 6.0 Testing Implementation and Quality Assurance
  - [ ] 6.1 Set up Jest configuration for backend testing
  - [ ] 6.2 Write unit tests for all service layer functions
  - [ ] 6.3 Create integration tests for API endpoints
  - [ ] 6.4 Implement controller layer unit tests
  - [ ] 6.5 Add repository layer tests with database mocking
  - [ ] 6.6 Write frontend component tests with React Testing Library
  - [ ] 6.7 Create custom hook tests for authentication and candidates
  - [ ] 6.8 Implement end-to-end testing scenarios
  - [ ] 6.9 Set up test coverage reporting (target: 80%+)
  - [ ] 6.10 Add performance and security testing

- [ ] 7.0 Integration and Deployment Setup
  - [ ] 7.1 Configure environment variables for production
  - [ ] 7.2 Set up CORS configuration for frontend-backend communication
  - [ ] 7.3 Implement logging and monitoring setup
  - [ ] 7.4 Create Docker configurations for containerization
  - [ ] 7.5 Set up database backup and migration strategies
  - [ ] 7.6 Configure security headers and rate limiting
  - [ ] 7.7 Implement health check endpoints
  - [ ] 7.8 Create deployment scripts and documentation
