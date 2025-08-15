import { Request, Response, NextFunction } from 'express';
import { ownershipMiddleware, ResourceOwnership } from './roleMiddleware';
import { ICandidateRepository } from '../interfaces/ICandidate';
import { IUserRepository } from '../interfaces/IUser';

/**
 * Factory functions for creating resource ownership middleware
 */
export class ResourceOwnershipMiddlewareFactory {
  
  /**
   * Create middleware to check candidate ownership
   */
  static createCandidateOwnershipMiddleware(candidateRepository: ICandidateRepository) {
    return ownershipMiddleware(async (req: Request): Promise<ResourceOwnership | null> => {
      try {
        const candidateId = parseInt(req.params.id);
        
        if (!candidateId) {
          return null;
        }

        const candidate = await candidateRepository.findById(candidateId);
        
        if (!candidate) {
          return null;
        }

        return {
          createdById: candidate.createdById,
          userId: candidate.createdById // For candidates, userId is the creator
        };
      } catch (error) {
        return null;
      }
    });
  }

  /**
   * Create middleware to check user profile ownership
   */
  static createUserOwnershipMiddleware(userRepository: IUserRepository) {
    return ownershipMiddleware(async (req: Request): Promise<ResourceOwnership | null> => {
      try {
        const userId = parseInt(req.params.id);
        
        if (!userId) {
          return null;
        }

        const user = await userRepository.findById(userId);
        
        if (!user) {
          return null;
        }

        return {
          userId: user.id
        };
      } catch (error) {
        return null;
      }
    });
  }

  /**
   * Create middleware for operations that require candidate creation ownership
   */
  static createCandidateCreatorOnlyMiddleware(candidateRepository: ICandidateRepository) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = req.user;
        const candidateId = parseInt(req.params.id);
        
        if (!user || !candidateId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
          return;
        }

        // Admins can access any candidate
        if (user.role === 'ADMIN') {
          next();
          return;
        }

        const candidate = await candidateRepository.findById(candidateId);
        
        if (!candidate) {
          res.status(404).json({
            success: false,
            error: 'Candidate not found',
            code: 'CANDIDATE_NOT_FOUND'
          });
          return;
        }

        // Check if user created this candidate
        if (candidate.createdById !== user.id) {
          res.status(403).json({
            success: false,
            error: 'You can only modify candidates you created',
            code: 'CREATOR_ACCESS_ONLY'
          });
          return;
        }

        next();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Ownership check failed',
          code: 'OWNERSHIP_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * Create middleware for conditional ownership (owners + admins + managers)
   */
  static createConditionalOwnershipMiddleware(candidateRepository: ICandidateRepository) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const user = req.user;
        const candidateId = parseInt(req.params.id);
        
        if (!user || !candidateId) {
          res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
          return;
        }

        // Admins and Hiring Managers can access any candidate
        if (user.role === 'ADMIN' || user.role === 'HIRING_MANAGER') {
          next();
          return;
        }

        const candidate = await candidateRepository.findById(candidateId);
        
        if (!candidate) {
          res.status(404).json({
            success: false,
            error: 'Candidate not found',
            code: 'CANDIDATE_NOT_FOUND'
          });
          return;
        }

        // HR Recruiters can only access candidates they created
        if (user.role === 'HR_RECRUITER' && candidate.createdById !== user.id) {
          res.status(403).json({
            success: false,
            error: 'HR Recruiters can only access candidates they created',
            code: 'LIMITED_ACCESS_RIGHTS'
          });
          return;
        }

        next();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Conditional ownership check failed',
          code: 'CONDITIONAL_OWNERSHIP_ERROR'
        });
      }
    };
  }
}

/**
 * Common resource ownership middleware instances
 * (These would be instantiated with actual repositories in the route files)
 */
export const createResourceOwnershipMiddlewares = (
  candidateRepository: ICandidateRepository,
  userRepository: IUserRepository
) => {
  return {
    candidateOwnership: ResourceOwnershipMiddlewareFactory.createCandidateOwnershipMiddleware(candidateRepository),
    userOwnership: ResourceOwnershipMiddlewareFactory.createUserOwnershipMiddleware(userRepository),
    candidateCreatorOnly: ResourceOwnershipMiddlewareFactory.createCandidateCreatorOnlyMiddleware(candidateRepository),
    conditionalCandidateAccess: ResourceOwnershipMiddlewareFactory.createConditionalOwnershipMiddleware(candidateRepository)
  };
};
