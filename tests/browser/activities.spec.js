// Challenges, Predict first, and the T-Account Lab walkthrough.
import { test, expect } from '@playwright/test';
import { watchErrors, setValue } from './helpers.js';
import { CHALLENGE_ANSWERS, PREDICTION_ANSWERS, T_ACCOUNT_ENTRIES } from './fixtures.js';
import { CHALLENGES } from '../../src/data/challenges.js';
import { PREDICTIONS } from '../../src/data/predictions.js';

test('every challenge and prediction has a known answer in fixtures.js', () => {
  for (const [slug, list] of Object.entries(CHALLENGES)) {
    expect(CHALLENGE_ANSWERS[slug]?.length, `add answers for ${slug} challenges to tests/browser/fixtures.js`).toBe(list.length);
  }
  for (const [slug, list] of Object.entries(PREDICTIONS)) {
    expect(PREDICTION_ANSWERS[slug]?.length, `add answers for ${slug} predictions to tests/browser/fixtures.js`).toBe(list.length);
  }
});

for (const [slug, answers] of Object.entries(CHALLENGE_ANSWERS)) {
  answers.forEach((a, i) => {
    for (const [kind, changes, status] of [['solve', a.solve, 'Done ✓'], ['break a rule', a.break, 'Rule broken']]) {
      test(`challenge ${slug} #${i + 1}: ${kind}`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`/tools/${slug}/`);
        const card = page.locator('[data-ch]').nth(i);
        await card.locator('[data-start]').click();
        await page.waitForURL(/ch=/);
        const status_ = page.locator('[data-ch]').nth(i).locator('[data-status]');
        await expect(status_, 'the starting scenario should not already be solved').toHaveText('Not yet');
        await expect(page.locator('[data-ch]').nth(i)).toHaveAttribute('data-active', '');
        for (const [k, v] of Object.entries(changes)) await setValue(page, k, v);
        await expect(status_).toHaveText(status);
        expect(errors).toEqual([]);
      });
    }
  });
}

for (const [slug, answers] of Object.entries(PREDICTION_ANSWERS)) {
  answers.forEach((right, i) => {
    for (const guess of ['up', 'down', 'same']) {
      test(`prediction ${slug} #${i + 1}: guess ${guess}`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`/tools/${slug}/`);
        const card = page.locator('[data-pr]').nth(i);
        await card.locator(`[data-choice="${guess}"]`).click();
        await expect(card.locator('[data-again]')).toBeVisible();
        await expect(card).toHaveAttribute('data-tone', guess === right ? 'good' : 'warn');
        await card.locator('[data-again]').click();
        await expect(card.locator('[data-result]')).toBeEmpty();
        await expect(card.locator('[data-choice]').first()).toBeEnabled();
        expect(errors).toEqual([]);
      });
    }
  });
}

test('predictions: a second card waits while the first replays', async ({ page }) => {
  await page.goto('/tools/break-even-lab/');
  const cards = page.locator('[data-pr]');
  await cards.nth(0).locator('[data-choice="down"]').click();
  await expect(cards.nth(1).locator('[data-choice="up"]')).toBeDisabled();
  await expect(cards.nth(0).locator('[data-again]')).toBeVisible();
  await expect(cards.nth(1).locator('[data-result]')).toBeEmpty();
  await cards.nth(1).locator('[data-choice="up"]').click();
  await expect(cards.nth(1)).toHaveAttribute('data-tone', 'good');
  await expect(cards.nth(0).locator('[data-result]')).toContainText('100 shirts → 100 shirts');
});

test('T-Account Lab: hints, all 12 entries, and a balanced trial balance', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/t-account-lab/');
  const fb = page.locator('[data-r="feedback"]');
  const enter = async (dr, cr, amt, crAmt = amt) => {
    await page.selectOption('#ta-dr', dr);
    await page.selectOption('#ta-cr', cr);
    await page.fill('#ta-dr-amt', String(amt));
    await page.fill('#ta-cr-amt', String(crAmt));
    await page.click('[data-act="check"]');
  };
  await enter('cash', 'capital', 10000, 9000);
  await expect(fb).toContainText('Debits must equal credits');
  await enter('capital', 'cash', 10000);
  await expect(fb).toContainText('wrong sides');
  for (const [i, [dr, cr, amt]] of T_ACCOUNT_ENTRIES.entries()) {
    await enter(dr, cr, amt);
    await expect(fb).toContainText('Correct');
    if (i < T_ACCOUNT_ENTRIES.length - 1) await page.click('[data-act="next"]');
  }
  await expect(page.locator('[data-r="tb-dr"]')).toHaveText('$26,400');
  await expect(page.locator('[data-r="tb-cr"]')).toHaveText('$26,400');
  await expect(page.locator('[data-share]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
