// Challenge mode: goal cards under a tool. Each card checks itself live as students change the numbers.
//
// Keyed by tool slug (the content file name). Each challenge:
//   title   short name for the card
//   goal    what to reach, in one or two plain sentences (student-facing: no em-dashes)
//   start   share-link params that set up the scenario (see src/scripts/lib/share-state.js):
//           g0 = which preset, g1 = which tab, and input ids (without "-n") for any overrides
//   met(s)  true when the goal is reached
//   rules   limits that must still hold: { text, ok(s) }
//
// s is the tool's current state: s.v('be-price') reads an input as a number, s.raw('fx-mode') reads
// it as text, s.pick(1) reads which button is pressed in group 1 (presets are group 0, tabs are group 1).
// Many tools clear the preset button once a number changes, so a card that needs preset data the
// inputs don't hold (a site or country you aren't editing) names its preset instead of reading pick(0).
// Checks reuse each tool's own math where it's exported, so a card never disagrees with the results on screen.
//
// Sample solutions go in the tool's teacher notes, never here: this file ships to student pages.

import { schedule } from '../scripts/tools/depreciation.js';
import { funnel } from '../scripts/tools/marketing-funnel.js';
import { plan, repay, TAKE_HOME } from '../scripts/tools/student-loans.js';
import { payoff } from '../scripts/tools/credit-card.js';
import { grow } from '../scripts/tools/start-early.js';
import { paycheck } from '../scripts/tools/paycheck.js';
import { outlook } from '../scripts/tools/investing-risk.js';
import { compare } from '../scripts/tools/insurance.js';
import { compareCars } from '../scripts/tools/car-buying.js';
import { abTest } from '../scripts/tools/ab-test.js';
import { engagement } from '../scripts/tools/engagement-rate.js';
import { POSTS, SIGNALS, rank } from '../scripts/tools/feed-ranking.js';
import { deal } from '../scripts/tools/influencer-deal.js';
import { MARKETS, compete } from '../scripts/tools/positioning-map.js';
import { atPrice } from '../scripts/tools/price-demand.js';
import { PRESETS as FS_BUSINESSES, buildStatements } from '../scripts/tools/financial-statements.js';
import { costMethod } from '../scripts/tools/inventory-methods.js';
import { computeRatios } from '../scripts/tools/ratio-dashboard.js';
import { PRESETS as CA_PRESETS, produce, oppCost } from '../scripts/tools/comparative-advantage.js';
import { landed } from '../scripts/tools/currency-trade.js';
import { MODES, runMode } from '../scripts/tools/market-entry.js';
import { PRESETS as OFF_PRODUCTS, unitCost } from '../scripts/tools/offshoring.js';
import { simulateRunway } from '../scripts/tools/startup-runway.js';
import { dealMath } from '../scripts/tools/investor-deal.js';
import { unitEconomics } from '../scripts/tools/unit-economics.js';
import { PRESETS as SD_MARKETS, at as sdAt, equilibrium } from '../scripts/tools/supply-demand.js';
import { runPayroll } from '../scripts/tools/payroll.js';

const near = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;

// Break-even units, rounded up the way the tool shows it. Infinity when each sale loses money.
const beUnits = (s) => {
  const cm = s.v('be-price') - s.v('be-vc');
  return cm > 0 ? Math.ceil(s.v('be-fc') / cm) : Infinity;
};
const beProfit = (s) => (s.v('be-price') - s.v('be-vc')) * s.v('be-q') - s.v('be-fc');

const dep = (s, method) => schedule(method, s.v('dp-cost'), Math.min(s.v('dp-salvage'), s.v('dp-cost')), Math.max(1, Math.round(s.v('dp-life'))));

const fn = (s) =>
  funnel({
    budget: s.v('fn-budget'),
    cpm: s.v('fn-cpm'),
    ctr: s.v('fn-ctr'),
    conv: s.v('fn-conv'),
    aov: s.v('fn-aov'),
    margin: s.v('fn-margin'),
  });

// Student Loan Simulator: the same plan the tool draws, read from the inputs.
const loans = (s) =>
  plan({
    cost: s.v('sl-cost'),
    aid: s.v('sl-aid'),
    family: s.v('sl-family'),
    years: Math.max(1, Math.min(6, Math.round(s.v('sl-years')))),
    rate: s.v('sl-rate'),
    sub: s.v('sl-sub') === 1,
  });
const takeHomeShare = (s) => repay(loans(s), s.v('sl-rate'), 10).monthly / ((s.v('sl-salary') * TAKE_HOME) / 12);

// Credit Card Payoff Lab and Start Early Lab: the tools' own math, read from the inputs.
const card = (s, plan_) => payoff({ balance: s.v('cc-balance'), apr: s.v('cc-apr'), fixed: s.v('cc-fixed') }, plan_);
const saver = (s, who) =>
  grow(s.v('se-monthly'), who === 'a' ? s.v('se-rate') : s.v('se-bRate'), Math.round(s.v(`se-${who}Start`)), Math.round(s.v(`se-${who}Stop`))).final;

const pay = (s) => paycheck({ hourly: s.v('pc-hourly'), hours: s.v('pc-hours'), k: s.v('pc-k'), state: s.v('pc-state') });

const invest = (s) => outlook({ amount: s.v('ir-amount'), years: Math.max(1, Math.round(s.v('ir-years'))), stocks: s.v('ir-stocks'), bonds: s.v('ir-bonds') });

const ins = (s) => compare({ aDed: s.v('in-a-ded'), aPrem: s.v('in-a-prem'), bDed: s.v('in-b-ded'), bPrem: s.v('in-b-prem'), cost: s.v('in-cost'), claims: Math.round(s.v('in-claims')), savings: s.v('in-savings') });

const car = (s) => compareCars({ newPrice: s.v('cb-new-price'), usedPrice: s.v('cb-used-price'), down: s.v('cb-down'), term: s.v('cb-term'), credit: s.v('cb-credit'), pay: s.v('cb-pay'), other: s.v('cb-other') });

const ab = (s) => abTest({ nA: s.v('ab-nA'), cA: Math.min(s.v('ab-cA'), s.v('ab-nA')), nB: s.v('ab-nB'), cB: Math.min(s.v('ab-cB'), s.v('ab-nB')) });
const rateIs = (c, n, r) => n > 0 && Math.abs(c / n - r) < 0.0005;

// Engagement Rate Lab: the "Add 20,000 bought followers" box has no id, so its share-link key is f0.
const eng = (s) => engagement({ followers: s.v('er-followers'), reach: s.v('er-reach'), likes: s.v('er-likes'), comments: s.v('er-comments'), shares: s.v('er-shares') }, s.v('f0') === 1);

// Feed Ranking Sandbox: the feed in order, with your bakery's post read from the inputs.
const feed = (s) => {
  const w = Object.fromEntries(SIGNALS.map(([k]) => [k, s.v(`fr-w-${k}`)]));
  const you = { ...POSTS[0] };
  for (const k of ['likes', 'comments', 'shares', 'watch', 'hours']) you[k] = Math.round(s.v(`fr-you-${k}`));
  return rank(POSTS.map((p) => (p.id === 'you' ? you : p)), w);
};
const feedPlace = (s) => feed(s).findIndex((p) => p.id === 'you') + 1;
const weightsAre = (s, w) => Object.entries(w).every(([k, v]) => s.v(`fr-w-${k}`) === v);
const youAre = (s, p) => ['likes', 'comments', 'shares', 'watch', 'hours'].every((k) => s.v(`fr-you-${k}`) === p[k]);

// Influencer Deal Lab: the creator being edited (group 1) against the product.
const infl = (s) =>
  deal({ fee: s.v('inf-fee'), followers: s.v('inf-followers'), eng: s.v('inf-eng'), fake: s.v('inf-fake') }, { aov: s.v('inf-aov'), margin: s.v('inf-margin'), click: s.v('inf-click'), buy: s.v('inf-buy') });
const inflKeep = (s, keys) => Object.entries(keys).every(([k, v]) => s.v(`inf-${k}`) === v);

// Positioning Map Lab: the market is the pressed preset.
const spot = (s) => compete(MARKETS[Math.max(0, s.pick(0))], { x: Math.min(10, s.v('pm-x')), y: Math.min(10, s.v('pm-y')) });

// Price & Demand: results at the current price.
const pd = (s) => atPrice({ p0: s.v('pd-p0'), q0: s.v('pd-q0'), b: s.v('pd-b'), vc: s.v('pd-vc'), fc: s.v('pd-fc') }, s.v('pd-price'));
const pdKeep = (s, keys) => Object.entries(keys).every(([k, v]) => s.v(`pd-${k}`) === v);

// Startup Runway: cost lines are numbered inputs (rw-startup-0, rw-fixed-0, ...), as many as the business has.
const lines = (s, kind) => {
  const out = [];
  for (let i = 0; Number.isFinite(s.v(`rw-${kind}-${i}`)); i++) out.push(['', s.v(`rw-${kind}-${i}`)]);
  return out;
};
const runway = (s) =>
  simulateRunway({ cash: s.v('rw-cash'), startup: lines(s, 'startup'), fixed: lines(s, 'fixed'), sales: s.v('rw-sales'), growth: s.v('rw-growth'), vc: s.v('rw-vc') });
const total = (s, kind) => lines(s, kind).reduce((t, [, v]) => t + v, 0);
const salesPlan = (s, sales, growth, vc) => s.v('rw-sales') === sales && s.v('rw-growth') === growth && s.v('rw-vc') === vc;

// Investor Deal Lab: your ask and the investor's offer.
const ask = (s) => dealMath({ amt: s.v('dl-askAmt'), pct: s.v('dl-askPct'), sales: s.v('dl-sales'), exit: s.v('dl-exit') });
const offer = (s) => dealMath({ amt: s.v('dl-offAmt'), pct: s.v('dl-offPct'), sales: s.v('dl-sales'), exit: s.v('dl-exit') });

const ue = (s) => unitEconomics({ spend: s.v('ue-spend'), newc: s.v('ue-newc'), aov: s.v('ue-aov'), freq: s.v('ue-freq'), margin: s.v('ue-margin'), months: s.v('ue-months') });

// Supply and Demand Lab: the market is the pressed preset; the "Lock the price" box has no id, so its key is f0.
const sdMarket = (s) => SD_MARKETS[Math.max(0, s.pick(0))];
const sdShift = (s) => ({ ds: s.v('sd-ds'), ss: s.v('sd-ss') });
const sdEq = (s) => equilibrium(sdMarket(s), sdShift(s));

// Financial Statements Lab: each transaction has a checkbox (fs-on-0, ...) and an amount box with no
// id, so amounts are f0, f1, ... in the share link. The bakery has 11 transactions, lawn care 8.
const fsBiz = (s) => FS_BUSINESSES[Number.isFinite(s.v('fs-on-10')) ? 0 : 1];
const fs = (s) => buildStatements(fsBiz(s), fsBiz(s).tx.map((t, i) => ({ t, on: s.v(`fs-on-${i}`) === 1, amt: s.v(`f${i}`) })));
const fsKept = (s, i, amt) => s.v(`fs-on-${i}`) === 1 && s.v(`f${i}`) === amt;

// Inventory Methods Lab: the layer boxes have no ids: f0/f1 are beginning units/cost, f2/f3 purchase 1, and so on.
const invLayers = (s) => [0, 1, 2, 3].map((i) => [s.v(`f${i * 2}`), s.v(`f${i * 2 + 1}`)]);
const invCogs = (s, m) => costMethod(invLayers(s), s.v('iv-sold'), m).cogs;

// Ratio Dashboard: one ratio by key.
const ratio = (s, key) =>
  computeRatios(Object.fromEntries(['ca', 'inv', 'ta', 'cl', 'tl', 'sales', 'cogs', 'ni'].map((k) => [k, s.v(`rt-${k}`)]))).find((x) => x.r.key === key).v;

// Comparative Advantage: the max boxes and the trade boxes have no ids. f0/f1 are country A's max of
// each good, f2/f3 country B's, then f4 = amount A sends, f5 = which good (select), f6 = amount A gets.
// The "before trade" split is the scenario's starting split.
const caMax = (s) => [[s.v('f0'), s.v('f1')], [s.v('f2'), s.v('f3')]];
const caWorld = (s, scenario) => {
  const max = caMax(s);
  const now = max.map((m, i) => produce(m, s.v(`ca-share-${i}`)));
  const before = max.map((m, i) => produce(m, CA_PRESETS[scenario].c[i].base));
  const sum = (rows) => [rows[0][0] + rows[1][0], rows[0][1] + rows[1][1]];
  return { now: sum(now), before: sum(before), prodNow: now, prodBefore: before };
};
const caBothWin = (s, scenario) => {
  const { prodNow, prodBefore } = caWorld(s, scenario);
  const sg = Number(s.raw('f5') ?? 0), og = 1 - sg;
  const cons = prodNow.map((p) => [...p]);
  cons[0][sg] -= s.v('f4');
  cons[0][og] += s.v('f6');
  cons[1][sg] += s.v('f4');
  cons[1][og] -= s.v('f6');
  return cons.every((c, i) => {
    const d = [c[0] - prodBefore[i][0], c[1] - prodBefore[i][1]];
    return d[0] >= -0.001 && d[1] >= -0.001 && (d[0] > 0.05 || d[1] > 0.05);
  });
};
const caMaxAre = (s, idx, max) => s.v(`f${idx * 2}`) === max[0] && s.v(`f${idx * 2 + 1}`) === max[1];

// Currency & Trade: the deal from the inputs; mode is a radio ("import" or "export").
const fx = (s) =>
  landed({ mode: s.raw('fx-mode'), price: s.v('fx-price'), rate: s.v('fx-rate'), ship: s.v('fx-ship'), tariff: s.v('fx-tariff'), markup: s.v('fx-markup') });
const fxKeep = (s, keys) => Object.entries(keys).every(([k, v]) => s.v(`fx-${k}`) === v);

// Market Entry: five-year total for one way of entering. The political-risk box has no id: f0.
const entry = (s, key) =>
  runMode(MODES.find((m) => m.key === key), { sales: s.v('me-sales'), growth: s.v('me-growth'), shortfall: s.v('me-shortfall'), tariff: s.v('me-tariff'), political: s.v('f0') === 1 }).total;
const bestEntry = (s) => MODES.reduce((best, m) => (entry(s, m.key) > entry(s, best.key) ? m : best)).key;

// Offshoring: the boxes show the factory being edited (group 1); the other factory is the product's.
const offSites = (s, product) => {
  const sites = OFF_PRODUCTS[product].sites.map((x) => ({ ...x }));
  const sel = s.pick(1);
  if (sel >= 0) for (const k of ['wage', 'hours', 'mat', 'ship', 'defect']) sites[sel][k] = s.v(`off-${k}`);
  const w = { tariff: s.v('off-tariff'), currency: s.v('off-currency') };
  return { home: unitCost(sites[0], w, false).good, away: unitCost(sites[1], w, true).good };
};
const offFactory = (s, product) => s.pick(1) === 1 && ['wage', 'hours', 'mat', 'ship', 'defect'].every((k) => s.v(`off-${k}`) === OFF_PRODUCTS[product].sites[1][k]);
const payroll = (s) =>
  runPayroll({
    employees: ['a', 'b', 'c'].map((w) => ({ hours: s.v(`pr-${w}-hours`), rate: s.v(`pr-${w}-rate`) })),
    freq: s.v('pr-freq'),
    k: s.v('pr-k'),
    state: s.v('pr-state'),
    suta: s.v('pr-suta'),
  });

export const CHALLENGES = {
  'break-even-lab': [
    {
      title: 'Cut costs, not price',
      goal: 'The T-shirt shop breaks even at 100 shirts. Get break-even down to 75 shirts or fewer.',
      start: { g0: 1 },
      met: (s) => beUnits(s) <= 75,
      rules: [{ text: 'Price stays at $20 or less.', ok: (s) => s.v('be-price') <= 20 }],
    },
    {
      title: 'Price your way to profit',
      goal: 'The phone case startup loses money at its forecast. Earn a profit of at least $400 at 200 cases.',
      start: { g0: 3 },
      met: (s) => beProfit(s) >= 400,
      rules: [
        { text: 'Forecast stays at 200 cases.', ok: (s) => s.v('be-q') === 200 },
        { text: 'Price stays at $32 or less.', ok: (s) => s.v('be-price') <= 32 },
        { text: 'Fixed costs stay at $4,000.', ok: (s) => s.v('be-fc') === 4000 },
      ],
    },
    {
      title: 'Rent goes up',
      goal: 'The food truck\'s rent went up, so fixed costs are now $7,500. Get break-even back under 1,000 meals.',
      start: { g0: 2, 'be-fc': 7500 },
      met: (s) => beUnits(s) < 1000,
      rules: [{ text: 'Fixed costs stay at $7,500 or more.', ok: (s) => s.v('be-fc') >= 7500 }],
    },
  ],

  depreciation: [
    {
      title: 'Biggest first-year write-off',
      goal: 'For the delivery van, show the schedule for the method with the largest Year 1 depreciation.',
      start: { g0: 1, g1: 0 },
      met: (s) => {
        const y1 = ['sl', 'ddb', 'syd'].map((m) => dep(s, m)[0]?.dep ?? 0);
        return s.pick(1) === y1.indexOf(Math.max(...y1));
      },
      rules: [
        { text: 'Cost stays at $35,000.', ok: (s) => s.v('dp-cost') === 35000 },
        { text: 'Salvage stays at $5,000.', ok: (s) => s.v('dp-salvage') === 5000 },
        { text: 'Life stays at 5 years.', ok: (s) => s.v('dp-life') === 5 },
      ],
    },
    {
      title: '$400 a year',
      goal: 'Your company wants straight-line depreciation of exactly $400 a year on a $1,500 laptop. Set the salvage value and life to make it happen.',
      start: { g0: 3, g1: 0 },
      met: (s) => near(dep(s, 'sl')[0]?.dep ?? 0, 400),
      rules: [
        { text: 'Cost stays at $1,500.', ok: (s) => s.v('dp-cost') === 1500 },
        { text: 'Life is at least 2 years.', ok: (s) => s.v('dp-life') >= 2 },
      ],
    },
    {
      title: 'Write it off faster',
      goal: 'Using sum-of-the-years-digits, get the pizza oven\'s Year 1 depreciation to at least $3,000. You may only change the useful life.',
      start: { g0: 2, g1: 2 },
      met: (s) => s.pick(1) === 2 && (dep(s, 'syd')[0]?.dep ?? 0) >= 3000,
      rules: [
        { text: 'Cost stays at $12,000.', ok: (s) => s.v('dp-cost') === 12000 },
        { text: 'Salvage stays at $1,000.', ok: (s) => s.v('dp-salvage') === 1000 },
        { text: 'The sum-of-years schedule is showing.', ok: (s) => s.pick(1) === 2 },
      ],
    },
  ],

  'marketing-funnel': [
    {
      title: 'Make the ads pay',
      goal: 'The bakery barely breaks even on its ads. Earn at least $250 profit after ads.',
      start: { g0: 0 },
      met: (s) => fn(s).profit >= 250,
      rules: [
        { text: 'Budget stays at $500 or less.', ok: (s) => s.v('fn-budget') <= 500 },
        { text: 'Cost per 1,000 views stays at $8 (the platform sets it).', ok: (s) => s.v('fn-cpm') === 8 },
        { text: 'Profit margin stays at 60%.', ok: (s) => s.v('fn-margin') === 60 },
      ],
    },
    {
      title: 'Cheaper customers',
      goal: 'Each T-shirt customer costs over $30 in ads. Get the cost per customer under $20.',
      start: { g0: 2 },
      met: (s) => fn(s).cac < 20,
      rules: [
        { text: 'Budget stays at $1,000.', ok: (s) => s.v('fn-budget') === 1000 },
        { text: 'Average order stays at $25.', ok: (s) => s.v('fn-aov') === 25 },
        { text: 'Cost per 1,000 views stays at $5 or more.', ok: (s) => s.v('fn-cpm') >= 5 },
      ],
    },
    {
      title: 'Scale up',
      goal: 'The tutor doubles the budget to $1,600, but bigger keywords cost $70 per 1,000 views. Get sales per $1 of ads back to 6× or higher.',
      start: { g0: 1, 'fn-budget': 1600, 'fn-cpm': 70 },
      met: (s) => fn(s).roas >= 6,
      rules: [
        { text: 'Budget stays at $1,600 or more.', ok: (s) => s.v('fn-budget') >= 1600 },
        { text: 'Cost per 1,000 views stays at $70 or more.', ok: (s) => s.v('fn-cpm') >= 70 },
        { text: 'Average order stays at $300 or less.', ok: (s) => s.v('fn-aov') <= 300 },
      ],
    },
  ],

  'student-loan-simulator': [
    {
      title: 'Pass the paycheck test',
      goal: 'At the in-state school, you borrow more than 80% of your $55,000 starting salary. Get total borrowing down to 80% of your salary or less.',
      start: { g0: 1 },
      met: (s) => loans(s).borrowed <= 0.8 * s.v('sl-salary'),
      rules: [
        { text: 'Cost stays at $28,000 a year.', ok: (s) => s.v('sl-cost') === 28000 },
        { text: 'Starting salary stays at $55,000.', ok: (s) => s.v('sl-salary') === 55000 },
      ],
    },
    {
      title: 'Cut the interest',
      goal: 'At the in-state school, over $8,000 of interest piles up before your first payment. Get it under $6,000.',
      start: { g0: 1 },
      met: (s) => {
        const p = loans(s);
        return p.owed - p.borrowed < 6000;
      },
      rules: [
        { text: 'Cost stays at $28,000 a year.', ok: (s) => s.v('sl-cost') === 28000 },
        { text: 'Grants stay at $6,000 a year.', ok: (s) => s.v('sl-aid') === 6000 },
        { text: 'Family help stays at $10,000 a year.', ok: (s) => s.v('sl-family') === 10000 },
      ],
    },
    {
      title: 'What would you need to earn?',
      goal: 'At the out-of-state school, the 10-year payment takes almost half your take-home pay. Find a starting salary that brings it to 15% or less.',
      start: { g0: 2 },
      met: (s) => s.v('sl-salary') > 0 && takeHomeShare(s) <= 0.15,
      rules: [
        { text: 'Cost stays at $45,000 a year.', ok: (s) => s.v('sl-cost') === 45000 },
        { text: 'Grants stay at $8,000 a year.', ok: (s) => s.v('sl-aid') === 8000 },
        { text: 'Family help stays at $10,000 a year.', ok: (s) => s.v('sl-family') === 10000 },
      ],
    },
  ],

  'credit-card-payoff-lab': [
    {
      title: 'Done in a year',
      goal: 'The spring break trip takes over a year to pay off at $100 a month. Pay it off in 12 months or less.',
      start: { g0: 0 },
      met: (s) => card(s, 'fixed').months <= 12,
      rules: [
        { text: 'Balance stays at $1,200.', ok: (s) => s.v('cc-balance') === 1200 },
        { text: 'APR stays at 24%.', ok: (s) => s.v('cc-apr') === 24 },
      ],
    },
    {
      title: 'Shop for a better rate',
      goal: 'Paying $150 a month on the car repair costs over $500 in interest. Get it under $500 without paying more each month.',
      start: { g0: 1 },
      met: (s) => card(s, 'fixed').done && card(s, 'fixed').interest < 500,
      rules: [
        { text: 'Payment stays at $150.', ok: (s) => s.v('cc-fixed') === 150 },
        { text: 'Balance stays at $2,500.', ok: (s) => s.v('cc-balance') === 2500 },
      ],
    },
    {
      title: 'Stop the balance from growing',
      goal: 'At $100 a month, the maxed-out card is never paid off. Find a payment that clears it in 5 years (60 months) or less.',
      start: { g0: 2, 'cc-fixed': 100 },
      met: (s) => card(s, 'fixed').months <= 60,
      rules: [
        { text: 'Balance stays at $5,000.', ok: (s) => s.v('cc-balance') === 5000 },
        { text: 'APR stays at 28%.', ok: (s) => s.v('cc-apr') === 28 },
      ],
    },
  ],

  'start-early-lab': [
    {
      title: 'Become a millionaire',
      goal: 'Saver A has about $250,000 at 65. Get Saver A to $1,000,000 or more.',
      start: { g0: 0 },
      met: (s) => saver(s, 'a') >= 1000000,
      rules: [
        { text: 'Monthly deposit stays at $200 or less.', ok: (s) => s.v('se-monthly') <= 200 },
        { text: 'Saver A\'s return stays at 7% or less.', ok: (s) => s.v('se-rate') <= 7 },
      ],
    },
    {
      title: 'The late starter catches up',
      goal: 'Saver A saves from 18 to 28 and beats Saver B, who saves from 28 to 65. Change Saver B\'s plan so B ends up with at least as much as A.',
      start: { g0: 1 },
      met: (s) => saver(s, 'b') >= saver(s, 'a'),
      rules: [
        { text: 'Saver A still saves from 18 to 28 at 7%.', ok: (s) => s.v('se-aStart') === 18 && s.v('se-aStop') === 28 && s.v('se-rate') === 7 },
        { text: 'Saver B\'s return stays at 7% or less.', ok: (s) => s.v('se-bRate') <= 7 },
      ],
    },
    {
      title: 'Beat the savings account',
      goal: 'Saver B keeps everything in a 0.5% savings account and ends with less than a fifth of Saver A. Get Saver B to at least half of Saver A.',
      start: { g0: 2 },
      met: (s) => saver(s, 'b') >= saver(s, 'a') / 2,
      rules: [
        { text: 'Saver A stays the same: 22 to 65 at 7%.', ok: (s) => s.v('se-aStart') === 22 && s.v('se-aStop') === 65 && s.v('se-rate') === 7 },
        { text: 'Saver B still saves from 22 to 65.', ok: (s) => s.v('se-bStart') === 22 && s.v('se-bStop') === 65 },
      ],
    },
  ],

  'paycheck-lab': [
    {
      title: 'Clear $1,500 a paycheck',
      goal: 'At your first full-time job, you take home about $1,400 every 2 weeks. Get take-home pay to $1,500 or more a paycheck.',
      start: { g0: 1 },
      met: (s) => pay(s).net / s.v('pc-freq') >= 1500,
      rules: [
        { text: 'Hourly pay stays at $22.', ok: (s) => s.v('pc-hourly') === 22 },
        { text: '401(k) savings stay at 3% or more.', ok: (s) => s.v('pc-k') >= 3 },
        { text: 'State tax stays at 3%.', ok: (s) => s.v('pc-state') === 3 },
      ],
    },
    {
      title: 'No federal income tax',
      goal: 'Your part-time job pays $158 a year in federal income tax. Get it to $0 without working less.',
      start: { g0: 0 },
      met: (s) => pay(s).fed < 0.005,
      rules: [
        { text: 'Hourly pay stays at $17.', ok: (s) => s.v('pc-hourly') === 17 },
        { text: 'Hours stay at 20 a week.', ok: (s) => s.v('pc-hours') === 20 },
      ],
    },
    {
      title: 'Back to the 12% bracket',
      goal: 'The skilled job puts you in the 22% federal bracket. Get your top bracket down to 12% without earning less.',
      start: { g0: 2 },
      met: (s) => pay(s).gross > 0 && pay(s).marginal <= 12,
      rules: [
        { text: 'Hourly pay stays at $40.', ok: (s) => s.v('pc-hourly') === 40 },
        { text: 'Hours stay at 40 a week.', ok: (s) => s.v('pc-hours') === 40 },
      ],
    },
  ],

  'investing-risk-lab': [
    {
      title: 'Protect the car fund',
      goal: 'You need this $5,000 for a car in 2 years. All in stocks, there is about a 1 in 5 chance you end up with less. Get that chance under 1%.',
      start: { g0: 0 },
      met: (s) => invest(s).lossChance < 0.01,
      rules: [
        { text: 'You still need the money in 2 years.', ok: (s) => s.v('ir-years') === 2 },
        { text: 'You still invest $5,000.', ok: (s) => s.v('ir-amount') === 5000 },
      ],
    },
    {
      title: 'Safe, but too safe',
      goal: 'All in cash for 40 years, $5,000 only grows to about $18,500. Get the middle outcome to $40,000 or more.',
      start: { g0: 3 },
      met: (s) => invest(s).middle >= 40000,
      rules: [
        { text: 'Still 40 years.', ok: (s) => s.v('ir-years') === 40 },
        { text: 'You still invest $5,000.', ok: (s) => s.v('ir-amount') === 5000 },
        { text: 'The bad case stays above $25,000.', ok: (s) => invest(s).bad > 25000 },
      ],
    },
    {
      title: 'Raise the floor',
      goal: 'The college fund\'s bad case is $7,213. Change the mix so the bad case is $7,250 or more.',
      start: { g0: 1 },
      met: (s) => invest(s).bad >= 7250,
      rules: [
        { text: 'Still 10 years.', ok: (s) => s.v('ir-years') === 10 },
        { text: 'You still invest $5,000.', ok: (s) => s.v('ir-amount') === 5000 },
        { text: 'The middle outcome stays at $10,000 or more.', ok: (s) => invest(s).middle >= 10000 },
      ],
    },
  ],

  'insurance-deductible-lab': [
    {
      title: 'How high can Plan B go?',
      goal: 'After one $1,500 fender bender, Plan A is cheaper. Lower Plan B\'s deductible until Plan B is the cheaper plan this year.',
      start: { g0: 1 },
      met: (s) => ins(s).cheaper === 'B',
      rules: [
        { text: 'Premiums stay at $230 and $195 a month.', ok: (s) => s.v('in-a-prem') === 230 && s.v('in-b-prem') === 195 },
        { text: 'Plan A\'s deductible stays at $250.', ok: (s) => s.v('in-a-ded') === 250 },
        { text: 'The repair still costs $1,500.', ok: (s) => s.v('in-cost') === 1500 },
      ],
    },
    {
      title: 'A rough year',
      goal: 'Two $4,000 accidents make Plan A cheaper by over $1,000. How low would Plan B\'s monthly premium have to be to win anyway?',
      start: { g0: 2 },
      met: (s) => ins(s).cheaper === 'B',
      rules: [
        { text: 'Deductibles stay at $250 and $1,000.', ok: (s) => s.v('in-a-ded') === 250 && s.v('in-b-ded') === 1000 },
        { text: 'Still two accidents of $4,000.', ok: (s) => s.v('in-claims') === 2 && s.v('in-cost') === 4000 },
      ],
    },
    {
      title: 'Make the low deductible worth it',
      goal: 'Plan A only pays off if you file more than 0.56 claims a year. Change Plan A\'s price so it pays off at 0.25 claims a year or fewer (one claim every 4 years).',
      start: { g0: 0 },
      met: (s) => ins(s).breakEven <= 0.25,
      rules: [
        { text: 'Deductibles stay at $250 and $1,000.', ok: (s) => s.v('in-a-ded') === 250 && s.v('in-b-ded') === 1000 },
        { text: 'Plan B still costs $195 a month.', ok: (s) => s.v('in-b-prem') === 195 },
      ],
    },
  ],

  'car-buying-lab': [
    {
      title: 'Pass 20/4/10 with a used car',
      goal: 'Neither car meets any part of the 20/4/10 guideline. Change the used car deal until it meets all three parts.',
      start: { g0: 0 },
      met: (s) => { const u = car(s).used.check; return u.down && u.term && u.budget; },
      rules: [
        { text: 'Pay stays at $45,760 a year.', ok: (s) => s.v('cb-pay') === 45760 },
        { text: 'Insurance, gas, and upkeep stay at $250 a month or more.', ok: (s) => s.v('cb-other') >= 250 },
        { text: 'Your credit score stays Prime.', ok: (s) => s.v('cb-credit') === 1 },
      ],
    },
    {
      title: 'Cut the new car\'s interest',
      goal: 'The new car\'s loan costs $4,268 in interest. Get it under $3,000.',
      start: { g0: 0 },
      met: (s) => car(s).new.interest < 3000,
      rules: [
        { text: 'The new car still costs $28,000.', ok: (s) => s.v('cb-new-price') === 28000 },
        { text: 'Your credit score stays Prime.', ok: (s) => s.v('cb-credit') === 1 },
      ],
    },
    {
      title: 'Credit is worth money',
      goal: 'With near prime credit, the used car\'s loan costs $7,836 in interest. Get it under $3,000 without changing the deal.',
      start: { g0: 2 },
      met: (s) => car(s).used.interest < 3000,
      rules: [
        { text: 'The used car still costs $16,000.', ok: (s) => s.v('cb-used-price') === 16000 },
        { text: 'Down payment stays at $2,000.', ok: (s) => s.v('cb-down') === 2000 },
        { text: 'Loan length stays at 60 months.', ok: (s) => s.v('cb-term') === 60 },
      ],
    },
  ],

  'ab-post-test': [
    {
      title: 'Run a bigger test',
      goal: 'The bake sale test can\'t tell if B is better. Keep the same click rates (3% and 5%) and get the tool to say Version B is very likely better.',
      start: { g0: 0 },
      met: (s) => ab(s).gap > 0 && ab(s).luck < 0.05,
      rules: [
        { text: 'A\'s click rate stays at 3%.', ok: (s) => rateIs(s.v('ab-cA'), s.v('ab-nA'), 0.03) },
        { text: 'B\'s click rate stays at 5%.', ok: (s) => rateIs(s.v('ab-cB'), s.v('ab-nB'), 0.05) },
      ],
    },
    {
      title: 'How many clicks would it take?',
      goal: 'Same bake sale, same 200 viewers each. How many clicks would Version B need before the tool says it is very likely better?',
      start: { g0: 0 },
      met: (s) => ab(s).gap > 0 && ab(s).luck < 0.05,
      rules: [
        { text: 'Each version is still shown to 200 people.', ok: (s) => s.v('ab-nA') === 200 && s.v('ab-nB') === 200 },
        { text: 'Version A still gets 6 clicks.', ok: (s) => s.v('ab-cA') === 6 },
      ],
    },
    {
      title: 'Too small to tell',
      goal: 'With 20,000 viewers each, a half-point gap looks real. Keep the same click rates and find a smaller test where luck could explain the gap at least 20 times in 100.',
      start: { g0: 2 },
      met: (s) => ab(s).luck >= 0.2,
      rules: [
        { text: 'A\'s click rate stays at 3.0%.', ok: (s) => rateIs(s.v('ab-cA'), s.v('ab-nA'), 0.03) },
        { text: 'B\'s click rate stays at 3.5%.', ok: (s) => rateIs(s.v('ab-cB'), s.v('ab-nB'), 0.035) },
        { text: 'Both versions are shown to the same number of people.', ok: (s) => s.v('ab-nA') === s.v('ab-nB') },
      ],
    },
  ],

  'engagement-rate-lab': [
    {
      title: 'Wake up the quiet fans',
      goal: 'The big account\'s engagement rate by followers is 0.5%. Get it to 1% or more.',
      start: { g0: 0 },
      met: (s) => eng(s).rateF >= 1 - 1e-9,
      rules: [
        { text: 'Followers stay at 50,000.', ok: (s) => s.v('er-followers') === 50000 },
        { text: 'People who saw it stay at 4,000.', ok: (s) => s.v('er-reach') === 4000 },
      ],
    },
    {
      title: 'Undo the bought followers',
      goal: 'The small account bought 20,000 followers and its rate by followers fell to 1.3%. Keep them and get the rate back to 8% or more.',
      start: { g0: 1, f0: 1 },
      met: (s) => eng(s).rateF >= 8 - 1e-9,
      rules: [
        { text: 'The bought followers stay.', ok: (s) => s.v('f0') === 1 },
        { text: 'Real followers stay at 4,000.', ok: (s) => s.v('er-followers') === 4000 },
      ],
    },
    {
      title: 'Reach is the problem',
      goal: 'Only 8% of the big account\'s followers saw the post. Get the rate by followers to 2% when the people who see it act the same as before.',
      start: { g0: 0 },
      met: (s) => eng(s).rateF >= 2 - 1e-9,
      rules: [
        { text: 'Followers stay at 50,000.', ok: (s) => s.v('er-followers') === 50000 },
        { text: 'Rate by people who saw it stays at 6.3% or less.', ok: (s) => eng(s).rateR <= 6.25 + 0.005 },
      ],
    },
  ],

  'feed-ranking-sandbox': [
    {
      title: 'Make a better post',
      goal: '"Keep them watching" puts your bakery\'s post 6th. Get it into the top 3 by changing only your post.',
      start: { g0: 2 },
      met: (s) => feedPlace(s) <= 3,
      rules: [
        { text: 'The algorithm stays "Keep them watching."', ok: (s) => weightsAre(s, { recency: 2, likes: 1, comments: 6, shares: 4, watch: 10, friend: 0 }) },
        { text: 'Your post is still 3 hours old.', ok: (s) => s.v('fr-you-hours') === 3 },
      ],
    },
    {
      title: 'Cool down the feed',
      goal: '"Keep them watching" puts the shouting match at the top. Change the algorithm so a different post is first.',
      start: { g0: 2 },
      met: (s) => feed(s)[0]?.id !== 'fight',
      rules: [
        { text: 'Watch time still counts 5 or more.', ok: (s) => s.v('fr-w-watch') >= 5 },
        { text: 'Your bakery\'s post stays the same.', ok: (s) => youAre(s, POSTS[0]) },
      ],
    },
    {
      title: 'Build a feed that helps the bakery',
      goal: 'Without touching your post, build an algorithm that puts it in the top 3.',
      start: { g0: 2 },
      met: (s) => feedPlace(s) <= 3,
      rules: [
        { text: 'Your bakery\'s post stays the same.', ok: (s) => youAre(s, POSTS[0]) },
        { text: 'At least 3 signals count 1 or more.', ok: (s) => SIGNALS.filter(([k]) => s.v(`fr-w-${k}`) >= 1).length >= 3 },
      ],
    },
  ],

  'influencer-deal-lab': [
    {
      title: 'Negotiate the fee',
      goal: 'The big creator loses about $4,400 on phone cases. Negotiate a fee so the post at least breaks even.',
      start: { g0: 0, g1: 0 },
      met: (s) => s.pick(1) === 0 && infl(s).profit >= 0,
      rules: [
        { text: 'You are still looking at the big creator.', ok: (s) => s.pick(1) === 0 },
        { text: 'Followers, engagement, and fake followers stay the same.', ok: (s) => inflKeep(s, { followers: 800000, eng: 1.2, fake: 30 }) },
        { text: 'The product numbers stay the same.', ok: (s) => inflKeep(s, { aov: 30, margin: 65, click: 10, buy: 12 }) },
      ],
    },
    {
      title: 'How fake is too fake?',
      goal: 'The mid creator for the sneaker shop loses money with 45% fake followers. Change only the fake share until the deal breaks even.',
      start: { g0: 1, g1: 1 },
      met: (s) => s.pick(1) === 1 && infl(s).profit >= 0,
      rules: [
        { text: 'You are still looking at the mid creator.', ok: (s) => s.pick(1) === 1 },
        { text: 'Fee, followers, and engagement stay the same.', ok: (s) => inflKeep(s, { fee: 600, followers: 90000, eng: 6 }) },
        { text: 'The product numbers stay the same.', ok: (s) => inflKeep(s, { aov: 90, margin: 40, click: 8, buy: 6 }) },
      ],
    },
    {
      title: 'Grow the small creator',
      goal: 'The small creator earns about $65 for the phone case shop. How many followers would she need to earn $500 or more?',
      start: { g0: 0, g1: 2 },
      met: (s) => s.pick(1) === 2 && infl(s).profit >= 500,
      rules: [
        { text: 'You are still looking at the small creator.', ok: (s) => s.pick(1) === 2 },
        { text: 'Fee, engagement, and fake followers stay the same.', ok: (s) => inflKeep(s, { fee: 80, eng: 8, fake: 3 }) },
        { text: 'The product numbers stay the same.', ok: (s) => inflKeep(s, { aov: 30, margin: 65, click: 10, buy: 12 }) },
      ],
    },
  ],

  'positioning-map-lab': [
    {
      title: 'Find the gap',
      goal: 'In Pizza in town, place your brand where it wins 350 customers or more.',
      start: { g0: 0 },
      met: (s) => s.pick(0) === 0 && spot(s).yours >= 350 - 0.5,
      rules: [
        { text: 'Still the pizza market.', ok: (s) => s.pick(0) === 0 },
        { text: 'Quality stays less than 5 above price, so you can afford to make it.', ok: (s) => !spot(s).stretch },
      ],
    },
    {
      title: 'Premium shoes',
      goal: 'In Running shoes, win 300 customers or more while charging a high price.',
      start: { g0: 2 },
      met: (s) => s.pick(0) === 2 && spot(s).yours >= 300 - 0.5,
      rules: [
        { text: 'Still the running shoe market.', ok: (s) => s.pick(0) === 2 },
        { text: 'Price stays at 7 or higher.', ok: (s) => s.v('pm-x') >= 7 },
        { text: 'Performance stays less than 5 above price.', ok: (s) => !spot(s).stretch },
      ],
    },
    {
      title: 'Win the gym crowd',
      goal: 'In Snack bars, win at least 100 customers with a bar that is both pricey and very healthy.',
      start: { g0: 1 },
      met: (s) => s.pick(0) === 1 && spot(s).yours >= 100 - 0.5,
      rules: [
        { text: 'Still the snack bar market.', ok: (s) => s.pick(0) === 1 },
        { text: 'Price stays at 7 or higher.', ok: (s) => s.v('pm-x') >= 7 },
        { text: 'Healthiness stays at 7 or higher.', ok: (s) => s.v('pm-y') >= 7 },
      ],
    },
  ],

  'price-demand': [
    {
      title: 'Most ticket revenue',
      goal: 'Concert tickets bring in $60,000 at $40. Find a price that brings in $60,700 or more.',
      start: { g0: 0 },
      met: (s) => pd(s).revenue >= 60700,
      rules: [{ text: 'Demand stays the same (starting price, sales, and customers lost per $1).', ok: (s) => pdKeep(s, { p0: 40, q0: 1500, b: 30 }) }],
    },
    {
      title: 'Most hoodie profit',
      goal: 'School hoodies earn $1,840 profit at $35. Find a price that earns $2,000 or more.',
      start: { g0: 1 },
      met: (s) => pd(s).profit >= 2000,
      rules: [
        { text: 'Demand stays the same.', ok: (s) => pdKeep(s, { p0: 35, q0: 120, b: 4 }) },
        { text: 'Costs stay the same: $18 a hoodie and $200 fixed.', ok: (s) => pdKeep(s, { vc: 18, fc: 200 }) },
      ],
    },
    {
      title: 'Popcorn costs went up',
      goal: 'Popcorn now costs $3 a bucket to make, and profit at $8 is $2,000. Get profit to $3,500 or more.',
      start: { g0: 3, 'pd-vc': 3 },
      met: (s) => pd(s).profit >= 3500,
      rules: [
        { text: 'Demand stays the same.', ok: (s) => pdKeep(s, { p0: 8, q0: 400, b: 15 }) },
        { text: 'Each bucket still costs $3 or more to make.', ok: (s) => s.v('pd-vc') >= 3 },
      ],
    },
  ],

  'startup-runway': [
    {
      title: 'Raise enough cash',
      goal: 'The food truck runs out of cash in month 7. Raise enough starting cash that it never runs out in the first 24 months.',
      start: { g0: 0 },
      met: (s) => runway(s).runOut === null,
      rules: [
        { text: 'Startup costs stay at $60,000.', ok: (s) => total(s, 'startup') === 60000 },
        { text: 'Fixed costs stay at $6,000 a month.', ok: (s) => total(s, 'fixed') === 6000 },
        { text: 'The sales plan stays the same: $5,000 in month 1, 8% growth, 42% variable costs.', ok: (s) => salesPlan(s, 5000, 8, 42) },
      ],
    },
    {
      title: 'No new money',
      goal: 'The phone case startup runs out of cash in month 3. Without raising more money, make it last all 24 months.',
      start: { g0: 1 },
      met: (s) => runway(s).runOut === null,
      rules: [
        { text: 'Starting cash stays at $15,000.', ok: (s) => s.v('rw-cash') === 15000 },
        { text: 'Sales in month 1 stay at $2,000.', ok: (s) => s.v('rw-sales') === 2000 },
        { text: 'Sales growth stays at 12% or less.', ok: (s) => s.v('rw-growth') <= 12 },
      ],
    },
    {
      title: 'Keep a cushion',
      goal: 'The food truck\'s cash drops below zero before sales catch up. Keep its lowest cash balance at $10,000 or more.',
      start: { g0: 0 },
      met: (s) => runway(s).low.cash >= 10000,
      rules: [
        { text: 'Starting cash stays at $75,000.', ok: (s) => s.v('rw-cash') === 75000 },
        { text: 'The sales plan stays the same: $5,000 in month 1, 8% growth, 42% variable costs.', ok: (s) => salesPlan(s, 5000, 8, 42) },
      ],
    },
  ],

  'investor-deal-lab': [
    {
      title: 'A realistic ask',
      goal: 'The investor says a $500,000 value is too high for a truck with $120,000 in sales. Change the equity you offer so your ask values the company at $300,000 or less, and you still keep at least 80%.',
      start: { g0: 0 },
      met: (s) => ask(s).valid && ask(s).post <= 300000 + 0.5 && ask(s).keep >= 80,
      rules: [{ text: 'You still ask for $50,000.', ok: (s) => s.v('dl-askAmt') === 50000 }],
    },
    {
      title: 'Make it worth their while',
      goal: 'This investor only says yes if the deal could pay back 5 times their money. Change your ask so it returns 5× or more at a $2 million sale, and you keep at least 70%.',
      start: { g0: 1 },
      met: (s) => ask(s).investorReturn >= 5 - 1e-9 && ask(s).keep >= 70,
      rules: [
        { text: 'You still ask for $100,000.', ok: (s) => s.v('dl-askAmt') === 100000 },
        { text: 'The future sale stays at $2,000,000.', ok: (s) => s.v('dl-exit') === 2000000 },
      ],
    },
    {
      title: 'Dream big',
      goal: 'Under the investor\'s offer, you\'d walk away with $210,000 if the dog treat bakery sells. How big would the sale need to be for you to get $500,000 or more?',
      start: { g0: 2 },
      met: (s) => offer(s).founderAtExit >= 500000,
      rules: [{ text: 'The investor\'s offer stays at $25,000 for 30%.', ok: (s) => s.v('dl-offAmt') === 25000 && s.v('dl-offPct') === 30 }],
    },
  ],

  'unit-economics-lab': [
    {
      title: 'Hit 3 to 1',
      goal: 'Each food truck app customer is worth 2.64 times what it costs to win them. Get that to 3 to 1 or better.',
      start: { g0: 0 },
      met: (s) => ue(s).ratio >= 3 - 1e-9,
      rules: [
        { text: 'Marketing spend stays at $900 a month.', ok: (s) => s.v('ue-spend') === 900 },
        { text: 'New customers stay at 30 a month.', ok: (s) => s.v('ue-newc') === 30 },
      ],
    },
    {
      title: 'Save the snack box',
      goal: 'Each snack box customer costs $10 more to win than they bring in. Make each customer worth at least $10 more than they cost.',
      start: { g0: 1 },
      met: (s) => ue(s).perCustomer >= 10 - 1e-9,
      rules: [
        { text: 'The box still costs $25.', ok: (s) => s.v('ue-aov') === 25 },
        { text: 'Still one box a month.', ok: (s) => s.v('ue-freq') === 1 },
        { text: 'Marketing spend stays at $4,000 a month.', ok: (s) => s.v('ue-spend') === 4000 },
      ],
    },
    {
      title: 'Spend more, stay healthy',
      goal: 'The tutor wants to spend $2,000 a month on ads, but the ads already bring in all the students they can. Keep the ratio at 3 to 1 or better anyway.',
      start: { g0: 2, 'ue-spend': 2000 },
      met: (s) => ue(s).ratio >= 3 - 1e-9,
      rules: [
        { text: 'Marketing spend stays at $2,000 or more.', ok: (s) => s.v('ue-spend') >= 2000 },
        { text: 'New students stay at 10 a month.', ok: (s) => s.v('ue-newc') === 10 },
        { text: 'Sessions still cost $40.', ok: (s) => s.v('ue-aov') === 40 },
      ],
    },
  ],

  'supply-demand': [
    {
      title: 'Undo the drought',
      goal: 'A drought cut the strawberry supply and pushed the price above $4.70. Without more supply, what would have to happen to demand to bring the price back to $4.00 or less?',
      start: { g0: 0, 'sd-ss': -400 },
      met: (s) => s.pick(0) === 0 && sdEq(s).trades && sdEq(s).price <= 4 + 1e-9,
      rules: [
        { text: 'Still strawberries.', ok: (s) => s.pick(0) === 0 },
        { text: 'The drought still counts: supply shift stays at −400 or lower.', ok: (s) => s.v('sd-ss') <= -400 },
      ],
    },
    {
      title: 'Meet the hype',
      goal: 'A famous athlete wore the sneakers, so demand jumped and the price hit $140. Get the price back to $120 or less while the hype lasts.',
      start: { g0: 2, 'sd-ds': 300 },
      met: (s) => s.pick(0) === 2 && sdEq(s).trades && sdEq(s).price <= 120 + 1e-9,
      rules: [
        { text: 'Still sneakers.', ok: (s) => s.pick(0) === 2 },
        { text: 'The hype stays: demand shift stays at +300 or more.', ok: (s) => s.v('sd-ds') >= 300 },
      ],
    },
    {
      title: 'End the gas shortage',
      goal: 'Gas prices are capped at $3.00, so drivers want more gas than stations have. Shift supply until there is no shortage at $3.00.',
      start: { g0: 1, f0: 1, 'sd-price': 3 },
      met: (s) => {
        const { want, offer: sell } = sdAt(sdMarket(s), sdShift(s), s.v('sd-price'));
        return s.pick(0) === 1 && s.v('f0') === 1 && sell >= want;
      },
      rules: [
        { text: 'Still gasoline.', ok: (s) => s.pick(0) === 1 },
        { text: 'The price stays locked at $3.00.', ok: (s) => s.v('f0') === 1 && Math.abs(s.v('sd-price') - 3) < 1e-9 },
        { text: 'Demand shift stays at 0 or more.', ok: (s) => s.v('sd-ds') >= 0 },
      ],
    },
  ],

  'financial-statements': [
    {
      title: 'Cash is not profit',
      goal: 'The bakery ends March with $6,950 in cash and $950 of net income. Change the month so it ends with $8,000 or more in cash, but the same net income.',
      start: { g0: 0 },
      met: (s) => fs(s).bal.cash >= 8000,
      rules: [{ text: 'Net income stays at $950.', ok: (s) => Math.abs(fs(s).ni - 950) < 0.005 }],
    },
    {
      title: 'Profit is not cash',
      goal: 'Green Edge Lawn Care earned $1,830 in June. Get net income to $2,500 or more without ending the month with more cash.',
      start: { g0: 1 },
      met: (s) => fs(s).ni >= 2500,
      rules: [{ text: 'Ending cash stays at $3,030 or less.', ok: (s) => fs(s).bal.cash <= 3030 }],
    },
    {
      title: 'Pay the owner more',
      goal: 'The bakery owner wants to withdraw $1,500 this month, which drops ending capital to $7,650. Keep the bigger withdrawal and get ending capital back to $8,350 or more.',
      start: { g0: 0, f10: 1500 },
      met: (s) => fs(s).endCap >= 8350,
      rules: [
        { text: 'The owner still withdraws $1,500 or more.', ok: (s) => s.v('fs-on-10') === 1 && s.v('f10') >= 1500 },
        { text: 'The owner still invests $1,000, no more.', ok: (s) => fsKept(s, 9, 1000) },
      ],
    },
  ],

  'inventory-methods': [
    {
      title: 'Make the methods agree',
      goal: 'For the sneakers, LIFO puts $410 more into cost of goods sold than FIFO. Change the costs so FIFO and LIFO give the same cost of goods sold.',
      start: { g0: 0 },
      met: (s) => Math.abs(invCogs(s, 'lifo') - invCogs(s, 'fifo')) < 0.005,
      rules: [
        { text: 'The store still sells 70 pairs.', ok: (s) => s.v('iv-sold') === 70 },
        { text: 'It still has 100 pairs to sell.', ok: (s) => invLayers(s).reduce((t, [u]) => t + u, 0) === 100 },
      ],
    },
    {
      title: 'A $100 tax gap',
      goal: 'With rising sneaker prices, LIFO saves about $86 in tax compared with FIFO. How much would the last purchase have to cost for LIFO to save $100 or more?',
      start: { g0: 0 },
      met: (s) => ((invCogs(s, 'lifo') - invCogs(s, 'fifo')) * s.v('iv-tax')) / 100 >= 100,
      rules: [
        { text: 'Tax rate stays at 21%.', ok: (s) => s.v('iv-tax') === 21 },
        { text: 'The store still sells 70 pairs.', ok: (s) => s.v('iv-sold') === 70 },
        { text: 'The beginning inventory and first two purchases stay the same.', ok: (s) => [20, 60, 30, 65, 30, 70].every((v, i) => s.v(`f${i}`) === v) },
      ],
    },
    {
      title: 'Make the methods disagree',
      goal: 'Every bag of coffee cost $8, so the methods all agree. Change the purchases so LIFO\'s cost of goods sold is at least $100 more than FIFO\'s.',
      start: { g0: 2 },
      met: (s) => invCogs(s, 'lifo') - invCogs(s, 'fifo') >= 100 - 0.005,
      rules: [
        { text: 'The store still sells 220 bags.', ok: (s) => s.v('iv-sold') === 220 },
        { text: 'Beginning inventory stays 50 bags at $8.', ok: (s) => s.v('f0') === 50 && s.v('f1') === 8 },
      ],
    },
  ],

  'ratio-dashboard': [
    {
      title: 'Pay this year\'s bills',
      goal: 'The furniture store has only $0.87 of short-term assets for every $1 due this year. Get the current ratio to 1.5 or higher by turning short-term debt into a long-term loan.',
      start: { g0: 3 },
      met: (s) => ratio(s, 'current') >= 1.5,
      rules: [
        { text: 'Current assets stay at $260,000.', ok: (s) => s.v('rt-ca') === 260000 },
        { text: 'Total liabilities stay at $520,000 (the debt moves, it doesn\'t disappear).', ok: (s) => s.v('rt-tl') === 520000 },
      ],
    },
    {
      title: 'Less on the shelves',
      goal: 'The grocery store\'s quick ratio is 0.58. Sell off inventory for cash until the quick ratio is 1 or higher.',
      start: { g0: 1 },
      met: (s) => ratio(s, 'quick') >= 1,
      rules: [
        { text: 'Current assets stay at $180,000 (inventory turns into cash).', ok: (s) => s.v('rt-ca') === 180000 },
        { text: 'Current liabilities stay at $120,000.', ok: (s) => s.v('rt-cl') === 120000 },
      ],
    },
    {
      title: 'Owe less than twice',
      goal: 'The furniture store owes $6.50 for every $1 the owners have in it. The owners put in more money to pay down debt. Get debt-to-equity under 2.',
      start: { g0: 3 },
      met: (s) => ratio(s, 'de') < 2,
      rules: [{ text: 'Total assets stay at $600,000.', ok: (s) => s.v('rt-ta') === 600000 }],
    },
  ],

  'comparative-advantage': [
    {
      title: 'Both islands win',
      goal: 'Have each island make what it gives up the least for, then set up a trade so both islands end up with more of at least one good and less of neither.',
      start: { g0: 0 },
      met: (s) => caBothWin(s, 0),
      rules: [{ text: 'What each island can make stays the same.', ok: (s) => caMaxAre(s, 0, [10, 40]) && caMaxAre(s, 1, [20, 20]) }],
    },
    {
      title: 'More of everything',
      goal: 'Change how Portugal and England split their workers so the world makes more wine and more cloth than before trade.',
      start: { g0: 1 },
      met: (s) => {
        const w = caWorld(s, 1);
        return w.now[0] > w.before[0] + 0.05 && w.now[1] > w.before[1] + 0.05;
      },
      rules: [{ text: 'What each country can make stays the same.', ok: (s) => caMaxAre(s, 0, [90, 80]) && caMaxAre(s, 1, [60, 72]) }],
    },
    {
      title: 'Give trade a reason',
      goal: 'Northland and Southland give up the same amount for each good, so trade can\'t help. Change what Southland can make so specializing lets the world make more of both goods.',
      start: { g0: 2 },
      met: (s) => {
        const w = caWorld(s, 2);
        const [a, b] = caMax(s).map(oppCost);
        return a !== b && w.now[0] > w.before[0] + 0.05 && w.now[1] > w.before[1] + 0.05;
      },
      rules: [
        { text: 'Northland stays the same: 100 corn or 50 tractors.', ok: (s) => caMaxAre(s, 0, [100, 50]) },
        { text: 'Southland can still make at most 60 corn.', ok: (s) => s.v('f2') === 60 },
      ],
    },
  ],

  'currency-trade': [
    {
      title: 'When imports get pricey',
      goal: 'Italian olive oil sells for less than the $16 U.S.-made bottle. Find an exchange rate where it costs more than $16 on the shelf.',
      start: { g0: 0 },
      met: (s) => s.raw('fx-mode') === 'import' && fx(s).shelf > 16,
      rules: [
        { text: 'Still importing.', ok: (s) => s.raw('fx-mode') === 'import' },
        { text: 'Price, shipping, tariff, and markup stay the same.', ok: (s) => fxKeep(s, { price: 6, ship: 1.5, tariff: 10, markup: 60 }) },
      ],
    },
    {
      title: 'Tariff war',
      goal: 'Sneakers from Vietnam sell for $52, less than the $60 U.S.-made pair. What tariff would make them cost $60 or more?',
      start: { g0: 1 },
      met: (s) => s.raw('fx-mode') === 'import' && fx(s).shelf >= 60 - 0.005,
      rules: [
        { text: 'Still importing.', ok: (s) => s.raw('fx-mode') === 'import' },
        { text: 'Price, exchange rate, shipping, and markup stay the same.', ok: (s) => fxKeep(s, { price: 500000, rate: 25000, ship: 2, markup: 100 }) },
      ],
    },
    {
      title: 'Sell more guitars in Japan',
      goal: 'The U.S. guitar costs ¥180,600 in Japan, more than the ¥170,000 Japanese guitar. Get it under ¥170,000 without lowering the U.S. price or the store markup.',
      start: { g0: 2 },
      met: (s) => s.raw('fx-mode') === 'export' && fx(s).shelf < 170000,
      rules: [
        { text: 'Still exporting.', ok: (s) => s.raw('fx-mode') === 'export' },
        { text: 'The guitar still costs $800.', ok: (s) => s.v('fx-price') === 800 },
        { text: 'Store markup stays at 40%.', ok: (s) => s.v('fx-markup') === 40 },
      ],
    },
  ],

  'market-entry': [
    {
      title: 'Make the subsidiary pay',
      goal: 'In the small test market, owning your own subsidiary loses about $142,000 over 5 years. How big would first-year sales need to be for it to at least break even?',
      start: { g0: 0 },
      met: (s) => entry(s, 'sub') >= 0,
      rules: [
        { text: 'Growth stays at 10% a year or less.', ok: (s) => s.v('me-growth') <= 10 },
        { text: 'No sales shortfall.', ok: (s) => s.v('me-shortfall') === 0 },
      ],
    },
    {
      title: 'Tariffs and exporting',
      goal: 'In the big but risky market, a 25% tariff makes exporting earn the least of any way in. How low would the tariff have to be for exporting to earn the most?',
      start: { g0: 2 },
      met: (s) => bestEntry(s) === 'export',
      rules: [
        { text: 'Sales still fall 30% short.', ok: (s) => s.v('me-shortfall') === 30 },
        { text: 'Political risk is still there.', ok: (s) => s.v('f0') === 1 },
        { text: 'Sales and growth stay the same.', ok: (s) => s.v('me-sales') === 3000000 && s.v('me-growth') === 10 },
      ],
    },
    {
      title: 'Grow into a joint venture',
      goal: 'In the small test market, a joint venture loses about $21,000 over 5 years. How fast would sales need to grow for it to at least break even?',
      start: { g0: 0 },
      met: (s) => entry(s, 'jv') >= 0,
      rules: [
        { text: 'First-year sales stay at $300,000.', ok: (s) => s.v('me-sales') === 300000 },
        { text: 'No sales shortfall.', ok: (s) => s.v('me-shortfall') === 0 },
      ],
    },
  ],

  'offshoring-decision-lab': [
    {
      title: 'The tariff that brings it home',
      goal: 'Making T-shirts overseas saves about $5 a shirt. What tariff would make making them at home cheaper?',
      start: { g0: 0, g1: 1 },
      met: (s) => { const c = offSites(s, 0); return c.home < c.away; },
      rules: [
        { text: 'The overseas factory stays the same.', ok: (s) => offFactory(s, 0) },
        { text: 'No currency change.', ok: (s) => s.v('off-currency') === 0 },
      ],
    },
    {
      title: 'A better factory',
      goal: 'Furniture made overseas costs more per good unit than furniture made at home. Improve the overseas factory so it costs less.',
      start: { g0: 1, g1: 1 },
      met: (s) => { const c = offSites(s, 1); return c.away < c.home; },
      rules: [
        { text: 'You are still changing the overseas factory.', ok: (s) => s.pick(1) === 1 },
        { text: 'Overseas wage, materials, and shipping stay the same.', ok: (s) => s.v('off-wage') === 5 && s.v('off-mat') === 70 && s.v('off-ship') === 60 },
        { text: 'Tariff stays at 25%.', ok: (s) => s.v('off-tariff') === 25 },
      ],
    },
    {
      title: 'Currency swing',
      goal: 'Headphones cost more to make overseas, partly because the factory country\'s currency got 10% stronger. How much would it have to change for overseas to be cheaper?',
      start: { g0: 2, g1: 1 },
      met: (s) => { const c = offSites(s, 2); return c.away < c.home; },
      rules: [
        { text: 'Both factories stay the same.', ok: (s) => offFactory(s, 2) },
        { text: 'Tariff stays at 25%.', ok: (s) => s.v('off-tariff') === 25 },
      ],
    },
  ],

  'payroll-lab': [
    {
      title: 'Same hours, lower cost',
      goal: 'The coffee shop\'s payroll costs $1,721.28 for 90 hours of work. Get the total cost to $1,650 or less without cutting any hours.',
      start: { g0: 0 },
      met: (s) => payroll(s).cost <= 1650,
      rules: [
        { text: 'Total hours stay at 90.', ok: (s) => s.v('pr-a-hours') + s.v('pr-b-hours') + s.v('pr-c-hours') === 90 },
        { text: 'Nobody\'s hourly pay changes.', ok: (s) => s.v('pr-a-rate') === 16 && s.v('pr-b-rate') === 15.5 && s.v('pr-c-rate') === 19 },
      ],
    },
    {
      title: 'Stay on budget',
      goal: 'The landscaping crew has a $4,800 payroll budget, but this payroll really costs $4,930.62. Cut Cara\'s hours until the total cost fits the budget.',
      start: { g0: 1 },
      met: (s) => payroll(s).cost <= 4800,
      rules: [
        { text: 'Ana and Ben keep 80 hours each.', ok: (s) => s.v('pr-a-hours') === 80 && s.v('pr-b-hours') === 80 },
        { text: 'Nobody\'s hourly pay changes.', ok: (s) => s.v('pr-a-rate') === 22 && s.v('pr-b-rate') === 20 && s.v('pr-c-rate') === 18 },
      ],
    },
    {
      title: 'A raise for Cara',
      goal: 'At the small office, Cara takes home $654.32 a paycheck. Find the hourly pay that gets her take-home to $700 or more.',
      start: { g0: 2 },
      met: (s) => payroll(s).checks[2].net >= 700,
      rules: [
        { text: 'Cara still works 40 hours.', ok: (s) => s.v('pr-c-hours') === 40 },
        { text: '401(k) savings stay at 5%.', ok: (s) => s.v('pr-k') === 5 },
      ],
    },
  ],
};
