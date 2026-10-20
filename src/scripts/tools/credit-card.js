// Credit Card Payoff Lab
// Each month: interest = balance × APR ÷ 12, then the payment comes off.
// Minimum payment (a common card formula): interest + 1% of the balance, at least $25.
// Fixed payment: the same amount every month. Nothing new goes on the card.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Spring break trip', balance: 1200, apr: 24, fixed: 100 },
  { name: 'Car repair', balance: 2500, apr: 22, fixed: 150 },
  { name: 'Maxed-out card', balance: 5000, apr: 28, fixed: 250 },
];
const KEYS = ['balance', 'apr', 'fixed'];
// Stop simulating after 50 years. A payment that never covers the interest never finishes.
const MAX_MONTHS = 600;

export const minPayment = (bal, interest) => Math.max(25, interest + bal * 0.01);

/** Month-by-month payoff. plan: 'min' or 'fixed'. Returns balances (index 0 = today), months, interest. */
export function payoff(s, plan) {
  let bal = s.balance;
  const r = s.apr / 100 / 12;
  const balances = [bal];
  let interest = 0;
  let paid = 0;
  let firstPay = 0;
  for (let m = 1; m <= MAX_MONTHS && bal > 0.005; m++) {
    const i = bal * r;
    const want = plan === 'min' ? minPayment(bal, i) : s.fixed;
    const pay = Math.min(want, bal + i);
    if (m === 1) firstPay = pay;
    interest += i;
    paid += pay;
    bal = bal + i - pay;
    balances.push(Math.max(bal, 0));
  }
  const done = bal <= 0.005;
  return { balances, months: done ? balances.length - 1 : Infinity, interest, paid, firstPay, done };
}

/** "3 years, 4 months" */
export function duration(m) {
  if (!Number.isFinite(m)) return 'Never';
  const y = Math.floor(m / 12);
  const mo = m % 12;
  const parts = [];
  if (y) parts.push(`${y} year${y === 1 ? '' : 's'}`);
  if (mo || !y) parts.push(`${mo} month${mo === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function initCreditCard(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, `cc-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
      max: k === 'apr' ? 100 : undefined,
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  function render() {
    const mn = payoff(state, 'min');
    const fx = payoff(state, 'fixed');
    const firstInterest = (state.balance * state.apr) / 100 / 12;

    r('min-time').textContent = duration(mn.months);
    r('min-int').textContent = money(mn.interest, 0);
    r('fix-time').textContent = duration(fx.months);
    r('fix-int').textContent = fx.done ? money(fx.interest, 0) : 'Never ends';
    setTone(r('fix-time-box'), fx.done ? 'good' : 'bad');
    setTone(r('min-time-box'), 'bad');

    const v = r('verdict');
    if (!state.balance) {
      setTone(v, 'warn');
      v.textContent = 'Put a balance on the card to see the payoff.';
    } else if (!fx.done) {
      setTone(v, 'bad');
      v.textContent = `A ${money(state.fixed, 0)} payment doesn't even cover the first month's interest (${money(firstInterest, 2)}), so the balance never goes down. Pay more than the interest to make progress.`;
    } else if (fx.months >= mn.months) {
      setTone(v, 'warn');
      v.textContent = `Your fixed payment is smaller than the minimum, so it takes longer. Try a payment above ${money(mn.firstPay, 2)}.`;
    } else {
      setTone(v, 'good');
      v.textContent = `Paying ${money(state.fixed, 0)} a month instead of the minimum saves ${money(mn.interest - fx.interest, 0)} in interest and finishes ${duration(mn.months - fx.months)} sooner.`;
    }

    r('formula').innerHTML =
      `Monthly interest rate = ${state.apr}% ÷ 12 = ${num(state.apr / 12, 2)}%` +
      `<span>First month's interest = ${money(state.balance, 0)} × ${num(state.apr / 12, 2)}% = ${money(firstInterest, 2)}</span>` +
      `<span>First minimum payment = ${money(firstInterest, 2)} interest + ${money(state.balance * 0.01, 2)} (1% of the balance) = ${money(mn.firstPay, 2)}</span>` +
      `<span>Total paid, minimum plan = ${money(state.balance, 0)} borrowed + ${money(mn.interest, 0)} interest = ${money(mn.paid, 0)}</span>` +
      (fx.done ? `<span>Total paid, fixed plan = ${money(state.balance, 0)} borrowed + ${money(fx.interest, 0)} interest = ${money(fx.paid, 0)}</span>` : '');

    draw(mn, fx);
  }

  function draw(mn, fx) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 240 : 280;
    const L = narrow ? 52 : 64, R = 12, T = 14, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));

    // Show up to the longer finished plan, capped at 30 years so a "never" line still fits.
    const span = Math.min(Math.max(Number.isFinite(mn.months) ? mn.months : 360, fx.done ? fx.months : 0, 12), 360);
    const stepX = span > 120 ? 60 : span > 48 ? 12 : 6;
    // A balance that never shrinks can grow huge; cap the scale at 3 times the starting balance and clip the line.
    const maxY = niceMax(Math.min(Math.max(state.balance, ...fx.balances.slice(0, span + 1), 1), Math.max(state.balance, 1) * 3));
    const x = (m) => L + (m / span) * (W - L - R);
    const y = (v) => T + (1 - v / maxY) * (H - T - B);

    // 4 gridlines when the top starts with 2 ($2,000), otherwise 5 ($250,000, $5,000), so labels stay round.
    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const v = (maxY / n) * i;
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, money(v, 0));
    }
    for (let m = 0; m <= span; m += stepX) {
      add('text', { x: x(m), y: H - B + 18, 'text-anchor': 'middle' }, stepX >= 12 ? String(m / 12) : String(m));
    }
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, stepX >= 12 ? 'Years from today' : 'Months from today');

    const line = (bals, color, dash) => {
      const pts = bals.slice(0, span + 1).map((b, m) => `${x(m).toFixed(1)},${y(Math.min(b, maxY)).toFixed(1)}`).join(' ');
      add('polyline', { points: pts, fill: 'none', style: `stroke:var(${color});stroke-width:3;${dash ? 'stroke-dasharray:6 4' : ''}`, 'stroke-linejoin': 'round' });
    };
    line(mn.balances, '--bad', false);
    line(fx.balances, '--good', true);

    svg.setAttribute('aria-label', `Card balance over time. Minimum payments: paid off in ${duration(mn.months)}. Fixed ${money(state.fixed, 0)} payments: ${fx.done ? `paid off in ${duration(fx.months)}` : 'never paid off'}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
