import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys - E2E Tests', () => {
  test.describe('Participant Journey', () => {
    test('should complete full participant journey', async ({ page }) => {
      // Step 1: Visit homepage
      await page.goto('/');

      // Step 2: Should see app shell
      await expect(page.getByText(/yalla/i).first()).toBeVisible();

      // Step 3: Navigate to explore
      await page.getByRole('link', { name: /explore/i }).first().click();

      // Step 4: Should see experiences
      await expect(page.locator('[data-testid="experience-card"]').first()).toBeVisible();

      // Step 5: Click on experience
      await page.locator('[data-testid="experience-card"]').first().click();

      // Step 6: Should see experience details
      await expect(page.locator('h1').first()).toBeVisible();

      // Step 7: Book experience
      await page.getByRole('button', { name: /book|reserve/i }).first().click();

      // Step 8: Should see confirmation
      await expect(page.getByText(/booking confirmed|confirmed/i).first()).toBeVisible();

      // Step 9: Navigate to My Plans
      await page.getByRole('link', { name: /my plans|plans/i }).first().click();

      // Step 10: Should see reservation
      await expect(page.locator('[data-testid="reservation-card"]').first()).toBeVisible();
    });
  });

  test.describe('Staff Operations Journey', () => {
    test('should complete staff operations journey', async ({ page }) => {
      // Step 1: Login as staff
      await page.goto('/login');
      await page.fill('input[name="phone"]', '+966503456789');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Step 2: Navigate to Staff dashboard
      await page.getByRole('link', { name: /dashboard/i }).first().click();

      // Step 3: Should see staff dashboard
      await expect(page.locator('h1').first()).toContainText(/staff|dashboard/i);

      // Step 4: View experiences
      await page.getByRole('link', { name: /experiences/i }).first().click();

      // Step 5: Should see experiences list
      await expect(page.locator('[data-testid="experience-item"]').first()).toBeVisible();

      // Step 6: Create new experience
      await page.getByRole('button', { name: /create experience/i }).click();
      await page.fill('input[name="title"]', 'Test Experience');
      await page.fill('input[name="date"]', '2026-03-01');
      await page.getByRole('button', { name: /save/i }).click();

      // Step 7: Should see success message
      await expect(page.getByText(/experience created/i).first()).toBeVisible();
    });
  });

  test.describe('Support Journey', () => {
    test('should complete support request journey', async ({ page }) => {
      // Step 1: Login as participant
      await page.goto('/login');
      await page.fill('input[name="phone"]', '+966501234567');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Step 2: Navigate to Support
      await page.getByRole('link', { name: /support/i }).first().click();

      // Step 3: Should see support page
      await expect(page.locator('h1').first()).toContainText(/support/i);

      // Step 4: Create support request
      await page.getByRole('button', { name: /new request/i }).click();
      await page.selectOption('select[name="type"]', 'operational');
      await page.fill('textarea[name="description"]', 'Test support request');
      await page.getByRole('button', { name: /submit/i }).click();

      // Step 5: Should see confirmation
      await expect(page.getByText(/request submitted/i).first()).toBeVisible();
    });
  });

  test.describe('Safety Case Journey', () => {
    test('should complete safety case journey', async ({ page }) => {
      // Step 1: Login as trust & safety staff
      await page.goto('/login');
      await page.fill('input[name="phone"]', '+966505678901');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Step 2: Navigate to Safety Cases
      await page.getByRole('link', { name: /safety/i }).first().click();

      // Step 3: Should see safety cases
      await expect(page.locator('h1').first()).toContainText(/safety/i);

      // Step 4: View case details
      await page.locator('[data-testid="safety-case-item"]').first().click();

      // Step 5: Should see case details
      await expect(page.locator('[data-testid="case-details"]')).toBeVisible();

      // Step 6: Update case status
      await page.selectOption('select[name="status"]', 'under_review');
      await page.getByRole('button', { name: /update/i }).click();

      // Step 7: Should see success message
      await expect(page.getByText(/status updated/i).first()).toBeVisible();
    });
  });
});
