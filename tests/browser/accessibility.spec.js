// Accessibility: every page passes axe-core's WCAG 2.2 AA checks in light and dark mode, at
// phone width, and in projector view, plus a few things axe can't see on its own.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SLUGS } from './helpers.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const MODES = [
  ['light', '?theme=light', 1280],
  ['dark', '?theme=dark', 1280],
  ['phone light', '?theme=light', 390],
  ['phone dark', '?theme=dark', 390],
  ['projector', '?embed=1', 1280],
];
const PAGES = ['/', '/standards/', '/privacy/', '/teachers/', ...SLUGS.map((s) => `/tools/${s}/`), ...SLUGS.map((s) => `/teachers/${s}/`)];

async function violations(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

for (const path of PAGES) {
  for (const [name, query, width] of MODES) {
    // Teacher pages aren't projected; check them in light, dark, and on a phone.
    if (path.startsWith('/teachers/') && name === 'projector') continue;
    test(`axe: ${path} ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path + query);
      await page.waitForLoadState('networkidle');
      expect(await violations(page)).toEqual([]);
    });
  }
}

// Course pages, found from the home page so new courses are picked up.
test('axe: every course page, normal and projector', async ({ page }) => {
  await page.goto('/');
  const courses = await page.$$eval('a[href^="/courses/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
  for (const c of courses) {
    for (const q of ['?theme=light', '?theme=dark', '?embed=1']) {
      await page.goto(c + q);
      await page.waitForLoadState('networkidle');
      expect(await violations(page), `${c}${q}`).toEqual([]);
    }
  }
});

// Screen readers hear a slider's value with its unit, the same as its number box shows.
test('sliders speak their units', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  await expect(page.locator('#be-price')).toHaveAttribute('aria-valuetext', '$2.00');
  await page.locator('#be-price').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#be-price')).toHaveAttribute('aria-valuetext', '$2.25');
  await page.goto('/tools/depreciation/');
  await expect(page.locator('#dp-life')).toHaveAttribute('aria-valuetext', /^\d+ years?$/);
});

// Charts describe the current numbers in words, and the description follows the sliders.
test('Break-Even chart describes what it shows', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  const chart = page.locator('[data-chart]');
  await expect(chart).toHaveAttribute('aria-label', /cross at 100 units, or \$200 in sales/);
  await page.locator('#be-price-n').fill('0.5');
  await expect(chart).toHaveAttribute('aria-label', /no break-even point/);
});

// A table or chart that scrolls sideways on a phone can be reached and scrolled with the keyboard,
// and on a wide screen it adds no extra tab stop.
test('sideways-scrolling boxes take focus only when they scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/depreciation/');
  const box = page.locator('[data-tool] [role="region"][tabindex="0"]').first();
  await expect(box).toHaveAttribute('aria-label', /scrolls sideways/);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('[data-tool] .overflow-x-auto[tabindex]')).toHaveCount(0);
});

// Every focusable control shows a focus ring, and nothing is clickable only with a mouse.
for (const slug of SLUGS) {
  test(`keyboard: ${slug}`, async ({ page }) => {
    await page.goto(`/tools/${slug}/`);
    await page.waitForLoadState('networkidle');
    const mouseOnly = await page.evaluate(() =>
      [...document.querySelectorAll('main *')]
        .filter((el) => getComputedStyle(el).cursor === 'pointer' && el.offsetParent)
        .filter((el) => !el.closest('a[href],button,label,summary,input,select,textarea,[tabindex]'))
        .map((el) => el.outerHTML.slice(0, 100))
    );
    expect(mouseOnly, 'clickable but not reachable by keyboard').toEqual([]);
    const noRing = new Set();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const miss = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none' ? null : el.outerHTML.slice(0, 100);
      });
      if (miss) noRing.add(miss);
    }
    expect([...noRing], 'focused without a visible focus ring').toEqual([]);
  });
}

// WCAG reflow: tools work at 320px wide (a phone at 400% zoom) without sideways scrolling.
for (const slug of SLUGS) {
  test(`reflow at 320px: ${slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(`/tools/${slug}/`);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
