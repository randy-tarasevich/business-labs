// Depreciation Comparer
// Straight-line:        (Cost − Salvage) ÷ Life, every year
// Double-declining:     Book value × (2 ÷ Life), never below salvage; last year brings book value to salvage
// Sum-of-years-digits:  (Cost − Salvage) × Years left ÷ (1 + 2 + … + Life)

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Food truck', cost: 60000, salvage: 6000, life: 8 },
  { name: 'Delivery van', cost: 35000, salvage: 5000, life: 5 },
  { name: 'Pizza oven', cost: 12000, salvage: 1000, life: 10 },
  { name: 'Laptop', cost: 1500, salvage: 100, life: 3 },
];
const METHODS = [
  { key: 'sl', label: 'Straight-line', color: 'var(--accent)' },
  { key: 'ddb', label: 'Double-declining balance', short: 'Double-declining', color: 'var(--warn)' },
  { key: 'syd', label: 'Sum-of-the-years-digits', short: 'Sum-of-years', color: 'var(--good)' },
];
const round2 = (n) => Math.round(n * 100) / 100;

/** Year-by-year schedule: [{ year, start, dep, accum, end }] */
export function schedule(method, cost, salvage, life) {
  const rows = [];
  const base = Math.max(cost - salvage, 0);
  const syd = (life * (life + 1)) / 2;
  let bv = cost;
  let accum = 0;
  for (let y = 1; y <= life; y++) {
    let dep;
    if (method === 'sl') dep = base / life;
    else if (method === 'syd') dep = (base * (life - y + 1)) / syd;
    else dep = y === life ? bv - salvage : Math.min(bv * (2 / life), bv - salvage);
    dep = round2(Math.max(dep, 0));
    if (y === life) dep = round2(bv - salvage); // absorb rounding so book value lands on salvage
    accum = round2(accum + dep);
    rows.push({ year: y, start: bv, dep, accum, end: round2(bv - dep) });
    bv = round2(bv - dep);
  }
  return rows;
}

export function initDepreciation(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };
  let tab = 'sl';

  const edit = (k) => (v) => {
    state[k] = k === 'life' ? Math.max(1, Math.round(v)) : v;
    setActive(-1);
    render();
  };
  const syncs = [
    linkRange(root, 'dp-cost', { get: () => state.cost, set: edit('cost') }),
    linkRange(root, 'dp-salvage', { get: () => state.salvage, set: edit('salvage') }),
    linkRange(root, 'dp-life', { get: () => state.life, set: edit('life'), max: 40 }),
  ];
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  const tabs = $('[data-tabs]');
  METHODS.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.m = m.key;
    b.innerHTML = `<i style="background:${m.color}"></i>${m.short || m.label}`;
    b.addEventListener('click', () => {
      tab = m.key;
      render();
    });
    tabs.appendChild(b);
  });

  function render() {
    const { cost, life } = state;
    const salvage = Math.min(state.salvage, cost);
    const all = Object.fromEntries(METHODS.map((m) => [m.key, schedule(m.key, cost, salvage, life)]));
    const base = cost - salvage;

    METHODS.forEach((m) => {
      r(`y1-${m.key}`).textContent = money(all[m.key][0]?.dep ?? 0, 0);
    });
    r('total').textContent = money(base, 0);

    [...tabs.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === tab)));
    const m = METHODS.find((x) => x.key === tab);
    r('sched-h').textContent = `${m.label} schedule`;
    r('sched').innerHTML = all[tab]
      .map((row) => `<tr><th scope="row">${row.year}</th><td>${money(row.start, 2)}</td><td>${money(row.dep, 2)}</td><td>${money(row.accum, 2)}</td><td>${money(row.end, 2)}</td></tr>`)
      .join('');

    const v = r('verdict');
    if (state.salvage > cost) {
      setTone(v, 'warn');
      v.textContent = 'Salvage value can\'t be more than the cost. The tool is treating salvage as equal to cost.';
    } else if (base <= 0) {
      setTone(v, 'warn');
      v.textContent = 'Cost equals salvage value, so there is nothing to depreciate.';
    } else {
      const sl1 = all.sl[0].dep;
      const ddb1 = all.ddb[0].dep;
      setTone(v, 'info');
      v.textContent = `Every method writes off the same ${money(base, 0)} in total. The difference is timing: double-declining takes ${Math.round((ddb1 / base) * 100)}% of it in year 1, straight-line only ${Math.round((sl1 / base) * 100)}%.`;
    }

    const rate = (2 / life) * 100;
    const syd = (life * (life + 1)) / 2;
    r('formula').innerHTML =
      `Depreciable amount = ${money(cost, 0)} − ${money(salvage, 0)} = ${money(base, 0)}` +
      `<span>Straight-line: ${money(base, 0)} ÷ ${life} = ${money(base / life, 2)} per year</span>` +
      `<span>Double-declining: rate = 2 ÷ ${life} = ${num(rate, rate % 1 ? 1 : 0)}%, year 1 = ${money(cost, 0)} × ${num(rate, rate % 1 ? 1 : 0)}% = ${money(all.ddb[0]?.dep ?? 0, 2)}</span>` +
      `<span>Sum-of-years: 1 + … + ${life} = ${num(syd)}, year 1 = ${money(base, 0)} × ${life}/${num(syd)} = ${money(all.syd[0]?.dep ?? 0, 2)}</span>`;

    drawCharts(all, cost, salvage, life);
  }

  function drawCharts(all, cost, salvage, life) {
    const W = fitWidth($('[data-chart-box]'), 300, 760);
    const narrow = W < 520;
    // Chart 1: depreciation expense each year (grouped bars)
    const bars = $('[data-bars]');
    bars.replaceChildren();
    const H1 = narrow ? 200 : 220, L = narrow ? 52 : 66, R = 8, T = 10, B = 30;
    bars.setAttribute('viewBox', `0 0 ${W} ${H1}`);
    const add1 = (t, a, x) => bars.appendChild(svgEl(t, a, x));
    const topDep = Math.max(...METHODS.flatMap((m) => all[m.key].map((x) => x.dep)), 1);
    const stepDep = niceMax(topDep / 4);
    const maxDep = Math.ceil(topDep / stepDep) * stepDep;
    const y1 = (d) => H1 - B - (d / maxDep) * (H1 - T - B);
    for (let v = 0; v <= maxDep + 0.01; v += stepDep) {
      add1('line', { x1: L, x2: W - R, y1: y1(v), y2: y1(v), style: 'stroke:var(--grid)' });
      add1('text', { x: L - 6, y: y1(v) + 4, 'text-anchor': 'end' }, short(v));
    }
    const band = (W - L - R) / life;
    const bw = Math.min((band * 0.8) / 3, 22);
    for (let yr = 1; yr <= life; yr++) {
      const cx = L + band * (yr - 0.5);
      METHODS.forEach((m, k) => {
        const d = all[m.key][yr - 1].dep;
        add1('rect', { x: cx + (k - 1.5) * bw, y: y1(d), width: bw - 1, height: Math.max(H1 - B - y1(d), 0), rx: 2, style: `fill:${m.color}` });
      });
      if (life <= 12 || yr % 2 === 1) add1('text', { x: cx, y: H1 - B + 16, 'text-anchor': 'middle' }, String(yr));
    }
    bars.setAttribute('aria-label', `Depreciation expense by year. Year 1: ${METHODS.map((m) => `${m.label} ${money(all[m.key][0].dep, 0)}`).join(', ')}.`);

    // Chart 2: book value over time (lines)
    const lines = $('[data-lines]');
    lines.replaceChildren();
    const H2 = narrow ? 200 : 220;
    lines.setAttribute('viewBox', `0 0 ${W} ${H2}`);
    const add2 = (t, a, x) => lines.appendChild(svgEl(t, a, x));
    const stepV = niceMax((cost || 1) / 4);
    const maxV = Math.ceil((cost || 1) / stepV) * stepV;
    const x2 = (yr) => L + ((W - L - R - 10) * yr) / life;
    const y2 = (d) => H2 - B - (d / maxV) * (H2 - T - B);
    for (let v = 0; v <= maxV + 0.01; v += stepV) {
      add2('line', { x1: L, x2: W - R, y1: y2(v), y2: y2(v), style: 'stroke:var(--grid)' });
      add2('text', { x: L - 6, y: y2(v) + 4, 'text-anchor': 'end' }, short(v));
    }
    for (let yr = 0; yr <= life; yr++) if (life <= 12 || yr % 2 === 0) add2('text', { x: x2(yr), y: H2 - B + 16, 'text-anchor': 'middle' }, String(yr));
    add2('line', { x1: L, x2: W - R, y1: y2(salvage), y2: y2(salvage), style: 'stroke:var(--muted)', 'stroke-dasharray': '3 4' });
    add2('text', { x: L + 6, y: y2(salvage) - 6 }, `Salvage value ${short(salvage)}`);
    METHODS.forEach((m) => {
      const pts = [[0, cost], ...all[m.key].map((x) => [x.year, x.end])];
      add2('polyline', { points: pts.map(([a, b]) => `${x2(a)},${y2(b)}`).join(' '), fill: 'none', style: `stroke:${m.color}`, 'stroke-width': m.key === tab ? 3.5 : 2, 'stroke-linejoin': 'round' });
      pts.forEach(([a, b]) => add2('circle', { cx: x2(a), cy: y2(b), r: m.key === tab ? 3.5 : 2.5, style: `fill:${m.color}` }));
    });
    lines.setAttribute('aria-label', `Book value falls from ${money(cost, 0)} to ${money(salvage, 0)} over ${life} years under every method.`);
  }

  const short = (v) => (v >= 1e6 ? `$${+(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${+(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : money(v, 0));

  onWidthChange($('[data-chart-box]'), () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
