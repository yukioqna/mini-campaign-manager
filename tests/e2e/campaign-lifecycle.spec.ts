import { test, expect } from '@playwright/test';

test.describe('Campaign Lifecycle', () => {
  const timestamp = Date.now();
  const userEmail = `e2e_${timestamp}@test.com`;
  const userName = 'E2E User';

  test('full campaign lifecycle: create → schedule → send → verify stats and locked actions', async ({ page }) => {
    // ── 1. Register ──────────────────────────────────────────────────────────
    await page.goto('/register');
    // Verify page loaded (MiniSend brand heading on register page)
    await expect(page.getByRole('heading', { name: 'MiniSend' })).toBeVisible();

    await page.getByLabel('Name').fill(userName);
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password').fill('password123');

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Land on campaigns list
    await expect(page).toHaveURL('/campaigns');

    // ── 2. Create campaign ───────────────────────────────────────────────────
    await page.getByRole('button', { name: 'New Campaign' }).click();
    await expect(page).toHaveURL('/campaigns/new');

    const campaignName = `E2E Campaign ${timestamp}`;
    await page.getByLabel('Campaign Name').fill(campaignName);
    await page.getByLabel('Email Subject').fill('Test Subject');

    // Bulk add 3 recipients
    const recipients = [
      'alice@example.com, Alice',
      'bob@example.com, Bob',
      'carlos@example.com',
    ].join('\n');
    await page.getByLabel('Recipients').fill(recipients);

    await page.getByRole('button', { name: 'Create Campaign' }).click();

    // Land on campaign detail
    await expect(page).toHaveURL(/\/campaigns\/[a-f0-9-]+/);

    // ── 3. Verify stats cards visible (draft) ────────────────────────────────
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('Sent')).toBeVisible();
    await expect(page.getByText('Failed')).toBeVisible();
    await expect(page.getByText('Opened')).toBeVisible();
    await expect(page.getByText('Open Rate')).toBeVisible();
    await expect(page.getByText('Send Rate')).toBeVisible();

    // ── 4. Verify recipients shown as pending ────────────────────────────────
    await expect(page.getByText('alice@example.com')).toBeVisible();
    await expect(page.getByText('bob@example.com')).toBeVisible();
    await expect(page.getByText('carlos@example.com')).toBeVisible();

    // All should show pending (status badge)
    const pendingBadges = page.getByText('Pending');
    await expect(pendingBadges).toHaveCount(3);

    // ── 5. Verify action buttons for draft ─────────────────────────────────
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    // Add Recipient form should be visible
    await expect(page.getByPlaceholder('Email')).toBeVisible();

    // ── 6. Schedule campaign ────────────────────────────────────────────────
    // Click the main page Schedule button (not the modal button)
    await page.locator('main').getByRole('button', { name: 'Schedule' }).click();

    // Schedule modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Schedule Campaign')).toBeVisible();

    // Set a future datetime (tomorrow)
    const future = new Date(Date.now() + 86_400_000);
    const iso = future.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    await page.getByLabel('Date and Time').fill(iso);
    await page.getByLabel('Date and Time').press('Tab');

    // Click the Schedule button inside the dialog
    await page.getByRole('dialog').getByRole('button', { name: 'Schedule' }).click();

    // Wait for modal to close and status to update
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Scheduled')).toBeVisible();

    // ── 7. Verify Add Recipient is locked after scheduling ──────────────────
    await expect(page.getByPlaceholder('Email')).not.toBeVisible();
    await expect(page.getByText('Recipients are locked after scheduling or sending.')).toBeVisible();

    // ── 8. Verify Send Now visible, other actions hidden ─────────────────
    await expect(page.getByRole('button', { name: 'Send Now' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();

    // ── 9. Send campaign ───────────────────────────────────────────────────
    await page.getByRole('button', { name: 'Send Now' }).click();

    // Confirm modal — scope Send click to the dialog so it doesn't hit "Send Now"
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Send Campaign' }).click();

    // Wait for status to become 'Sent' (simulateSend takes 1-3s per recipient)
    await expect(page.getByText('Sent')).toBeVisible({ timeout: 30_000 });

    // ── 10. Verify Send and Add Recipient are hidden after sent ──────────────
    await expect(page.getByRole('button', { name: 'Send Now' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Campaign' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByPlaceholder('Email')).not.toBeVisible();
    await expect(page.getByText('Recipients are locked after scheduling or sending.')).toBeVisible();

    // ── 11. Stats should be updated ────────────────────────────────────────
    await expect(page.getByText('Sent')).toBeVisible(); // StatCard label
    await expect(page.getByText('Failed')).toBeVisible();
    await expect(page.getByText('Opened')).toBeVisible();
  });
});
