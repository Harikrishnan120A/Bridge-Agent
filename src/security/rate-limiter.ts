import { RateCounter } from '../types';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RateLimiter {
  private limits: Record<string, number> = {
    actionsPerMinute: 10,
    actionsPerSession: 50,
    commandsPerMinute: 5,
    fileEditsPerMinute: 20,
    previewsPerMinute: 3
  };

  private counters: Map<string, RateCounter> = new Map();
  private resetInterval: NodeJS.Timeout;

  constructor(customLimits?: Partial<Record<string, number>>) {
    if (customLimits) {
      this.limits = { ...this.limits, ...customLimits } as Record<string, number>;
    }

    // Reset counters every minute
    this.resetInterval = setInterval(() => {
      this.resetExpiredCounters();
    }, 60000) as NodeJS.Timeout;
  }

  async checkLimit(type: string, identifier: string = 'default'): Promise<boolean> {
    const key = `${type}:${identifier}`;
    const limit = this.limits[type];

    if (!limit) {
      // No limit configured for this type
      return true;
    }

    let counter = this.counters.get(key);

    if (!counter) {
      counter = {
        count: 0,
        resetTime: new Date(Date.now() + 60000) // Reset in 1 minute
      };
      this.counters.set(key, counter);
    }

    // Check if counter should be reset
    if (Date.now() >= counter.resetTime.getTime()) {
      counter.count = 0;
      counter.resetTime = new Date(Date.now() + 60000);
    }

    // Check if limit exceeded
    if (counter.count >= limit) {
      const waitTime = Math.ceil((counter.resetTime.getTime() - Date.now()) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded for ${type}. Wait ${waitTime} seconds.`
      );
    }

    // Increment counter
    counter.count++;
    this.counters.set(key, counter);

    return true;
  }

  private resetExpiredCounters(): void {
    const now = Date.now();
    
    for (const [key, counter] of this.counters.entries()) {
      if (now >= counter.resetTime.getTime()) {
        counter.count = 0;
        counter.resetTime = new Date(now + 60000);
      }
    }
  }

  getRemainingAttempts(type: string, identifier: string = 'default'): number {
    const key = `${type}:${identifier}`;
    const limit = this.limits[type];

    if (!limit) {
      return Infinity;
    }

    const counter = this.counters.get(key);
    if (!counter) {
      return limit;
    }

    return Math.max(0, limit - counter.count);
  }

  getWaitTime(type: string, identifier: string = 'default'): number {
    const key = `${type}:${identifier}`;
    const counter = this.counters.get(key);

    if (!counter) {
      return 0;
    }

    return Math.max(0, counter.resetTime.getTime() - Date.now());
  }

  reset(type?: string, identifier?: string): void {
    if (type && identifier) {
      const key = `${type}:${identifier}`;
      this.counters.delete(key);
    } else if (type) {
      // Reset all counters for this type
      for (const key of this.counters.keys()) {
        if (key.startsWith(`${type}:`)) {
          this.counters.delete(key);
        }
      }
    } else {
      // Reset all counters
      this.counters.clear();
    }
  }

  dispose(): void {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }
}
