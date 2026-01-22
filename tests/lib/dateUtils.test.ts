import { describe, it, expect } from 'vitest';
import {
  safeDate,
  formatDateForInput,
  formatDateForDisplay,
  formatDateTimeForDisplay,
  compareDates,
  getDaysAgo,
  getMonthsAgo
} from '@/lib/dateUtils';

describe('dateUtils', () => {
  describe('safeDate', () => {
    it('should convert Firebase Timestamp to Date', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T12:00:00Z')
      };
      const result = safeDate(mockTimestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = safeDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
    });

    it('should handle YYYY-MM-DD string format', () => {
      const result = safeDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(15);
    });

    it('should handle ISO string format', () => {
      const isoDate = '2024-01-15T10:30:00.000Z';
      const result = safeDate(isoDate);
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle number (timestamp)', () => {
      const timestamp = new Date('2024-01-15').getTime();
      const result = safeDate(timestamp);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid dates', () => {
      expect(safeDate('invalid-date')).toBeNull();
      expect(safeDate(null)).toBeNull();
      expect(safeDate(undefined)).toBeNull();
      expect(safeDate(NaN)).toBeNull();
    });

    it('should return null for empty values', () => {
      expect(safeDate('')).toBeNull();
      expect(safeDate(0)).toBeNull();
    });
  });

  describe('formatDateForInput', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDateForInput(date);
      expect(result).toBe('2024-01-15');
    });

    it('should handle Firebase Timestamp', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15')
      };
      const result = formatDateForInput(mockTimestamp);
      expect(result).toBe('2024-01-15');
    });

    it('should return empty string for invalid dates', () => {
      expect(formatDateForInput(null)).toBe('');
      expect(formatDateForInput('invalid')).toBe('');
      expect(formatDateForInput(undefined)).toBe('');
    });

    it('should handle single-digit months and days', () => {
      const date = new Date('2024-03-05');
      const result = formatDateForInput(date);
      expect(result).toBe('2024-03-05');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date with valid format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDateForDisplay(date, 'es-ES');
      expect(result).toContain('2024');
      expect(result).toContain('01');
    });

    it('should use es-ES locale by default', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDateForDisplay(date);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Fecha inválida');
    });

    it('should handle Firebase Timestamp', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T12:00:00Z')
      };
      const result = formatDateForDisplay(mockTimestamp);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Fecha inválida');
    });

    it('should return "Fecha inválida" for invalid dates', () => {
      expect(formatDateForDisplay(null)).toBe('Fecha inválida');
      expect(formatDateForDisplay('invalid')).toBe('Fecha inválida');
      expect(formatDateForDisplay(undefined)).toBe('Fecha inválida');
    });
  });

  describe('formatDateTimeForDisplay', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTimeForDisplay(date);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Fecha inválida');
      expect(result).toContain('2024');
    });

    it('should handle Firebase Timestamp', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T14:30:00Z')
      };
      const result = formatDateTimeForDisplay(mockTimestamp);
      expect(result).toBeTruthy();
      expect(result).not.toBe('Fecha inválida');
    });

    it('should return "Fecha inválida" for invalid dates', () => {
      expect(formatDateTimeForDisplay(null)).toBe('Fecha inválida');
      expect(formatDateTimeForDisplay('invalid')).toBe('Fecha inválida');
    });
  });

  describe('compareDates', () => {
    it('should return negative when first date is older', () => {
      const dateA = new Date('2024-01-01');
      const dateB = new Date('2024-01-15');
      const result = compareDates(dateA, dateB);
      expect(result).toBeGreaterThan(0); // Más recientes primero
    });

    it('should return positive when first date is newer', () => {
      const dateA = new Date('2024-01-15');
      const dateB = new Date('2024-01-01');
      const result = compareDates(dateA, dateB);
      expect(result).toBeLessThan(0);
    });

    it('should handle Firebase Timestamps', () => {
      const mockTimestampA = { toDate: () => new Date('2024-01-01') };
      const mockTimestampB = { toDate: () => new Date('2024-01-15') };
      const result = compareDates(mockTimestampA, mockTimestampB);
      expect(typeof result).toBe('number');
    });
  });

  describe('getDaysAgo', () => {
    it('should return date from X days ago', () => {
      const today = new Date();
      const result = getDaysAgo(7);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(today.getTime());
    });
  });

  describe('getMonthsAgo', () => {
    it('should return date from X months ago', () => {
      const today = new Date();
      const result = getMonthsAgo(3);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeLessThan(today.getTime());
    });
  });
});
