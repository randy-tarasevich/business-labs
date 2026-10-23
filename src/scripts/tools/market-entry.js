// Market Entry Lab
// Five ways to enter a foreign market. Each has an upfront cost and a share of foreign sales the company keeps.
// Yearly profit = Sales that year × Share kept. Cumulative profit starts at −Upfront cost.
// Risks: sales can miss the forecast (all modes), a tariff cuts the exporter's share,
// and political trouble forces owned operations (joint venture, subsidiary) out after year 2.

import { money, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const YEARS = 5;
// shipShare: the exporter's shipments are worth about this share of foreign sales, so a tariff of T% costs T × shipShare.
const SHIP_SHARE = 0.4;

export const MODES = [
  { key: 'license', name: 'Licensing', up: 5000, keep: 5, control: 'Low', risk: 'Very low', owned: false, color: '--muted', how: 'A foreign company makes and sells your product and pays you a royalty.' },
  { key: 'export', name: 'Exporting', up: 20000, keep: 12, control: 'Low', risk: 'Low', owned: false, color: '--accent', how: 'You make it at home and ship it to a distributor in the other country.' },
  { key: 'franchise', name: 'Franchising', up: 30000, keep: 8, control: 'Medium', risk: 'Low', owned: false, color: '--good', how: 'Local owners run stores under your brand and rules, and pay you fees.' },
  { key: 'jv', name: 'Joint venture', up: 250000, keep: 12.5, control: 'Shared', risk: 'Medium', owned: true, color: '--warn', how: 'You and a local partner co-own a new company and split the profit.' },
  { key: 'sub', name: 'Own subsidiary', up: 600000, keep: 25, control: 'High', risk: 'High', owned: true, color: '--bad', how: 'You build or buy your own operation there and keep all the profit.' },
];

// Control and risk pills. Classes are written out in full so Tailwind generates them.
const PILL = 'font-sans font-semibold text-[12px] leading-[normal] rounded-full py-0.5 px-2 border whitespace-nowrap';
const PILL_TONE = {
  'c-high': 'border-current text-good',
  'r-high': 'border-current text-bad',
  'r-medium': 'border-line text-warn',
  'c-shared': 'border-line text-warn',
  'c-medium': 'border-line text-warn',
};

const PRESETS = [
  { name: 'Small test market', sales: 300000, growth: 10, shortfall: 0, tariff: 0, political: false },
  { name: 'Big growing market', sales: 3000000, growth: 10, shortfall: 0, tariff: 0, political: false },
  { name: 'Big but risky market', sales: 3000000, growth: 10, shortfall: 30, tariff: 25, political: true },
];

/** Year-by-year cumulative profit for one mode. Index 0 is the day you enter. */
export function runMode(m, s) {
  const keep = m.key === 'export' ? Math.max(m.keep - s.tariff * SHIP_SHARE, 0) : m.keep;
  const cum = [-m.up];
  let sales = s.sales * (1 - s.shortfall / 100);
  for (let y = 1; y <= YEARS; y++) {
    const forcedOut = s.political && m.owned && y >= 3;
    const profit = forcedOut ? 0 : sales * (keep / 100);
    cum.push(cum[y - 1] + profit);
    sales *= 1 + s.growth / 100;
  }
  const payback = cum.findIndex((v, i) => i > 0 && v >= 0);
  return { keep, cum, total: cum[YEARS], payback: payback === -1 ? null : payback };
}

export function initMarketEntry(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };
  const modes = MODES.map((m) => ({ ...m }));

  const edit = (k) => (v) => {
    state[k] = v;
    setActive(-1);
    render();
  };
  const syncs = ['sales', 'growth', 'shortfall', 'tariff'].map((k) => linkRange(root, `me-${k}`, { get: () => state[k], set: edit(k), max: k === 'shortfall' ? 100 : undefined }));
  const pol = $('[data-political]');
  pol.addEventListener('change', () => {
    state.political = pol.checked;
    setActive(-1);
    render();
  });
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncAll();
    render();
  });
  const syncAll = () => {
    syncs.forEach((s) => s());
    pol.checked = state.political;
  };

  // Editable mode table
  r('modes').innerHTML = modes
    .map(
      (m, i) => `<tr data-i="${i}">
        <th scope="row"><i style="background:var(${m.color})"></i><span class="font-semibold">${m.name}</span><span class="block text-[12.5px] text-muted mt-0.5 ml-[17px]">${m.how}</span></th>
        <td><span class="inline-flex items-center gap-[3px] [&_span]:text-muted"><span>$</span><input type="number" class="w-[86px] font-mono font-medium text-[14px] leading-[normal] normal-nums text-ink bg-bg border border-line rounded-md py-[3px] px-1.5 text-right" min="0" step="1000" inputmode="decimal" value="${m.up}" data-f="up" aria-label="${m.name} upfront cost" /></span></td>
        <td><span class="inline-flex items-center gap-[3px] [&_span]:text-muted"><input type="number" class="w-[60px] font-mono font-medium text-[14px] leading-[normal] normal-nums text-ink bg-bg border border-line rounded-md py-[3px] px-1.5 text-right" min="0" max="100" step="0.5" inputmode="decimal" value="${m.keep}" data-f="keep" aria-label="${m.name} share of sales kept" /><span>%</span></span><span class="block font-sans font-medium text-[11.5px] leading-[normal] normal-nums text-bad mt-[3px]" data-after="${i}"></span></td>
        <td><span class="${PILL} ${PILL_TONE[`c-${m.control.toLowerCase()}`] ?? 'border-line'}">${m.control}</span></td>
        <td><span class="${PILL} ${PILL_TONE[`r-${m.risk.toLowerCase().replace(/\s/g, '')}`] ?? 'border-line'}">${m.risk}</span></td>
      </tr>`
    )
    .join('');
  r('modes').addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const v = parseFloat(e.target.value);
    if (Number.isNaN(v) || v < 0) return;
    modes[+e.target.closest('tr').dataset.i][f] = v;
    setActive(-1);
    render();
  });

  function render() {
    const res = modes.map((m) => ({ m, ...runMode(m, state) }));
    res.forEach((x, i) => {
      const el = root.querySelector(`[data-after="${i}"]`);
      el.textContent = x.m.key === 'export' && state.tariff > 0 ? `${+x.keep.toFixed(1)}% after tariff` : '';
    });

    const ranked = [...res].sort((a, b) => b.total - a.total);
    r('results').innerHTML = ranked
      .map(
        (x, k) => `<tr><th scope="row" class="${k === 0 ? 'font-semibold!' : ''}"><i class="inline-block w-2.5 h-2.5 rounded-[2px] mr-[7px] align-[0]" style="background:var(${x.m.color})"></i>${x.m.name}</th><td class="${k === 0 ? 'text-good font-semibold!' : x.total < 0 ? 'text-bad' : ''}">${money(x.total, 0)}</td><td>${x.payback ? `Year ${x.payback}` : 'Not in 5 years'}</td></tr>`
      )
      .join('');

    const best = ranked[0];
    const sub = res.find((x) => x.m.key === 'sub');
    const v = r('verdict');
    if (best.total <= 0) {
      setTone(v, 'bad');
      v.textContent = 'No way into this market makes money in five years. The best choice may be to stay home.';
    } else {
      const notes = [];
      if (best.m.key !== 'sub' && sub.total < best.total) notes.push(state.political ? 'Owned operations take the biggest hit when political trouble forces them out.' : 'Owning your own operation costs too much up front for a market this size.');
      if (best.m.key === 'sub') notes.push('The biggest market rewards the biggest bet, but you also have the most to lose if things go wrong.');
      if (best.m.control === 'Low') notes.push('You make money, but someone else controls how your brand is sold.');
      setTone(v, 'good');
      v.textContent = `${best.m.name} earns the most over five years: ${money(best.total, 0)}. ${notes.join(' ')}`;
    }

    const e = res.find((x) => x.m.key === 'export');
    const s1 = state.sales * (1 - state.shortfall / 100);
    r('formula').innerHTML =
      `Year 1 sales = ${money(state.sales, 0)} × (1 − ${state.shortfall}%) = ${money(s1, 0)}` +
      `<span>Year 1 profit, own subsidiary = ${money(s1, 0)} × ${sub.keep}% = ${money(s1 * sub.keep / 100, 0)}</span>` +
      `<span>Exporting share after tariff = ${e.m.keep}% − ${state.tariff}% × ${SHIP_SHARE} = ${+e.keep.toFixed(1)}%</span>` +
      `<span>5-year profit = all yearly profits − upfront cost</span>`;

    draw(res);
  }

  function draw(res) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 250 : 300, L = narrow ? 58 : 72, R = narrow ? 12 : 110, T = 12, B = 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const all = res.flatMap((x) => x.cum);
    const lo0 = Math.min(0, ...all), hi0 = Math.max(0, ...all);
    const step = niceStep((hi0 - lo0) / 5 || 1);
    const lo = Math.floor(lo0 / step) * step, hi = Math.ceil(hi0 / step) * step || step;
    const x = (yr) => L + (yr / YEARS) * (W - L - R);
    const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
    for (let v = lo; v <= hi + step / 1000; v += step) {
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: `stroke:var(${Math.abs(v) < step / 1000 ? '--muted' : '--grid'})`, 'stroke-width': Math.abs(v) < step / 1000 ? 1.4 : 1 });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, short(v));
    }
    for (let yr = 0; yr <= YEARS; yr++) add('text', { x: x(yr), y: H - B + 16, 'text-anchor': narrow && yr === YEARS ? 'end' : 'middle' }, yr === 0 ? 'Enter' : `Yr ${yr}`);
    if (state.political) {
      add('rect', { x: x(2), y: T, width: x(YEARS) - x(2), height: H - T - B, style: 'fill:var(--bad-soft)', opacity: 0.6 });
      add('text', { x: x(2) + 6, y: T + 14, style: 'fill:var(--bad);font-weight:600' }, 'Forced out');
    }
    // Draw the best line last so it sits on top.
    const order = [...res].sort((a, b) => a.total - b.total);
    order.forEach((r0) => {
      add('polyline', { points: r0.cum.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', style: `stroke:var(${r0.m.color})`, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
      r0.cum.forEach((v, i) => add('circle', { cx: x(i), cy: y(v), r: 2.8, style: `fill:var(${r0.m.color})` }));
    });
    if (!narrow) {
      // End labels, nudged apart so they don't overlap.
      const ends = res.map((r0) => ({ name: r0.m.name, color: r0.m.color, y: y(r0.total) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      ends.forEach((e) => add('text', { x: W - R + 8, y: e.y + 4, style: `fill:var(${e.color});font-weight:600;font-family:var(--font-sans)` }, e.name));
    }
    svg.setAttribute('aria-label', `Cumulative profit over five years. ${res.map((x) => `${x.m.name}: ${money(x.total, 0)}`).join(', ')}.`);
  }

  const niceStep = (v) => {
    const p = 10 ** Math.floor(Math.log10(v));
    for (const s of [1, 2, 2.5, 5, 10]) if (s * p >= v) return s * p;
    return 10 * p;
  };
  const short = (v) => {
    const a = Math.abs(v);
    const s = a >= 1e6 ? `$${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `$${+(a / 1e3).toFixed(0)}K` : `$${Math.round(a)}`;
    return v < 0 ? `−${s}` : s;
  };

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncAll();
  render();
}
