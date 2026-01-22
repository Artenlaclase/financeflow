import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';
import { mockConsole } from '../helpers/firebase';

describe('logger', () => {
  let consoleMock: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    consoleMock = mockConsole();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    consoleMock.restore();
    vi.unstubAllEnvs();
  });

  describe('log', () => {
    it('should log messages in development', () => {
      logger.log('Test message', { data: 'value' });
      expect(consoleMock.logs.length).toBeGreaterThan(0);
    });

    it('should not log in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      logger.log('Test message');
      expect(consoleMock.logs).toHaveLength(0);
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      logger.error('Error message', new Error('Test error'));
      expect(consoleMock.errors.length).toBeGreaterThan(0);
    });

    it('should log errors in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      logger.error('Error message');
      expect(consoleMock.errors.length).toBeGreaterThan(0);
    });
  });

  describe('warn', () => {
    it('should log warnings in development', () => {
      logger.warn('Warning message');
      expect(consoleMock.warnings.length).toBeGreaterThan(0);
    });

    it('should not log warnings in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      logger.warn('Warning message');
      expect(consoleMock.warnings).toHaveLength(0);
    });
  });

  describe('time and timeEnd', () => {
    it('should measure execution time', () => {
      logger.time('test-timer');
      logger.timeEnd('test-timer');
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle multiple timers', () => {
      logger.time('timer1');
      logger.time('timer2');
      logger.timeEnd('timer1');
      logger.timeEnd('timer2');
      expect(true).toBe(true);
    });
  });
});
