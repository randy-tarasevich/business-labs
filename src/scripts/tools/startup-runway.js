// Startup Runway
// Burn = Fixed costs - (Sales - Variable costs)
// Runway (months) = Cash after startup costs / Burn
// The chart plays it out month by month, so growing sales can stretch the runway.

import { money, niceMax, svgEl, setTone, wireReveals, fitRange } from '../lib/util.js';

const MONTHS = 24;

const PRESETS = [
  {
    name: 'Food truck',
    cash: 75000,
    startup: [['Used truck', 45000], ['Kitchen equipment', 8000], ['Wrap and signs', 3000], ['Permits and licenses', 2500], ['First inventory', 1500]],
    fixed: [['Part-time help', 2800], ['Commissary and parking', 1500], ['Fuel and propane', 1000], ['Insurance', 500], ['Phone and card reader', 200]],
    sales: 5000, growth: 8, vc: 42,
  },
  {
    name: 'Phone case startup',
    cash: 15000,
    startup: [['Molds and samples', 3500], ['First inventory', 2500], ['Website and photos', 1500], ['LLC and trademark', 800]],
    fixed: [['Online ads', 2000], ['Shipping service', 1200], ['Insurance', 500], ['Software and apps', 300]],
    sales: 2000, growth: 12, vc: 36,
  },
  {
    name: 'T-shirt shop',
    cash: 8000,
    startup: [['Heat press', 1500], ['Laptop and design software', 1200], ['First blank shirts', 1000], ['Website and logo', 500], ['Business license', 100]],
    fixed: [['Storage space', 600], ['Marketing', 350], ['Website and software', 150], ['Insurance', 100]],
    sales: 1200, growth: 15, vc: 40,
  },
  {
    name: 'Dog walking',
    cash: 1000,
    startup: [['Leashes and supplies', 150], ['Flyers and cards', 100], ['Background check', 75]],
    fixed: [['Insurance', 60], ['Phone plan', 50], ['Scheduling app', 20]],
    sales: 400, growth: 20, vc: 10,
  },
];

const SLIDERS = ['cash', 'sales', 'growth', 'vc'];
const sum = (items) => items.reduce((t, [, v]) => t + v, 0);
const copyPreset = (p) => ({ ...p, startup: p.startup.map((i) => [...i]), fixed: p.fixed.map((i) => [...i]) });

/** Month-by-month cash. Month 0 is opening day, after startup costs are paid. */
export function simulateRunway({ cash, startup, fixed, sales, growth, vc }) {
  const startupTotal = sum(startup);
  const fixedTotal = sum(fixed);
  const opening = cash - startupTotal;
  const months = [{ month: 0, sales: 0, flow: 0, cash: opening }];
  let bal = opening;
  let s = sales;
  let runOut = opening < 0 ? 0 : null;
  let firstProfit = null;
  let low = { month: 0, cash: opening };
  for (let m = 1; m <= MONTHS; m++) {
    const flow = s * (1 - vc / 100) - fixedTotal;
    bal += flow;
    months.push({ month: m, sales: s, flow, cash: bal });
    if (flow > 0 && firstProfit === null) firstProfit = m;
    if (bal < 0 && runOut === null) runOut = m;
    if (bal < low.cash) low = { month: m, cash: bal };
    s *= 1 + growth / 100;
  }
  const burn = -months[1].flow;
  return { startupTotal, fixedTotal, opening, months, runOut, firstProfit, low, burn };
}

export function initStartupRunway(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let state = copyPreset(PRESETS[0]);
  let activePreset = 0;

  const presetWrap = $('[data-presets]');
  PRESETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      activePreset = i;
      state = copyPreset(p);
      renderItems('startup');
      renderItems('fixed');
      syncInputs();
      render();
    });
    presetWrap.appendChild(b);
  });

  SLIDERS.forEach((f) => {
    const range = $(`#rw-${f}`);
    const num = $(`#rw-${f}-n`);
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

  function renderItems(kind) {
    const wrap = $(`[data-items="${kind}"]`);
    wrap.replaceChildren();
    state[kind].forEach((item, i) => {
      const id = `rw-${kind}-${i}`;
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center gap-2';
      const label = document.createElement('label');
      label.htmlFor = id;
      label.className = 'text-[13.5px] min-w-0';
      label.textContent = item[0];
      const box = document.createElement('div');
      box.className = 'flex items-center gap-1 shrink-0';
      const unit = document.createElement('span');
      unit.className = 'text-muted font-mono';
      unit.textContent = '$';
      const input = document.createElement('input');
      Object.assign(input, { id, type: 'number', min: 0, step: kind === 'startup' ? 100 : 50, value: item[1] });
      input.inputMode = 'decimal';
      input.className = 'w-[88px] font-mono font-medium text-[14px] leading-[normal] text-ink bg-bg border border-line rounded-md py-[3px] px-[7px] text-right tabular-nums';
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        if (Number.isNaN(v) || v < 0) return;
        state[kind][i][1] = v;
        activePreset = -1;
        syncPresetButtons();
        render();
      });
      box.append(unit, input);
      row.append(label, box);
      wrap.appendChild(row);
    });
  }

  function syncPresetButtons() {
    [...presetWrap.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === activePreset)));
  }

  // No skip means a preset or the starting example is loading. Size the dollar sliders to it;
  // growth and variable cost are percents, so their fixed scales already fit.
  function syncInputs(skip) {
    if (skip === undefined) ['cash', 'sales'].forEach((f) => fitRange($(`#rw-${f}`), state[f]));
    SLIDERS.forEach((f) => {
      const range = $(`#rw-${f}`);
      if (state[f] > parseFloat(range.max)) range.max = Math.ceil(state[f] * 1.5);
      if (f !== skip) range.value = state[f];
      $(`#rw-${f}-n`).value = state[f];
    });
    syncPresetButtons();
  }

  function render() {
    const sim = simulateRunway(state);
    const { startupTotal, fixedTotal, opening, runOut, firstProfit, low, burn } = sim;
    const m1Sales = state.sales;
    const m1Var = m1Sales * (state.vc / 100);

    r('startup-total').textContent = money(startupTotal, 0);
    r('fixed-total').textContent = `${money(fixedTotal, 0)}/mo`;

    r('runout').textContent = runOut === null ? 'Not by month 24' : runOut === 0 ? 'Before opening' : `Month ${runOut}`;
    setTone(r('runout-box'), runOut === null ? 'good' : 'bad');
    r('opening').textContent = money(opening, 0);
    r('low-k').textContent = `Lowest cash (month ${low.month})`;
    r('low').textContent = money(low.cash, 0);
    setTone(r('low-box'), low.cash < 0 ? 'bad' : low.cash < fixedTotal ? 'warn' : '');
    r('profit').textContent = firstProfit === null ? 'Not by month 24' : `Month ${firstProfit}`;

    const verdict = r('verdict');
    let tone = 'good';
    let msg;
    if (opening < 0) {
      tone = 'bad';
      msg = `Startup costs are ${money(-opening, 0)} more than your starting cash, so you run out before you even open. Raise more money or spend less to get started.`;
    } else if (runOut !== null) {
      tone = 'bad';
      msg = `You run out of cash in month ${runOut}. To make it through month 24, you would need about ${money(-low.cash, 0)} more in starting cash, or lower costs, or faster sales.`;
    } else if (firstProfit === null) {
      tone = 'warn';
      msg = `You still have cash at month 24, but you are losing money every month. Without changes, the cash will run out eventually.`;
    } else if (firstProfit === 1) {
      msg = `You bring in more than you spend from month 1, so your cash only grows. Runway is not a worry for this business.`;
    } else if (low.cash < fixedTotal) {
      tone = 'warn';
      msg = `You make it, but barely. In month ${low.month} you are down to ${money(low.cash, 0)}, less than one month of fixed costs. One surprise expense could end the business.`;
    } else {
      msg = `You make it. Cash bottoms out at ${money(low.cash, 0)} in month ${low.month}, then grows once sales cover the monthly costs.`;
    }
    setTone(verdict, tone);
    verdict.textContent = msg;

    const lines = [
      `Cash after startup = ${money(state.cash, 0)} − ${money(startupTotal, 0)} = ${money(opening, 0)}`,
      `Month 1 burn = ${money(fixedTotal, 0)} − (${money(m1Sales, 0)} − ${money(m1Var, 0)}) = ${money(burn, 0)}`,
    ];
    if (burn <= 0) lines.push('No burn: month 1 brings in more than it costs.');
    else if (opening <= 0) lines.push('Runway = 0 months (no cash left after startup)');
    else lines.push(`Runway = ${money(opening, 0)} ÷ ${money(burn, 0)} = ${(opening / burn).toFixed(1)} months (if sales never grew)`);
    r('formula').innerHTML = `Runway = Cash after startup ÷ Monthly burn${lines.map((l) => `<span>${l}</span>`).join('')}`;

    drawChart(sim);
  }

  function drawChart({ months, runOut, low }) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = 640, H = 360, L = 72, R = 14, T = 22, B = 44;
    const vals = months.map((m) => m.cash);
    const hi = Math.max(0, ...vals);
    const lo = Math.min(0, ...vals);
    const step = niceMax(Math.max(hi - lo, 10) / 5);
    const top = Math.ceil(hi / step) * step || step;
    const bottom = Math.floor(lo / step) * step;
    const band = (W - L - R) / months.length;
    const xc = (m) => L + band * (m + 0.5);
    const y = (d) => T + ((top - d) / (top - bottom)) * (H - T - B);
    const add = (tag, attrs, text) => svg.appendChild(svgEl(tag, attrs, text));

    for (let v = bottom; v <= top + step / 2; v += step) {
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: 'stroke:var(--grid)', 'stroke-width': 1 });
      add('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, money(v, 0));
    }

    months.forEach(({ month, cash }) => {
      const y1 = y(Math.max(cash, 0));
      const y2 = y(Math.min(cash, 0));
      add('rect', {
        x: xc(month) - band * 0.36, width: band * 0.72, y: y1, height: Math.max(y2 - y1, 1), rx: 2,
        style: `fill:var(${cash >= 0 ? '--good' : '--bad'})`,
      });
      if (month % 3 === 0) add('text', { x: xc(month), y: H - B + 18, 'text-anchor': 'middle' }, String(month));
    });
    add('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Month (0 = opening day)');
    add('line', { x1: L, x2: W - R, y1: y(0), y2: y(0), style: 'stroke:var(--ink)', 'stroke-width': 1.5, opacity: 0.55 });

    if (runOut) {
      add('line', { x1: xc(runOut) - band / 2, x2: xc(runOut) - band / 2, y1: T, y2: H - B, style: 'stroke:var(--bad)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      const right = xc(runOut) > W * 0.6;
      add('text', { x: xc(runOut) - band / 2 + (right ? -6 : 6), y: T - 6, 'text-anchor': right ? 'end' : 'start', style: 'fill:var(--bad);font-weight:600' }, `Out of cash: month ${runOut}`);
    }

    if (low.month > 0 && low.cash < vals[0]) {
      const ly = y(low.cash);
      add('circle', { cx: xc(low.month), cy: ly, r: 6, style: 'fill:var(--accent);stroke:var(--panel)', 'stroke-width': 2 });
      const right = xc(low.month) > W * 0.6;
      const below = low.cash < 0;
      add('text', {
        x: xc(low.month) + (right ? -10 : 10), y: below ? ly + 18 : ly - 10, 'text-anchor': right ? 'end' : 'start',
        style: 'fill:var(--accent);font-weight:600;font-size:12px',
      }, `Lowest: ${money(low.cash, 0)}`);
    }

    svg.setAttribute('aria-label', `Cash in the bank over ${MONTHS} months. ${runOut === null ? 'Cash never runs out.' : runOut === 0 ? 'Cash runs out before opening.' : `Cash runs out in month ${runOut}.`} Lowest cash is ${money(low.cash, 0)} in month ${low.month}.`);
  }

  wireReveals(root);


  renderItems('startup');
  renderItems('fixed');
  syncInputs();
  render();
}
