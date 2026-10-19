export class EmailService {
  /**
   * Escapes HTML characters to prevent XSS.
   */
  public static escapeHtml(unsafe: string): string {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Renders a template by replacing placeholders with escaped parameters.
   */
  public static renderTemplate(template: string, params: Record<string, string>): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return key in params ? this.escapeHtml(params[key]) : match;
    });
  }

  public static getBookingConfirmationTemplates() {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { background: #4A90E2; color: #ffffff; padding: 20px; text-align: center; }
  .content { padding: 30px; }
  .content p { margin-bottom: 15px; }
  .footer { padding: 20px; text-align: center; font-size: 0.85em; color: #777; background: #eeeeee; }
  .details { background: #f9f9f9; padding: 15px; border-left: 4px solid #4A90E2; margin-bottom: 20px; }
  .ar-section { direction: rtl; text-align: right; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
  @media only screen and (max-width: 600px) {
    .container { margin: 0; width: 100%; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Booking Confirmed / تم تأكيد الحجز</h2>
    </div>
    <div class="content">
      <p>Dear Customer,</p>
      <p>Your booking has been successfully confirmed. Here are the details:</p>
      <div class="details">
        <strong>Experience:</strong> {{ experienceTitle }}<br>
        <strong>Date:</strong> {{ date }}<br>
        <strong>Time:</strong> {{ time }}
      </div>
      
      <div class="ar-section">
        <p>عزيزي العميل،</p>
        <p>تم تأكيد حجزك بنجاح. إليك التفاصيل:</p>
        <div class="details" style="border-left: none; border-right: 4px solid #4A90E2;">
          <strong>التجربة:</strong> {{ experienceTitleAr }}<br>
          <strong>التاريخ:</strong> {{ date }}<br>
          <strong>الوقت:</strong> {{ time }}
        </div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for choosing Yalla.</p>
      <p>شكراً لاختيارك يلا.</p>
    </div>
  </div>
</body>
</html>
`;

    const textTemplate = `
Booking Confirmed / تم تأكيد الحجز

Dear Customer,
Your booking has been successfully confirmed. Here are the details:
Experience: {{ experienceTitle }}
Date: {{ date }}
Time: {{ time }}

عزيزي العميل،
تم تأكيد حجزك بنجاح. إليك التفاصيل:
التجربة: {{ experienceTitleAr }}
التاريخ: {{ date }}
الوقت: {{ time }}

Thank you for choosing Yalla. / شكراً لاختيارك يلا.
`;
    return { htmlTemplate, textTemplate };
  }

  public static generateBookingConfirmationEmail(params: {
    experienceTitle: string;
    experienceTitleAr: string;
    date: string;
    time: string;
  }): { html: string; text: string } {
    const { htmlTemplate, textTemplate } = this.getBookingConfirmationTemplates();
    return {
      html: this.renderTemplate(htmlTemplate, params),
      text: this.renderTemplate(textTemplate, params)
    };
  }
}
