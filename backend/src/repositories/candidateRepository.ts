import { PrismaClient } from '@prisma/client';
import { 
  ICandidate, 
  ICreateCandidateDto, 
  IUpdateCandidateDto, 
  ICandidateRepository,
  ICandidateFilters,
  ICandidateListResponse
} from '../interfaces/ICandidate';

export class CandidateRepository implements ICandidateRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<ICandidate | null> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    return candidate;
  }

  async findByEmail(email: string): Promise<ICandidate | null> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { email },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    return candidate;
  }

  async findAll(filters: ICandidateFilters = {}): Promise<ICandidateListResponse> {
    const {
      experienceLevel,
      search,
      createdById,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }
    
    if (createdById) {
      where.createdById = createdById;
    }
    
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = createdAfter;
      if (createdBefore) where.createdAt.lte = createdBefore;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.candidate.count({ where });
    
    // Get candidates with pagination
    const candidates = await this.prisma.candidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    return {
      candidates,
      total,
      page,
      totalPages
    };
  }

  async create(data: ICreateCandidateDto & { createdById: number }): Promise<ICandidate> {
    const candidate = await this.prisma.candidate.create({
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    return candidate;
  }

  async update(id: number, data: IUpdateCandidateDto): Promise<ICandidate> {
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    return candidate;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.candidate.delete({
      where: { id }
    });
  }

  async updateCVInfo(id: number, cvFileName: string, cvFilePath: string): Promise<ICandidate> {
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data: {
        cvFileName,
        cvFilePath
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    return candidate;
  }
}
