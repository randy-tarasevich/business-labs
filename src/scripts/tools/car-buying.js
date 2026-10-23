// Car Buying Lab
// Two cars, one new and one used, bought with the same down payment and loan length.
// Each loan rate comes from the buyer's credit tier (src/data/car-loans.js): used-car loans cost more.
// Loan = price - down payment, paid back in equal monthly payments. Total cost = price + interest.
// The 20/4/10 guideline: put at least 20% down, borrow for 4 years or less, and keep all car costs
// (payment, insurance, gas, upkeep) under 10% of gross (before-tax) pay.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';
import { CREDIT_TIERS, TERMS, RATES_AS_OF } from '../../data/car-loans.js';

const PRESETS = [
  { name: 'First car', newPrice: 28000, usedPrice: 16000, down: 2000, term: 60, credit: 1, pay: 45760, other: 250 },
  { name: 'Stretch it to 84 months', newPrice: 28000, usedPrice: 16000, down: 2000, term: 84, credit: 1, pay: 45760, other: 250 },
  { name: 'No credit history yet', newPrice: 28000, usedPrice: 16000, down: 2000, term: 60, credit: 3, pay: 45760, other: 250 },
];
const RANGE_KEYS = ['newPrice', 'usedPrice', 'down', 'pay', 'other'];
const IDS = { newPrice: 'cb-new-price', usedPrice: 'cb-used-price', down: 'cb-down', pay: 'cb-pay', other: 'cb-other' };

/** Equal monthly payment for a loan. */
export function payment(principal, apr, months) {
  if (principal <= 0 || months <= 0) return 0;
  const r = apr / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - (1 + r) ** -months);
}

/** One car bought with this down payment, loan length, and rate. */
export function carLoan(price, down, months, apr) {
  const principal = Math.max(0, price - down);
  const monthly = payment(principal, apr, months);
  const interest = monthly * months - principal;
  return { price, principal, monthly, interest, total: price + interest, downShare: price > 0 ? Math.min(down, price) / price : 0 };
}

/** The 20/4/10 checks for one car. other = insurance, gas, and upkeep per month. */
export function guideline(loan, months, pay, other) {
  const monthlyGross = pay / 12;
  const carCosts = loan.monthly + other;
  return {
    down: loan.downShare >= 0.2,
    term: months <= 48,
    budget: monthlyGross > 0 && carCosts <= monthlyGross * 0.1,
    carCosts,
    share: monthlyGross > 0 ? carCosts / monthlyGross : Infinity,
  };
}

/** Both cars for a scenario. s: { newPrice, usedPrice, down, term, credit (tier index), pay, other } */
export function compareCars(s) {
  const tier = CREDIT_TIERS[Math.min(Math.max(Math.round(s.credit), 0), CREDIT_TIERS.length - 1)];
  const nw = carLoan(s.newPrice, s.down, s.term, tier.newApr);
  const used = carLoan(s.usedPrice, s.down, s.term, tier.usedApr);
  return {
    tier,
    new: { ...nw, apr: tier.newApr, check: guideline(nw, s.term, s.pay, s.other) },
    used: { ...used, apr: tier.usedApr, check: guideline(used, s.term, s.pay, s.other) },
  };
}

export function initCarBuying(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };
  const term = $('#cb-term');
  const credit = $('#cb-credit');

  const syncs = RANGE_KEYS.map((k) =>
    linkRange(root, IDS[k], {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
    })
  );
  term.addEventListener('change', () => {
    state.term = parseInt(term.value, 10);
    setActive(-1);
    render();
  });
  credit.addEventListener('change', () => {
    state.credit = parseInt(credit.value, 10);
    setActive(-1);
    render();
  });
  const syncSelects = () => {
    term.value = String(state.term);
    credit.value = String(state.credit);
  };
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    syncSelects();
    render();
  });

  r('asof').textContent = `Loan rates are U.S. averages for ${RATES_AS_OF} from Experian. Your real rate depends on your credit, the lender, and the car.`;

  function render() {
    const c = compareCars(state);
    r('new-pay').textContent = money(c.new.monthly, 0);
    r('used-pay').textContent = money(c.used.monthly, 0);
    r('new-total').textContent = money(c.new.total, 0);
    r('used-total').textContent = money(c.used.total, 0);
    r('rates').textContent = `Your loan rates: ${c.new.apr}% for the new car, ${c.used.apr}% for the used car.`;

    const yes = (ok) => (ok ? 'Yes' : 'No');
    const row = (label, a, b) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${label}</th><td>${a}</td><td>${b}</td>`;
      return tr;
    };
    r('rule').replaceChildren(
      row('At least 20% down', `${yes(c.new.check.down)} (${Math.round(c.new.downShare * 100)}%)`, `${yes(c.used.check.down)} (${Math.round(c.used.downShare * 100)}%)`),
      row('Loan of 4 years or less', `${yes(c.new.check.term)} (${state.term / 12} yr)`, `${yes(c.used.check.term)} (${state.term / 12} yr)`),
      row('Car costs under 10% of pay', `${yes(c.new.check.budget)} (${pct(c.new.check.share)})`, `${yes(c.used.check.budget)} (${pct(c.used.check.share)})`)
    );
    const passes = (x) => [x.down, x.term, x.budget].filter(Boolean).length;

    const v = r('verdict');
    const saved = c.new.total - c.used.total;
    if (!state.newPrice && !state.usedPrice) {
      setTone(v, 'warn');
      v.textContent = 'Enter a price for each car.';
    } else {
      setTone(v, passes(c.used.check) === 3 || passes(c.new.check) === 3 ? 'good' : saved > 0 ? 'info' : 'warn');
      v.textContent = (saved >= 0
        ? `The used car costs ${money(saved, 0)} less in total, even at a higher loan rate.`
        : `The new car costs ${money(-saved, 0)} less in total.`) +
        ` It meets ${passes(c.used.check)} of 3 parts of the 20/4/10 guideline; the new car meets ${passes(c.new.check)}.`;
    }

    r('formula').innerHTML =
      `New car loan = ${money(state.newPrice, 0)} − ${money(state.down, 0)} down = ${money(c.new.principal, 0)} at ${c.new.apr}% for ${state.term} months` +
      `<span>New car: ${money(c.new.monthly, 2)} × ${state.term} = ${money(c.new.monthly * state.term, 0)} paid, so ${money(c.new.interest, 0)} is interest</span>` +
      `<span>Used car loan = ${money(state.usedPrice, 0)} − ${money(state.down, 0)} down = ${money(c.used.principal, 0)} at ${c.used.apr}% for ${state.term} months</span>` +
      `<span>Used car: ${money(c.used.monthly, 2)} × ${state.term} = ${money(c.used.monthly * state.term, 0)} paid, so ${money(c.used.interest, 0)} is interest</span>` +
      `<span>10% of pay = ${money(state.pay, 0)} ÷ 12 × 10% = ${money(state.pay / 120, 0)} a month for all car costs</span>`;

    draw(c);
  }

  function draw(c) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 170 : 160;
    const L = narrow ? 64 : 84, R = 16, T = 10, B = 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxX = niceMax(Math.max(c.new.total, c.used.total, 1000));
    const x = (v) => L + (v / maxX) * (W - L - R);
    const n = String(maxX)[0] === '2' && String(maxX)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxX / n) * i;
      add('line', { x1: x(val), x2: x(val), y1: T, y2: H - B, style: 'stroke:var(--grid)' });
      add('text', { x: x(val), y: H - B + 18, 'text-anchor': 'middle' }, narrow && i % 2 ? '' : money(val, 0));
    }
    const rowH = (H - T - B) / 2;
    [['New car', c.new], ['Used car', c.used]].forEach(([label, car], i) => {
      const y0 = T + i * rowH + rowH * 0.18;
      const h = rowH * 0.64;
      const down = Math.min(state.down, car.price);
      let at = 0;
      for (const [val, color, op] of [[down, '--good', 1], [car.principal, '--accent', 1], [car.interest, '--bad', 0.6]]) {
        if (val <= 0) continue;
        add('rect', { x: x(at), y: y0, width: Math.max(0, x(at + val) - x(at)), height: h, style: `fill:var(${color});opacity:${op}` });
        at += val;
      }
      add('text', { x: L - 8, y: y0 + h / 2 + 4, 'text-anchor': 'end', style: 'fill:var(--ink)' }, label);
    });
    svg.setAttribute('aria-label', `Total cost of each car. New car: ${money(c.new.total, 0)}, including ${money(c.new.interest, 0)} of interest. Used car: ${money(c.used.total, 0)}, including ${money(c.used.interest, 0)} of interest.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  syncSelects();
  render();
}

function pct(x) {
  return Number.isFinite(x) ? `${Math.round(x * 100)}%` : 'n/a';
}

