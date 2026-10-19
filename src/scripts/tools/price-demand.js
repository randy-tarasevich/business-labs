// Price and Demand Lab
// Straight-line demand: Units = Units at the starting price − (Customers lost per $1) × (Price − Starting price)
// Revenue = Price × Units. Profit = Revenue − Variable cost × Units − Fixed costs.
// Price elasticity at a point = (Customers lost per $1 × Price) ÷ Units.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Concert tickets', unit: 'tickets', p0: 40, q0: 1500, b: 30, vc: 5, fc: 20000, price: 40 },
  { name: 'School hoodies', unit: 'hoodies', p0: 35, q0: 120, b: 4, vc: 18, fc: 200, price: 35 },
  { name: 'Food truck tacos', unit: 'tacos', p0: 4, q0: 600, b: 120, vc: 1.5, fc: 800, price: 4 },
  { name: 'Movie popcorn', unit: 'buckets', p0: 8, q0: 400, b: 15, vc: 1, fc: 0, price: 8 },
];

/** Everything about one price. */
export function atPrice(s, price) {
  const units = Math.max(0, s.q0 - s.b * (price - s.p0));
  const revenue = price * units;
  const profit = revenue - s.vc * units - s.fc;
  const elasticity = units > 0 ? (s.b * price) / units : Infinity;
  return { units, revenue, profit, elasticity };
}

/** Choke price (nobody buys), revenue-maximizing price, profit-maximizing price. */
export function keyPrices(s) {
  const choke = s.b > 0 ? s.p0 + s.q0 / s.b : Infinity;
  return { choke, revMax: choke / 2, profitMax: Math.min((choke + s.vc) / 2, choke) };
}

export function initPriceDemand(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const edit = (k) => (v) => {
    state[k] = v;
    if (k !== 'price') setActive(-1);
    render();
  };
  const syncs = ['price', 'p0', 'q0', 'b', 'vc', 'fc'].map((k) => linkRange(root, `pd-${k}`, { get: () => state[k], set: edit(k), fit: k !== 'price' })); // render() sizes the price slider to the demand curve
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncAll();
    render();
  });
  const syncAll = () => syncs.forEach((s) => s());
  $('[data-best]').addEventListener('change', () => render());

  function render() {
    const kp = keyPrices(state);
    const priceRange = $('#pd-price');
    const top = Number.isFinite(kp.choke) ? Math.ceil(kp.choke * 1.05 * 4) / 4 : state.p0 * 3;
    priceRange.max = Math.max(top, state.price, 1);
    priceRange.step = top > 40 ? 0.5 : 0.25;
    const at = atPrice(state, state.price);
    const u = state.unit;

    r('units').textContent = `${num(Math.round(at.units))}`;
    r('units-k').textContent = `${u[0].toUpperCase()}${u.slice(1)} sold`;
    r('rev').textContent = money(at.revenue, 0);
    r('profit').textContent = money(at.profit, 0);
    setTone(r('profit-box'), at.profit >= 0 ? 'good' : 'bad');
    const e = at.elasticity;
    r('elas').textContent = Number.isFinite(e) ? e.toFixed(2) : '–';
    r('elas-k').textContent = !Number.isFinite(e) ? 'Elasticity' : e > 1.05 ? 'Elasticity: elastic' : e < 0.95 ? 'Elasticity: inelastic' : 'Elasticity: unit';

    const v = r('verdict');
    if (at.units <= 0) {
      setTone(v, 'bad');
      v.textContent = `At ${money(state.price, 2)}, nobody buys. Every customer has decided it isn't worth it.`;
    } else if (e > 1.05) {
      setTone(v, 'info');
      v.textContent = `Elastic: customers are price-sensitive here. A 1% price increase loses about ${e.toFixed(1)}% of sales, so raising the price would lower revenue. Cutting it would raise revenue.`;
    } else if (e < 0.95) {
      setTone(v, 'info');
      v.textContent = `Inelastic: customers barely react here. A 1% price increase only loses about ${e.toFixed(2)}% of sales, so raising the price would raise revenue.`;
    } else {
      setTone(v, 'good');
      v.textContent = 'Unit elastic: you are right at the top of the revenue curve. Moving the price either way lowers revenue.';
    }

    const best = $('[data-best]').checked;
    r('best').hidden = !best;
    if (best) {
      const rv = atPrice(state, kp.revMax);
      const pf = atPrice(state, kp.profitMax);
      r('best').innerHTML = `<li><i style="background:var(--accent)"></i>Most revenue at ${money(kp.revMax, 2)}: ${money(rv.revenue, 0)}</li><li><i style="background:var(--good)"></i>Most profit at ${money(kp.profitMax, 2)}: ${money(pf.profit, 0)}</li>`;
    }

    r('formula').innerHTML =
      `${u[0].toUpperCase()}${u.slice(1)} sold = ${num(state.q0)} − ${num(state.b)} × (${money(state.price, 2)} − ${money(state.p0, 2)}) = ${num(Math.round(at.units))}` +
      `<span>Revenue = ${money(state.price, 2)} × ${num(Math.round(at.units))} = ${money(at.revenue, 0)}</span>` +
      `<span>Profit = ${money(at.revenue, 0)} − ${money(state.vc, 2)} × ${num(Math.round(at.units))} − ${money(state.fc, 0)} = ${money(at.profit, 0)}</span>` +
      (Number.isFinite(e) ? `<span>Elasticity = (${num(state.b)} × ${money(state.price, 2)}) ÷ ${num(Math.round(at.units))} = ${e.toFixed(2)}</span>` : '');

    draw(kp, at, best);
  }

  function draw(kp, at, best) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 260 : 320, L = narrow ? 54 : 70, R = 12, T = 14, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const xMax = Math.max(Number.isFinite(kp.choke) ? kp.choke : state.p0 * 2, state.price, 1);
    const N = 80;
    const pts = Array.from({ length: N + 1 }, (_, i) => {
      const p = (xMax * i) / N;
      return { p, ...atPrice(state, p) };
    });
    const yTop = Math.max(...pts.map((d) => d.revenue), 10);
    const yBot = Math.min(0, ...pts.map((d) => d.profit));
    const stepY = niceMax((yTop - yBot) / 5);
    const lo = Math.floor(yBot / stepY) * stepY;
    const hi = Math.ceil(yTop / stepY) * stepY;
    const x = (p) => L + (p / xMax) * (W - L - R);
    const y = (d) => T + ((hi - Math.max(d, lo)) / (hi - lo)) * (H - T - B);

    for (let v = lo; v <= hi + 0.01; v += stepY) {
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: `stroke:var(${v === 0 ? '--muted' : '--grid'})`, 'stroke-width': v === 0 ? 1.2 : 1 });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, short(v));
    }
    const xStep = niceMax(xMax / (narrow ? 4 : 6));
    for (let p = 0; p <= xMax + 0.001; p += xStep) add('text', { x: x(p), y: H - B + 16, 'text-anchor': 'middle' }, money(p, xStep % 1 ? 2 : 0));
    add('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Price');

    const path = (key) => pts.map((d) => `${x(d.p)},${y(d[key])}`).join(' ');
    add('polyline', { points: path('revenue'), fill: 'none', style: 'stroke:var(--accent)', 'stroke-width': 2.5 });
    add('polyline', { points: path('profit'), fill: 'none', style: 'stroke:var(--good)', 'stroke-width': 2.5 });

    if (best) {
      [[kp.revMax, 'revenue', '--accent'], [kp.profitMax, 'profit', '--good']].forEach(([p, k, c]) => {
        const d = atPrice(state, p);
        add('circle', { cx: x(p), cy: y(d[k]), r: 5, style: `fill:var(${c});stroke:var(--panel)`, 'stroke-width': 2 });
      });
    }

    add('line', { x1: x(state.price), x2: x(state.price), y1: T, y2: H - B, style: 'stroke:var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    add('circle', { cx: x(state.price), cy: y(at.revenue), r: 4.5, style: 'fill:var(--ink)' });
    add('circle', { cx: x(state.price), cy: y(at.profit), r: 4.5, style: 'fill:var(--ink)' });
    const right = x(state.price) > W * 0.62;
    add('text', { x: x(state.price) + (right ? -6 : 6), y: T + 10, 'text-anchor': right ? 'end' : 'start', style: 'fill:var(--ink);font-weight:600' }, `Your price ${money(state.price, 2)}`);
    svg.setAttribute('aria-label', `Revenue and profit at each price. At ${money(state.price, 2)}: revenue ${money(at.revenue, 0)}, profit ${money(at.profit, 0)}.`);
  }

  const short = (v) => {
    const a = Math.abs(v);
    const s = a >= 1e6 ? `$${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `$${+(a / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K` : `$${Math.round(a)}`;
    return v < 0 ? `−${s}` : s;
  };

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncAll();
  render();
}
