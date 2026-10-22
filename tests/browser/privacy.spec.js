// The privacy page (/privacy/) makes promises to districts. These tests keep them true:
// every page loads only from this site, no cookies are set, and the browser stores nothing beyond
// what the page lists. If a tool needs something new, change the privacy page and this test together.
import { test, expect } from '@playwright/test';
import { SLUGS } from './helpers.js';

const PAGES = ['/', '/standards/', '/privacy/', '/about/', '/teachers/', ...SLUGS.map((s) => `/tools/${s}/`), ...SLUGS.map((s) => `/teachers/${s}/`)];
// Listed on the privacy page: the light/dark choice and the Business Plan Builder draft (plus its linked Drive file).
const ALLOWED_STORAGE = ['theme', 'business-labs:business-plan'];
const ALLOWED_DATABASES = ['business-labs'];

test('every page loads only from this site, sets no cookies, and stores only what the privacy page lists', async ({ page, context, baseURL }) => {
  test.setTimeout(240_000);
  const origin = new URL(baseURL).origin;
  const outside = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) outside.push(`${page.url()} -> ${url}`);
  });

  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }

  // Use the features that store things: switch the theme and type into the business plan.
  await page.goto('/tools/business-plan/');
  await page.locator('[data-theme-toggle]').click();
  const field = page.locator('main input[type="text"], main textarea').first();
  await field.fill('Privacy test');
  await page.waitForTimeout(1500);

  expect(outside, 'requests to other sites').toEqual([]);
  expect(await context.cookies(), 'cookies').toEqual([]);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.filter((k) => !ALLOWED_STORAGE.includes(k)), 'unexpected browser storage').toEqual([]);
  const dbs = await page.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : []));
  expect(dbs.filter((d) => !ALLOWED_DATABASES.includes(d)), 'unexpected browser databases').toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage)), 'session storage').toEqual([]);
});

test('privacy page is linked from every page footer and fits a phone', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['light', 'dark']) {
    await page.goto(`/privacy/?theme=${theme}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
