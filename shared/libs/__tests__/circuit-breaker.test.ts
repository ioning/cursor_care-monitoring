import { CircuitBreaker, CircuitState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenMaxCalls: 2,
    });
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute function when circuit is closed', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('should open circuit after failure threshold', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      // Circuit should be open now
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    });

    it('should transition to half-open after reset timeout', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Failure'));

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be in half-open state
      const state = circuitBreaker.getState();
      expect(state).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after successful calls in half-open state', async () => {
      const failingFn = jest.fn().mockRejectedValue(new Error('Failure'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Successful calls in half-open
      await circuitBreaker.execute(successFn);
      await circuitBreaker.execute(successFn);

      // Circuit should be closed
      const state = circuitBreaker.getState();
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('getState', () => {
    it('should return CLOSED state initially', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

