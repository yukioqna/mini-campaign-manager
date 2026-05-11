import { test, expect } from '@playwright/test';

test.describe('Campaign Validation', () => {
  test('shows error when creating campaign with invalid recipient email', async ({ page }) => {
    // Register
    const timestamp = Date.now();
    const email = `val_${timestamp}@test.com`;
    await page.goto('/register');
    await page.getByLabel('Name').fill('Val User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/campaigns');

    // Navigate to new campaign
    await page.getByRole('button', { name: 'New Campaign' }).click();
    await expect(page).toHaveURL('/campaigns/new');

    // Fill valid fields
    await page.getByLabel('Campaign Name').fill('Valid Campaign');
    await page.getByLabel('Email Subject').fill('Subject');

    // Fill invalid email
    await page.getByLabel('Recipients').fill('not-an-email');

    // Try to save
    await page.getByRole('button', { name: 'Create Campaign' }).click();

    // Client-side validation should catch the bad email before API call
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('Register Validation', () => {
  test('shows error on duplicate email registration (case-insensitive)', async ({ page }) => {
    const timestamp = Date.now();
    const email = `dup_${timestamp}@test.com`;

    // Register first time
    await page.goto('/register');
    await page.getByLabel('Name').fill('Dup User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/campaigns');

    // Simulate logout by clearing Zustand store via in-memory logout
    // The auth token lives in memory (Zustand), so we navigate to login to reset state
    await page.goto('/login');

    // Try to register with same email (uppercase this time to test case-insensitivity)
    await page.goto('/register');
    await page.getByLabel('Name').fill('Dup User 2');
    await page.getByLabel('Email').fill(email.toUpperCase());
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error (409 from API)
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL('/register');
  });
});
