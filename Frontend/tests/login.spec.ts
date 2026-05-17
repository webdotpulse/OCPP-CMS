import { test, expect } from '@playwright/test';

test('bypasses authentication by injecting a mocked JWT and user object', async ({ page }) => {
  // Go to the base URL
  await page.goto('/');

  // Inject mocked JWT and user into localStorage
  await page.evaluate(() => {
    window.localStorage.setItem('token', 'mocked-jwt-token');
    window.localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'admin@example.com',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }));
  });

  // Reload the page to apply the mocked credentials
  await page.reload();

  // Navigate to the dashboard
  await page.goto('/dashboard');

  // Verify that the dashboard page loads correctly
  await expect(page.locator('text=System Overview')).toBeVisible();
});
