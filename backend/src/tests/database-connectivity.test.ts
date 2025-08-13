import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Connectivity and Model Relationships', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data and disconnect
    await prisma.candidate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      // Test basic database connectivity
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should have the correct database schema', async () => {
      // Test that our tables exist
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;
      
      const tableNames = (tables as any[]).map(t => t.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('candidates');
    });
  });

  describe('User Model', () => {
    it('should create a user with default role', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('HR_RECRUITER'); // Default role
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should create a user with specific role', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'manager@example.com',
          name: 'Hiring Manager',
          role: 'HIRING_MANAGER'
        }
      });

      expect(user.role).toBe('HIRING_MANAGER');
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'unique@example.com',
          name: 'First User'
        }
      });

      // Attempting to create another user with the same email should fail
      await expect(
        prisma.user.create({
          data: {
            email: 'unique@example.com',
            name: 'Second User'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Candidate Model', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `user-${Date.now()}@example.com`,
          name: 'Test User for Candidates'
        }
      });
    });

    it('should create a candidate with all required fields', async () => {
      const candidate = await prisma.candidate.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          experienceLevel: 'MID_LEVEL',
          createdById: testUser.id
        }
      });

      expect(candidate.id).toBeDefined();
      expect(candidate.firstName).toBe('John');
      expect(candidate.lastName).toBe('Doe');
      expect(candidate.email).toBe('john.doe@example.com');
      expect(candidate.phone).toBe('+1234567890');
      expect(candidate.experienceLevel).toBe('MID_LEVEL');
      expect(candidate.createdById).toBe(testUser.id);
      expect(candidate.createdAt).toBeDefined();
      expect(candidate.updatedAt).toBeDefined();
    });

    it('should create a candidate with optional fields', async () => {
      const candidate = await prisma.candidate.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+0987654321',
          experienceLevel: 'SENIOR_LEVEL',
          address: '123 Main St, City, Country',
          education: 'Bachelor of Computer Science',
          workExperience: '5 years at Tech Company',
          cvFileName: 'jane_smith_cv.pdf',
          cvFilePath: '/uploads/cvs/jane_smith_cv.pdf',
          createdById: testUser.id
        }
      });

      expect(candidate.address).toBe('123 Main St, City, Country');
      expect(candidate.education).toBe('Bachelor of Computer Science');
      expect(candidate.workExperience).toBe('5 years at Tech Company');
      expect(candidate.cvFileName).toBe('jane_smith_cv.pdf');
      expect(candidate.cvFilePath).toBe('/uploads/cvs/jane_smith_cv.pdf');
    });

    it('should enforce unique email constraint for candidates', async () => {
      await prisma.candidate.create({
        data: {
          firstName: 'First',
          lastName: 'Candidate',
          email: 'duplicate@example.com',
          phone: '+1111111111',
          experienceLevel: 'ENTRY_LEVEL',
          createdById: testUser.id
        }
      });

      // Attempting to create another candidate with the same email should fail
      await expect(
        prisma.candidate.create({
          data: {
            firstName: 'Second',
            lastName: 'Candidate',
            email: 'duplicate@example.com',
            phone: '+2222222222',
            experienceLevel: 'MID_LEVEL',
            createdById: testUser.id
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `relationship-user-${Date.now()}@example.com`,
          name: 'Relationship Test User'
        }
      });
    });

    it('should establish relationship between user and candidates', async () => {
      // Create candidates for the user
      const candidate1 = await prisma.candidate.create({
        data: {
          firstName: 'Candidate',
          lastName: 'One',
          email: `candidate1-${Date.now()}@example.com`,
          phone: '+1111111111',
          experienceLevel: 'ENTRY_LEVEL',
          createdById: testUser.id
        }
      });

      const candidate2 = await prisma.candidate.create({
        data: {
          firstName: 'Candidate',
          lastName: 'Two',
          email: `candidate2-${Date.now()}@example.com`,
          phone: '+2222222222',
          experienceLevel: 'MID_LEVEL',
          createdById: testUser.id
        }
      });

      // Test the relationship from user side
      const userWithCandidates = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { candidatesCreated: true }
      });

      expect(userWithCandidates?.candidatesCreated).toHaveLength(2);
      expect(userWithCandidates?.candidatesCreated[0].createdById).toBe(testUser.id);
      expect(userWithCandidates?.candidatesCreated[1].createdById).toBe(testUser.id);

      // Test the relationship from candidate side
      const candidateWithUser = await prisma.candidate.findUnique({
        where: { id: candidate1.id },
        include: { createdBy: true }
      });

      expect(candidateWithUser?.createdBy.id).toBe(testUser.id);
      expect(candidateWithUser?.createdBy.email).toBe(testUser.email);
    });

    it('should prevent deletion of user with existing candidates', async () => {
      // Create a candidate for the user
      await prisma.candidate.create({
        data: {
          firstName: 'Protected',
          lastName: 'Candidate',
          email: `protected-${Date.now()}@example.com`,
          phone: '+3333333333',
          experienceLevel: 'SENIOR_LEVEL',
          createdById: testUser.id
        }
      });

      // Attempting to delete the user should fail due to foreign key constraint
      await expect(
        prisma.user.delete({
          where: { id: testUser.id }
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance Indexes', () => {
    it('should verify indexes exist for performance optimization', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, tablename, indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'candidates')
        ORDER BY tablename, indexname
      `;

      const indexNames = (indexes as any[]).map(idx => idx.indexname);
      
      // Check for our custom performance indexes
      expect(indexNames).toContain('users_role_idx');
      expect(indexNames).toContain('candidates_experienceLevel_idx');
      expect(indexNames).toContain('candidates_createdAt_idx');
      expect(indexNames).toContain('candidates_createdById_idx');
      
      // Check for unique constraint indexes
      expect(indexNames).toContain('users_email_key');
      expect(indexNames).toContain('candidates_email_key');
    });
  });
});
