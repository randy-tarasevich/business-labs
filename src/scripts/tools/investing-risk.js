// Investing Risk Lab
// A mix of stocks, bonds, and cash is held for some number of years and rebalanced each year.
// The mix's average yearly return and swing come from the historical figures in src/data/investing.js
// (stocks and bonds treated as moving independently; cash never loses money).
// Growth over many years is modeled as lognormal: the middle outcome grows at the mix's typical
// (geometric) rate, and the spread widens with the square root of the years. The bad and good cases
// are the 1-in-10 low and high outcomes (10th and 90th percentiles).

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';
import { STOCKS, BONDS, CASH, DATA_YEARS } from '../../data/investing.js';

const PRESETS = [
  { name: 'Car fund, 2 years', amount: 5000, years: 2, stocks: 100, bonds: 0 },
  { name: 'College, 10 years', amount: 5000, years: 10, stocks: 60, bonds: 40 },
  { name: 'Retirement, 40 years', amount: 5000, years: 40, stocks: 90, bonds: 10 },
  { name: 'Play it safe, 40 years', amount: 5000, years: 40, stocks: 0, bonds: 0 },
];
const KEYS = ['amount', 'years', 'stocks', 'bonds'];
/** z-score of the 90th percentile of a normal distribution. */
export const Z90 = 1.2815515655446004;

/** Standard normal cumulative probability (Abramowitz and Stegun 26.2.17, error under 1 in 10 million). */
export function normalCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

/** Percent in stocks and bonds, with whatever is left in cash. Bonds are trimmed if the two add past 100. */
export function normalizeMix(stocks, bonds) {
  const s = Math.min(Math.max(stocks, 0), 100);
  const b = Math.min(Math.max(bonds, 0), 100 - s);
  return { stocks: s, bonds: b, cash: 100 - s - b };
}

/** Yearly average return and swing for a mix, plus its lognormal growth rate (mu) and spread (sigma). */
export function mixStats(stocks, bonds) {
  const w = normalizeMix(stocks, bonds);
  const ws = w.stocks / 100, wb = w.bonds / 100, wc = w.cash / 100;
  const mean = ws * (STOCKS.mean / 100) + wb * (BONDS.mean / 100) + wc * (CASH.mean / 100);
  const variance = (ws * STOCKS.sd / 100) ** 2 + (wb * BONDS.sd / 100) ** 2;
  const sigma2 = Math.log(1 + variance / (1 + mean) ** 2);
  return { ...w, mean, sd: Math.sqrt(variance), mu: Math.log(1 + mean) - sigma2 / 2, sigma: Math.sqrt(sigma2) };
}

/** Outcomes after `years` for `amount` invested in a mix. */
export function outlook({ amount, years, stocks, bonds }) {
  const m = mixStats(stocks, bonds);
  const at = (t, z) => amount * Math.exp(m.mu * t + z * m.sigma * Math.sqrt(t));
  const lossChance = m.sigma > 0 && years > 0 ? normalCdf((-m.mu * Math.sqrt(years)) / m.sigma) : m.mu < 0 ? 1 : 0;
  return {
    ...m,
    middle: at(years, 0),
    bad: at(years, -Z90),
    good: at(years, Z90),
    cashOnly: amount * (1 + CASH.mean / 100) ** years,
    lossChance,
    path: (t) => ({ middle: at(t, 0), bad: at(t, -Z90), good: at(t, Z90) }),
  };
}

export function initInvestingRisk(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, `ir-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = k === 'years' ? Math.max(1, Math.min(50, Math.round(v))) : v;
        if (k === 'stocks' && state.stocks + state.bonds > 100) {
          state.bonds = Math.max(0, 100 - state.stocks);
          syncs[3]();
        }
        if (k === 'bonds' && state.stocks + state.bonds > 100) {
          state.bonds = Math.max(0, 100 - state.stocks);
          syncs[3]();
        }
        setActive(-1);
        render();
      },
      max: k === 'years' ? 50 : k === 'stocks' || k === 'bonds' ? 100 : undefined,
      fit: k === 'amount',
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  r('data').textContent = `Based on U.S. returns from ${DATA_YEARS}: stocks averaged ${STOCKS.mean}% a year (swinging about ${STOCKS.sd}% either way), Treasury bonds ${BONDS.mean}% (about ${BONDS.sd}%), and cash ${CASH.mean}%. Past returns don't promise future ones.`;

  function render() {
    const o = outlook(state);
    r('cash-pct').textContent = `${num(o.cash)}%`;
    r('middle').textContent = money(o.middle, 0);
    r('bad').textContent = money(o.bad, 0);
    r('good').textContent = money(o.good, 0);
    r('loss').textContent = lossText(o.lossChance);
    setTone(r('bad-box'), o.bad < state.amount ? 'bad' : '');
    setTone(r('loss-box'), o.lossChance >= 0.1 ? 'bad' : o.lossChance >= 0.02 ? 'warn' : 'good');

    const v = r('verdict');
    const yrs = `${state.years} year${state.years === 1 ? '' : 's'}`;
    if (!state.amount) {
      setTone(v, 'warn');
      v.textContent = 'Put in an amount to invest.';
    } else if (o.sigma === 0) {
      setTone(v, 'info');
      v.textContent = `All cash can't lose money, but it grows slowly: ${money(state.amount, 0)} becomes about ${money(o.middle, 0)} in ${yrs}.`;
    } else if (o.lossChance >= 0.1) {
      setTone(v, 'bad');
      v.textContent = `In ${yrs}, about 1 in ${Math.max(2, Math.round(1 / o.lossChance))} times you'd end up with less than the ${money(state.amount, 0)} you put in. Money you need soon is risky to invest.`;
    } else if (o.bad > o.cashOnly) {
      setTone(v, 'good');
      v.textContent = `Over ${yrs}, even the bad case (${money(o.bad, 0)}) beats keeping it all in cash (${money(o.cashOnly, 0)}). Time smooths out the bad years.`;
    } else {
      setTone(v, 'warn');
      v.textContent = `Over ${yrs}, the middle outcome (${money(o.middle, 0)}) beats all cash (${money(o.cashOnly, 0)}), but the bad case (${money(o.bad, 0)}) doesn't.`;
    }

    r('formula').innerHTML =
      `Mix: ${num(o.stocks)}% stocks, ${num(o.bonds)}% bonds, ${num(o.cash)}% cash` +
      `<span>Average year = ${num(o.stocks)}% × ${STOCKS.mean}% + ${num(o.bonds)}% × ${BONDS.mean}% + ${num(o.cash)}% × ${CASH.mean}% = ${num(o.mean * 100, 2)}%</span>` +
      `<span>Typical swing in a year = about ${num(o.sd * 100, 1)}% above or below that</span>` +
      `<span>Middle outcome = ${money(state.amount, 0)} growing about ${num((Math.exp(o.mu) - 1) * 100, 2)}% a year for ${yrs} = ${money(o.middle, 0)}</span>` +
      `<span>All cash = ${money(state.amount, 0)} × ${num(1 + CASH.mean / 100, 4)} to the power of ${state.years} = ${money(o.cashOnly, 0)}</span>`;

    draw(o);
  }

  function draw(o) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 240 : 280;
    const L = narrow ? 62 : 74, R = 12, T = 14, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const years = state.years;
    const steps = Math.max(years * 4, 8);
    const pts = Array.from({ length: steps + 1 }, (_, i) => (i / steps) * years);
    const maxY = niceMax(Math.max(o.good, o.cashOnly, state.amount, 1));
    const x = (t) => L + (t / years) * (W - L - R);
    const y = (v) => T + (1 - Math.min(v, maxY) / maxY) * (H - T - B);

    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxY / n) * i;
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }
    const tick = years <= 5 ? 1 : years <= 20 ? 5 : 10;
    for (let t = 0; t <= years; t += tick) add('text', { x: x(t), y: H - B + 18, 'text-anchor': 'middle' }, String(t));
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, 'Years invested');

    const top = pts.map((t) => `${x(t).toFixed(1)},${y(o.path(t).good).toFixed(1)}`);
    const bottom = pts.map((t) => `${x(t).toFixed(1)},${y(o.path(t).bad).toFixed(1)}`).reverse();
    if (o.sigma > 0) add('polygon', { points: [...top, ...bottom].join(' '), style: 'fill:var(--accent);opacity:0.18' });
    const line = (fn, color, dash, width = 3) =>
      add('polyline', { points: pts.map((t) => `${x(t).toFixed(1)},${y(fn(t)).toFixed(1)}`).join(' '), fill: 'none', style: `stroke:var(${color});stroke-width:${width};${dash ? `stroke-dasharray:${dash}` : ''}`, 'stroke-linejoin': 'round' });
    line(() => state.amount, '--muted', '2 4', 1.5);
    line((t) => state.amount * (1 + CASH.mean / 100) ** t, '--warn', '6 4');
    line((t) => o.path(t).middle, '--accent', '');

    svg.setAttribute('aria-label', `Range of outcomes for ${money(state.amount, 0)} over ${state.years} years. Middle ${money(o.middle, 0)}, bad case ${money(o.bad, 0)}, good case ${money(o.good, 0)}. All cash would grow to ${money(o.cashOnly, 0)}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}

function lossText(p) {
  if (p <= 0) return '0%';
  if (p < 0.001) return 'Under 0.1%';
  return `${num(p * 100, 1)}%`;
}
