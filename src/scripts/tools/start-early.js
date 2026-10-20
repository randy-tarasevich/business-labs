// Start Early Lab (compound interest)
// Each month: balance grows by (yearly return ÷ 12), then that month's deposit goes in.
// Each saver deposits from their start age up to (not including) their stop age.
// Everything is measured at age 65.

import { money, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

export const END_AGE = 65;
const START_AGE = 14;

const PRESETS = [
  { name: 'Start at 16 vs. 26', monthly: 50, rate: 7, aStart: 16, aStop: 65, bStart: 26, bStop: 65 },
  { name: 'Save 10 years, then stop', monthly: 100, rate: 7, aStart: 18, aStop: 28, bStart: 28, bStop: 65 },
  { name: 'Savings account vs. index fund', monthly: 100, rate: 7, aStart: 22, aStop: 65, bStart: 22, bStop: 65, bRate: 0.5 },
];
const KEYS = ['monthly', 'rate', 'aStart', 'aStop', 'bStart', 'bStop', 'bRate'];

/** Balance at each birthday from START_AGE to 65 for one saver. */
export function grow(monthly, rate, start, stop) {
  const r = rate / 100 / 12;
  let bal = 0;
  let put = 0;
  const byAge = [];
  for (let age = START_AGE; age < END_AGE; age++) {
    byAge.push(bal);
    for (let m = 0; m < 12; m++) {
      bal *= 1 + r;
      if (age >= start && age < stop) {
        bal += monthly;
        put += monthly;
      }
    }
  }
  byAge.push(bal);
  return { byAge, final: bal, put, growth: bal - put };
}

export function initStartEarly(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const fresh = (p) => ({ bRate: p.rate, ...p });
  const state = fresh(PRESETS[0]);

  const syncs = KEYS.map((k) =>
    linkRange(root, `se-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = k.endsWith('Start') || k.endsWith('Stop') ? Math.round(v) : v;
        setActive(-1);
        render();
      },
      fit: !(k.endsWith('Start') || k.endsWith('Stop')),
      max: k === 'rate' || k === 'bRate' ? 30 : undefined,
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, fresh(p));
    syncs.forEach((s) => s());
    render();
  });

  function clampAges() {
    for (const who of ['a', 'b']) {
      state[`${who}Start`] = Math.min(Math.max(state[`${who}Start`], START_AGE), END_AGE);
      state[`${who}Stop`] = Math.min(Math.max(state[`${who}Stop`], state[`${who}Start`]), END_AGE);
    }
  }

  function render() {
    clampAges();
    const A = grow(state.monthly, state.rate, state.aStart, state.aStop);
    const B = grow(state.monthly, state.bRate, state.bStart, state.bStop);

    r('a-final').textContent = money(A.final, 0);
    r('b-final').textContent = money(B.final, 0);
    r('a-put').textContent = money(A.put, 0);
    r('b-put').textContent = money(B.put, 0);
    r('a-growth').textContent = money(A.growth, 0);
    r('b-growth').textContent = money(B.growth, 0);
    setTone(r('a-box'), A.final >= B.final ? 'good' : '');
    setTone(r('b-box'), B.final > A.final ? 'good' : '');

    const yrs = (s, e) => Math.max(e - s, 0);
    const v = r('verdict');
    if (!A.put && !B.put) {
      setTone(v, 'warn');
      v.textContent = 'Set a monthly deposit and the ages each saver starts and stops.';
    } else {
      const win = A.final >= B.final ? 'A' : 'B';
      const W = win === 'A' ? A : B, Lo = win === 'A' ? B : A;
      const lessPut = W.put < Lo.put;
      setTone(v, 'good');
      v.textContent = `Saver ${win} ends up with ${money(W.final - Lo.final, 0)} more at 65` +
        (lessPut ? `, even though they put in ${money(Lo.put - W.put, 0)} less. Their money had more years to grow.` : '.') +
        ` Of Saver ${win}'s ${money(W.final, 0)}, ${Math.round((W.growth / Math.max(W.final, 1)) * 100)}% is growth, not deposits.`;
    }

    r('formula').innerHTML =
      `Saver A: ${money(state.monthly, 0)} × 12 × ${yrs(state.aStart, state.aStop)} years = ${money(A.put, 0)} put in` +
      `<span>Saver A at 65: ${money(A.final, 0)}, so growth = ${money(A.final, 0)} − ${money(A.put, 0)} = ${money(A.growth, 0)}</span>` +
      `<span>Saver B: ${money(state.monthly, 0)} × 12 × ${yrs(state.bStart, state.bStop)} years = ${money(B.put, 0)} put in</span>` +
      `<span>Saver B at 65: ${money(B.final, 0)}, so growth = ${money(B.final, 0)} − ${money(B.put, 0)} = ${money(B.growth, 0)}</span>`;

    draw(A, B);
  }

  function draw(A, B) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 240 : 280;
    const L = narrow ? 62 : 74, R = 12, T = 14, B_ = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxY = niceMax(Math.max(A.final, B.final, 1));
    const x = (age) => L + ((age - START_AGE) / (END_AGE - START_AGE)) * (W - L - R);
    const y = (v) => T + (1 - v / maxY) * (H - T - B_);

    // 4 gridlines when the top starts with 2 ($2,000), otherwise 5 ($250,000, $5,000), so labels stay round.
    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxY / 4) * i;
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }
    for (let age = 15; age <= END_AGE; age += narrow ? 10 : 5) {
      add('text', { x: x(age), y: H - B_ + 18, 'text-anchor': 'middle' }, String(age));
    }
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, 'Age');

    const line = (s, color, dash) => {
      const pts = s.byAge.map((b, i) => `${x(START_AGE + i).toFixed(1)},${y(b).toFixed(1)}`).join(' ');
      add('polyline', { points: pts, fill: 'none', style: `stroke:var(${color});stroke-width:3;${dash ? 'stroke-dasharray:6 4' : ''}`, 'stroke-linejoin': 'round' });
    };
    line(A, '--accent', false);
    line(B, '--warn', true);
    svg.setAttribute('aria-label', `Savings by age. Saver A has ${money(A.final, 0)} at 65. Saver B has ${money(B.final, 0)} at 65.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
