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
// s is the tool's current state: s.v('be-price') reads an input as a number, s.pick(1) reads which
// button is pressed in group 1 (presets are group 0, tabs are group 1). Checks reuse each tool's own
// math where it's exported, so a card never disagrees with the results on screen.
//
// Sample solutions go in the tool's teacher notes, never here: this file ships to student pages.

import { schedule } from '../scripts/tools/depreciation.js';
import { funnel } from '../scripts/tools/marketing-funnel.js';
import { plan, repay, TAKE_HOME } from '../scripts/tools/student-loans.js';
import { payoff } from '../scripts/tools/credit-card.js';
import { grow } from '../scripts/tools/start-early.js';

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
};
