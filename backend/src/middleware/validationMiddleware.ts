import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ExperienceLevel } from '../interfaces/ICandidate';
import { IApiResponse } from '../interfaces/IFileService';

export const validateCandidate: ValidationChain[] = [
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .escape(),
  
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  
  body('phone')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('experienceLevel')
    .isIn(Object.values(ExperienceLevel))
    .withMessage('Invalid experience level'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
    .escape(),
  
  body('education')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Education must be less than 1000 characters')
    .escape(),
  
  body('workExperience')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Work experience must be less than 2000 characters')
    .escape()
];

export const validateCandidateUpdate: ValidationChain[] = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .escape(),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .escape(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('experienceLevel')
    .optional()
    .isIn(Object.values(ExperienceLevel))
    .withMessage('Invalid experience level'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
    .escape(),
  
  body('education')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Education must be less than 1000 characters')
    .escape(),
  
  body('workExperience')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Work experience must be less than 2000 characters')
    .escape()
];

export const validateLoginRequest: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
    
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];

export const validateRegistrationRequest: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .escape(),
    
  body('role')
    .optional()
    .isIn(['HR_RECRUITER', 'HIRING_MANAGER', 'ADMIN'])
    .withMessage('Invalid role')
];

export const validateChangePasswordRequest: ValidationChain[] = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

export const validatePasswordResetRequest: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

export const validatePasswordResetConfirm: ValidationChain[] = [
  body('token')
    .isLength({ min: 1 })
    .withMessage('Reset token is required')
    .isAlphanumeric()
    .withMessage('Invalid reset token format'),
    
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(error => error.msg)
    } as IApiResponse);
    return;
  }
  
  next();
};
