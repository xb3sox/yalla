import { test, expect } from '@playwright/test';

test.describe('01 - Discovery and Filters Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(700);
  });

  test('should display initial list of experiences and search by query', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Discover|Explore|استكشف/i);
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Art');
    await expect(page.locator('text=Sunset Art Walk')).toBeVisible();

    await searchInput.fill('');
    await expect(page.locator('text=Arabic Coffee Ceremony')).toBeVisible();
  });

  test('should filter experiences by city (Riyadh / Jeddah)', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]').first();

    await searchInput.fill('Riyadh');
    await expect(page.locator('text=Riyadh').first()).toBeVisible();

    await searchInput.fill('Jeddah');
    await expect(page.locator('text=Jeddah').first()).toBeVisible();
  });

  test('should toggle language between English and Arabic RTL', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');

    const langToggle = page.locator('button:has-text("العربية"), button[aria-label="Switch to Arabic"]').first();
    await langToggle.click({ force: true });

    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    const englishToggle = page.locator('button:has-text("EN"), button[aria-label="Switch to English"]').first();
    await englishToggle.click({ force: true });

    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');
  });
});
