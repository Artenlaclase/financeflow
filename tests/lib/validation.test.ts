import { describe, it, expect } from 'vitest';
import {
  validateYear,
  validateMonth,
  validatePeriod,
  validateAnalyticsParams,
  validateAmount,
  getFirestoreErrorMessage
} from '@/lib/validation';

describe('validation', () => {
  describe('validateYear', () => {
    const currentYear = new Date().getFullYear();

    it('should validate current year', () => {
      const result = validateYear(currentYear);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate past years (within range)', () => {
      const result = validateYear(2020);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject years before MIN_YEAR (2000)', () => {
      const result = validateYear(1999);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('year');
      expect(result.errors[0].message).toContain('2000');
    });

    it('should reject future years', () => {
      const futureYear = currentYear + 1;
      const result = validateYear(futureYear);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('year');
      expect(result.errors[0].message).toContain('futuro');
    });

    it('should handle edge case: MIN_YEAR', () => {
      const result = validateYear(2000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMonth', () => {
    it('should validate valid months (0-11)', () => {
      for (let month = 0; month <= 11; month++) {
        const result = validateMonth(month);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should accept undefined (optional month)', () => {
      const result = validateMonth(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject month < 0', () => {
      const result = validateMonth(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('month');
    });

    it('should reject month > 11', () => {
      const result = validateMonth(12);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('month');
    });

    it('should reject non-integer values', () => {
      const result = validateMonth(5.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validatePeriod', () => {
    const validPeriods = ['thisMonth', 'lastMonth', 'last3Months', 'last6Months', 'thisYear', 'custom'];

    it('should validate all standard periods', () => {
      validPeriods.forEach(period => {
        const result = validatePeriod(period);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid periods', () => {
      const result = validatePeriod('invalidPeriod');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('period');
    });

    it('should accept custom valid periods list', () => {
      const customPeriods = ['weekly', 'monthly', 'yearly'];
      const result = validatePeriod('monthly', customPeriods);
      expect(result.isValid).toBe(true);
    });

    it('should reject when not in custom valid periods list', () => {
      const customPeriods = ['weekly', 'monthly', 'yearly'];
      const result = validatePeriod('daily', customPeriods);
      expect(result.isValid).toBe(false);
    });

    it('should handle empty string', () => {
      const result = validatePeriod('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAnalyticsParams', () => {
    const currentYear = new Date().getFullYear();

    it('should validate complete valid params', () => {
      const result = validateAnalyticsParams('thisMonth', currentYear, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate params without month', () => {
      const result = validateAnalyticsParams('thisYear', currentYear);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple errors', () => {
      const result = validateAnalyticsParams('invalidPeriod', 1999, 15);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should return individual validation errors', () => {
      const result = validateAnalyticsParams('invalidPeriod', currentYear, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('period');
    });

    it('should validate all fields together', () => {
      const result = validateAnalyticsParams('lastMonth', 2022, 5);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive numbers', () => {
      const result = validateAmount(100);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate decimal numbers', () => {
      const result = validateAmount(99.99);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative numbers', () => {
      const result = validateAmount(-50);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('amount');
    });

    it('should reject zero', () => {
      const result = validateAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('amount');
    });

    it('should reject NaN', () => {
      const result = validateAmount(NaN);
      expect(result.isValid).toBe(false);
    });

    it('should reject non-finite numbers', () => {
      const result = validateAmount(Infinity);
      expect(result.isValid).toBe(false);
    });

    it('should handle very small positive numbers', () => {
      const result = validateAmount(0.01);
      expect(result.isValid).toBe(true);
    });

    it('should handle large numbers', () => {
      const result = validateAmount(999999999.99);
      expect(result.isValid).toBe(true);
    });
  });

  describe('getFirestoreErrorMessage', () => {
    it('should return user-friendly message for permission-denied', () => {
      const message = getFirestoreErrorMessage('permission-denied');
      expect(message).toContain('permisos');
    });

    it('should return user-friendly message for not-found', () => {
      const message = getFirestoreErrorMessage('not-found');
      expect(message).toContain('no se encontró');
    });

    it('should return user-friendly message for already-exists', () => {
      const message = getFirestoreErrorMessage('already-exists');
      expect(message).toContain('ya existe');
    });

    it('should return user-friendly message for unauthenticated', () => {
      const message = getFirestoreErrorMessage('unauthenticated');
      expect(message).toContain('autenticado');
    });

    it('should return user-friendly message for unavailable', () => {
      const message = getFirestoreErrorMessage('unavailable');
      expect(message).toContain('disponible');
    });

    it('should return generic message for unknown errors', () => {
      const message = getFirestoreErrorMessage('unknown-error-code');
      expect(message).toContain('Error');
    });

    it('should handle empty string', () => {
      const message = getFirestoreErrorMessage('');
      expect(message).toBeTruthy();
    });
  });
});
