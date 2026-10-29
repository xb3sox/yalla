import { test, expect } from '@playwright/test';

test.describe('02 - Booking Checkout Flow Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/reservations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            reservation: {
              id: `res-e2e-${Date.now()}`,
              participant_id: 'user-1',
              experience_id: 'exp-4',
              state: 'confirmed',
              created_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              payment_state: 'captured',
              payment_id: `pay-stripe-mock-${Date.now()}`,
            },
          },
        }),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(700);
  });

  test('should navigate to unbooked experience details, select session, and complete checkout', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('Traditional Cooking');

    const cardTitle = page.locator('h3:has-text("Traditional Cooking Workshop"), h3:has-text("ورشة طبخ تقليدي")').first();
    await expect(cardTitle).toBeVisible();
    await cardTitle.click({ force: true });

    const bookButton = page.locator('button:has-text("Book your place"), button:has-text("Book Now"), button:has-text("احجز مكانك"), button:has-text("Join waitlist"), button:has-text("انضم لقائمة الانتظار")').first();
    await expect(bookButton).toBeVisible();

    await bookButton.scrollIntoViewIfNeeded();
    await bookButton.click({ force: true });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.locator('button:has-text("Confirm"), button:has-text("تأكيد")').first();
    await confirmButton.scrollIntoViewIfNeeded();
    await confirmButton.click({ force: true });

    const confirmationHeader = dialog.locator('h3').filter({ hasText: /Booking Confirmed|Waitlist|تم الحجز|قائمة الانتظار/i }).first();
    await expect(confirmationHeader).toBeVisible({ timeout: 5000 });

    const myPlansDialogButton = dialog.locator('button').filter({ hasText: /My Plans|خططي/i }).first();
    await myPlansDialogButton.scrollIntoViewIfNeeded();
    await myPlansDialogButton.click({ force: true });

    await expect(page.locator('h1')).toContainText(/My Plans|خططي/i, { timeout: 5000 });
  });
});
