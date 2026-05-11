import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('shows error message without page reload on invalid credentials', async ({ page }) => {
    // Visit login page
    await page.goto('/login');

    // Verify page loaded (MiniSend brand heading on auth page)
    await expect(page.getByRole('heading', { name: 'MiniSend' })).toBeVisible();

    // Fill in wrong credentials
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    // Get initial URL to verify no redirect
    const initialUrl = page.url();

    // Submit
    await page.getByRole('button', { name: 'Sign In' }).click();

    // URL should not have changed (no redirect to /campaigns)
    await expect(page).toHaveURL(initialUrl);

    // Error alert should be visible
    await expect(page.getByRole('alert')).toBeVisible();

    // Still on login page — link back to register should be visible
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();
  });
});
