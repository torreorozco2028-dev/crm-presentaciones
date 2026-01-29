import { test, expect } from '@playwright/test';

test('should login and handle success or error', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL('/en/auth/login');

  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');

  await page.click('button[type="submit"]');

  await page.waitForLoadState('networkidle');

  if ((await page.url()) === '/users') {
    console.log('Login successful! Redirected to the dashboard.');
    await expect(page).toHaveURL('/users');
  } else {
    const errorMessage = await page.locator('#form-errors').textContent();
    console.log(
      'User is not registered. Please use a different email',
      errorMessage
    );
    await expect(errorMessage).toBeTruthy();
  }
});
