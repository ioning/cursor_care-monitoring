import { createLogger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes in half-open to close
  timeout?: number; // Time in ms before trying half-open
  resetTimeout?: number; // Time in ms before resetting failure count
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {},
  ) {
    const {
      failureThreshold = 5,
      successThreshold = 2,
      timeout = 60000, // 1 minute
      resetTimeout = 300000, // 5 minutes
    } = options;

    this.options = {
      failureThreshold,
      successThreshold,
      timeout,
      resetTimeout,
    };

    this.logger = createLogger({ serviceName: 'circuit-breaker' });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition
    this.checkState();

    if (this.state === CircuitState.OPEN) {
      const error = new Error(
        `Circuit breaker is OPEN for ${this.name}. Request rejected.`,
      );
      this.logger.warn('Circuit breaker is open', {
        name: this.name,
        state: this.state,
      });
      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private checkState(): void {
    const now = Date.now();

    // Reset failure count if reset timeout passed
    if (
      this.lastFailureTime &&
      now - this.lastFailureTime > this.options.resetTimeout!
    ) {
      this.logger.info('Resetting circuit breaker failure count', {
        name: this.name,
      });
      this.failureCount = 0;
      this.lastFailureTime = null;
    }

    // Transition from OPEN to HALF_OPEN after timeout
    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime &&
      now - this.lastFailureTime > this.options.timeout!
    ) {
      this.logger.info('Circuit breaker transitioning to HALF_OPEN', {
        name: this.name,
      });
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.logger.info('Circuit breaker transitioning to CLOSED', {
          name: this.name,
        });
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in half-open
      this.logger.warn('Circuit breaker transitioning to OPEN (from HALF_OPEN)', {
        name: this.name,
        failureCount: this.failureCount,
      });
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.options.failureThreshold!
    ) {
      // Open circuit after threshold failures
      this.logger.warn('Circuit breaker transitioning to OPEN', {
        name: this.name,
        failureCount: this.failureCount,
      });
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.logger.info('Resetting circuit breaker', { name: this.name });
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}



export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes in half-open to close
  timeout?: number; // Time in ms before trying half-open
  resetTimeout?: number; // Time in ms before resetting failure count
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {},
  ) {
    const {
      failureThreshold = 5,
      successThreshold = 2,
      timeout = 60000, // 1 minute
      resetTimeout = 300000, // 5 minutes
    } = options;

    this.options = {
      failureThreshold,
      successThreshold,
      timeout,
      resetTimeout,
    };

    this.logger = createLogger({ serviceName: 'circuit-breaker' });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition
    this.checkState();

    if (this.state === CircuitState.OPEN) {
      const error = new Error(
        `Circuit breaker is OPEN for ${this.name}. Request rejected.`,
      );
      this.logger.warn('Circuit breaker is open', {
        name: this.name,
        state: this.state,
      });
      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private checkState(): void {
    const now = Date.now();

    // Reset failure count if reset timeout passed
    if (
      this.lastFailureTime &&
      now - this.lastFailureTime > this.options.resetTimeout!
    ) {
      this.logger.info('Resetting circuit breaker failure count', {
        name: this.name,
      });
      this.failureCount = 0;
      this.lastFailureTime = null;
    }

    // Transition from OPEN to HALF_OPEN after timeout
    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime &&
      now - this.lastFailureTime > this.options.timeout!
    ) {
      this.logger.info('Circuit breaker transitioning to HALF_OPEN', {
        name: this.name,
      });
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.logger.info('Circuit breaker transitioning to CLOSED', {
          name: this.name,
        });
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in half-open
      this.logger.warn('Circuit breaker transitioning to OPEN (from HALF_OPEN)', {
        name: this.name,
        failureCount: this.failureCount,
      });
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.options.failureThreshold!
    ) {
      // Open circuit after threshold failures
      this.logger.warn('Circuit breaker transitioning to OPEN', {
        name: this.name,
        failureCount: this.failureCount,
      });
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.logger.info('Resetting circuit breaker', { name: this.name });
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}







