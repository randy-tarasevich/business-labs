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

/**
 * Type a value into a number box (or click a tab, or tick a checkbox) the way a student would.
 * Keys are share-link keys: an input id without "-n", or f0, f1, ... for inputs without an id,
 * counted the same way src/scripts/lib/share-state.js counts them.
 */
export async function setValue(page, key, value) {
  if (key === 'tab') {
    await page.locator('[data-tool] [data-tabs] > *').nth(value).click();
    return;
  }
  await page.evaluate(([k, v]) => {
    const root = document.querySelector('[data-tool]');
    const unnamed = () =>
      [...root.querySelectorAll('input, select')].filter(
        (el) => !el.closest('[data-no-share]') && !el.id && el.type !== 'radio' && (el.type === 'range' || ['number', 'checkbox', 'select-one'].includes(el.type))
      );
    const el = root.querySelector(`#${k}-n`) || root.querySelector(`#${k}`) || (/^f\d+$/.test(k) ? unnamed()[+k.slice(1)] : null);
    if (!el) throw new Error(`setValue: no input for "${k}"`);
    if (el.type === 'checkbox') el.checked = Number(v) === 1;
    else el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, [key, value]);
}
