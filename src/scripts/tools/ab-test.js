// A/B Post Test
// Click rate = Clicks ÷ People who saw it.
// Gap = B's click rate − A's click rate.
// "Could it be luck?": pretend A and B are really the same post (both get the combined click rate),
// run 1,000 fake tests with the same number of viewers, and count how many show a gap at least as big
// as the real one. Seeded, so the same inputs always give the same answer.

import { num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Bake sale: small test', nA: 200, cA: 6, nB: 200, cB: 10 },
  { name: 'Photo vs. text', nA: 1000, cA: 20, nB: 1000, cB: 45 },
  { name: 'Tiny gap, huge test', nA: 20000, cA: 600, nB: 20000, cB: 700 },
];
const KEYS = ['nA', 'cA', 'nB', 'cB'];
export const SIMS = 1000;
const DOTS = 200;

/** Small seeded random number generator (mulberry32), so results don't jump around on every render. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random count of clicks from n viewers who each click with chance p. */
function draw(n, p, rand) {
  if (n <= 5000) {
    let c = 0;
    for (let i = 0; i < n; i++) if (rand() < p) c++;
    return c;
  }
  // Large tests: normal approximation to the binomial.
  const z = Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());
  return Math.max(0, Math.round(n * p + z * Math.sqrt(n * p * (1 - p))));
}

/** Everything about one test. */
export function abTest(s) {
  const rA = s.nA > 0 ? s.cA / s.nA : 0;
  const rB = s.nB > 0 ? s.cB / s.nB : 0;
  const gap = rB - rA;
  const pooled = s.nA + s.nB > 0 ? (s.cA + s.cB) / (s.nA + s.nB) : 0;
  const rand = rng(s.nA * 31 + s.cA * 7 + s.nB * 13 + s.cB * 17 + 1);
  const gaps = [];
  let asBig = 0;
  for (let i = 0; i < SIMS; i++) {
    const g = (s.nB ? draw(s.nB, pooled, rand) / s.nB : 0) - (s.nA ? draw(s.nA, pooled, rand) / s.nA : 0);
    if (i < DOTS) gaps.push(g);
    if (Math.abs(g) >= Math.abs(gap) - 1e-12) asBig++;
  }
  return { rA, rB, gap, pooled, gaps, luck: asBig / SIMS };
}

const pct = (x, d = 1) => `${num(x * 100, d)}%`;

export function initAbTest(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, `ab-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = Math.round(v);
        setActive(-1);
        render();
      },
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  function render() {
    // Clicks can't be more than viewers.
    state.cA = Math.min(state.cA, state.nA);
    state.cB = Math.min(state.cB, state.nB);
    const t = abTest(state);
    const winner = t.gap > 0 ? 'B' : t.gap < 0 ? 'A' : null;

    r('rA').textContent = pct(t.rA);
    r('rB').textContent = pct(t.rB);
    r('gap').textContent = `${t.gap >= 0 ? '+' : '−'}${num(Math.abs(t.gap) * 100, 1)} pts`;
    const per100 = Math.round(t.luck * 100);
    r('luck').textContent = per100 < 1 ? 'Under 1 in 100' : `${per100} in 100`;
    setTone(r('luck-box'), t.luck < 0.05 ? 'good' : t.luck < 0.2 ? 'warn' : 'bad');

    const v = r('verdict');
    if (!state.nA || !state.nB) {
      setTone(v, 'warn');
      v.textContent = 'Show each version to some people to run the test.';
    } else if (!winner) {
      setTone(v, 'info');
      v.textContent = 'A tie. Both versions got the same click rate.';
    } else if (t.luck < 0.05) {
      setTone(v, 'good');
      v.textContent = `Version ${winner} is very likely better. If the two posts were really the same, a gap this big would show up ${per100 < 1 ? 'less than once' : per100 === 1 ? 'only once' : `only ${per100} times`} in 100 tests.`;
    } else if (t.luck < 0.2) {
      setTone(v, 'warn');
      v.textContent = `Version ${winner} might be better, but luck could explain it about ${per100} times in 100. Show both versions to more people before you decide.`;
    } else {
      setTone(v, 'bad');
      v.textContent = `Too close to call. Even if the posts were exactly the same, a gap this big would show up ${per100} times in 100 tests, just by luck.`;
    }

    r('formula').innerHTML =
      `A's click rate = ${num(state.cA)} ÷ ${num(state.nA)} = ${pct(t.rA, 2)}` +
      `<span>B's click rate = ${num(state.cB)} ÷ ${num(state.nB)} = ${pct(t.rB, 2)}</span>` +
      `<span>Gap = ${pct(t.rB, 2)} − ${pct(t.rA, 2)} = ${num(t.gap * 100, 2)} points</span>` +
      `<span>If they were the same post: ${num(state.cA + state.cB)} ÷ ${num(state.nA + state.nB)} = ${pct(t.pooled, 2)} click rate for both</span>` +
      `<span>Fake tests with a gap at least that big: ${Math.round(t.luck * SIMS)} of ${num(SIMS)}</span>`;

    drawChart(t);
  }

  function drawChart(t) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const L = 16, R = 16, T = 26, rowH = 9;
    const add = (tag, a, x) => svg.appendChild(svgEl(tag, a, x));
    const span = Math.max(Math.abs(t.gap) * 1.4, ...t.gaps.map(Math.abs), 0.001);
    const x = (g) => L + ((g + span) / (2 * span)) * (W - L - R);

    // Stack the dots into columns so it reads like a dot plot.
    const cols = narrow ? 34 : 50;
    const bin = (2 * span) / cols;
    const heights = new Array(cols + 1).fill(0);
    const placed = t.gaps.map((g) => {
      const b = Math.min(cols, Math.max(0, Math.round((g + span) / bin)));
      return { g, b, h: heights[b]++ };
    });
    const maxH = Math.max(...heights, 1);
    const H = T + maxH * rowH + 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const base = T + maxH * rowH;

    placed.forEach(({ g, b, h }) => {
      const big = Math.abs(g) >= Math.abs(t.gap) - 1e-12;
      add('circle', { cx: L + b * bin * ((W - L - R) / (2 * span)), cy: base - h * rowH - rowH / 2, r: 3.6, style: `fill:var(${big ? '--bad' : '--muted'});opacity:${big ? 1 : 0.55}` });
    });
    add('line', { x1: L, x2: W - R, y1: base + 1, y2: base + 1, style: 'stroke:var(--line)' });

    const mark = (g, label) => {
      add('line', { x1: x(g), x2: x(g), y1: T - 8, y2: base + 1, style: 'stroke:var(--accent);stroke-width:2.5' });
      const right = x(g) > W * 0.7, left = x(g) < W * 0.3;
      add('text', { x: x(g), y: T - 12, 'text-anchor': right ? 'end' : left ? 'start' : 'middle', style: 'fill:var(--accent);font-weight:600;font-size:12.5px' }, label);
    };
    if (t.gap !== 0) {
      mark(t.gap, `Your gap: ${t.gap > 0 ? '+' : '−'}${num(Math.abs(t.gap) * 100, 1)} pts`);
      add('line', { x1: x(-t.gap), x2: x(-t.gap), y1: T, y2: base + 1, style: 'stroke:var(--accent);stroke-width:1.5;stroke-dasharray:4 3;opacity:0.7' });
    }
    add('text', { x: x(0), y: base + 18, 'text-anchor': 'middle' }, '0');
    add('text', { x: L, y: base + 18, 'text-anchor': 'start' }, `A ahead`);
    add('text', { x: W - R, y: base + 18, 'text-anchor': 'end' }, `B ahead`);
    add('text', { x: W / 2, y: base + 34, 'text-anchor': 'middle', style: 'font-family:var(--font-sans)' }, `Gaps in ${DOTS} fake tests where A and B are the same post`);
    svg.setAttribute('aria-label', `Out of ${num(SIMS)} fake tests where both posts are the same, ${Math.round(t.luck * SIMS)} had a gap at least as big as yours.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
