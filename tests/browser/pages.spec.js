// Every page loads cleanly, fits a phone, and keeps teacher notes off student pages.
import { test, expect } from '@playwright/test';
import { SLUGS, watchErrors } from './helpers.js';

const OTHER_PAGES = ['/', '/standards/', '/privacy/', '/teachers/'];

for (const path of [...OTHER_PAGES, ...SLUGS.map((s) => `/tools/${s}/`), ...SLUGS.map((s) => `/teachers/${s}/`)]) {
  test(`loads without errors: ${path}`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

// CLAUDE.md: every tool works at phone width, in light and dark mode, and in projector view.
for (const slug of SLUGS) {
  for (const mode of ['?theme=light', '?theme=dark', '?embed=1']) {
    test(`fits a phone without sideways scrolling: ${slug} ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const errors = watchErrors(page);
      await page.goto(`/tools/${slug}/${mode}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, 'page is wider than the phone screen').toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
}

// CLAUDE.md: answer keys and teacher notes never go on student pages (anything there is in the page source).
for (const slug of SLUGS) {
  test(`teacher notes stay off the student page: ${slug}`, async ({ page }) => {
    await page.goto(`/teachers/${slug}/`);
    const notes = await page.evaluate(() =>
      [...document.querySelectorAll('main li, main p')]
        .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
        .filter((t) => t.length >= 60)
    );
    expect(notes.length, 'teacher page should have notes to check').toBeGreaterThan(0);
    // All text on the student page, including anything hidden with CSS or the hidden attribute.
    await page.goto(`/tools/${slug}/`);
    const student = await page.evaluate(() => document.documentElement.textContent.replace(/\s+/g, ' '));
    const leaked = notes.filter((t) => student.includes(t.slice(0, 50)));
    expect(leaked, 'teacher note text found on the student page').toEqual([]);
  });
}
