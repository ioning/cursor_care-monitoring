import { retryWithBackoff, RetryOptions } from '../retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await retryWithBackoff(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValue('success');

    const options: RetryOptions = {
      maxRetries: 3,
      initialDelay: 10,
      maxDelay: 100,
      backoffMultiplier: 2,
    };

    const result = await retryWithBackoff(fn, options);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const options: RetryOptions = {
      maxRetries: 2,
      initialDelay: 10,
    };

    await expect(retryWithBackoff(fn, options)).rejects.toThrow('Persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failure'));
    const startTime = Date.now();

    const options: RetryOptions = {
      maxRetries: 2,
      initialDelay: 50,
      backoffMultiplier: 2,
    };

    try {
      await retryWithBackoff(fn, options);
    } catch (e) {
      // Expected
    }

    const elapsed = Date.now() - startTime;
    // Should have waited at least initialDelay + initialDelay * 2
    expect(elapsed).toBeGreaterThanOrEqual(50 + 100);
  });

  it('should respect maxDelay', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failure'));
    const startTime = Date.now();

    const options: RetryOptions = {
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 100,
      backoffMultiplier: 2,
    };

    try {
      await retryWithBackoff(fn, options);
    } catch (e) {
      // Expected
    }

    const elapsed = Date.now() - startTime;
    // Should not exceed maxDelay * retries
    expect(elapsed).toBeLessThan(1000);
  });
});

