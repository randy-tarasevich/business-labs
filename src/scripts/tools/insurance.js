// Insurance Deductible Lab
// Two car insurance plans: a monthly premium and a deductible for each.
// A year's cost = 12 × premium + what you pay on each claim. On a claim, you pay the repair cost up to
// the deductible and insurance pays the rest. Claims are all the same size here.
// Break-even: the low-deductible plan costs (premium difference × 12) more a year and saves up to
// (deductible difference) per claim, so it pays off only if you file more claims than that ratio.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PLANS = { aDed: 250, aPrem: 230, bDed: 1000, bPrem: 195 };
const PRESETS = [
  { name: 'Quiet year', ...PLANS, cost: 3000, claims: 0, savings: 500 },
  { name: 'One fender bender', ...PLANS, cost: 1500, claims: 1, savings: 500 },
  { name: 'Rough year', ...PLANS, cost: 4000, claims: 2, savings: 500 },
];
const KEYS = ['aDed', 'aPrem', 'bDed', 'bPrem', 'cost', 'claims', 'savings'];
const IDS = { aDed: 'in-a-ded', aPrem: 'in-a-prem', bDed: 'in-b-ded', bPrem: 'in-b-prem', cost: 'in-cost', claims: 'in-claims', savings: 'in-savings' };
export const MAX_CLAIMS = 3;

/** One plan's cost for a year with `claims` claims of `cost` each. */
export function yearCost(premium, deductible, claims, cost) {
  const outOfPocket = claims * Math.min(cost, deductible);
  return { premiums: premium * 12, outOfPocket, total: premium * 12 + outOfPocket };
}

/** Claims per year at which the two plans cost the same, for claims of `cost` each. Infinity if never. */
export function breakEven(s) {
  const extraPremium = (s.aPrem - s.bPrem) * 12; // what the low-deductible plan A costs more each year
  const savedPerClaim = Math.min(s.cost, s.bDed) - Math.min(s.cost, s.aDed); // what A saves on each claim
  if (savedPerClaim <= 0) return extraPremium <= 0 ? 0 : Infinity;
  return Math.max(0, extraPremium / savedPerClaim);
}

export function compare(s) {
  const a = yearCost(s.aPrem, s.aDed, s.claims, s.cost);
  const b = yearCost(s.bPrem, s.bDed, s.claims, s.cost);
  return { a, b, diff: Math.abs(a.total - b.total), cheaper: a.total < b.total ? 'A' : b.total < a.total ? 'B' : 'tie', breakEven: breakEven(s) };
}

export function initInsurance(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, IDS[k], {
      get: () => state[k],
      set: (v) => {
        state[k] = k === 'claims' ? Math.max(0, Math.min(MAX_CLAIMS, Math.round(v))) : v;
        setActive(-1);
        render();
      },
      max: k === 'claims' ? MAX_CLAIMS : undefined,
      fit: k === 'cost' || k === 'savings',
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  function render() {
    const c = compare(state);
    r('a-total').textContent = money(c.a.total, 0);
    r('b-total').textContent = money(c.b.total, 0);
    r('diff').textContent = c.cheaper === 'tie' ? 'Same cost' : `Plan ${c.cheaper} by ${money(c.diff, 0)}`;
    r('even').textContent = !Number.isFinite(c.breakEven) ? 'Never' : c.breakEven === 0 ? 'Always' : `${num(c.breakEven, 2)} claims a year`;
    setTone(r('a-box'), c.cheaper === 'A' ? 'good' : '');
    setTone(r('b-box'), c.cheaper === 'B' ? 'good' : '');

    const claimsTxt = state.claims === 0 ? 'no claims' : `${state.claims} claim${state.claims === 1 ? '' : 's'} of ${money(state.cost, 0)}`;
    const v = r('verdict');
    const shortA = state.claims > 0 && Math.min(state.cost, state.aDed) > state.savings;
    const shortB = state.claims > 0 && Math.min(state.cost, state.bDed) > state.savings;
    if (c.cheaper === 'tie') {
      setTone(v, 'info');
      v.textContent = `With ${claimsTxt}, both plans cost ${money(c.a.total, 0)} this year.`;
    } else {
      const winner = c.cheaper === 'A' ? 'A (low deductible)' : 'B (high deductible)';
      const short = c.cheaper === 'A' ? shortA : shortB;
      setTone(v, short ? 'warn' : 'good');
      v.textContent = `With ${claimsTxt}, Plan ${winner} saves ${money(c.diff, 0)} this year.` +
        (short ? ` But each claim means paying ${money(Math.min(state.cost, c.cheaper === 'A' ? state.aDed : state.bDed), 0)} on the spot, more than your ${money(state.savings, 0)} in savings.` : '');
    }
    const warn = r('savings-note');
    if (state.bDed > state.savings) {
      setTone(warn, 'warn');
      warn.textContent = `Plan B's ${money(state.bDed, 0)} deductible is more than your ${money(state.savings, 0)} in savings. One accident could mean borrowing or putting it on a credit card.`;
    } else {
      setTone(warn, 'good');
      warn.textContent = `Your ${money(state.savings, 0)} in savings could cover Plan B's ${money(state.bDed, 0)} deductible.`;
    }

    const extra = (state.aPrem - state.bPrem) * 12;
    const saved = Math.min(state.cost, state.bDed) - Math.min(state.cost, state.aDed);
    r('formula').innerHTML =
      `Plan A: ${money(state.aPrem, 0)} × 12 + ${state.claims} × ${money(Math.min(state.cost, state.aDed), 0)} = ${money(c.a.total, 0)}` +
      `<span>Plan B: ${money(state.bPrem, 0)} × 12 + ${state.claims} × ${money(Math.min(state.cost, state.bDed), 0)} = ${money(c.b.total, 0)}</span>` +
      `<span>Plan A costs ${money(extra, 0)} more a year in premiums and saves ${money(saved, 0)} on each claim</span>` +
      `<span>Break-even = ${money(extra, 0)} ÷ ${money(saved, 0)} = ${Number.isFinite(c.breakEven) ? num(c.breakEven, 2) : 'never'} claims a year</span>`;

    draw();
  }

  function draw() {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 240 : 280;
    const L = narrow ? 56 : 66, R = 12, T = 22, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const rows = Array.from({ length: MAX_CLAIMS + 1 }, (_, n) => ({
      n,
      a: yearCost(state.aPrem, state.aDed, n, state.cost).total,
      b: yearCost(state.bPrem, state.bDed, n, state.cost).total,
    }));
    const maxY = niceMax(Math.max(...rows.flatMap((x) => [x.a, x.b]), 100));
    const y = (v) => T + (1 - v / maxY) * (H - T - B);
    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxY / n) * i;
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }
    const slot = (W - L - R) / rows.length;
    const bw = Math.min(40, slot * 0.34);
    rows.forEach((row) => {
      const cx = L + slot * (row.n + 0.5);
      const on = row.n === state.claims;
      for (const [val, dx, color] of [[row.a, -bw / 2 - 2, '--accent'], [row.b, bw / 2 + 2, '--warn']]) {
        add('rect', { x: cx + dx - bw / 2, y: y(val), width: bw, height: Math.max(0, y(0) - y(val)), style: `fill:var(${color});opacity:${on ? 1 : 0.45}` });
      }
      add('text', { x: cx, y: H - B + 18, 'text-anchor': 'middle', style: on ? 'fill:var(--ink);font-weight:600' : '' }, `${row.n} claim${row.n === 1 ? '' : 's'}`);
    });
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, `Claims of ${money(state.cost, 0)} in a year`);
    svg.setAttribute('aria-label', `Yearly cost by number of claims of ${money(state.cost, 0)}. ` + rows.map((x) => `${x.n} claims: Plan A ${money(x.a, 0)}, Plan B ${money(x.b, 0)}`).join('. ') + '.');
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
