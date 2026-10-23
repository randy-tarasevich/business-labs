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
import { plan, payment } from '../../src/scripts/tools/student-loans.js';
import { paycheck } from '../../src/scripts/tools/paycheck.js';
import { outlook, normalCdf, normalizeMix, Z90 } from '../../src/scripts/tools/investing-risk.js';

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

test('product life cycle: stage signs and move outcomes', async () => {
  const { PRODUCTS, STAGES, yearChange } = await import('../../src/scripts/tools/product-life-cycle.js');
  assert.deepEqual(PRODUCTS.map((p) => p.stage), ['intro', 'growth', 'maturity', 'decline']);
  // Year-over-year change, worked out by hand (see the teacher notes).
  const pct = PRODUCTS.map((p) => Math.round(yearChange(p.sales) * 100) || 0);
  assert.deepEqual(pct, [Math.round((4000 / 3000 - 1) * 100), Math.round((128000 / 46000 - 1) * 100), 0, Math.round((100000 / 205000 - 1) * 100)]);
  assert.deepEqual(pct, [33, 178, 0, -51]);
  // The data have to show each stage's signs.
  const [ring, nuggets, drink, dvd] = PRODUCTS;
  assert.ok(ring.profit < 0 && nuggets.profit > nuggets.profitBefore && drink.profit < drink.profitBefore && dvd.profit < dvd.profitBefore);
  for (const p of PRODUCTS) {
    assert.ok(STAGES[p.stage]);
    for (const list of [p.moves, p.ops]) assert.equal(list.filter((m) => m.best).length, 1, `${p.name}: exactly one best option`);
    for (const m of p.moves) assert.equal(m.next.length, 4);
  }
  // Best move wins on sales everywhere except decline, where it is the profitable exit with the lowest sales.
  for (const p of [ring, nuggets, drink]) {
    const best = p.moves.find((m) => m.best).next.at(-1);
    for (const m of p.moves.filter((x) => !x.best)) assert.ok(best > m.next.at(-1), `${p.name}: best move sells most`);
  }
  const dvdBest = dvd.moves.find((m) => m.best).next.at(-1);
  assert.ok(dvd.moves.filter((m) => !m.best).every((m) => m.next.at(-1) > dvdBest));
});

test('unit economics: CAC, LTV, ratio, payback', async () => {
  const { PRESETS, unitEconomics } = await import('../../src/scripts/tools/unit-economics.js');
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} should be ${b}`);
  // Worked out by hand (see the teacher notes).
  const [truck, snack, tutor] = PRESETS.map(unitEconomics);
  close(truck.cac, 900 / 30);
  close(truck.monthly, 12 * 2 * 0.55);
  close(truck.ltv, 13.2 * 6);
  close(truck.ratio, 79.2 / 30);
  close(truck.payback, 30 / 13.2);
  close(snack.cac, 40);
  close(snack.ltv, 7.5 * 4);
  close(snack.ratio, 0.75);
  close(snack.perCustomer, -10);
  assert.ok(snack.payback > PRESETS[1].months, 'snack box customers leave before paying back');
  close(tutor.ltv, 40 * 4 * 0.7 * 5);
  close(tutor.ratio, 560 / 150);
  // Try it #3: food truck customers stay 9 months.
  close(unitEconomics({ ...PRESETS[0], months: 9 }).ratio, (13.2 * 9) / 30);
  // Edge cases: no new customers, free customers, no margin.
  assert.ok(Number.isNaN(unitEconomics({ ...PRESETS[0], newc: 0 }).cac));
  assert.equal(unitEconomics({ ...PRESETS[0], spend: 0 }).ratio, Infinity);
  assert.equal(unitEconomics({ ...PRESETS[0], margin: 0 }).payback, Infinity);
});

test('positioning map: customer splits and the gap lesson', async () => {
  const { MARKETS, compete, START } = await import('../../src/scripts/tools/positioning-map.js');
  const [pizza, snacks, shoes] = MARKETS;
  const won = (m, x, y) => Math.round(compete(m, { x, y }).yours);
  // One split by hand: you at Families (4, 4.5). Weight = pull ÷ (distance + 0.5)², pull 1 for you, 3 for rivals.
  const w = (pull, d) => pull / (d + 0.5) ** 2;
  const you = w(1, 0);
  const rivals = w(3, Math.hypot(0.5, 0.5)) + w(3, Math.hypot(2, 0.5)) + w(3, Math.hypot(2, 2)); // Planet Pie, Crust & Co., Slice Shack
  assert.equal(won(pizza, 4, 4.5), Math.round((400 * you) / (you + rivals))); // 236
  // The gap beats copying a crowded spot in every market, and the start corner wins nothing.
  assert.equal(won(pizza, 4.5, 8), 350);
  assert.equal(won(snacks, 3.5, 7.5), 300);
  assert.equal(won(shoes, 5, 6.5), 400);
  assert.ok(won(pizza, 4, 4.5) < 350 && won(snacks, 2.5, 2.5) < 300 && won(shoes, 2.5, 3) < 400 && won(shoes, 8.5, 8.5) < 100);
  for (const m of MARKETS) assert.equal(won(m, START.x, START.y), 0, `${m.name}: start wins nothing`);
  assert.equal(won(snacks, 1, 9.5), 0, 'corner with no customers in reach');
  // Hard-to-afford flag: feature 5+ above price.
  assert.equal(compete(pizza, { x: 2, y: 9 }).stretch, true);
  assert.equal(compete(pizza, { x: 4.5, y: 8 }).stretch, false);
  // Every customer is counted once: split + unserved = market size.
  for (const m of MARKETS) for (const [x, y] of [[5, 5], [0, 10], [9, 9]]) {
    const c = compete(m, { x, y });
    const counted = c.groups.reduce((t, g) => t + g.split.reduce((a, b) => a + b, 0) + g.unserved, 0);
    assert.ok(Math.abs(counted - c.total) < 1e-9);
  }
});

test('student loans: in-state public ($28,000 cost, $6,000 grants, $10,000 family, 4 years, 10% private)', () => {
  const p = plan({ cost: 28000, aid: 6000, family: 10000, years: 4, rate: 10, salary: 55000, sub: true });
  // Gap $12,000 a year. Federal limits 5,500 / 6,500 / 7,500 / 7,500 = 27,000; private covers the rest = 21,000.
  assert.equal(p.fedBorrowed, 27000);
  assert.equal(p.privBorrowed, 21000);
  // Subsidized 3,500 + 4,500 + 5,500 + 5,500 = 19,000, so $2,000 unsubsidized each year.
  assert.equal(p.subBorrowed, 19000);
  // Money waits 4.5, 3.5, 2.5, 1.5 years (school left + 6-month grace).
  // Federal: 2,000 x 6.52% x (4.5 + 3.5 + 2.5 + 1.5) = 1,564.80
  // Private: 10% x (6,500 x 4.5 + 5,500 x 3.5 + 4,500 x 2.5 + 4,500 x 1.5) = 6,650
  near(p.accrued, 8214.8, 0.01);
  near(p.owed, 56214.8, 0.01);
});

test('student loans: no subsidized loans means interest on the whole federal loan', () => {
  const p = plan({ cost: 28000, aid: 6000, family: 10000, years: 4, rate: 10, salary: 55000, sub: false });
  // Federal: 6.52% x (5,500 x 4.5 + 6,500 x 3.5 + 7,500 x 2.5 + 7,500 x 1.5) = 6.52% x 77,500 = 5,053
  near(p.accrued, 5053 + 6650, 0.01);
});

test('student loans: federal lifetime limit stops at $31,000', () => {
  // 6 years with a big gap: 5,500 + 6,500 + 7,500 + 7,500 = 27,000, then only 4,000 more allowed.
  const p = plan({ cost: 40000, aid: 0, family: 0, years: 6, rate: 10, salary: 55000, sub: true });
  assert.equal(p.fedBorrowed, 31000);
  assert.equal(p.subBorrowed, 23000);
  assert.equal(p.borrowed, 240000);
});

test('student loans: monthly payment matches textbook amortization tables', () => {
  near(payment(10000, 6, 120), 111.02, 0.01); // $10,000 at 6% for 10 years
  near(payment(10000, 10, 120), 132.15, 0.01); // $10,000 at 10% for 10 years
  near(payment(12000, 0, 120), 100, 0.001); // no interest: just split it up
});

test('paycheck: first full-time job ($22 x 40 hours, 3% 401(k), 3% state)', () => {
  const y = paycheck({ hourly: 22, hours: 40, k: 3, state: 3 });
  // Gross 22 x 40 x 52 = 45,760. 401(k) 3% = 1,372.80.
  assert.equal(y.gross, 45760);
  near(y.k401, 1372.8, 0.001);
  // Taxable = 45,760 - 1,372.80 - 16,100 = 28,287.20.
  // Federal = 10% x 12,400 + 12% x (28,287.20 - 12,400) = 1,240 + 1,906.46 = 3,146.46
  near(y.fed, 3146.464, 0.001);
  assert.equal(y.marginal, 12);
  // FICA on all 45,760: 6.2% = 2,837.12; 1.45% = 663.52. State 3% x 44,387.20 = 1,331.62.
  near(y.ss, 2837.12, 0.001);
  near(y.medicare, 663.52, 0.001);
  near(y.state, 1331.616, 0.001);
  near(y.net, 45760 - 1372.8 - 3146.464 - 2837.12 - 663.52 - 1331.616, 0.001);
});

test('paycheck: a raise into the 22% bracket only taxes the dollars above the line', () => {
  // $33 x 40 x 52 = 68,640; 3% 401(k) = 2,059.20; taxable = 50,480.80, so $80.80 sits in the 22% bracket.
  // Federal = 1,240 + 12% x 38,000 + 22% x 80.80 = 1,240 + 4,560 + 17.776 = 5,817.776
  const y = paycheck({ hourly: 33, hours: 40, k: 3, state: 3 });
  near(y.fed, 5817.776, 0.001);
  assert.equal(y.marginal, 22);
  assert.ok(y.net > paycheck({ hourly: 32, hours: 40, k: 3, state: 3 }).net, 'the raise still raises take-home pay');
});

test('paycheck: Social Security stops at the wage base; extra Medicare starts over $200,000', () => {
  // $125 x 40 x 52 = 260,000. Social Security = 6.2% x 184,500 = 11,439.
  // Medicare = 1.45% x 260,000 + 0.9% x 60,000 = 3,770 + 540 = 4,310.
  const y = paycheck({ hourly: 125, hours: 40, k: 0, state: 0 });
  near(y.ss, 11439, 0.001);
  near(y.medicare, 4310, 0.001);
});

test('paycheck: pay under the standard deduction owes no federal income tax', () => {
  // $17 x 15 x 52 = 13,260, under 16,100.
  assert.equal(paycheck({ hourly: 17, hours: 15, k: 0, state: 3 }).fed, 0);
});

test('investing risk: normal table values', () => {
  near(normalCdf(0), 0.5, 1e-7);
  near(normalCdf(1), 0.8413, 0.0001); // z-table
  near(normalCdf(-1.96), 0.025, 0.0001); // z-table
  near(normalCdf(-Z90), 0.10, 1e-6);
});

test('investing risk: car fund, $5,000 all in stocks for 2 years', () => {
  // Lognormal from an 11.82% average and 19.46% standard deviation:
  // sigma^2 = ln(1 + 0.1946^2 / 1.1182^2) = ln(1.030286) = 0.029837; mu = ln(1.1182) - 0.029837 / 2 = 0.096798
  const o = outlook({ amount: 5000, years: 2, stocks: 100, bonds: 0 });
  near(o.sigma, Math.sqrt(0.029837), 0.0001);
  near(o.mu, 0.096798, 0.00001);
  near(o.middle, 5000 * Math.exp(2 * 0.096798), 0.5); // about 6,068
  // Chance of losing money = P(Z < -0.096798 x sqrt(2) / 0.17273) = P(Z < -0.7925). z-table: 0.214
  near(o.lossChance, 0.214, 0.001);
});

test('investing risk: all cash never loses and grows at the cash rate', () => {
  const o = outlook({ amount: 5000, years: 40, stocks: 0, bonds: 0 });
  assert.equal(o.lossChance, 0);
  near(o.middle, o.bad, 1e-6);
  near(o.middle, 5000 * 1.0333 ** 40, 0.01); // about 18,536
});

test('investing risk: stocks and bonds can never add past 100%', () => {
  assert.deepEqual(normalizeMix(70, 50), { stocks: 70, bonds: 30, cash: 0 });
  assert.deepEqual(normalizeMix(60, 0), { stocks: 60, bonds: 0, cash: 40 });
});
