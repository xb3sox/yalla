export class PhoneUtils {
  // E.164 international number format: + followed by country code (1-3 digits) and subscriber number.
  // Minimum length is 7 digits (+1234567), maximum length is 15 digits (+123456789012345).
  private static readonly E164_REGEX = /^\+[1-9]\d{6,14}$/;
  private static readonly GCC_PREFIXES = ['+966', '+971', '+965', '+974', '+973', '+968'];

  /**
   * Sanitizes phone number string and validates E.164 international format.
   * Throws an Error if phone number is invalid.
   */
  public static sanitizeAndValidatePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Phone number is required and must be a string');
    }

    // Strip spaces, hyphens, parentheses, dots
    let cleaned = phone.replace(/[\s().-]/g, '');

    // Handle leading 00 as +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    }

    // Ensure leading +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    if (!this.E164_REGEX.test(cleaned)) {
      throw new Error(`Invalid E.164 phone number format: '${phone}'`);
    }

    return cleaned;
  }

  /**
   * Returns true if phone number belongs to Saudi Arabia or a GCC country.
   */
  public static isGccPhoneNumber(phone: string): boolean {
    try {
      const formatted = this.sanitizeAndValidatePhone(phone);
      return this.GCC_PREFIXES.some((prefix) => formatted.startsWith(prefix));
    } catch {
      return false;
    }
  }
}
