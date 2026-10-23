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
};
