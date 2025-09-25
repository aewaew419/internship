/**
 * Client-side Rate Limiting for Authentication Attempts
 * Provides protection against brute force attacks
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  progressiveDelay?: boolean;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanupExpiredAttempts();
  }

  /**
   * Check if an action is allowed for a given identifier
   */
  isAllowed(identifier: string): { allowed: boolean; remainingAttempts?: number; resetTime?: number; waitTime?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return { allowed: true, remainingAttempts: this.config.maxAttempts - 1 };
    }

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        waitTime: record.blockedUntil - now,
        resetTime: record.blockedUntil
      };
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.config.windowMs) {
      this.attempts.delete(identifier);
      return { allowed: true, remainingAttempts: this.config.maxAttempts - 1 };
    }

    // Check if max attempts reached
    if (record.count >= this.config.maxAttempts) {
      const blockDuration = this.calculateBlockDuration(record.count);
      const blockedUntil = now + blockDuration;
      
      this.attempts.set(identifier, {
        ...record,
        blockedUntil
      });

      return {
        allowed: false,
        waitTime: blockDuration,
        resetTime: blockedUntil
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.config.maxAttempts - record.count
    };
  }

  /**
   * Record an attempt for a given identifier
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      // Reset if window expired
      if (now - record.firstAttempt > this.config.windowMs) {
        this.attempts.set(identifier, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now
        });
      } else {
        this.attempts.set(identifier, {
          ...record,
          count: record.count + 1,
          lastAttempt: now
        });
      }
    }
  }

  /**
   * Reset attempts for a given identifier (e.g., on successful login)
   */
  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get current attempt count for identifier
   */
  getAttemptCount(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const now = Date.now();
    if (now - record.firstAttempt > this.config.windowMs) {
      this.attempts.delete(identifier);
      return 0;
    }

    return record.count;
  }

  /**
   * Calculate block duration with progressive delay
   */
  private calculateBlockDuration(attemptCount: number): number {
    if (!this.config.progressiveDelay) {
      return this.config.blockDurationMs;
    }

    // Progressive delay: 1min, 5min, 15min, 30min, 1hr
    const delays = [60000, 300000, 900000, 1800000, 3600000];
    const delayIndex = Math.min(attemptCount - this.config.maxAttempts, delays.length - 1);
    return delays[delayIndex];
  }

  /**
   * Clean up expired attempts
   */
  private cleanupExpiredAttempts(): void {
    const cleanup = () => {
      const now = Date.now();
      for (const [identifier, record] of Array.from(this.attempts.entries())) {
        if (now - record.firstAttempt > this.config.windowMs && 
            (!record.blockedUntil || now > record.blockedUntil)) {
          this.attempts.delete(identifier);
        }
      }
    };

    // Run cleanup every 5 minutes
    setInterval(cleanup, 5 * 60 * 1000);
  }
}

// Pre-configured rate limiters for different scenarios
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
  progressiveDelay: true
});

export const registrationRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 30 * 60 * 1000, // 30 minutes
  progressiveDelay: false
});

export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000, // 1 hour
  progressiveDelay: false
});

/**
 * Get user identifier for rate limiting (IP-based fallback)
 */
export function getUserIdentifier(email?: string, studentId?: string): string {
  if (email) return `email:${email}`;
  if (studentId) return `student:${studentId}`;
  
  // Fallback to a browser fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset()
  ].join('|');
  
  return `fingerprint:${btoa(fingerprint)}`;
}

/**
 * Format remaining time for user display
 */
export function formatWaitTime(waitTimeMs: number): string {
  const minutes = Math.ceil(waitTimeMs / (60 * 1000));
  
  if (minutes < 60) {
    return `${minutes} นาที`;
  }
  
  const hours = Math.ceil(minutes / 60);
  return `${hours} ชั่วโมง`;
}

/**
 * Hook for using rate limiting in components
 */
export function useRateLimit(limiter: RateLimiter, identifier: string) {
  const checkLimit = () => limiter.isAllowed(identifier);
  const recordAttempt = () => limiter.recordAttempt(identifier);
  const resetAttempts = () => limiter.resetAttempts(identifier);
  const getAttemptCount = () => limiter.getAttemptCount(identifier);

  return {
    checkLimit,
    recordAttempt,
    resetAttempts,
    getAttemptCount
  };
}