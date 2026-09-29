import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidSaudiPhone,
  isValidDate,
  isValidTime,
  isValidPrice,
  isValidCapacity,
  isNonEmptyString,
  isNonEmptyArray,
  isValidId,
  isValidUrl,
  isInRange,
  isFutureDate,
  isPastDate,
} from './validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidSaudiPhone', () => {
    it('should validate correct Saudi phone numbers', () => {
      expect(isValidSaudiPhone('+966501234567')).toBe(true);
      expect(isValidSaudiPhone('+966 50 123 4567')).toBe(true);
      expect(isValidSaudiPhone('+966551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidSaudiPhone('')).toBe(false);
      expect(isValidSaudiPhone('12345678')).toBe(false);
      expect(isValidSaudiPhone('+12345678901')).toBe(false);
      expect(isValidSaudiPhone('+966401234567')).toBe(false); // Not starting with 5
    });
  });

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('2026-01-15')).toBe(true);
      expect(isValidDate('2026-12-31')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('2026-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2026-01-32')).toBe(false); // Invalid day
      expect(isValidDate('2025-02-29')).toBe(false); // Not a leap year
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('01-15-2026')).toBe(false); // Wrong format
    });
  });

  describe('isValidTime', () => {
    it('should validate correct times', () => {
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
      expect(isValidTime('12:30')).toBe(true);
      expect(isValidTime('9:05')).toBe(true);
    });

    it('should reject invalid times', () => {
      expect(isValidTime('')).toBe(false);
      expect(isValidTime('24:00')).toBe(false);
      expect(isValidTime('12:60')).toBe(false);
      expect(isValidTime('invalid')).toBe(false);
      expect(isValidTime('12:30:45')).toBe(false); // Too many parts
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(100)).toBe(true);
      expect(isValidPrice(99.99)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(-100)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice(Infinity)).toBe(false);
    });
  });

  describe('isValidCapacity', () => {
    it('should validate correct capacities', () => {
      expect(isValidCapacity(1)).toBe(true);
      expect(isValidCapacity(10)).toBe(true);
      expect(isValidCapacity(100)).toBe(true);
    });

    it('should reject invalid capacities', () => {
      expect(isValidCapacity(0)).toBe(false);
      expect(isValidCapacity(-1)).toBe(false);
      expect(isValidCapacity(1.5)).toBe(false);
      expect(isValidCapacity(NaN)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('should validate non-empty arrays', () => {
      expect(isNonEmptyArray([1])).toBe(true);
      expect(isNonEmptyArray(['a', 'b'])).toBe(true);
      expect(isNonEmptyArray([{}])).toBe(true);
    });

    it('should reject empty arrays', () => {
      expect(isNonEmptyArray([])).toBe(false);
      expect(isNonEmptyArray(null)).toBe(false);
      expect(isNonEmptyArray(undefined)).toBe(false);
    });
  });

  describe('isValidId', () => {
    it('should validate valid IDs', () => {
      expect(isValidId('123')).toBe(true);
      expect(isValidId('abc-123')).toBe(true);
      expect(isValidId('uuid-1234-5678')).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('   ')).toBe(false);
      expect(isValidId(null)).toBe(false);
      expect(isValidId(undefined)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('invalid')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // Missing protocol
    });
  });

  describe('isInRange', () => {
    it('should validate values in range', () => {
      expect(isInRange(5, 0, 10)).toBe(true);
      expect(isInRange(0, 0, 10)).toBe(true);
      expect(isInRange(10, 0, 10)).toBe(true);
    });

    it('should reject values out of range', () => {
      expect(isInRange(-1, 0, 10)).toBe(false);
      expect(isInRange(11, 0, 10)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isFutureDate(futureDate.toISOString().split('T')[0])).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(isFutureDate(pastDate.toISOString().split('T')[0])).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('should validate past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      expect(isPastDate(pastDate.toISOString().split('T')[0])).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isPastDate(futureDate.toISOString().split('T')[0])).toBe(false);
    });
  });
});
