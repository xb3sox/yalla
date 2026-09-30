/**
 * Validation Utilities
 * 
 * Provides validation functions for common data types.
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Saudi format)
 */
export function isValidSaudiPhone(phone: string): boolean {
  const phoneRegex = /^\+966[5][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validate price (positive number)
 */
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && isFinite(price);
}

/**
 * Validate capacity (positive integer)
 */
export function isValidCapacity(capacity: number): boolean {
  return Number.isInteger(capacity) && capacity > 0;
}

/**
 * Validate required string
 */
export function isNonEmptyString(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate array is not empty
 */
export function isNonEmptyArray<T>(arr: T[] | undefined | null): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate ID format (non-empty string)
 */
export function isValidId(id: string | undefined | null): boolean {
  return isNonEmptyString(id);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate date is in the future
 */
export function isFutureDate(date: string): boolean {
  const parsedDate = new Date(date);
  return parsedDate > new Date();
}

/**
 * Validate date is in the past
 */
export function isPastDate(date: string): boolean {
  const parsedDate = new Date(date);
  return parsedDate < new Date();
}
