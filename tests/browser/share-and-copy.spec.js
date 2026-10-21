// Share links and Copy results, on every tool that has them.
import { test, expect } from '@playwright/test';
import { SLUGS, watchErrors } from './helpers.js';

// Change the last preset and tab, then the first three inputs, the way a student would.
async function mutate(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-tool]');
    for (const g of root.querySelectorAll('[data-presets], [data-tabs]')) g.lastElementChild?.click();
    const els = [...root.querySelectorAll('input[type=number], input[type=checkbox], select, input[type=radio], input[type=range]')].filter(
      (e) => !(e.type === 'range' && e.id && root.querySelector(`#${CSS.escape(e.id)}-n`))
    );
    let n = 0;
    for (const e of els) {
      if (n >= 3) break;
      if (e.type === 'checkbox') e.checked = !e.checked;
      else if (e.tagName === 'SELECT') {
        if (e.options.length < 2) continue;
        e.selectedIndex = (e.selectedIndex + 1) % e.options.length;
      } else if (e.type === 'radio') {
        if (e.checked) continue;
        e.checked = true;
      } else e.value = String(Math.round((parseFloat(e.value) || 1) * 1.3 + 1));
      e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new Event('change', { bubbles: true }));
      n++;
    }
    return n;
  });
}

const snapshot = (page) =>
  page.evaluate(() => {
    const root = document.querySelector('[data-tool]');
    return {
      values: [...root.querySelectorAll('input, select')].map((e) => (e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value)),
      pressed: [...root.querySelectorAll('[aria-pressed]')].map((b) => b.getAttribute('aria-pressed')),
      text: root.innerText,
    };
  });

for (const slug of SLUGS) {
  test(`share link reopens the same numbers: ${slug}`, async ({ page, context }) => {
    const errors = watchErrors(page);
    await page.goto(`/tools/${slug}/`);
    test.skip(!(await page.locator('[data-share]').count()), 'this tool does not use share links');
    const clean = page.url();
    expect(await mutate(page)).toBeGreaterThan(0);
    await expect(page).not.toHaveURL(clean);
    await page.waitForTimeout(400); // the URL updates after a short pause
    const before = await snapshot(page);
    const link = page.url();
    expect(await page.locator('[data-project]').getAttribute('href')).toContain('embed=1');

    const fresh = await context.newPage();
    watchErrors(fresh);
    await fresh.goto(link);
    expect(await snapshot(fresh)).toEqual(before);
    expect(errors).toEqual([]);
  });

  test(`Copy results gives a readable summary: ${slug}`, async ({ page }) => {
    await page.goto(`/tools/${slug}/`);
    test.skip(!(await page.locator('[data-copy-results]').count()), 'this tool does not use Copy results');
    await mutate(page);
    await page.waitForTimeout(400);
    await page.locator('[data-copy-results]').click();
    await expect(page.locator('[data-copy-label]')).toHaveText('Results copied');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('(Business Labs)');
    expect(text).toContain('My numbers:');
    expect(text).toContain('Results:');
    expect(text).toMatch(/Link: http\S+\/tools\/\S+\?\S+/);
    expect(text).not.toMatch(/undefined|NaN|\[object/);
    expect(text, 'no em-dashes in copied text').not.toContain('—');
  });
}

test('share links ignore junk in the URL', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/break-even-lab/?be-price=abc&g0=99&nonsense=1');
  await expect(page.locator('#be-price-n')).toHaveValue('2.00');
  expect(errors).toEqual([]);
});

test('an untouched tool keeps a clean URL', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  await page.waitForTimeout(600);
  expect(new URL(page.url()).search).toBe('');
});

test('Copy results still copies when the clipboard API is blocked', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('blocked'));
  });
  await page.locator('[data-copy-results]').click();
  await expect(page.locator('[data-copy-label]')).toHaveText('Results copied');
});
