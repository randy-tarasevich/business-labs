// The For teachers page: public, so it must never link to teacher notes. Its counts come from the content files.
import { test, expect } from '@playwright/test';
import { SLUGS } from './helpers.js';

test('For teachers page: linked from the header, counts are current, never links to teacher notes', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  await page.getByRole('banner').getByRole('link', { name: 'For teachers' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.getByText('interactive tools', { exact: true }).locator('..')).toContainText(String(SLUGS.length));
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h.includes('/teachers')), 'links to teacher notes').toEqual([]);
  // The demo video's files are served from this site.
  for (const src of ['/demo/break-even.mp4', '/demo/break-even.webm', '/demo/break-even.jpg']) {
    expect((await page.request.get(src)).status(), src).toBe(200);
  }
});
