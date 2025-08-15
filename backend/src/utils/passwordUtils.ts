import { securityConfig } from '../config/auth';

export interface IPasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordUtils {
  /**
   * Validates password strength based on security configuration
   */
  static validatePasswordStrength(password: string): IPasswordValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < securityConfig.passwordMinLength) {
      errors.push(`Password must be at least ${securityConfig.passwordMinLength} characters long`);
    }

    // Check maximum length (for bcrypt compatibility)
    if (password.length > 72) {
      errors.push('Password must be less than 72 characters long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special characters if required
    if (securityConfig.passwordRequireSpecialChars) {
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }

    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc/i,
      /(.)\1{2,}/, // Three or more repeated characters
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common weak patterns');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generates a random secure password
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = lowercase + uppercase + numbers;
    if (securityConfig.passwordRequireSpecialChars) {
      charset += specialChars;
    }

    let password = '';
    
    // Ensure at least one character from each required set
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    if (securityConfig.passwordRequireSpecialChars) {
      password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Calculates password entropy (bits)
   */
  static calculatePasswordEntropy(password: string): number {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Approximate special chars
    
    return Math.log2(charsetSize) * password.length;
  }
}
