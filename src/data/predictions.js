// Predict first: question cards above a tool's challenges. A student picks Goes up, Goes down, or
// Stays the same; the tool loads the scenario, makes the change on screen, and shows before and after
// next to the guess. The right answer comes from the tool's own math, never from a stored key.
//
// Keyed by tool slug. Each prediction:
//   question  the scenario and the change, in plain words (student-facing: no em-dashes)
//   start     share-link params for the "before" scenario (g0 preset, g1 tab, input overrides)
//   change    params applied on top of start for the "after"
//   measure   { label, value(s), fmt(n) }: the number the question is about. s is the same state
//             object challenges get: s.v('id') reads an input, s.pick(1) the pressed tab.
//
// Pick questions where students' gut answer is often wrong. Discussion prompts and the "why" go in
// the tool's teacher notes under "Predict first", never here: this file ships to student pages.

import { schedule } from '../scripts/tools/depreciation.js';
import { funnel } from '../scripts/tools/marketing-funnel.js';
import { money, num } from '../scripts/lib/util.js';
import { plan } from '../scripts/tools/student-loans.js';
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
import { atPrice, keyPrices } from '../scripts/tools/price-demand.js';
import { PRESETS as FS_BUSINESSES, buildStatements } from '../scripts/tools/financial-statements.js';
import { costMethod } from '../scripts/tools/inventory-methods.js';
import { computeRatios } from '../scripts/tools/ratio-dashboard.js';
import { produce, oppCost } from '../scripts/tools/comparative-advantage.js';
import { landed } from '../scripts/tools/currency-trade.js';
import { MODES, runMode } from '../scripts/tools/market-entry.js';
import { PRESETS as OFF_PRODUCTS, unitCost } from '../scripts/tools/offshoring.js';
import { simulateRunway } from '../scripts/tools/startup-runway.js';
import { dealMath } from '../scripts/tools/investor-deal.js';
import { unitEconomics } from '../scripts/tools/unit-economics.js';
import { PRESETS as SD_MARKETS, equilibrium } from '../scripts/tools/supply-demand.js';
import { runPayroll } from '../scripts/tools/payroll.js';

const beUnits = (s) => {
  const cm = s.v('be-price') - s.v('be-vc');
  return cm > 0 ? Math.ceil(s.v('be-fc') / cm) : Infinity;
};
const METHODS = ['sl', 'ddb', 'syd'];
const dep = (s) => schedule(METHODS[s.pick(1)] ?? 'sl', s.v('dp-cost'), Math.min(s.v('dp-salvage'), s.v('dp-cost')), Math.max(1, Math.round(s.v('dp-life'))));
const fn = (s) =>
  funnel({ budget: s.v('fn-budget'), cpm: s.v('fn-cpm'), ctr: s.v('fn-ctr'), conv: s.v('fn-conv'), aov: s.v('fn-aov'), margin: s.v('fn-margin') });

const borrowed = (s) =>
  plan({
    cost: s.v('sl-cost'),
    aid: s.v('sl-aid'),
    family: s.v('sl-family'),
    years: Math.max(1, Math.min(6, Math.round(s.v('sl-years')))),
    rate: s.v('sl-rate'),
    sub: s.v('sl-sub') === 1,
  }).borrowed;

const saver = (s, who) =>
  grow(s.v('se-monthly'), who === 'a' ? s.v('se-rate') : s.v('se-bRate'), Math.round(s.v(`se-${who}Start`)), Math.round(s.v(`se-${who}Stop`)));

const pay = (s) => paycheck({ hourly: s.v('pc-hourly'), hours: s.v('pc-hours'), k: s.v('pc-k'), state: s.v('pc-state') });

const invest = (s) => outlook({ amount: s.v('ir-amount'), years: Math.max(1, Math.round(s.v('ir-years'))), stocks: s.v('ir-stocks'), bonds: s.v('ir-bonds') });

const ins = (s) => compare({ aDed: s.v('in-a-ded'), aPrem: s.v('in-a-prem'), bDed: s.v('in-b-ded'), bPrem: s.v('in-b-prem'), cost: s.v('in-cost'), claims: Math.round(s.v('in-claims')), savings: s.v('in-savings') });

const car = (s) => compareCars({ newPrice: s.v('cb-new-price'), usedPrice: s.v('cb-used-price'), down: s.v('cb-down'), term: s.v('cb-term'), credit: s.v('cb-credit'), pay: s.v('cb-pay'), other: s.v('cb-other') });

const ab = (s) => abTest({ nA: s.v('ab-nA'), cA: s.v('ab-cA'), nB: s.v('ab-nB'), cB: s.v('ab-cB') });

// Engagement Rate Lab: the bought-followers box has no id, so its share-link key is f0.
const eng = (s) => engagement({ followers: s.v('er-followers'), reach: s.v('er-reach'), likes: s.v('er-likes'), comments: s.v('er-comments'), shares: s.v('er-shares') }, s.v('f0') === 1);

const yourScore = (s) => {
  const w = Object.fromEntries(SIGNALS.map(([k]) => [k, s.v(`fr-w-${k}`)]));
  const you = { ...POSTS[0] };
  for (const k of ['likes', 'comments', 'shares', 'watch', 'hours']) you[k] = Math.round(s.v(`fr-you-${k}`));
  return Math.round(rank(POSTS.map((p) => (p.id === 'you' ? you : p)), w).find((p) => p.id === 'you').score * 10) / 10;
};

const infl = (s) =>
  deal({ fee: s.v('inf-fee'), followers: s.v('inf-followers'), eng: s.v('inf-eng'), fake: s.v('inf-fake') }, { aov: s.v('inf-aov'), margin: s.v('inf-margin'), click: s.v('inf-click'), buy: s.v('inf-buy') });

const won = (s) => Math.round(compete(MARKETS[Math.max(0, s.pick(0))], { x: s.v('pm-x'), y: s.v('pm-y') }).yours);

const demand = (s) => ({ p0: s.v('pd-p0'), q0: s.v('pd-q0'), b: s.v('pd-b'), vc: s.v('pd-vc'), fc: s.v('pd-fc') });

const lines = (s, kind) => {
  const out = [];
  for (let i = 0; Number.isFinite(s.v(`rw-${kind}-${i}`)); i++) out.push(['', s.v(`rw-${kind}-${i}`)]);
  return out;
};
const runway = (s) =>
  simulateRunway({ cash: s.v('rw-cash'), startup: lines(s, 'startup'), fixed: lines(s, 'fixed'), sales: s.v('rw-sales'), growth: s.v('rw-growth'), vc: s.v('rw-vc') });

const ue = (s) => unitEconomics({ spend: s.v('ue-spend'), newc: s.v('ue-newc'), aov: s.v('ue-aov'), freq: s.v('ue-freq'), margin: s.v('ue-margin'), months: s.v('ue-months') });

const sdEq = (s) => equilibrium(SD_MARKETS[Math.max(0, s.pick(0))], { ds: s.v('sd-ds'), ss: s.v('sd-ss') });

const fsBiz = (s) => FS_BUSINESSES[Number.isFinite(s.v('fs-on-10')) ? 0 : 1];
const fs = (s) => buildStatements(fsBiz(s), fsBiz(s).tx.map((t, i) => ({ t, on: s.v(`fs-on-${i}`) === 1, amt: s.v(`f${i}`) })));

const invCogs = (s, m) => costMethod([0, 1, 2, 3].map((i) => [s.v(`f${i * 2}`), s.v(`f${i * 2 + 1}`)]), s.v('iv-sold'), m).cogs;

const ratio = (s, key) =>
  computeRatios(Object.fromEntries(['ca', 'inv', 'ta', 'cl', 'tl', 'sales', 'cogs', 'ni'].map((k) => [k, s.v(`rt-${k}`)]))).find((x) => x.r.key === key).v;

// Comparative Advantage: max boxes have no ids (f0/f1 country A, f2/f3 country B).
const caWine = (s) => produce([s.v('f0'), s.v('f1')], s.v('ca-share-0'))[0] + produce([s.v('f2'), s.v('f3')], s.v('ca-share-1'))[0];

const shelf = (s) =>
  landed({ mode: s.raw('fx-mode'), price: s.v('fx-price'), rate: s.v('fx-rate'), ship: s.v('fx-ship'), tariff: s.v('fx-tariff'), markup: s.v('fx-markup') }).shelf;

// Market Entry: the political-risk box has no id, so it is f0.
const entry = (s, key) =>
  runMode(MODES.find((m) => m.key === key), { sales: s.v('me-sales'), growth: s.v('me-growth'), shortfall: s.v('me-shortfall'), tariff: s.v('me-tariff'), political: s.v('f0') === 1 }).total;

// Offshoring: cost per good unit made overseas, editing the overseas factory (group 1 = 1).
const awayCost = (s, product) => {
  const site = { ...OFF_PRODUCTS[product].sites[1] };
  for (const k of ['wage', 'hours', 'mat', 'ship', 'defect']) site[k] = s.v(`off-${k}`);
  return Math.round(unitCost(site, { tariff: s.v('off-tariff'), currency: s.v('off-currency') }, true).good * 100) / 100;
};
const payroll = (s) =>
  runPayroll({
    employees: ['a', 'b', 'c'].map((w) => ({ hours: s.v(`pr-${w}-hours`), rate: s.v(`pr-${w}-rate`) })),
    freq: s.v('pr-freq'),
    k: s.v('pr-k'),
    state: s.v('pr-state'),
    suta: s.v('pr-suta'),
  });

export const PREDICTIONS = {
  'break-even-lab': [
    {
      question: 'The T-shirt shop expects to sell twice as many shirts: 240 instead of 120. What happens to its break-even point?',
      start: { g0: 1 },
      change: { 'be-q': 240 },
      measure: { label: 'Break-even', value: beUnits, fmt: (n) => `${num(n)} shirts` },
    },
    {
      question: 'The food truck raises its price by $1. Because of that, it expects to sell 100 fewer meals (850 instead of 950). What happens to profit?',
      start: { g0: 2 },
      change: { 'be-price': 13, 'be-q': 850 },
      measure: { label: 'Profit at forecast', value: (s) => (s.v('be-price') - s.v('be-vc')) * s.v('be-q') - s.v('be-fc'), fmt: (n) => money(n, 0) },
    },
  ],

  depreciation: [
    {
      question: 'The food truck switches from straight-line to double-declining balance. What happens to the total depreciation over its 8-year life?',
      start: { g0: 0, g1: 0 },
      change: { g1: 1 },
      measure: { label: 'Total depreciation', value: (s) => dep(s).reduce((t, r) => t + r.dep, 0), fmt: (n) => money(n, 0) },
    },
    {
      question: 'The delivery van switches from double-declining balance to sum-of-the-years-digits. Both are "accelerated" methods. What happens to Year 1 depreciation?',
      start: { g0: 1, g1: 1 },
      change: { g1: 2 },
      measure: { label: 'Year 1 depreciation', value: (s) => dep(s)[0]?.dep ?? NaN, fmt: (n) => money(n, 0) },
    },
  ],

  'marketing-funnel': [
    {
      question: 'The T-shirt video ads get twice as many clicks: the click rate goes from 0.8% to 1.6%. What happens to profit after ads?',
      start: { g0: 2 },
      change: { 'fn-ctr': 1.6 },
      measure: { label: 'Profit after ads', value: (s) => fn(s).profit, fmt: (n) => money(n, 0) },
    },
    {
      question: 'The bakery adds a bundle deal, so the average order goes from $28 to $35. What happens to its ad cost per customer?',
      start: { g0: 0 },
      change: { 'fn-aov': 35 },
      measure: { label: 'Cost per customer', value: (s) => fn(s).cac, fmt: (n) => money(n, 2) },
    },
  ],

  'student-loan-simulator': [
    {
      question: 'You switch from the out-of-state public school ($45,000 a year) to the private college ($65,000 a year). What happens to the total you borrow?',
      start: { g0: 2 },
      change: { g0: 3 },
      measure: { label: 'Total borrowed', value: borrowed, fmt: (n) => money(n, 0) },
    },
    {
      question: 'At the in-state school, it turns out you don\'t qualify for subsidized loans. What happens to the total you borrow?',
      start: { g0: 1, 'sl-sub': 1 },
      change: { 'sl-sub': 0 },
      measure: { label: 'Total borrowed', value: borrowed, fmt: (n) => money(n, 0) },
    },
  ],

  'credit-card-payoff-lab': [
    {
      question: 'On the spring break trip, you double your fixed payment from $100 to $200. What happens to the interest charged in the first month?',
      start: { g0: 0 },
      change: { 'cc-fixed': 200 },
      measure: { label: 'First month\'s interest', value: (s) => (s.v('cc-balance') * s.v('cc-apr')) / 1200, fmt: (n) => money(n, 2) },
    },
    {
      question: 'On the maxed-out card, you cut your fixed payment in half, from $250 to $125. What happens to the total interest you pay?',
      start: { g0: 2 },
      change: { 'cc-fixed': 125 },
      measure: { label: 'Total interest, fixed plan', value: (s) => payoff({ balance: s.v('cc-balance'), apr: s.v('cc-apr'), fixed: s.v('cc-fixed') }, 'fixed').interest, fmt: (n) => money(n, 0) },
    },
  ],

  'start-early-lab': [
    {
      question: 'Both savers double their monthly deposit from $50 to $100. What happens to the share of Saver A\'s money at 65 that is growth, not deposits?',
      start: { g0: 0 },
      change: { 'se-monthly': 100 },
      measure: { label: 'Growth share of Saver A', value: (s) => { const a = saver(s, 'a'); return Math.round((a.growth / Math.max(a.final, 1)) * 1000) / 10; }, fmt: (n) => `${num(n, 1)}%` },
    },
    {
      question: 'Saver B waits 5 more years and starts at 31 instead of 26. What happens to how far behind Saver A they finish?',
      start: { g0: 0 },
      change: { 'se-bStart': 31 },
      measure: { label: 'Saver A minus Saver B at 65', value: (s) => saver(s, 'a').final - saver(s, 'b').final, fmt: (n) => money(n, 0) },
    },
  ],

  'paycheck-lab': [
    {
      question: 'You get a raise from $32 to $33 an hour, and it pushes you from the 12% federal bracket into the 22% bracket. What happens to your take-home pay?',
      start: { g0: 1, 'pc-hourly': 32 },
      change: { 'pc-hourly': 33 },
      measure: { label: 'Take-home per paycheck', value: (s) => pay(s).net / s.v('pc-freq'), fmt: (n) => money(n, 2) },
    },
    {
      question: 'At the part-time job, you cut back from 20 hours a week to 15. What happens to the share of your pay that goes to Social Security?',
      start: { g0: 0 },
      change: { 'pc-hours': 15 },
      measure: { label: 'Social Security share of pay', value: (s) => { const p = pay(s); return p.gross ? Math.round((p.ss / p.gross) * 1000) / 10 : 0; }, fmt: (n) => `${num(n, 1)}%` },
    },
  ],

  'investing-risk-lab': [
    {
      question: 'Your car fund is all in stocks. You decide to wait 20 years instead of 2. What happens to the chance you end up with less than you put in?',
      start: { g0: 0 },
      change: { 'ir-years': 20 },
      measure: { label: 'Chance of losing money', value: (s) => Math.round(invest(s).lossChance * 1000) / 10, fmt: (n) => `${num(n, 1)}%` },
    },
    {
      question: 'Your college fund (60% stocks, 40% bonds, 10 years) gets a gift: you invest $10,000 instead of $5,000. What happens to the chance you end up with less than you put in?',
      start: { g0: 1 },
      change: { 'ir-amount': 10000 },
      measure: { label: 'Chance of losing money', value: (s) => Math.round(invest(s).lossChance * 1000) / 10, fmt: (n) => `${num(n, 1)}%` },
    },
  ],

  'insurance-deductible-lab': [
    {
      question: 'After one fender bender, the repair bill doubles from $1,500 to $3,000. What happens to how much Plan A saves you compared with Plan B?',
      start: { g0: 1 },
      change: { 'in-cost': 3000 },
      measure: { label: 'Plan B minus Plan A', value: (s) => { const c = ins(s); return c.b.total - c.a.total; }, fmt: (n) => money(n, 0) },
    },
    {
      question: 'The fender bender turns out to be a small one: a $600 repair instead of $1,500. What happens to Plan B\'s cost for the year?',
      start: { g0: 1 },
      change: { 'in-cost': 600 },
      measure: { label: 'Plan B this year', value: (s) => ins(s).b.total, fmt: (n) => money(n, 0) },
    },
  ],

  'car-buying-lab': [
    {
      question: 'You stretch the new car loan from 60 months to 84 months to get a lower payment. What happens to the total interest you pay?',
      start: { g0: 0 },
      change: { 'cb-term': 84 },
      measure: { label: 'New car interest', value: (s) => car(s).new.interest, fmt: (n) => money(n, 0) },
    },
    {
      question: 'Your credit score climbs from Prime to Super prime before you buy. What happens to the used car\'s monthly payment?',
      start: { g0: 0 },
      change: { 'cb-credit': 0 },
      measure: { label: 'Used car monthly payment', value: (s) => car(s).used.monthly, fmt: (n) => money(n, 2) },
    },
  ],

  'ab-post-test': [
    {
      question: 'The bake sale shows each post to 800 people instead of 200, and the click rates stay the same (3% and 5%). What happens to the gap between B and A?',
      start: { g0: 0 },
      change: { 'ab-nA': 800, 'ab-cA': 24, 'ab-nB': 800, 'ab-cB': 40 },
      measure: { label: 'Gap (B minus A)', value: (s) => Math.round(ab(s).gap * 1000) / 10, fmt: (n) => `${num(n, 1)} pts` },
    },
    {
      question: 'The huge test shrinks from 20,000 viewers each to 2,000 each, with the same click rates (3.0% and 3.5%). What happens to the chance luck explains the gap?',
      start: { g0: 2 },
      change: { 'ab-nA': 2000, 'ab-cA': 60, 'ab-nB': 2000, 'ab-cB': 70 },
      measure: { label: 'Gap this big by luck', value: (s) => Math.round(ab(s).luck * 100), fmt: (n) => `${num(n)} in 100` },
    },
  ],

  'engagement-rate-lab': [
    {
      question: 'The big account buys 20,000 followers. What happens to its engagement rate by followers?',
      start: { g0: 0 },
      change: { f0: 1 },
      measure: { label: 'Engagement rate by followers', value: (s) => Math.round(eng(s).rateF * 100) / 100, fmt: (n) => `${num(n, 2)}%` },
    },
    {
      question: 'The small account\'s post is shown to twice as many people (5,000 instead of 2,500), and it gets the same likes, comments, and shares. What happens to its engagement rate by followers?',
      start: { g0: 1 },
      change: { 'er-reach': 5000 },
      measure: { label: 'Engagement rate by followers', value: (s) => Math.round(eng(s).rateF * 10) / 10, fmt: (n) => `${num(n, 1)}%` },
    },
  ],

  'feed-ranking-sandbox': [
    {
      question: 'The feed is set to "Newest first." Your muffin post gets twice as many likes: 240 instead of 120. What happens to its score?',
      start: { g0: 0 },
      change: { 'fr-you-likes': 240 },
      measure: { label: 'Your post\'s score', value: yourScore, fmt: (n) => num(n, 1) },
    },
    {
      question: 'Still "Newest first." You post the muffins again. This time it\'s 1 hour old instead of 3, but it only has half the likes (60). What happens to its score?',
      start: { g0: 0 },
      change: { 'fr-you-hours': 1, 'fr-you-likes': 60 },
      measure: { label: 'Your post\'s score', value: yourScore, fmt: (n) => num(n, 1) },
    },
  ],

  'influencer-deal-lab': [
    {
      question: 'The phone case shop raises its average order from $30 to $40. What happens to the number of customers the big creator brings in?',
      start: { g0: 0, g1: 0 },
      change: { 'inf-aov': 40 },
      measure: { label: 'Customers from the big creator', value: (s) => Math.round(infl(s).customers * 10) / 10, fmt: (n) => num(n, 1) },
    },
    {
      question: 'The mid creator\'s engagement doubles from 4% to 8%, but she doubles her fee from $350 to $700. What happens to the shop\'s profit from her post?',
      start: { g0: 0, g1: 1 },
      change: { 'inf-eng': 8, 'inf-fee': 700 },
      measure: { label: 'Profit from the mid creator', value: (s) => Math.round(infl(s).profit), fmt: (n) => money(n, 0) },
    },
  ],

  'positioning-map-lab': [
    {
      question: 'Your pizza brand sits right on the Families bubble, the biggest group. You move it to the empty "Good pizza, fair price" bubble, which is smaller. What happens to the customers you win?',
      start: { g0: 0, 'pm-x': 4, 'pm-y': 4.5 },
      change: { 'pm-x': 4.5, 'pm-y': 8 },
      measure: { label: 'Customers you win', value: won, fmt: (n) => num(n) },
    },
    {
      question: 'Your snack bar sits right on the Gym regulars (price 8, healthiness 8). You make it even healthier: healthiness 10 at the same price. What happens to the customers you win?',
      start: { g0: 1, 'pm-x': 8, 'pm-y': 8 },
      change: { 'pm-y': 10 },
      measure: { label: 'Customers you win', value: won, fmt: (n) => num(n) },
    },
  ],

  'price-demand': [
    {
      question: 'The concert venue raises its rent, so fixed costs go from $20,000 to $25,000. What happens to the ticket price that earns the most profit?',
      start: { g0: 0 },
      change: { 'pd-fc': 25000 },
      measure: { label: 'Most profitable price', value: (s) => keyPrices(demand(s)).profitMax, fmt: (n) => money(n, 2) },
    },
    {
      question: 'The movie theater raises popcorn from $8 to $10 a bucket, so it sells fewer buckets. What happens to popcorn revenue?',
      start: { g0: 3 },
      change: { 'pd-price': 10 },
      measure: { label: 'Revenue', value: (s) => atPrice(demand(s), s.v('pd-price')).revenue, fmt: (n) => money(n, 0) },
    },
  ],

  'startup-runway': [
    {
      question: 'The food truck starts with $20,000 more cash ($95,000 instead of $75,000). What happens to the month it first makes a profit?',
      start: { g0: 0 },
      change: { 'rw-cash': 95000 },
      measure: { label: 'First month with a profit', value: (s) => runway(s).firstProfit ?? NaN, fmt: (n) => `Month ${num(n)}` },
    },
    {
      question: 'The phone case startup cuts its online ads from $2,000 to $1,000 a month, and sales stay the same. What happens to its lowest cash balance?',
      start: { g0: 1 },
      change: { 'rw-fixed-0': 1000 },
      measure: { label: 'Lowest cash balance', value: (s) => Math.round(runway(s).low.cash), fmt: (n) => money(n, 0) },
    },
  ],

  'investor-deal-lab': [
    {
      question: 'The smoothie truck\'s sales last year were really $240,000, not $120,000. You still ask for $50,000 for 10%. What happens to the value your ask puts on the company?',
      start: { g0: 0 },
      change: { 'dl-sales': 240000 },
      measure: { label: 'Your ask: company value', value: (s) => dealMath({ amt: s.v('dl-askAmt'), pct: s.v('dl-askPct'), sales: s.v('dl-sales'), exit: s.v('dl-exit') }).post, fmt: (n) => money(n, 0) },
    },
    {
      question: 'The investor still offers $300,000 for the headset brand, but now wants 15% instead of 10%. What happens to the value their offer puts on the company?',
      start: { g0: 3 },
      change: { 'dl-offPct': 15 },
      measure: { label: 'Their offer: company value', value: (s) => dealMath({ amt: s.v('dl-offAmt'), pct: s.v('dl-offPct'), sales: s.v('dl-sales'), exit: s.v('dl-exit') }).post, fmt: (n) => money(n, 0) },
    },
  ],

  'unit-economics-lab': [
    {
      question: 'The snack box doubles its ad spending from $4,000 to $8,000 a month, and new customers go from 100 to 150. What happens to how much each customer is worth compared with what they cost?',
      start: { g0: 1 },
      change: { 'ue-spend': 8000, 'ue-newc': 150 },
      measure: { label: 'Customer worth to cost', value: (s) => Math.round(ue(s).ratio * 100) / 100, fmt: (n) => `${num(n, 2)} to 1` },
    },
    {
      question: 'Food truck app customers stay 8 months instead of 6. What happens to how long it takes to earn back what each customer cost to win?',
      start: { g0: 0 },
      change: { 'ue-months': 8 },
      measure: { label: 'Months to earn it back', value: (s) => Math.round(ue(s).payback * 10) / 10, fmt: (n) => `${num(n, 1)} months` },
    },
  ],

  'supply-demand': [
    {
      question: 'Strawberries: a study makes people want 300 more quarts at every price, and a new farm adds 300 more quarts at every price. What happens to the market price?',
      start: { g0: 0 },
      change: { 'sd-ds': 300, 'sd-ss': 300 },
      measure: { label: 'Market price', value: (s) => Math.round(sdEq(s).price * 100) / 100, fmt: (n) => money(n, 2) },
    },
    {
      question: 'The week before Halloween, demand for pumpkins jumps and the price rises. What happens to the number of pumpkins sold?',
      start: { g0: 3 },
      change: { 'sd-ds': 400 },
      measure: { label: 'Pumpkins sold', value: (s) => Math.round(sdEq(s).qty), fmt: (n) => num(n) },
    },
  ],

  'financial-statements': [
    {
      question: 'The bakery owner withdraws $1,600 for personal use instead of $800. What happens to the bakery\'s net income?',
      start: { g0: 0 },
      change: { f10: 1600 },
      measure: { label: 'Net income', value: (s) => fs(s).ni, fmt: (n) => money(n, 0) },
    },
    {
      question: 'The bakery uses up $1,000 of supplies this month instead of $700. It didn\'t spend any cash on it. What happens to ending owner\'s capital?',
      start: { g0: 0 },
      change: { f6: 1000 },
      measure: { label: 'Ending capital', value: (s) => fs(s).endCap, fmt: (n) => money(n, 0) },
    },
  ],

  'inventory-methods': [
    {
      question: 'The sneaker store sells every pair it has: 100 instead of 70. What happens to the gap between LIFO and FIFO cost of goods sold?',
      start: { g0: 0 },
      change: { 'iv-sold': 100 },
      measure: { label: 'LIFO minus FIFO', value: (s) => invCogs(s, 'lifo') - invCogs(s, 'fifo'), fmt: (n) => money(n, 0) },
    },
    {
      question: 'The tax rate goes up from 21% to 30%. What happens to the sneakers\' FIFO cost of goods sold?',
      start: { g0: 0 },
      change: { 'iv-tax': 30 },
      measure: { label: 'FIFO cost of goods sold', value: (s) => invCogs(s, 'fifo'), fmt: (n) => money(n, 0) },
    },
  ],

  'ratio-dashboard': [
    {
      question: 'The hardware store has a great year: sales and cost of goods sold both double. What happens to its gross margin?',
      start: { g0: 0 },
      change: { 'rt-sales': 3200000, 'rt-cogs': 2080000 },
      measure: { label: 'Gross margin', value: (s) => Math.round(ratio(s, 'gm') * 1000) / 10, fmt: (n) => `${num(n, 1)}%` },
    },
    {
      question: 'The grocery store uses $60,000 of cash to pay bills due this year. Current assets drop to $120,000 and current liabilities to $60,000. What happens to its current ratio?',
      start: { g0: 1 },
      change: { 'rt-ca': 120000, 'rt-cl': 60000 },
      measure: { label: 'Current ratio', value: (s) => Math.round(ratio(s, 'current') * 100) / 100, fmt: (n) => `${num(n, 2)}×` },
    },
  ],

  'comparative-advantage': [
    {
      question: 'Palm Island gets twice as good at everything: it can now make 20 fish or 80 coconuts. What happens to how many coconuts Palm gives up to make 1 fish?',
      start: { g0: 0 },
      change: { f0: 20, f1: 80 },
      measure: { label: 'Palm: coconuts given up per fish', value: (s) => oppCost([s.v('f0'), s.v('f1')]), fmt: (n) => num(n, 2) },
    },
    {
      question: 'Portugal puts all its workers on wine and England puts all of its on cloth. What happens to the total wine the world makes?',
      start: { g0: 1 },
      change: { 'ca-share-0': 100, 'ca-share-1': 0 },
      measure: { label: 'World wine', value: caWine, fmt: (n) => num(n) },
    },
  ],

  'currency-trade': [
    {
      question: 'The dollar gets stronger: $1 now buys 1.00 euro instead of 0.90. What happens to the shelf price of Italian olive oil in the U.S.?',
      start: { g0: 0 },
      change: { 'fx-rate': 1 },
      measure: { label: 'Shelf price', value: (s) => Math.round(shelf(s) * 100) / 100, fmt: (n) => money(n, 2) },
    },
    {
      question: 'The same strong dollar: $1 now buys 1.50 Canadian dollars instead of 1.37. What happens to the price of a U.S. kayak in Canada?',
      start: { g0: 3 },
      change: { 'fx-rate': 1.5 },
      measure: { label: 'Price in Canada', value: (s) => Math.round(shelf(s)), fmt: (n) => `C$${num(n)}` },
    },
  ],

  'market-entry': [
    {
      question: 'In the big but risky market, the political risk goes away. What happens to what licensing earns over 5 years?',
      start: { g0: 2 },
      change: { f0: 0 },
      measure: { label: 'Licensing, 5 years', value: (s) => Math.round(entry(s, 'license')), fmt: (n) => money(n, 0) },
    },
    {
      question: 'In the small test market, sales come in 30% short of the forecast. What happens to what your own subsidiary earns over 5 years?',
      start: { g0: 0 },
      change: { 'me-shortfall': 30 },
      measure: { label: 'Own subsidiary, 5 years', value: (s) => Math.round(entry(s, 'sub')), fmt: (n) => money(n, 0) },
    },
  ],

  'offshoring-decision-lab': [
    {
      question: 'The company makes twice as many T-shirts a year: 200,000 instead of 100,000. What happens to the cost of each good shirt made overseas?',
      start: { g0: 0, g1: 1 },
      change: { 'off-units': 200000 },
      measure: { label: 'Overseas cost per good shirt', value: (s) => awayCost(s, 0), fmt: (n) => money(n, 2) },
    },
    {
      question: 'The overseas furniture factory cuts its defect rate from 6% to 2%. What happens to the cost of each good piece made overseas?',
      start: { g0: 1, g1: 1 },
      change: { 'off-defect': 2 },
      measure: { label: 'Overseas cost per good piece', value: (s) => awayCost(s, 1), fmt: (n) => money(n, 2) },
    },
  ],

  'payroll-lab': [
    {
      question: 'Every coffee shop employee starts saving 5% of their pay in a 401(k). What happens to the employer\'s payroll taxes?',
      start: { g0: 0 },
      change: { 'pr-k': 5 },
      measure: { label: 'Employer payroll taxes', value: (s) => payroll(s).t.employer, fmt: (n) => money(n, 2) },
    },
    {
      question: 'Ben\'s hours double, from 20 to 40 a week. What happens to the federal income tax withheld from his check?',
      start: { g0: 0 },
      change: { 'pr-b-hours': 40 },
      measure: { label: 'Ben\'s federal withholding', value: (s) => payroll(s).checks[1].fed, fmt: (n) => money(n, 2) },
    },
  ],
};
