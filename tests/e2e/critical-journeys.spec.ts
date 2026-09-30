import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys - E2E Tests', () => {
  test.describe('Participant Journey', () => {
    test('should complete full participant journey', async ({ page }) => {
      // Step 1: Visit homepage
      await page.goto('/');
      
      // Step 2: Should see onboarding or login
      await expect(page.locator('text=Yalla')).toBeVisible();
      
      // Step 3: Navigate to explore
      await page.click('text=Explore');
      
      // Step 4: Should see experiences
      await expect(page.locator('[data-testid="experience-card"]').first()).toBeVisible();
      
      // Step 5: Click on experience
      await page.click('[data-testid="experience-card"] >> nth=0');
      
      // Step 6: Should see experience details
      await expect(page.locator('h1')).toBeVisible();
      
      // Step 7: Book experience
      await page.click('text=      // Step 8: Should see confirmation
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
      
      // Step 9: Navigate to My Plans
      await page.click('text=      // Step 10: Should see reservation
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
      await page.click('text=      // Step 3: Should see staff dashboard
      await expect(page.locator('h1')).toContainText('Staff');
      
      // Step 4: View experiences
      await page.click('text=      // Step 5: Should see experiences list
      await expect(page.locator('[data-testid="experience-item"]').first()).toBeVisible();
      
      // Step 6: Create new experience
      await page.click('button:has-text("Create Experience")');
      await page.fill('input[name="title"]', 'Test Experience');
      await page.fill('input[name="date"]', '2026-03-01');
      await page.click('button:has-text("Save")');
      
      // Step 7: Should see success message
      await expect(page.locator('text=Experience created')).toBeVisible();
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
      await page.click('text=      // Step 3: Should see support page
      await expect(page.locator('h1')).toContainText('Support');
      
      // Step 4: Create support request
      await page.click('button:has-text("New Request")');
      await page.selectOption('select[name="type"]', 'operational');
      await page.fill('textarea[name="description"]', 'Test support request');
      await page.click('button:has-text("Submit")');
      
      // Step 5: Should see confirmation
      await expect(page.locator('text=Request submitted')).toBeVisible();
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
      await page.click('text=      // Step 3: Should see safety cases
      await expect(page.locator('h1')).toContainText('Safety Cases');
      
      // Step 4: View case details
      await page.click('[data-testid="safety-case-item"] >> nth=0');
      
      // Step 5: Should see case details
      await expect(page.locator('[data-testid="case-details"]')).toBeVisible();
      
      // Step 6: Update case status
      await page.selectOption('select[name="status"]', 'under_review');
      await page.click('button:has-text("Update")');
      
      // Step 7: Should see success message
      await expect(page.locator('text=Status updated')).toBeVisible();
    });
  });
});
