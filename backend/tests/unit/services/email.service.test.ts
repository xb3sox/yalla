import { EmailService } from '../../../src/services/email.service';

describe('EmailService', () => {
  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      const unsafe = '<script>alert("xss & \'hack\'")</script>';
      const safe = EmailService.escapeHtml(unsafe);
      expect(safe).toBe('&lt;script&gt;alert(&quot;xss &amp; &#039;hack&#039;&quot;)&lt;/script&gt;');
    });
  });

  describe('renderTemplate', () => {
    it('should replace variables with escaped values', () => {
      const template = 'Hello {{ name }}, welcome to {{ place }}!';
      const params = { name: '<John>', place: 'Yalla & Co' };
      const result = EmailService.renderTemplate(template, params);
      expect(result).toBe('Hello &lt;John&gt;, welcome to Yalla &amp; Co!');
    });

    it('should handle missing variables by leaving the placeholder', () => {
      const template = 'Hello {{ name }}, your score is {{ score }}.';
      const params = { name: 'Alice' };
      const result = EmailService.renderTemplate(template, params);
      expect(result).toBe('Hello Alice, your score is {{ score }}.');
    });
  });

  describe('generateBookingConfirmationEmail', () => {
    it('should generate html and text correctly with sanitization', () => {
      const params = {
        experienceTitle: 'Desert Safari <Premium>',
        experienceTitleAr: 'رحلة سفاري <مميزة>',
        date: '2023-12-01',
        time: '14:00 & 18:00'
      };

      const { html, text } = EmailService.generateBookingConfirmationEmail(params);
      
      expect(html).toContain('Desert Safari &lt;Premium&gt;');
      expect(html).toContain('رحلة سفاري &lt;مميزة&gt;');
      expect(html).toContain('14:00 &amp; 18:00');
      
      expect(text).toContain('Desert Safari &lt;Premium&gt;');
      expect(text).toContain('رحلة سفاري &lt;مميزة&gt;');
      expect(text).toContain('14:00 &amp; 18:00');
    });
  });
});
