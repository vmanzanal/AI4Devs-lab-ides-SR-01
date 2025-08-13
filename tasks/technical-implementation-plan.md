# Technical Implementation Plan - ATS Candidate Management

## Database Schema Design

### Updated Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  HR_RECRUITER
  HIRING_MANAGER
  ADMIN
}

enum ExperienceLevel {
  ENTRY_LEVEL
  MID_LEVEL
  SENIOR_LEVEL
  EXECUTIVE
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      UserRole @default(HR_RECRUITER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  candidatesCreated Candidate[] @relation("CandidateCreatedBy")

  @@map("users")
}

model Candidate {
  id              Int             @id @default(autoincrement())
  firstName       String
  lastName        String
  email           String          @unique
  phone           String
  experienceLevel ExperienceLevel
  address         String?
  education       String?
  workExperience  String?
  cvFileName      String?
  cvFilePath      String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  createdById     Int

  // Relations
  createdBy User @relation("CandidateCreatedBy", fields: [createdById], references: [id])

  @@map("candidates")
}
```

### Migration Strategy

1. **Step 1:** Add role enum and update User model
2. **Step 2:** Create Candidate model with relationships
3. **Step 3:** Create indexes for performance optimization

```sql
-- Performance indexes
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_experience_level ON candidates(experience_level);
CREATE INDEX idx_candidates_created_at ON candidates(created_at);
CREATE INDEX idx_users_role ON users(role);
```

## Backend Architecture (SOLID Principles)

### Directory Structure

```
backend/src/
├── controllers/           # Request handlers
│   ├── authController.ts
│   ├── candidateController.ts
│   └── userController.ts
├── services/             # Business logic
│   ├── authService.ts
│   ├── candidateService.ts
│   ├── fileService.ts
│   └── validationService.ts
├── repositories/         # Data access layer
│   ├── userRepository.ts
│   └── candidateRepository.ts
├── interfaces/           # Type definitions
│   ├── IUser.ts
│   ├── ICandidate.ts
│   └── IFileService.ts
├── middleware/           # Express middleware
│   ├── authMiddleware.ts
│   ├── roleMiddleware.ts
│   └── validationMiddleware.ts
├── utils/               # Utility functions
│   ├── fileUtils.ts
│   └── validationUtils.ts
├── routes/              # API routes
│   ├── authRoutes.ts
│   ├── candidateRoutes.ts
│   └── userRoutes.ts
├── config/              # Configuration
│   ├── database.ts
│   └── multer.ts
└── tests/               # Test files
    ├── controllers/
    ├── services/
    └── integration/
```

### Service Layer Implementation (SOLID)

#### 1. Single Responsibility Principle

```typescript
// candidateService.ts
export class CandidateService {
  constructor(
    private candidateRepository: ICandidateRepository,
    private fileService: IFileService,
    private validationService: IValidationService
  ) {}

  async createCandidate(candidateData: CreateCandidateDto, createdById: number): Promise<Candidate> {
    // Single responsibility: candidate creation logic only
    await this.validationService.validateCandidateData(candidateData);
    await this.checkDuplicateEmail(candidateData.email);
    return this.candidateRepository.create({ ...candidateData, createdById });
  }

  private async checkDuplicateEmail(email: string): Promise<void> {
    const existing = await this.candidateRepository.findByEmail(email);
    if (existing) {
      throw new Error('Candidate with this email already exists');
    }
  }
}

// fileService.ts
export class FileService implements IFileService {
  async uploadCV(file: Express.Multer.File, candidateId: number): Promise<string> {
    // Single responsibility: file handling only
    this.validateFileType(file);
    this.validateFileSize(file);
    return this.saveFile(file, candidateId);
  }
}
```

#### 2. Open/Closed Principle

```typescript
// interfaces/IValidationService.ts
export interface IValidationService {
  validateCandidateData(data: CreateCandidateDto): Promise<void>;
}

// Base validation service
export abstract class BaseValidationService implements IValidationService {
  abstract validateCandidateData(data: CreateCandidateDto): Promise<void>;
  
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Extended validation service (open for extension)
export class EnhancedValidationService extends BaseValidationService {
  async validateCandidateData(data: CreateCandidateDto): Promise<void> {
    // Extended validation with additional rules
    await super.validateCandidateData(data);
    await this.validatePhoneNumber(data.phone);
    await this.validateExperienceLevel(data.experienceLevel);
  }
}
```

#### 3. Liskov Substitution Principle

```typescript
// User role abstraction
export abstract class BaseUser {
  constructor(protected userData: User) {}
  
  abstract canAddCandidate(): boolean;
  abstract getPermissions(): string[];
}

export class HRRecruiter extends BaseUser {
  canAddCandidate(): boolean {
    return true;
  }
  
  getPermissions(): string[] {
    return ['add_candidate', 'view_candidates', 'edit_candidates'];
  }
}

export class HiringManager extends BaseUser {
  canAddCandidate(): boolean {
    return true;
  }
  
  getPermissions(): string[] {
    return ['add_candidate', 'view_candidates'];
  }
}
```

#### 4. Interface Segregation Principle

```typescript
// Segregated interfaces
export interface ICandidateReader {
  findById(id: number): Promise<Candidate | null>;
  findByEmail(email: string): Promise<Candidate | null>;
  findAll(filters?: CandidateFilters): Promise<Candidate[]>;
}

export interface ICandidateWriter {
  create(data: CreateCandidateDto): Promise<Candidate>;
  update(id: number, data: UpdateCandidateDto): Promise<Candidate>;
  delete(id: number): Promise<void>;
}

export interface ICandidateRepository extends ICandidateReader, ICandidateWriter {}
```

#### 5. Dependency Inversion Principle

```typescript
// High-level modules depend on abstractions
export class CandidateController {
  constructor(
    private candidateService: ICandidateService,
    private authService: IAuthService
  ) {}

  async createCandidate(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser(req);
      const candidate = await this.candidateService.createCandidate(req.body, user.id);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

### API Endpoints Design

```typescript
// candidateRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { validateCandidate } from '../middleware/validationMiddleware';

const router = Router();

// POST /api/candidates - Create new candidate
router.post('/', 
  authMiddleware,
  roleMiddleware(['HR_RECRUITER', 'HIRING_MANAGER']),
  validateCandidate,
  candidateController.createCandidate
);

// GET /api/candidates - List candidates with filtering
router.get('/', 
  authMiddleware,
  roleMiddleware(['HR_RECRUITER', 'HIRING_MANAGER']),
  candidateController.getCandidates
);

// GET /api/candidates/:id - Get specific candidate
router.get('/:id', 
  authMiddleware,
  roleMiddleware(['HR_RECRUITER', 'HIRING_MANAGER']),
  candidateController.getCandidateById
);

// POST /api/candidates/:id/cv - Upload CV
router.post('/:id/cv', 
  authMiddleware,
  roleMiddleware(['HR_RECRUITER', 'HIRING_MANAGER']),
  upload.single('cv'),
  candidateController.uploadCV
);

export default router;
```

## Frontend Architecture

### Component Structure

```
frontend/src/
├── components/
│   ├── common/              # Reusable components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── FileUpload/
│   │   └── ValidationMessage/
│   ├── candidate/           # Candidate-specific components
│   │   ├── CandidateForm/
│   │   ├── CandidateList/
│   │   └── CandidateCard/
│   └── layout/              # Layout components
│       ├── Header/
│       ├── Sidebar/
│       └── Dashboard/
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useCandidates.ts
│   └── useFileUpload.ts
├── services/                # API services
│   ├── authService.ts
│   ├── candidateService.ts
│   └── apiClient.ts
├── types/                   # TypeScript definitions
│   ├── User.ts
│   ├── Candidate.ts
│   └── API.ts
├── utils/                   # Utility functions
│   ├── validation.ts
│   └── formatters.ts
└── tests/                   # Test files
    ├── components/
    ├── hooks/
    └── services/
```

### Key React Components

#### CandidateForm Component

```typescript
// components/candidate/CandidateForm/CandidateForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CandidateFormData } from '../../../types/Candidate';
import { Button } from '../../common/Button/Button';
import { Input } from '../../common/Input/Input';
import { FileUpload } from '../../common/FileUpload/FileUpload';
import { ValidationMessage } from '../../common/ValidationMessage/ValidationMessage';

export const CandidateForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CandidateFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: CandidateFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await candidateService.createCandidate(data);
      // Success handling
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="candidate-form">
      <Input
        {...register('firstName', { required: 'First name is required' })}
        label="First Name *"
        error={errors.firstName?.message}
      />
      
      <Input
        {...register('lastName', { required: 'Last name is required' })}
        label="Last Name *"
        error={errors.lastName?.message}
      />
      
      <Input
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format'
          }
        })}
        label="Email *"
        type="email"
        error={errors.email?.message}
      />
      
      {/* Additional form fields */}
      
      <FileUpload
        accept=".pdf"
        maxSize={5 * 1024 * 1024} // 5MB
        onFileSelect={(file) => setSelectedFile(file)}
      />
      
      {submitError && <ValidationMessage type="error" message={submitError} />}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding Candidate...' : 'Add Candidate'}
      </Button>
    </form>
  );
};
```

## Test-Driven Development Strategy

### Backend Testing Structure

```typescript
// tests/services/candidateService.test.ts
describe('CandidateService', () => {
  let candidateService: CandidateService;
  let mockRepository: jest.Mocked<ICandidateRepository>;
  let mockFileService: jest.Mocked<IFileService>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockFileService = createMockFileService();
    candidateService = new CandidateService(mockRepository, mockFileService);
  });

  describe('createCandidate', () => {
    it('should create candidate with valid data', async () => {
      // Arrange
      const candidateData = createValidCandidateData();
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdCandidate);

      // Act
      const result = await candidateService.createCandidate(candidateData, 1);

      // Assert
      expect(result).toEqual(createdCandidate);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...candidateData,
        createdById: 1
      });
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const candidateData = createValidCandidateData();
      mockRepository.findByEmail.mockResolvedValue(existingCandidate);

      // Act & Assert
      await expect(candidateService.createCandidate(candidateData, 1))
        .rejects.toThrow('Candidate with this email already exists');
    });
  });
});
```

### Frontend Testing Structure

```typescript
// tests/components/CandidateForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CandidateForm } from '../../../components/candidate/CandidateForm/CandidateForm';
import * as candidateService from '../../../services/candidateService';

jest.mock('../../../services/candidateService');

describe('CandidateForm', () => {
  it('should submit form with valid data', async () => {
    // Arrange
    const mockCreateCandidate = jest.spyOn(candidateService, 'createCandidate')
      .mockResolvedValue(mockCandidate);
    
    render(<CandidateForm />);

    // Act
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john.doe@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /add candidate/i }));

    // Assert
    await waitFor(() => {
      expect(mockCreateCandidate).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        // ... other fields
      });
    });
  });

  it('should display validation errors for empty required fields', async () => {
    // Arrange
    render(<CandidateForm />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /add candidate/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

## Implementation Timeline

### Week 1-2: Database & Backend Foundation
1. **Day 1-2:** Database schema design and Prisma migrations
2. **Day 3-4:** Authentication and authorization middleware
3. **Day 5-6:** Candidate service layer with SOLID principles
4. **Day 7-8:** API endpoints and file upload functionality
5. **Day 9-10:** Backend unit and integration tests

### Week 3-4: Frontend Development
1. **Day 1-2:** Project structure and common components
2. **Day 3-4:** Candidate form with validation
3. **Day 5-6:** File upload component and integration
4. **Day 7-8:** Dashboard and navigation
5. **Day 9-10:** Frontend component and integration tests

### Week 5: Integration & Testing
1. **Day 1-2:** End-to-end testing setup and scenarios
2. **Day 3-4:** Security testing and vulnerability assessment
3. **Day 5:** Performance testing and optimization

### Week 6: Deployment & Documentation
1. **Day 1-2:** Production deployment setup
2. **Day 3-4:** User documentation and training materials
3. **Day 5:** Final testing and go-live preparation

## Security Implementation

### Authentication & Authorization

```typescript
// middleware/authMiddleware.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await userRepository.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// middleware/roleMiddleware.ts
export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Input Validation & Sanitization

```typescript
// middleware/validationMiddleware.ts
import { body, validationResult } from 'express-validator';

export const validateCandidate = [
  body('firstName').trim().isLength({ min: 1 }).escape(),
  body('lastName').trim().isLength({ min: 1 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().isMobilePhone(),
  body('experienceLevel').isIn(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE']),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

This comprehensive technical implementation plan provides a solid foundation for developing the ATS candidate management system following SOLID principles and TDD methodology. The architecture is designed to be scalable, maintainable, and secure.
