// Teacher notes pages: search, cross-listing, jump links, copy buttons, previous/next, phone fit.
import { test, expect } from '@playwright/test';
import { SLUGS, watchErrors } from './helpers.js';

test('index search finds a tool by standards code', async ({ page }) => {
  await page.goto('/teachers/');
  await page.fill('#notes-search', 'FI:384');
  const shown = page.locator('[data-search]:visible h3');
  await expect(shown.first()).toHaveText('Adjusting Entries Lab');
  await expect(page.locator('[data-search-status]')).toHaveText('1 tool match.');
  await expect(page.locator('[data-course-nav]')).toBeHidden();
  await page.press('#notes-search', 'Escape');
  await expect(page.locator('[data-course-nav]')).toBeVisible();
});

test('index search with no match says so', async ({ page }) => {
  await page.goto('/teachers/');
  await page.fill('#notes-search', 'zzzz');
  await expect(page.locator('[data-search-empty]')).toBeVisible();
});

test('index cross-lists tools under every course they fit', async ({ page }) => {
  await page.goto('/teachers/');
  const smm = page.locator('#social-media-marketing [data-id="marketing-funnel"]');
  await expect(smm).toBeVisible();
  await expect(smm).toContainText('Home course: Marketing');
});

test('notes page jump links reach their section', async ({ page }) => {
  await page.goto('/teachers/break-even-lab/');
  const nav = page.getByRole('navigation', { name: 'On this page' }).filter({ visible: true });
  await nav.getByRole('link', { name: 'Common misconceptions' }).click();
  await expect(page).toHaveURL(/#common-misconceptions$/);
  await expect(page.locator('#common-misconceptions')).toBeInViewport();
});

test('copy buttons put the student and projector links on the clipboard', async ({ page }) => {
  await page.goto('/teachers/break-even-lab/');
  await page.getByRole('button', { name: 'Copy student link' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/tools\/break-even-lab\/$/);
  await page.getByRole('button', { name: 'Copy projector link' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/tools\/break-even-lab\/\?embed=1$/);
});

test('previous and next follow the course order', async ({ page }) => {
  // Accounting sequence: accounting-equation-lab, t-account-lab, adjusting-entries-lab, ...
  await page.goto('/teachers/t-account-lab/');
  const more = page.getByRole('navigation', { name: 'More in Accounting' });
  await expect(more.getByRole('link').first()).toHaveAttribute('href', '/teachers/accounting-equation-lab/');
  await expect(more.getByRole('link').last()).toHaveAttribute('href', '/teachers/adjusting-entries-lab/');
});

for (const path of ['/teachers/', ...SLUGS.map((s) => `/teachers/${s}/`)]) {
  for (const mode of ['?theme=light', '?theme=dark']) {
    test(`fits a phone without sideways scrolling: ${path} ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const errors = watchErrors(page);
      await page.goto(`${path}${mode}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'page is wider than the phone screen').toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}
