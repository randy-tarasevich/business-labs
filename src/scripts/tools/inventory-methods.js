// Inventory Methods Lab (periodic system)
// Goods available = Beginning inventory + Purchases. Each method splits that cost into
// Cost of goods sold (COGS) and Ending inventory in a different way.

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const LAYER_NAMES = ['Beginning', 'Purchase 1', 'Purchase 2', 'Purchase 3'];
const PRESETS = [
  { name: 'Sneakers (prices rising)', item: 'pairs', layers: [[20, 60], [30, 65], [30, 70], [20, 78]], sold: 70, price: 110, tax: 21 },
  { name: 'TVs (prices falling)', item: 'TVs', layers: [[10, 400], [15, 360], [15, 330], [10, 300]], sold: 35, price: 550, tax: 21 },
  { name: 'Coffee beans (prices steady)', item: 'bags', layers: [[50, 8], [100, 8], [100, 8], [50, 8]], sold: 220, price: 14, tax: 21 },
];
const METHODS = [
  { key: 'fifo', label: 'FIFO', long: 'First in, first out', note: 'Oldest costs sold first' },
  { key: 'lifo', label: 'LIFO', long: 'Last in, first out', note: 'Newest costs sold first' },
  { key: 'avg', label: 'Weighted average', long: 'Weighted average', note: 'Same cost for every unit' },
];

const round2 = (n) => Math.round(n * 100) / 100;

/** Split layers into sold and remaining pieces for one method. */
export function costMethod(layers, sold, method) {
  const units = layers.reduce((t, [u]) => t + u, 0);
  const totalCost = layers.reduce((t, [u, c]) => t + u * c, 0);
  const n = Math.min(sold, units);
  if (method === 'avg') {
    const avg = units ? totalCost / units : 0;
    const cogs = round2(n * avg);
    return { cogs, ending: round2(totalCost - cogs), avg, soldParts: [{ layer: -1, units: n, cost: avg }], leftParts: [{ layer: -1, units: units - n, cost: avg }], units, totalCost };
  }
  const order = layers.map((l, i) => i);
  if (method === 'lifo') order.reverse();
  let need = n;
  const soldParts = [];
  const left = layers.map(([u]) => u);
  for (const i of order) {
    if (need <= 0) break;
    const take = Math.min(need, layers[i][0]);
    if (take > 0) soldParts.push({ layer: i, units: take, cost: layers[i][1] });
    left[i] -= take;
    need -= take;
  }
  const leftParts = layers.map(([, c], i) => ({ layer: i, units: left[i], cost: c })).filter((p) => p.units > 0);
  const cogs = round2(soldParts.reduce((t, p) => t + p.units * p.cost, 0));
  return { cogs, ending: round2(totalCost - cogs), soldParts, leftParts, units, totalCost };
}

export function initInventoryMethods(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = structuredClone(PRESETS[0]);

  // Layer inputs
  const layerWrap = r('layers');
  LAYER_NAMES.forEach((name, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<th scope="row">${name}</th>
      <td><input type="number" min="0" step="1" inputmode="numeric" data-u="${i}" aria-label="${name} units" /></td>
      <td><span>$</span><input type="number" min="0" step="0.5" inputmode="decimal" data-c="${i}" aria-label="${name} cost per unit" /></td>
      <td data-lt="${i}"></td>`;
    layerWrap.appendChild(row);
  });
  layerWrap.addEventListener('input', (e) => {
    const i = e.target.dataset.u ?? e.target.dataset.c;
    if (i === undefined) return;
    const v = parseFloat(e.target.value);
    if (Number.isNaN(v) || v < 0) return;
    state.layers[i][e.target.dataset.u !== undefined ? 0 : 1] = e.target.dataset.u !== undefined ? Math.floor(v) : v;
    setActive(-1);
    render();
  });

  const syncs = [
    // fit: false because render() sets this slider's max to the units on hand.
    linkRange(root, 'iv-sold', { get: () => state.sold, set: (v) => { state.sold = Math.round(v); setActive(-1); render(); }, fit: false }),
    linkRange(root, 'iv-price', { get: () => state.price, set: (v) => { state.price = v; setActive(-1); render(); } }),
    linkRange(root, 'iv-tax', { get: () => state.tax, set: (v) => { state.tax = v; setActive(-1); render(); }, max: 60 }),
  ];

  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, structuredClone(p));
    syncAll();
    render();
  });

  function syncAll() {
    state.layers.forEach(([u, c], i) => {
      root.querySelector(`[data-u="${i}"]`).value = u;
      root.querySelector(`[data-c="${i}"]`).value = c;
    });
    syncs.forEach((s) => s());
  }

  function render() {
    const units = state.layers.reduce((t, [u]) => t + u, 0);
    const soldRange = $('#iv-sold');
    soldRange.max = Math.max(units, 1);
    if (state.sold > units) {
      state.sold = units;
      syncs[0]();
    }
    state.layers.forEach(([u, c], i) => (root.querySelector(`[data-lt="${i}"]`).textContent = money(u * c, 0)));
    const results = METHODS.map((m) => ({ m, ...costMethod(state.layers, state.sold, m.key) }));
    const sales = state.sold * state.price;
    r('avail').textContent = `${num(units)} ${state.item}, ${money(results[0].totalCost, 0)}`;
    r('sold-k').textContent = `Units sold (of ${num(units)})`;

    const best = Math.max(...results.map((x) => sales - x.cogs));
    r('rows').innerHTML = results
      .map((x) => {
        const gp = sales - x.cogs;
        const tax = Math.max(gp, 0) * (state.tax / 100);
        const top = Math.abs(gp - best) < 0.005 && results.filter((y) => Math.abs(sales - y.cogs - best) < 0.005).length < 3;
        return `<tr><th scope="row">${x.m.label}</th><td>${money(x.cogs, 0)}</td><td>${money(x.ending, 0)}</td><td class="${top ? 'text-good font-semibold!' : ''}">${money(gp, 0)}</td><td>${money(tax, 0)}</td></tr>`;
      })
      .join('');
    r('sales').textContent = `Sales: ${num(state.sold)} × ${money(state.price, 2)} = ${money(sales, 0)}`;

    // Verdict: which way are prices moving?
    const costs = state.layers.filter(([u]) => u > 0).map(([, c]) => c);
    const first = costs[0];
    const last = costs[costs.length - 1];
    const [fifo, lifo] = results;
    const v = r('verdict');
    if (!units || !state.sold) {
      setTone(v, 'warn');
      v.textContent = 'Sell at least one unit to compare the methods.';
    } else if (state.sold >= units) {
      setTone(v, 'warn');
      v.textContent = 'You sold everything, so every method gives the same COGS. The methods only differ in which costs stay on the shelf.';
    } else if (Math.abs(fifo.cogs - lifo.cogs) < 0.005) {
      setTone(v, 'info');
      v.textContent = 'When costs stay the same, all three methods give the same answer. The choice only matters when prices change.';
    } else if (last > first) {
      setTone(v, 'info');
      v.textContent = `Prices are rising. FIFO puts the old, cheap costs in COGS, so it shows ${money(lifo.cogs - fifo.cogs, 0)} more gross profit than LIFO, and more tax. LIFO shows less profit but saves tax.`;
    } else {
      setTone(v, 'info');
      v.textContent = `Prices are falling. Now LIFO puts the newer, cheaper costs in COGS, so LIFO shows ${money(fifo.cogs - lifo.cogs, 0)} more gross profit than FIFO.`;
    }

    r('formula').innerHTML = `Goods available = COGS + Ending inventory${results
      .map((x) => `<span>${x.m.label}: ${money(x.totalCost, 0)} = ${money(x.cogs, 0)} + ${money(x.ending, 0)}</span>`)
      .join('')}${state.layers.some(([u]) => u) ? `<span>Average cost = ${money(results[2].totalCost, 0)} ÷ ${num(units)} = ${money(results[2].avg, 2)}</span>` : ''}`;

    draw(results);
  }

  function draw(results) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const L = narrow ? 0 : 176;
    const rowH = narrow ? 118 : 96;
    const H = rowH * 3 + 4;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (tag, a, t) => svg.appendChild(svgEl(tag, a, t));
    const total = results[0].totalCost || 1;
    const span = W - L - 2;
    results.forEach((x, k) => {
      const y0 = k * rowH + (narrow ? 22 : 4);
      add('text', { x: 0, y: narrow ? y0 - 8 : y0 + 30, style: 'fill:var(--ink);font-weight:600;font-size:13px' }, x.m.label);
      if (!narrow) add('text', { x: 0, y: y0 + 48, style: 'font-size:11px' }, x.m.note);
      const bar = (parts, y, color) => {
        let xx = L;
        parts.forEach((p) => {
          const w = (p.units * p.cost / total) * span;
          if (w <= 0) return;
          add('rect', { x: xx, y, width: Math.max(w, 0.5), height: 26, rx: 3, style: `fill:${color};stroke:var(--panel)`, 'stroke-width': 2 });
          const t = `${num(p.units)} @ ${money(p.cost, p.cost % 1 ? 2 : 0)}`;
          if (w > t.length * 7.4 + 8) add('text', { x: xx + 6, y: y + 17, style: 'fill:var(--panel);font-weight:600;font-size:11.5px' }, t);
          xx += w;
        });
      };
      bar(x.soldParts, y0 + 4, 'var(--accent)');
      bar(x.leftParts, y0 + 36, 'var(--warn)');
      add('text', { x: L, y: y0 + 78 }, `COGS ${money(x.cogs, 0)}  ·  On the shelf ${money(x.ending, 0)}`);
    });
    svg.setAttribute('aria-label', results.map((x) => `${x.m.label}: COGS ${money(x.cogs, 0)}, ending inventory ${money(x.ending, 0)}`).join('. '));
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncAll();
  render();
}
