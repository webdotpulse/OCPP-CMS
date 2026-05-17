import { test, expect } from '@playwright/test';

test('verifies the navigation sidebar renders and "Stations" page loads', async ({ page }) => {
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

  // Assert the sidebar is visible
  const sidebar = page.locator('aside');
  await expect(sidebar).toBeVisible();

  // Click the "Stations" / "Locations" link
  // The route key is 'nav.locations' and path is '/stations'
  const stationsLink = page.locator('a[href="/stations"]');
  await expect(stationsLink).toBeVisible();
  await stationsLink.click();

  // Assert that the URL changes to /stations
  await expect(page).toHaveURL(/\/stations/);

  // Assert the data table containing the "Locations" heading is displayed
  await expect(page.locator('h1', { hasText: 'Locations' })).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
});
