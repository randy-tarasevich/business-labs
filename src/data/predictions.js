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
};
