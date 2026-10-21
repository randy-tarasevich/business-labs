// Ratio Dashboard
// Turns a simple balance sheet and income statement into the ratios lenders and owners check.
// Zones are rough rules of thumb. Good values differ a lot by industry.

import { money, presetButtons, wireReveals, setTone } from '../lib/util.js';

const FIELDS = [
  { key: 'ca', label: 'Current assets', hint: 'Cash, receivables, inventory: things that turn to cash within a year.' },
  { key: 'inv', label: 'Inventory', hint: 'Part of current assets.' },
  { key: 'ta', label: 'Total assets' },
  { key: 'cl', label: 'Current liabilities', hint: 'Bills due within a year.' },
  { key: 'tl', label: 'Total liabilities' },
  { key: 'sales', label: 'Net sales' },
  { key: 'cogs', label: 'Cost of goods sold' },
  { key: 'ni', label: 'Net income', hint: 'Use a minus sign for a loss.', neg: true },
];

const PRESETS = [
  { name: 'Hardware store', ca: 400000, inv: 220000, ta: 750000, cl: 160000, tl: 280000, sales: 1600000, cogs: 1040000, ni: 120000 },
  { name: 'Grocery store', ca: 180000, inv: 110000, ta: 520000, cl: 120000, tl: 300000, sales: 2400000, cogs: 1800000, ni: 48000 },
  { name: 'Software startup', ca: 900000, inv: 0, ta: 1100000, cl: 250000, tl: 300000, sales: 1500000, cogs: 300000, ni: -200000 },
  { name: 'Struggling furniture store', ca: 260000, inv: 210000, ta: 600000, cl: 300000, tl: 520000, sales: 900000, cogs: 630000, ni: -35000 },
];

// zones: [upperBound, tone] in order; last bound is Infinity. lo/hi: gauge range.
const RATIOS = [
  {
    key: 'current', group: 'Can it pay its bills?', name: 'Current ratio', fmt: 'x',
    calc: (d) => (d.cl > 0 ? d.ca / d.cl : NaN), formula: 'Current assets ÷ Current liabilities',
    lo: 0, hi: 4, zones: [[1, 'bad'], [1.5, 'warn'], [Infinity, 'good']],
    say: (v) => `It has ${money(v, 2)} of short-term assets for every $1 of bills due this year.`,
  },
  {
    key: 'quick', group: 'Can it pay its bills?', name: 'Quick ratio', fmt: 'x',
    calc: (d) => (d.cl > 0 ? (d.ca - d.inv) / d.cl : NaN), formula: '(Current assets − Inventory) ÷ Current liabilities',
    lo: 0, hi: 3, zones: [[0.5, 'bad'], [1, 'warn'], [Infinity, 'good']],
    say: (v) => `Without selling any inventory, it has ${money(v, 2)} for every $1 due soon.`,
  },
  {
    key: 'de', group: 'How much does it owe?', name: 'Debt-to-equity', fmt: 'x',
    calc: (d) => (d.eq > 0 ? d.tl / d.eq : NaN), formula: 'Total liabilities ÷ Owner\'s equity',
    lo: 0, hi: 4, zones: [[1, 'good'], [2, 'warn'], [Infinity, 'bad']],
    say: (v) => `Lenders have put in ${money(v, 2)} for every $1 the owners have in the business.`,
    bad: (d) => (d.eq <= 0 ? 'Owner\'s equity is zero or negative: the business owes more than it owns.' : null),
  },
  {
    key: 'gm', group: 'Is it profitable?', name: 'Gross margin', fmt: '%',
    calc: (d) => (d.sales > 0 ? (d.sales - d.cogs) / d.sales : NaN), formula: '(Net sales − COGS) ÷ Net sales',
    lo: 0, hi: 1, zones: null,
    say: (v) => `It keeps ${Math.round(v * 100)}¢ of every sales dollar after paying for the products it sold.`,
  },
  {
    key: 'nm', group: 'Is it profitable?', name: 'Net profit margin', fmt: '%',
    calc: (d) => (d.sales > 0 ? d.ni / d.sales : NaN), formula: 'Net income ÷ Net sales',
    lo: -0.2, hi: 0.3, zones: [[0, 'bad'], [0.05, 'warn'], [Infinity, 'good']],
    say: (v) => (v >= 0 ? `It keeps ${(v * 100).toFixed(1)}¢ of profit from every sales dollar, after all expenses.` : `It loses ${(-v * 100).toFixed(1)}¢ on every sales dollar.`),
  },
  {
    key: 'roa', group: 'Is it profitable?', name: 'Return on assets', fmt: '%',
    calc: (d) => (d.ta > 0 ? d.ni / d.ta : NaN), formula: 'Net income ÷ Total assets',
    lo: -0.2, hi: 0.3, zones: [[0, 'bad'], [0.05, 'warn'], [Infinity, 'good']],
    say: (v) => `Every $1 of stuff it owns earned ${(v * 100).toFixed(1)}¢ of ${v >= 0 ? 'profit' : 'loss'} this year.`,
  },
  {
    key: 'roe', group: 'Is it profitable?', name: 'Return on equity', fmt: '%',
    calc: (d) => (d.eq > 0 ? d.ni / d.eq : NaN), formula: 'Net income ÷ Owner\'s equity',
    lo: -0.3, hi: 0.5, zones: [[0, 'bad'], [0.1, 'warn'], [Infinity, 'good']],
    say: (v) => `Every $1 the owners have invested earned ${(v * 100).toFixed(1)}¢ of ${v >= 0 ? 'profit' : 'loss'}.`,
    bad: (d) => (d.eq <= 0 ? 'Can\'t calculate: owner\'s equity is zero or negative.' : null),
  },
  {
    key: 'turn', group: 'How fast does inventory sell?', name: 'Inventory turnover', fmt: 'x',
    calc: (d) => (d.inv > 0 ? d.cogs / d.inv : NaN), formula: 'COGS ÷ Inventory',
    lo: 0, hi: 20, zones: null,
    say: (v) => `It sells through its inventory about ${v.toFixed(1)} times a year, about every ${Math.round(365 / v)} days.`,
    naTone: 'info',
    bad: (d) => (d.inv <= 0 ? 'No inventory, so this ratio doesn\'t apply (common for service and software businesses).' : null),
  },
];

// Gauge zone colors, written out in full so Tailwind generates them.
const ZONE = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' };
const fmtVal = (r, v) => (r.fmt === '%' ? `${(v * 100).toFixed(1)}%` : `${v.toFixed(2)}×`).replace('-', '−');
const toneOf = (r, v) => (r.zones ? r.zones.find(([ub]) => v < ub)[1] : 'info');

/** All ratios for one set of statements. */
export function computeRatios(d) {
  const data = { ...d, eq: d.ta - d.tl };
  return RATIOS.map((r) => {
    const why = r.bad?.(data);
    const v = r.calc(data);
    return { r, v, why: why || (Number.isFinite(v) ? null : 'Not enough information.'), tone: why || !Number.isFinite(v) ? (why && r.naTone) || 'bad' : toneOf(r, v) };
  });
}

export function initRatioDashboard(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const wrap = r('inputs');
  FIELDS.forEach((f) => {
    const id = `rt-${f.key}`;
    const div = document.createElement('div');
    div.className = 'grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 items-center';
    div.innerHTML = `<label for="${id}" class="font-semibold text-[14px]">${f.label}</label><div class="flex items-center gap-1"><span class="text-muted font-mono">$</span><input id="${id}" type="number" class="w-[120px] font-mono font-medium text-[15px] leading-[normal] text-ink bg-bg border border-line rounded-md py-1 px-2 text-right tabular-nums" step="1000" ${f.neg ? '' : 'min="0"'} inputmode="decimal" data-k="${f.key}" /></div>${f.hint ? `<span class="text-[12.5px] text-muted col-span-full">${f.hint}</span>` : ''}`;
    wrap.appendChild(div);
  });
  wrap.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const v = parseFloat(e.target.value);
    if (Number.isNaN(v)) return;
    if (v < 0 && !FIELDS.find((f) => f.key === k).neg) return;
    state[k] = v;
    setActive(-1);
    render();
  });

  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    sync();
    render();
  });
  const sync = () => FIELDS.forEach((f) => (root.querySelector(`[data-k="${f.key}"]`).value = state[f.key]));

  function gauge(rr, v) {
    const { lo, hi, zones } = rr;
    const pct = (x) => ((Math.min(Math.max(x, lo), hi) - lo) / (hi - lo)) * 100;
    let bands = '';
    if (zones) {
      let start = lo;
      zones.forEach(([ub, tone]) => {
        const end = Math.min(ub, hi);
        if (end > start) bands += `<span class="absolute top-0 bottom-0 opacity-45 ${ZONE[tone]}" style="left:${pct(start)}%;width:${pct(end) - pct(start)}%"></span>`;
        start = end;
      });
    } else bands = '<span class="absolute top-0 bottom-0 bg-accent opacity-20" style="left:0;width:100%"></span>';
    const marker = Number.isFinite(v) ? `<span class="absolute -top-px -bottom-px w-1 -ml-0.5 bg-ink rounded-[2px] shadow-[0_0_0_2px_var(--panel)]" style="left:${pct(v)}%"></span>` : '';
    const ticks = zones ? zones.slice(0, -1).map(([ub]) => `<span class="absolute -translate-x-1/2 -top-0.5 font-mono font-medium text-[10.5px] leading-[normal] text-muted" style="left:${pct(ub)}%">${rr.fmt === '%' ? `${Math.round(ub * 100)}%` : ub}</span>`).join('') : '';
    return `<div class="relative h-2.5 rounded-[5px] overflow-hidden bg-grid" aria-hidden="true">${bands}${marker}</div><div class="relative h-3" aria-hidden="true">${ticks}</div>`;
  }

  function render() {
    const eq = state.ta - state.tl;
    r('eq').textContent = money(eq, 0);
    setTone(r('eq'), eq < 0 ? 'bad' : '');
    const res = computeRatios(state);
    const groups = [...new Set(RATIOS.map((x) => x.group))];
    r('cards').innerHTML = groups
      .map(
        (g) =>
          `<section class="grid gap-2"><h3 class="font-display font-semibold text-[15px]">${g}</h3><div class="grid grid-cols-2 gap-2.5 max-[620px]:grid-cols-1">${res
            .filter((x) => x.r.group === g)
            .map(
              ({ r: rr, v, why, tone }) =>
                `<article data-tone="${tone}" class="group border border-line border-l-4 rounded-lg py-2.5 px-3 grid gap-1.5 content-start tone-good:border-l-good tone-warn:border-l-warn tone-bad:border-l-bad tone-info:border-l-accent"><header class="flex justify-between items-baseline gap-2"><span class="font-semibold text-[14px]">${rr.name}</span><span class="font-mono font-semibold text-[20px] leading-[normal] tabular-nums group-tone-good:text-good group-tone-warn:text-warn group-tone-bad:text-bad">${why ? '–' : fmtVal(rr, v)}</span></header>${why ? '' : gauge(rr, v)}<p class="text-[13.5px]">${why || rr.say(v)}</p><span class="font-mono font-medium text-[11.5px] leading-[normal] text-muted">${rr.formula}</span></article>`
            )
            .join('')}</div></section>`
      )
      .join('');

    const issues = [];
    if (state.inv > state.ca) issues.push('inventory is more than current assets');
    if (state.ca > state.ta) issues.push('current assets are more than total assets');
    if (state.cl > state.tl) issues.push('current liabilities are more than total liabilities');
    if (state.cogs > state.sales) issues.push('COGS is more than sales');
    const v = r('verdict');
    if (issues.length) {
      setTone(v, 'warn');
      v.textContent = `Check your numbers: ${issues.join('; ')}.`;
    } else {
      const count = (t) => res.filter((x) => x.tone === t).length;
      const g = count('good'), b = count('bad');
      setTone(v, b > g ? 'bad' : b ? 'warn' : 'good');
      v.textContent = `${g} ratio${g === 1 ? '' : 's'} in the healthy range, ${b} in the danger range. ${b > g ? 'A lender would ask hard questions.' : b ? 'Mostly solid, with a weak spot or two to explain.' : 'A lender would like what they see.'}`;
    }
  }

  wireReveals(root);
  setActive(0);
  sync();
  render();
}

