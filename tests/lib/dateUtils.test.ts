import { describe, it, expect } from 'vitest';
import {
  safeDate,
  formatDateForInput,
  formatDateForDisplay,
  formatDateTimeForDisplay,
  getMonthName,
  getMonthStartEnd,
  isDateInRange
} from '@/lib/dateUtils';

describe('dateUtils', () => {
  describe('safeDate', () => {
    it('should convert Firebase Timestamp to Date', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15')
      };
      const result = safeDate(mockTimestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(15);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15');
      const result = safeDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(15);
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
    it('should format date as DD/MM/YYYY for es-ES locale', () => {
      const date = new Date('2024-01-15');
      const result = formatDateForDisplay(date, 'es-ES');
      expect(result).toMatch(/15\/01\/2024/);
    });

    it('should use es-ES locale by default', () => {
      const date = new Date('2024-01-15');
      const result = formatDateForDisplay(date);
      expect(result).toMatch(/15\/01\/2024/);
    });

    it('should handle Firebase Timestamp', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15')
      };
      const result = formatDateForDisplay(mockTimestamp);
      expect(result).toMatch(/15\/01\/2024/);
    });

    it('should return "Fecha inválida" for invalid dates', () => {
      expect(formatDateForDisplay(null)).toBe('Fecha inválida');
      expect(formatDateForDisplay('invalid')).toBe('Fecha inválida');
      expect(formatDateForDisplay(undefined)).toBe('Fecha inválida');
    });
  });

  describe('formatDateTimeForDisplay', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTimeForDisplay(date);
      expect(result).toMatch(/15\/01\/2024/);
      expect(result).toMatch(/14:30/);
    });

    it('should handle Firebase Timestamp', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15T14:30:00')
      };
      const result = formatDateTimeForDisplay(mockTimestamp);
      expect(result).toMatch(/15\/01\/2024/);
    });

    it('should return "Fecha inválida" for invalid dates', () => {
      expect(formatDateTimeForDisplay(null)).toBe('Fecha inválida');
      expect(formatDateTimeForDisplay('invalid')).toBe('Fecha inválida');
    });
  });

  describe('getMonthName', () => {
    it('should return correct month names in Spanish', () => {
      expect(getMonthName(0)).toBe('Enero');
      expect(getMonthName(5)).toBe('Junio');
      expect(getMonthName(11)).toBe('Diciembre');
    });

    it('should handle edge cases', () => {
      expect(getMonthName(-1)).toBe('Mes inválido');
      expect(getMonthName(12)).toBe('Mes inválido');
      expect(getMonthName(100)).toBe('Mes inválido');
    });
  });

  describe('getMonthStartEnd', () => {
    it('should return start and end of month', () => {
      const { start, end } = getMonthStartEnd(2024, 0); // January 2024
      
      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      
      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(0);
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
    });

    it('should handle February in leap year', () => {
      const { start, end } = getMonthStartEnd(2024, 1); // February 2024 (leap year)
      expect(end.getDate()).toBe(29);
    });

    it('should handle February in non-leap year', () => {
      const { start, end } = getMonthStartEnd(2023, 1); // February 2023
      expect(end.getDate()).toBe(28);
    });

    it('should handle December', () => {
      const { start, end } = getMonthStartEnd(2024, 11); // December
      expect(start.getMonth()).toBe(11);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('isDateInRange', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');

    it('should return true for dates within range', () => {
      const date = new Date('2024-01-15');
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return true for start date', () => {
      expect(isDateInRange(start, start, end)).toBe(true);
    });

    it('should return true for end date', () => {
      expect(isDateInRange(end, start, end)).toBe(true);
    });

    it('should return false for dates before range', () => {
      const date = new Date('2023-12-31');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('should return false for dates after range', () => {
      const date = new Date('2024-02-01');
      expect(isDateInRange(date, start, end)).toBe(false);
    });

    it('should handle Firebase Timestamps', () => {
      const mockTimestamp = {
        toDate: () => new Date('2024-01-15')
      };
      expect(isDateInRange(mockTimestamp, start, end)).toBe(true);
    });
  });
});
