import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads and shows cinema branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/cinema/i);
  });

  test('navigation links are visible', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Movies page', () => {
  test('navigates to /movies', async ({ page }) => {
    await page.goto('/movies');
    await expect(page).toHaveURL(/movies/);
  });
});

test.describe('Now Playing page', () => {
  test('navigates to /now-playing', async ({ page }) => {
    await page.goto('/now-playing');
    await expect(page).toHaveURL(/now-playing/);
  });
});

test.describe('Screenings page', () => {
  test('navigates to /screenings', async ({ page }) => {
    await page.goto('/screenings');
    await expect(page).toHaveURL(/screenings/);
  });
});
