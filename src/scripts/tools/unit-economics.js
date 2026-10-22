// Unit Economics Lab
// Customer acquisition cost (CAC) = Marketing spend ÷ New customers
// Profit per customer per month = Average order × Orders per month × Gross margin
// Lifetime value (LTV) = Profit per customer per month × Months a customer stays
// LTV:CAC = LTV ÷ CAC. Payback = CAC ÷ Profit per customer per month (in months).

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone, niceMax } from '../lib/util.js';

export const PRESETS = [
  { name: 'Food truck loyalty app', spend: 900, newc: 30, aov: 12, freq: 2, margin: 55, months: 6 },
  { name: 'Snack subscription box', spend: 4000, newc: 100, aov: 25, freq: 1, margin: 30, months: 4 },
  { name: 'Online tutoring', spend: 1500, newc: 10, aov: 40, freq: 4, margin: 70, months: 5 },
];
const KEYS = ['spend', 'newc', 'aov', 'freq', 'margin', 'months'];

/** A common rule of thumb: a customer should be worth at least 3 times what it cost to win them. */
export const HEALTHY = 3;

/** Every number the tool shows, for one set of inputs. */
export function unitEconomics(s) {
  const cac = s.newc > 0 ? s.spend / s.newc : NaN;
  const monthly = s.aov * s.freq * (s.margin / 100);
  const ltv = monthly * s.months;
  return {
    cac,
    monthly,
    ltv,
    ratio: cac > 0 ? ltv / cac : cac === 0 ? Infinity : NaN,
    payback: monthly > 0 ? cac / monthly : Infinity,
    perCustomer: ltv - cac,
  };
}

const months = (m) => `${num(m, m < 10 && m % 1 ? 1 : 0)} month${m === 1 ? '' : 's'}`;
const ratioText = (r) => (Number.isFinite(r) ? `${r.toFixed(2)} to 1` : r === Infinity ? 'No cost' : '–');

export function initUnitEconomics(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, `ue-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
      max: k === 'margin' ? 100 : undefined,
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  function render() {
    const u = unitEconomics(state);
    r('cac').textContent = Number.isFinite(u.cac) ? money(u.cac, 2) : '–';
    r('ltv').textContent = money(u.ltv, 2);
    r('ratio').textContent = ratioText(u.ratio);
    r('payback').textContent = !Number.isFinite(u.cac) ? '–' : u.payback === Infinity ? 'Never' : months(u.payback);
    const tone = !Number.isFinite(u.ratio) ? (u.ratio === Infinity ? 'good' : '') : u.ratio < 1 ? 'bad' : u.ratio < HEALTHY ? 'warn' : 'good';
    setTone(r('ratio-box'), tone);
    setTone(r('payback-box'), Number.isFinite(u.cac) && u.payback > state.months ? 'bad' : '');

    const v = r('verdict');
    setTone(v, tone || 'warn');
    if (!Number.isFinite(u.cac)) {
      v.textContent = 'Add some new customers to find what each one costs to win.';
    } else if (u.ratio === Infinity) {
      v.textContent = `These customers cost nothing to win, so every one of them adds ${money(u.ltv, 2)} of profit. Word of mouth is the cheapest marketing there is.`;
    } else if (u.ratio < 1) {
      v.textContent = `Each customer costs ${money(u.cac, 2)} to win but brings in only ${money(u.ltv, 2)} of profit before they leave. You lose ${money(-u.perCustomer, 2)} on every customer, so growing faster makes it worse.`;
    } else if (u.ratio < HEALTHY) {
      v.textContent = `Each customer pays back their ${money(u.cac, 2)} in ${months(u.payback)} and earns ${money(u.perCustomer, 2)} after that. Profitable, but thin: that leftover still has to cover rent, wages, and everything else.`;
    } else {
      v.textContent = `Each customer is worth ${u.ratio.toFixed(1)} times what they cost to win. They pay back ${money(u.cac, 2)} in ${months(u.payback)}, and every month after that is profit.`;
    }

    r('formula').innerHTML =
      `Cost to win a customer = ${money(state.spend, 0)} ÷ ${num(state.newc)} = ${Number.isFinite(u.cac) ? money(u.cac, 2) : '–'}` +
      `<span>Profit per customer each month = ${money(state.aov, 2)} × ${num(state.freq, state.freq % 1 ? 2 : 0)} × ${state.margin}% = ${money(u.monthly, 2)}</span>` +
      `<span>Lifetime value = ${money(u.monthly, 2)} × ${num(state.months)} months = ${money(u.ltv, 2)}</span>` +
      (Number.isFinite(u.ratio) ? `<span>LTV to CAC = ${money(u.ltv, 2)} ÷ ${money(u.cac, 2)} = ${u.ratio.toFixed(2)}</span>` : '') +
      (Number.isFinite(u.cac) && u.payback !== Infinity ? `<span>Payback = ${money(u.cac, 2)} ÷ ${money(u.monthly, 2)} = ${num(u.payback, 1)} months</span>` : '');

    draw(u);
  }

  // One customer's running total: starts at minus the cost to win them, climbs each month they stay,
  // then goes flat when they leave. Crossing zero is the payback point.
  function draw(u) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 260 : 300;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const cac = Number.isFinite(u.cac) ? u.cac : 0;
    const stay = state.months;
    const end = u.ltv - cac;
    const xMax = Math.max(6, Math.ceil(Math.max(stay, Number.isFinite(u.payback) && u.payback <= 36 ? u.payback : 0) * 1.25));
    // A customer who never turns a profit gets only a sliver of chart above zero.
    const bottom = cac > 0 ? niceMax(cac) : niceMax(Math.max(end, 1)) * 0.25;
    const top = end > 0 ? niceMax(Math.max(end, cac * 0.25)) : bottom * 0.12;
    const L = narrow ? 52 : 62, R = 14, T = 14, B = 34;
    const x = (m) => L + (m / xMax) * (W - L - R);
    const y = (d) => T + ((top - d) / (top + bottom)) * (H - T - B);

    for (const val of [-bottom, -bottom / 2, 0, ...(end > 0 ? [top / 2, top] : [])]) {
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), stroke: 'var(--grid)', 'stroke-width': val === 0 ? 0 : 1 });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }
    const ticks = xMax <= 12 ? 1 : xMax <= 24 ? 3 : 6;
    for (let m = 0; m <= xMax; m += ticks) add('text', { x: x(m), y: H - B + 16, 'text-anchor': 'middle' }, String(m));
    add('text', { x: (L + W - R) / 2, y: H - 3, 'text-anchor': 'middle' }, 'Months since the customer joined');

    // Profit area above zero, loss area below.
    const pts = [[0, -cac], [stay, end], [xMax, end]];
    const line = pts.map(([m, d]) => `${x(m)},${y(d)}`).join(' ');
    add('polygon', { points: `${x(0)},${y(0)} ${line} ${x(xMax)},${y(0)}`, style: 'fill:var(--good-soft)', 'clip-path': 'url(#ue-above)' });
    const defs = svgEl('defs');
    const above = svgEl('clipPath', { id: 'ue-above' });
    above.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: y(0) }));
    const below = svgEl('clipPath', { id: 'ue-below' });
    below.appendChild(svgEl('rect', { x: 0, y: y(0), width: W, height: H }));
    defs.append(above, below);
    svg.prepend(defs);
    add('polygon', { points: `${x(0)},${y(0)} ${line} ${x(xMax)},${y(0)}`, style: 'fill:var(--bad-soft)', 'clip-path': 'url(#ue-below)' });
    add('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), stroke: 'var(--ink)', 'stroke-width': 1.25 });
    add('polyline', { points: line, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });

    // Customer leaves
    add('line', { x1: x(stay), x2: x(stay), y1: T, y2: H - B, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.6 });
    // Bottom of the chart: the end-of-line label lives at the top right.
    const leftLabel = x(stay) > W - R - 110;
    add('text', { x: leftLabel ? x(stay) - 5 : x(stay) + 5, y: H - B - 6, 'text-anchor': leftLabel ? 'end' : 'start' }, 'customer leaves');

    const halo = { stroke: 'var(--panel)', 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' };
    if (cac > 0) {
      add('text', { x: x(0) + 6, y: y(-cac) + 16, ...halo, style: 'fill:var(--bad);font-weight:600' }, `−${money(cac, 0)} to win them`);
    }
    if (Number.isFinite(u.cac) && u.payback <= stay && cac > 0) {
      add('circle', { cx: x(u.payback), cy: y(0), r: 6, fill: 'var(--accent)', stroke: 'var(--panel)', 'stroke-width': 2 });
      // The line runs below zero to the left of payback and above it to the right,
      // so below-right (or, near the right edge, above-left) is always clear.
      const rightSide = x(u.payback) < W - R - 170;
      add('text', { x: rightSide ? x(u.payback) + 9 : x(u.payback) - 9, y: rightSide ? y(0) + 20 : y(0) - 10, 'text-anchor': rightSide ? 'start' : 'end', ...halo, style: 'fill:var(--accent);font-weight:600;font-size:12px' }, `Paid back: ${months(u.payback)}`);
    }
    const endLabel = `${end >= 0 ? '+' : '−'}${money(Math.abs(end), 0)} per customer`;
    add('text', { x: W - R - 4, y: y(end) + (end >= 0 ? -8 : 18), 'text-anchor': 'end', ...halo, style: `fill:var(${end >= 0 ? '--good' : '--bad'});font-weight:600` }, endLabel);

    svg.setAttribute('aria-label', !Number.isFinite(u.cac)
      ? 'Chart of one customer\'s profit over time. Add new customers to see it.'
      : `One customer's running profit. It starts at minus ${money(cac, 2)}, the cost to win them, and grows ${money(u.monthly, 2)} a month for ${months(stay)}. ` +
        (u.payback <= stay ? `It crosses zero after ${months(u.payback)}, ` : 'It never crosses zero before the customer leaves, ') +
        `and ends at ${end >= 0 ? 'a profit' : 'a loss'} of ${money(Math.abs(end), 2)}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
