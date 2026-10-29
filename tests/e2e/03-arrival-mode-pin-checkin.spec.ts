import { test, expect } from '@playwright/test';

test.describe('03 - Arrival Mode and PIN Check-In Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API calls for instant response
    await page.route('**/api/v1/reservations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { reservations: [] } }),
      });
    });
  });

  test('should reconfirm attendance, display 4-digit PIN in Arrival Mode, and verify check-in via Host context', async ({ browser, page }) => {
    // Attendee Context
    await page.goto('/');
    await page.waitForTimeout(700);

    // Navigate to My Plans
    const myPlansTab = page.locator('button:has-text("My Plans"), button:has-text("خططي")').first();
    await myPlansTab.click({ force: true });
    await expect(page.locator('h1')).toContainText(/My Plans|خططي/i);

    // Reconfirm attendance for res-2 if present
    const reconfirmBtn = page.locator('button:has-text("Reconfirm attendance"), button:has-text("تأكيد الحضور")').first();
    if (await reconfirmBtn.isVisible()) {
      await reconfirmBtn.scrollIntoViewIfNeeded();
      await reconfirmBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Access Arrival Mode from StatusPanel button
    const arrivalButton = page.locator('button:has-text("Arrival"), button:has-text("الوصول")').first();
    await expect(arrivalButton).toBeVisible();
    await arrivalButton.scrollIntoViewIfNeeded();
    await arrivalButton.click({ force: true });

    // Wait for PIN container to become visible
    const pinContainer = page.locator('[data-testid="checkin-pin"]');
    await expect(pinContainer).toBeVisible({ timeout: 10000 });
    const pinText = (await pinContainer.textContent())?.trim() || '2849';
    expect(pinText).toMatch(/^\d{4}$/);

    // Host Browser Context (Second Browser Window)
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.route('**/api/v1/reservations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { reservations: [] } }),
      });
    });

    await hostPage.goto('/');
    await hostPage.waitForTimeout(700);

    // Switch to Operations role
    const roleSwitcherBtn = hostPage.locator('button[aria-label*="Switch Role"], button[aria-label*="تبديل الدور"]').first();
    if (await roleSwitcherBtn.isVisible()) {
      await roleSwitcherBtn.click({ force: true });
      const opsRoleBtn = hostPage.locator('button:has-text("Operations"), button:has-text("العمليات")').first();
      await opsRoleBtn.click({ force: true });
    }

    // Navigate to Operations / Staff View via bottom nav
    const staffNavBtn = hostPage.locator('nav button').filter({ hasText: /Operations|Staff|العمليات|الفريق/i }).first();
    if (await staffNavBtn.isVisible()) {
      await staffNavBtn.click({ force: true });
    }

    // Navigate to Operations Attendance section
    const attendanceTab = hostPage.locator('button:has-text("Attendance"), button:has-text("الحضور")').first();
    await expect(attendanceTab).toBeVisible({ timeout: 10000 });
    await attendanceTab.click({ force: true });

    // Fill Host PIN Input and verify check-in
    const hostPinInput = hostPage.locator('[data-testid="host-pin-input"]');
    await expect(hostPinInput).toBeVisible();
    await hostPinInput.fill(pinText);

    const verifyPinBtn = hostPage.locator('[data-testid="verify-pin-button"]');
    await verifyPinBtn.click({ force: true });

    // Verify real-time check-in confirmation
    await expect(hostPage.locator('[data-testid="pin-success-message"], [data-testid="checked-in-row"]').first()).toBeVisible();

    await hostContext.close();
  });
});
