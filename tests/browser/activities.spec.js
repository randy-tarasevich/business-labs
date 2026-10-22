// Challenges, Predict first, and the T-Account Lab walkthrough.
import { test, expect } from '@playwright/test';
import { watchErrors, setValue } from './helpers.js';
import { CHALLENGE_ANSWERS, PREDICTION_ANSWERS, T_ACCOUNT_ENTRIES, ADJUSTING_ENTRIES, CLOSING_SORT, CLOSING_ENTRIES, BANK_REC_ITEMS } from './fixtures.js';
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

test('Adjusting Entries Lab: targeted hints, all 7 adjustments, and the adjusted trial balance', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/adjusting-entries-lab/');
  const fb = page.locator('[data-r="feedback"]');
  const enter = async (dr, cr, amt) => {
    await page.selectOption('#ae-dr', dr);
    await page.selectOption('#ae-cr', cr);
    await page.fill('#ae-dr-amt', String(amt));
    await page.fill('#ae-cr-amt', String(amt));
    await page.click('[data-act="check"]');
  };
  await expect(page.locator('[data-r="ni-start"]')).toHaveText('$3,350');
  await expect(page.locator('[data-r="f-dr"]')).toHaveText('$31,200');
  await enter('supexp', 'supplies', 450);
  await expect(fb).toContainText('what was used up');
  await enter('supexp', 'cash', 650);
  await expect(fb).toContainText('never use Cash');
  await enter('supexp', 'supplies', 600);
  await expect(fb, 'second wrong amount shows the calculation').toContainText('$1,100 on the books');
  for (const [i, [dr, cr, amt]] of ADJUSTING_ENTRIES.entries()) {
    if (i === 2) {
      await enter('depexp', 'equipment', 300);
      await expect(fb).toContainText('never touches the Equipment account');
    }
    await enter(dr, cr, amt);
    await expect(fb).toContainText('Correct');
    await page.click('[data-act="next"]');
  }
  await expect(page.locator('[data-r="f-dr"]')).toHaveText('$32,230');
  await expect(page.locator('[data-r="f-cr"]')).toHaveText('$32,230');
  await expect(page.locator('[data-r="ni-now"]')).toHaveText('$2,570');
  await expect(page.locator('[data-r="text"]')).toContainText('$3,350 of profit instead of $2,570');
  await expect(page.locator('[data-act="restart"]')).toBeVisible();
  await expect(page.locator('[data-share]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Closing Entries Lab: the sort, targeted hints, all 4 entries, and the post-closing trial balance', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/closing-entries-lab/');
  const fb = page.locator('[data-r="feedback"]');
  const box = (id) => page.locator(`#ce-sort-${id}`);
  await expect(page.locator('[data-r="adj-dr"]')).toHaveText('$32,230');

  // Sort: the Unearned Revenue trap first, then the right answer.
  for (const id of [...CLOSING_SORT, 'unearned']) await box(id).check();
  await page.click('[data-act="check"]');
  await expect(fb).toContainText('it\'s a liability');
  await box('unearned').uncheck();
  await page.click('[data-act="check"]');
  await expect(fb).toContainText('All correct');
  await page.click('[data-act="next"]');

  const enter = async (dr, cr, amt) => {
    await page.selectOption('#ce-dr', dr);
    await page.selectOption('#ce-cr', cr);
    await page.fill('#ce-dr-amt', String(amt));
    await page.fill('#ce-cr-amt', String(amt));
    await page.click('[data-act="check"]');
  };
  await enter('sales', 'capital', 5900);
  await expect(fb).toContainText('Income Summary first');
  await enter('sales', 'incsum', 5200);
  await expect(fb).toContainText('before adjustments');
  await enter('cash', 'incsum', 5900);
  await expect(fb).toContainText('never use Cash');
  for (const [i, [dr, cr, amt]] of CLOSING_ENTRIES.entries()) {
    if (i === 3) {
      await enter('incsum', 'drawing', 800);
      await expect(fb).toContainText('skips Income Summary');
    }
    await enter(dr, cr, amt);
    await expect(fb).toContainText('Correct');
    if (i === 1) await expect(page.getByRole('status').filter({ hasText: 'Income Summary holds $2,570' })).toBeVisible();
    await page.click('[data-act="next"]');
  }
  await expect(page.locator('[data-r="pc-dr"]')).toHaveText('$28,100');
  await expect(page.locator('[data-r="pc-cr"]')).toHaveText('$28,100');
  await expect(page.locator('[data-r="tb-verdict"]')).toContainText('Post-closing trial balance');
  await expect(page.locator('[data-r="text"]')).toContainText('$12,470');
  await expect(page.locator('[data-act="restart"]')).toBeVisible();
  await expect(page.locator('[data-share]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Bank Reconciliation Lab: targeted hints, all 8 items, and matching balances', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/tools/bank-reconciliation-lab/');
  const fb = page.locator('[data-r="feedback"]');
  const place = async (where, amt) => {
    await page.selectOption('#br-place', where);
    if (where !== 'none') await page.fill('#br-amt', String(amt));
    await page.click('[data-act="check"]');
  };
  await expect(page.locator('[data-r="diff"]')).toHaveText('$153');
  await place('book+', 650);
  await expect(fb).toContainText('Maya already recorded this');
  for (const [i, [where, amt]] of BANK_REC_ITEMS.entries()) {
    if (i === 1) {
      await place('book-', 180);
      await expect(fb).toContainText('already subtracted this check');
    }
    if (i === 3) {
      await place('bank-', 300);
      await expect(fb).toContainText('Does it explain any of the difference');
    }
    if (i === 7) {
      await place('book+', 96);
      await expect(fb).toContainText('difference between what she recorded');
      await place('book-', 27);
      await expect(fb).toContainText('too much or too little');
    }
    await place(where, amt);
    await expect(fb).toContainText('Correct');
    await page.click('[data-act="next"]');
  }
  await expect(page.locator('[data-r="bank-adj"]')).toHaveText('$6,137');
  await expect(page.locator('[data-r="book-adj"]')).toHaveText('$6,137');
  await expect(page.locator('[data-r="verdict"]')).toContainText('Reconciled');
  await expect(page.locator('[data-r="je"] tr')).toHaveCount(8);
  await expect(page.locator('[data-act="restart"]')).toBeVisible();
  await expect(page.locator('[data-share]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
