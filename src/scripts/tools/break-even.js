// Break-Even Lab
// Break-even units = Fixed costs / (Price - Variable cost per unit)

import { money, niceMax, svgEl, cssVar, onThemeChange, setTone, wireReveals, setBox, tidyOnBlur } from '../lib/util.js';

const PRESETS = [
  { name: 'Lemonade stand', price: 2, vc: 0.5, fc: 150, q: 140 },
  { name: 'T-shirt shop', price: 20, vc: 8, fc: 1200, q: 120 },
  { name: 'Food truck', price: 12, vc: 5, fc: 6000, q: 950 },
  { name: 'Phone case startup', price: 25, vc: 9, fc: 4000, q: 200 },
];
const FIELDS = ['price', 'vc', 'fc', 'q'];

export function initBreakEven(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let state = { ...PRESETS[0] };
  let activePreset = 0;

  const presetWrap = $('[data-presets]');
  PRESETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      activePreset = i;
      state = { ...p };
      syncInputs();
      render();
    });
    presetWrap.appendChild(b);
  });

  FIELDS.forEach((f) => {
    const range = $(`#be-${f}`);
    const num = $(`#be-${f}-n`);
    tidyOnBlur(num);
    range.addEventListener('input', () => {
      state[f] = parseFloat(range.value) || 0;
      activePreset = -1;
      syncInputs(f);
      render();
    });
    num.addEventListener('input', () => {
      const v = parseFloat(num.value);
      if (Number.isNaN(v) || v < 0) return;
      state[f] = v;
      activePreset = -1;
      if (v > parseFloat(range.max)) range.max = Math.ceil(v * 1.5);
      range.value = v;
      syncPresetButtons();
      render();
    });
  });

  function syncPresetButtons() {
    [...presetWrap.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === activePreset)));
  }

  function syncInputs(skip) {
    FIELDS.forEach((f) => {
      const range = $(`#be-${f}`);
      if (state[f] > parseFloat(range.max)) range.max = Math.ceil(state[f] * 1.5);
      if (f !== skip) range.value = state[f];
      setBox($(`#be-${f}-n`), state[f]);
    });
    syncPresetButtons();
  }

  function render() {
    const { price: P, vc: V, fc: F, q: Q } = state;
    const cm = P - V;
    const be = cm > 0 ? F / cm : Infinity;
    const beUnits = Math.ceil(be);
    const profit = P * Q - (F + V * Q);
    const n = (x) => x.toLocaleString('en-US');

    r('units').textContent = Number.isFinite(be) ? n(beUnits) : 'Never';
    r('dollars').textContent = Number.isFinite(be) ? money(beUnits * P, 0) : '–';
    r('cm').textContent = money(cm, 2);
    r('profit-k').textContent = `${profit >= 0 ? 'Profit' : 'Loss'} at ${n(Q)} units`;
    r('profit').textContent = money(profit, 0);
    setTone(r('profit-box'), profit >= 0 ? 'good' : 'bad');

    const verdict = r('verdict');
    if (!Number.isFinite(be)) {
      setTone(verdict, 'bad');
      verdict.textContent = 'Each sale costs as much as (or more than) you charge for it, so you can never break even. Raise the price or cut the variable cost.';
    } else if (Q >= beUnits) {
      setTone(verdict, 'good');
      verdict.textContent = `At ${n(Q)} units you're past break-even by ${n(Q - beUnits)} units, for a profit of ${money(profit, 0)}.`;
    } else {
      setTone(verdict, 'bad');
      verdict.textContent = `At ${n(Q)} units you're still ${n(beUnits - Q)} units short of break-even, for a loss of ${money(-profit, 0)}.`;
    }

    const head = 'Break-even units = Fixed costs ÷ (Price − Variable cost)';
    r('formula').innerHTML = Number.isFinite(be)
      ? `${head}<span>= ${money(F, 0)} ÷ (${money(P, 2)} − ${money(V, 2)}) = ${money(F, 0)} ÷ ${money(cm, 2)} = ${n(Math.round(be * 100) / 100)} → round up to ${n(beUnits)}</span>`
      : `${head}<span>= ${money(F, 0)} ÷ ${money(cm, 2)} → no break-even (margin is zero or negative)</span>`;

    drawChart({ P, V, F, Q, be });
  }

  function drawChart({ P, V, F, Q, be }) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = 640, H = 360, L = 64, R = 18, T = 16, B = 40;
    const xMax = niceMax(Math.max(Number.isFinite(be) ? be * 1.8 : 0, Q * 1.15, 10));
    const yMax = niceMax(Math.max(P * xMax, F + V * xMax, 10));
    const x = (u) => L + (u / xMax) * (W - L - R);
    const y = (d) => H - B - (d / yMax) * (H - T - B);
    const add = (tag, attrs, text) => svg.appendChild(svgEl(tag, attrs, text));

    for (let i = 0; i <= 5; i++) {
      const yv = (yMax * i) / 5;
      add('line', { x1: L, x2: W - R, y1: y(yv), y2: y(yv), stroke: cssVar('--grid'), 'stroke-width': 1 });
      add('text', { x: L - 8, y: y(yv) + 4, 'text-anchor': 'end' }, money(yv, 0));
      const xv = (xMax * i) / 5;
      add('text', { x: x(xv), y: H - B + 18, 'text-anchor': 'middle' }, Math.round(xv).toLocaleString('en-US'));
    }
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, 'Units sold');

    if (Number.isFinite(be)) {
      const poly = (top, bottom) => [...top, ...bottom.reverse()].map((p) => p.join(',')).join(' ');
      add('polygon', { points: poly([[x(0), y(0)], [x(be), y(P * be)]], [[x(0), y(F)], [x(be), y(F + V * be)]]), fill: cssVar('--bad-soft') });
      add('polygon', { points: poly([[x(be), y(P * be)], [x(xMax), y(P * xMax)]], [[x(be), y(F + V * be)], [x(xMax), y(F + V * xMax)]]), fill: cssVar('--good-soft') });
      add('text', { x: x(be * 0.35), y: y(F * 0.6 + P * be * 0.15), 'text-anchor': 'middle', style: `fill:${cssVar('--bad')};font-weight:500` }, 'LOSS');
      const px = Math.min(xMax * 0.9, be + (xMax - be) * 0.7);
      add('text', { x: x(px), y: y(((P + V) / 2) * px + F / 2) + 4, 'text-anchor': 'middle', style: `fill:${cssVar('--good')};font-weight:500` }, 'PROFIT');
    }

    add('line', { x1: x(0), x2: x(xMax), y1: y(F), y2: y(F), stroke: cssVar('--muted'), 'stroke-width': 1, 'stroke-dasharray': '2 4' });
    add('text', { x: W - R - 4, y: y(F) - 6, 'text-anchor': 'end' }, `Fixed costs ${money(F, 0)}`);
    add('line', { x1: x(0), y1: y(F), x2: x(xMax), y2: y(F + V * xMax), stroke: cssVar('--bad'), 'stroke-width': 2.5 });
    add('line', { x1: x(0), y1: y(0), x2: x(xMax), y2: y(P * xMax), stroke: cssVar('--good'), 'stroke-width': 2.5 });

    if (Q <= xMax) {
      add('line', { x1: x(Q), x2: x(Q), y1: T, y2: H - B, stroke: cssVar('--ink'), 'stroke-width': 1, 'stroke-dasharray': '5 4', opacity: 0.6 });
      add('text', { x: x(Q) + 5, y: T + 10 }, 'forecast');
    }

    if (Number.isFinite(be) && be <= xMax) {
      add('circle', { cx: x(be), cy: y(P * be), r: 6, fill: cssVar('--accent'), stroke: cssVar('--panel'), 'stroke-width': 2 });
      // Label goes above and to the left of the dot: both lines fall away to the left of break-even,
      // so that corner is always clear. If the dot is too close to the y-axis for the label to fit,
      // it goes below and to the right instead. The panel-colored halo keeps it readable if the
      // forecast or fixed-cost line passes behind it.
      const LABEL_W = 170;
      const left = x(be) - 10 - LABEL_W > L;
      add('text', {
        x: left ? x(be) - 10 : x(be) + 8,
        y: left ? Math.max(y(P * be) - 14, T + 12) : Math.min(y(P * be) + 22, H - B - 6),
        'text-anchor': left ? 'end' : 'start',
        stroke: cssVar('--panel'), 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke',
        style: `fill:${cssVar('--accent')};font-weight:600;font-size:12px`,
      }, `Break-even: ${Math.ceil(be).toLocaleString('en-US')} units`);
    }
  }

  wireReveals(root);
  onThemeChange(render);
  syncInputs();
  render();
}
