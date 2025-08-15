import jwt from 'jsonwebtoken';

/**
 * Simple in-memory token blacklist service
 * In production, this should use Redis or a database
 */
export class TokenBlacklistService {
  private blacklistedTokens: Set<string> = new Set();
  private tokenExpiries: Map<string, number> = new Map();

  /**
   * Add a token to the blacklist
   */
  blacklistToken(token: string): void {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        this.blacklistedTokens.add(token);
        this.tokenExpiries.set(token, decoded.exp * 1000); // Convert to milliseconds
      }
    } catch (error) {
      // If token can't be decoded, still blacklist it
      this.blacklistedTokens.add(token);
    }
  }

  /**
   * Check if a token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Clean up expired tokens from the blacklist
   * This should be called periodically
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];

    this.tokenExpiries.forEach((expiry, token) => {
      if (expiry < now) {
        expiredTokens.push(token);
      }
    });

    expiredTokens.forEach(token => {
      this.blacklistedTokens.delete(token);
      this.tokenExpiries.delete(token);
    });
  }

  /**
   * Get the number of blacklisted tokens
   */
  getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  clearBlacklist(): void {
    this.blacklistedTokens.clear();
    this.tokenExpiries.clear();
  }
}

// Singleton instance
export const tokenBlacklist = new TokenBlacklistService();

// Cleanup expired tokens every hour
setInterval(() => {
  tokenBlacklist.cleanupExpiredTokens();
}, 60 * 60 * 1000);
