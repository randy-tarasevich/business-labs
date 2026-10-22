// Math checks for the tools. Run with: npm test
//
// Each expected value is worked out a different way than the tool does it (a textbook formula or
// by hand, shown in the comments), so these catch the tool being wrong, not just the tool changing.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { schedule } from '../../src/scripts/tools/depreciation.js';
import { costMethod } from '../../src/scripts/tools/inventory-methods.js';
import { computeRatios } from '../../src/scripts/tools/ratio-dashboard.js';
import { funnel } from '../../src/scripts/tools/marketing-funnel.js';
import { payoff, duration } from '../../src/scripts/tools/credit-card.js';
import { grow } from '../../src/scripts/tools/start-early.js';
import { TRANSACTIONS, ACCOUNTS, balances } from '../../src/scripts/tools/t-accounts.js';
import { oppCost } from '../../src/scripts/tools/comparative-advantage.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const sum = (rows) => rows.reduce((t, r) => t + r.dep, 0);

test('depreciation: food truck ($60,000, salvage $6,000, 8 years)', () => {
  const sl = schedule('sl', 60000, 6000, 8);
  const ddb = schedule('ddb', 60000, 6000, 8);
  const syd = schedule('syd', 60000, 6000, 8);
  assert.equal(sl[0].dep, 6750); // 54,000 / 8
  assert.equal(ddb[0].dep, 15000); // 60,000 x 2/8
  assert.equal(syd[0].dep, 12000); // 54,000 x 8/36
  for (const rows of [sl, ddb, syd]) {
    near(sum(rows), 54000, 0.01, 'every method totals cost minus salvage:');
    assert.equal(rows.at(-1).end, 6000, 'book value ends at salvage');
    assert.equal(rows.length, 8);
  }
});

test('depreciation: delivery van ($35,000, salvage $5,000, 5 years)', () => {
  assert.equal(schedule('ddb', 35000, 5000, 5)[0].dep, 14000); // 35,000 x 2/5
  assert.equal(schedule('syd', 35000, 5000, 5)[0].dep, 10000); // 30,000 x 5/15
  assert.equal(schedule('sl', 35000, 5000, 5)[0].dep, 6000); // 30,000 / 5
});

test('depreciation: double-declining never goes below salvage', () => {
  // Laptop: $1,500, salvage $100, 3 years. 2/3 of 1,500 = 1,000 in year 1, 333.33 in year 2, then floor.
  const rows = schedule('ddb', 1500, 100, 3);
  rows.forEach((r) => assert.ok(r.end >= 100 - 0.005, `year ${r.year} book value ${r.end} below salvage`));
  near(sum(rows), 1400, 0.01);
});

test('inventory: sneakers, prices rising, 70 of 100 sold', () => {
  const layers = [[20, 60], [30, 65], [30, 70], [20, 78]]; // total cost 6,810
  // FIFO: 20 x 60 + 30 x 65 + 20 x 70 = 4,550
  assert.equal(costMethod(layers, 70, 'fifo').cogs, 4550);
  // LIFO: 20 x 78 + 30 x 70 + 20 x 65 = 4,960
  assert.equal(costMethod(layers, 70, 'lifo').cogs, 4960);
  // Weighted average: 6,810 / 100 = 68.10 each x 70 = 4,767
  assert.equal(costMethod(layers, 70, 'avg').cogs, 4767);
  for (const m of ['fifo', 'lifo', 'avg']) {
    const r = costMethod(layers, 70, m);
    near(r.cogs + r.ending, 6810, 0.01, `${m}: COGS + ending inventory = goods available:`);
  }
});

test('ratios: hardware store', () => {
  const d = { ca: 400000, inv: 220000, ta: 750000, cl: 160000, tl: 280000, sales: 1600000, cogs: 1040000, ni: 120000 };
  const v = Object.fromEntries(computeRatios(d).map((x) => [x.r.name, x.v]));
  near(v['Current ratio'], 2.5, 1e-9); // 400 / 160
  near(v['Quick ratio'], 1.125, 1e-9); // (400 - 220) / 160
  near(v['Debt-to-equity'], 280 / 470, 1e-9); // equity = 750 - 280
  near(v['Gross margin'], 0.35, 1e-9); // (1,600 - 1,040) / 1,600
  near(v['Net profit margin'], 0.075, 1e-9);
  near(v['Return on assets'], 0.16, 1e-9);
  near(v['Return on equity'], 120 / 470, 1e-9);
  near(v['Inventory turnover'], 1040 / 220, 1e-9);
});

test('marketing funnel: bakery social media ads', () => {
  // $500 at $8 per 1,000 views = 62,500 views; 1.2% click = 750; 4% buy = 30 customers.
  const f = funnel({ budget: 500, cpm: 8, ctr: 1.2, conv: 4, aov: 28, margin: 60 });
  near(f.views, 62500, 1e-6);
  near(f.clicks, 750, 1e-6);
  near(f.customers, 30, 1e-6);
  near(f.revenue, 840, 1e-6); // 30 x $28
  near(f.profit, 4, 1e-6); // 840 x 60% - 500
  near(f.roas, 1.68, 1e-9);
  near(f.cac, 500 / 30, 1e-9);
});

test('credit card: $1,200 at 24% APR, $100 a month', () => {
  // Annuity: n = -ln(1 - rP/A) / ln(1 + r) with r = 2%, P = 1,200, A = 100 -> 13.86, so 14 payments.
  // After 13 payments the balance is 1,200(1.02^13) - 100((1.02^13 - 1) / 0.02) = 84.29; last payment 85.98.
  // Total paid 1,385.98, so interest is 185.98.
  const p = payoff({ balance: 1200, apr: 24, fixed: 100 }, 'fixed');
  assert.equal(p.months, 14);
  assert.equal(duration(p.months), '1 year, 2 months');
  near(p.interest, 185.98, 0.005);
});

test('start early: $50 a month at 7%, age 16 vs. 26 to 65', () => {
  // Future value of monthly deposits: 50((1 + r)^n - 1) / r, r = 0.07 / 12.
  const fv = (months) => { const r = 0.07 / 12; return (50 * ((1 + r) ** months - 1)) / r; };
  const a = grow(50, 7, 16, 65);
  const b = grow(50, 7, 26, 65);
  near(a.final, fv(49 * 12), 1, 'Saver A at 65:'); // about $253,461
  near(b.final, fv(39 * 12), 1, 'Saver B at 65:'); // about $121,815
  assert.equal(a.put, 50 * 12 * 49); // $29,400 deposited
  assert.equal(b.put, 50 * 12 * 39); // $23,400 deposited
});

test('T-account lab: every entry balances and the trial balance is $26,400', () => {
  const ids = new Set(ACCOUNTS.map((a) => a.id));
  TRANSACTIONS.forEach((t, i) => {
    assert.ok(ids.has(t.dr) && ids.has(t.cr), `transaction ${i + 1} uses a real account`);
    assert.notEqual(t.dr, t.cr, `transaction ${i + 1} debits and credits different accounts`);
    assert.ok(t.amt > 0);
  });
  const { dr, cr } = balances(TRANSACTIONS);
  const normalDebit = new Set(['A', 'D', 'X']);
  let debits = 0, credits = 0;
  for (const a of ACCOUNTS) {
    const bal = normalDebit.has(a.type) ? dr[a.id] - cr[a.id] : cr[a.id] - dr[a.id];
    assert.ok(bal >= 0, `${a.name} has a negative balance`);
    if (normalDebit.has(a.type)) debits += bal; else credits += bal;
  }
  assert.equal(debits, 26400);
  assert.equal(credits, 26400);
  // Ending cash by hand: 10,000 + 15,000 - 20,000 + 1,500 - 300 - 500 + 600 - 1,000 - 700 = 4,600
  assert.equal(dr.cash - cr.cash, 4600);
  // Equity ties to the Accounting Equation Lab: capital - drawing + revenue - expenses = 10,700
  const net = (id) => cr[id] - dr[id];
  assert.equal(net('capital') + net('drawing') + net('sales') + net('fuel') + net('supexp'), 10700);
});

test('comparative advantage: opportunity cost', () => {
  assert.equal(oppCost([10, 40]), 4); // 1 fish costs 4 coconuts
  assert.equal(oppCost([20, 20]), 1);
  assert.equal(oppCost([0, 10]), Infinity);
});

test('adjusting entries: Maya, end of month 2', async () => {
  const { ACCOUNTS: A, UNADJUSTED, ADJUSTMENTS, adjustedBalances, netIncome } = await import('../../src/scripts/tools/adjusting-entries.js');
  const debitNormal = new Set(['A', 'D', 'X']);
  const totals = (bal) => A.reduce(([d, c], a) => (debitNormal.has(a.type) ? [d + (bal[a.id] || 0), c] : [d, c + (bal[a.id] || 0)]), [0, 0]);
  assert.deepEqual(totals(UNADJUSTED), [31200, 31200], 'unadjusted trial balance');

  // Amounts worked out by hand (see the teacher notes).
  assert.deepEqual(ADJUSTMENTS.map((t) => t.amt), [
    1100 - 450, // supplies used
    1200 / 6, // one month of a six-month policy
    (20000 - 2000) / 5 / 12, // straight-line, one month
    900 / 3, // one of three catering events
    4 * 60, // four days of wages
    (13500 * 0.08) / 12, // one month of interest
    400, // earned, billed next month
  ]);
  ADJUSTMENTS.forEach((t, i) => assert.ok(t.dr !== 'cash' && t.cr !== 'cash', `adjustment ${i + 1} must not use Cash`));

  const bal = adjustedBalances();
  assert.deepEqual(totals(bal), [32230, 32230], 'adjusted trial balance');
  assert.equal(netIncome(adjustedBalances(0)), 5200 - 1200 - 650); // 3,350
  assert.equal(netIncome(bal), 3350 + 700 - 1480); // 2,570
  // Accounting equation: assets (truck at book value) = liabilities + capital - drawing + net income
  const assets = bal.cash + bal.ar + bal.supplies + bal.prepaid + bal.equipment - bal.accdep;
  const liabilities = bal.ap + bal.wagespay + bal.intpay + bal.unearned + bal.loan;
  assert.equal(assets, 27500);
  assert.equal(liabilities, 15030);
  assert.equal(assets, liabilities + bal.capital - bal.drawing + netIncome(bal));
});

test('closing entries: Maya, end of month 2', async () => {
  const { ACCOUNTS: A, ADJUSTED, ENTRIES, SORTABLE, isTemporary, closedBalances, totals } = await import('../../src/scripts/tools/closing-entries.js');
  assert.deepEqual(totals(ADJUSTED), [32230, 32230], 'starts from the adjusted trial balance');

  // Sort: 8 temporary accounts close, 12 permanent ones carry over.
  const temp = SORTABLE.filter(isTemporary).sort();
  assert.deepEqual(temp, ['depexp', 'drawing', 'fuel', 'insexp', 'intexp', 'sales', 'supexp', 'wagesexp']);
  assert.equal(SORTABLE.length - temp.length, 12);
  for (const id of ['unearned', 'accdep', 'capital']) assert.equal(isTemporary(id), false, `${id} is permanent`);

  // Amounts worked out by hand (see the teacher notes).
  assert.deepEqual(ENTRIES.map((e) => e.amt), [
    5200 + 300 + 400, // adjusted revenue
    650 + 200 + 300 + 1440 + 90 + 650, // adjusted expenses
    5900 - 3330, // net income
    800, // drawing
  ]);
  ENTRIES.forEach((e, i) => assert.ok(e.dr !== 'cash' && e.cr !== 'cash', `entry ${i + 1} must not use Cash`));

  // Still balanced after every entry.
  for (let n = 0; n <= ENTRIES.length; n++) {
    const [d, c] = totals(closedBalances(n));
    assert.equal(d, c, `balanced after ${n} entries`);
  }
  assert.equal(closedBalances(2).incsum, 2570, 'Income Summary holds net income after entry 2');

  const bal = closedBalances();
  for (const a of A) if (isTemporary(a.id)) assert.equal(bal[a.id], 0, `${a.name} closed`);
  assert.equal(bal.capital, 10700 + 2570 - 800);
  assert.deepEqual(totals(bal), [28100, 28100], 'post-closing trial balance');
  const assets = bal.cash + bal.ar + bal.supplies + bal.prepaid + bal.equipment - bal.accdep;
  assert.equal(assets, 27500);
  assert.equal(assets, bal.ap + bal.wagespay + bal.intpay + bal.unearned + bal.loan + bal.capital);
});

test('bank reconciliation: Maya, end of month 3', async () => {
  const { BANK_START, BOOK_START, ITEMS, PLACES, balances } = await import('../../src/scripts/tools/bank-reconciliation.js');
  // Worked out by hand (see the teacher notes).
  assert.deepEqual(balances(0), { bank: 6087, book: 6240 });
  assert.deepEqual(balances(), { bank: 6087 + 650 - 180 - 420, book: 6240 - 15 - 120 + 5 + 27 });
  assert.equal(balances().bank, 6137);
  assert.equal(balances().book, 6137);
  assert.equal(ITEMS.find((t) => t.kind === 'Recording error').amt, 96 - 69);
  // Only Maya's side gets journal entries, and every one of them does.
  for (const t of ITEMS) assert.equal(!!t.entry, PLACES[t.place].side === 'book', `${t.label}: journal entry only on Maya's side`);
  assert.equal(BOOK_START - BANK_START, 153);
});
