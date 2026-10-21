// Shared helpers for the browser tests.
import { readdirSync } from 'node:fs';

/** Every tool slug, from the content files. */
export const SLUGS = readdirSync(new URL('../../src/content/tools/', import.meta.url))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.slice(0, -3))
  .sort();

/** Fail the test on any page error or console error. Call before page.goto. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

/** Type a value into a number box (or click a tab) the way a student would. */
export async function setValue(page, key, value) {
  if (key === 'tab') {
    await page.locator('[data-tool] [data-tabs] > *').nth(value).click();
    return;
  }
  await page.evaluate(([k, v]) => {
    const el = document.querySelector(`[data-tool] #${k}-n`) || document.querySelector(`[data-tool] #${k}`);
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [key, value]);
}
