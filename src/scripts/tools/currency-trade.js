// Currency and Trade Lab
// Importing into the U.S.:  Cost in dollars = Foreign price ÷ Exchange rate
//   Landed cost = Cost + Shipping + Tariff (percent of the product's cost). Shelf price = Landed cost × (1 + Markup)
// Exporting from the U.S.:  Cost in their currency = (U.S. price + Shipping) × Exchange rate
//   Their tariff is a percent of that cost. Shelf price abroad = Landed cost × (1 + Markup)
// Exchange rate = units of the other currency for $1. A higher number means a stronger dollar.

import { niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const CURRENCIES = {
  EUR: 'euros', JPY: 'yen', CAD: 'Canadian dollars', MXN: 'Mexican pesos', GBP: 'British pounds', VND: 'Vietnamese dong', CNY: 'Chinese yuan',
};
export const PRESETS = [
  { name: 'Import: olive oil from Italy', mode: 'import', cur: 'EUR', item: 'bottle', price: 6, rate: 0.9, ship: 1.5, tariff: 10, markup: 60, rival: 16, rivalNote: 'U.S.-made olive oil' },
  { name: 'Import: sneakers from Vietnam', mode: 'import', cur: 'VND', item: 'pair', price: 500000, rate: 25000, ship: 2, tariff: 20, markup: 100, rival: 60, rivalNote: 'U.S.-made sneakers' },
  { name: 'Export: guitars to Japan', mode: 'export', cur: 'JPY', item: 'guitar', price: 800, rate: 150, ship: 60, tariff: 0, markup: 40, rival: 170000, rivalNote: 'a Japanese-made guitar' },
  { name: 'Export: kayaks to Canada', mode: 'export', cur: 'CAD', item: 'kayak', price: 900, rate: 1.37, ship: 80, tariff: 0, markup: 30, rival: 1700, rivalNote: 'a Canadian-made kayak' },
];
const KEYS = ['price', 'rate', 'ship', 'tariff', 'markup', 'rival'];

/** Price build-up for one exchange rate. Amounts are in the buyer's currency. */
export function landed(s, rate = s.rate) {
  if (s.mode === 'import') {
    const cost = rate > 0 ? s.price / rate : 0;
    const tariff = cost * (s.tariff / 100);
    const land = cost + s.ship + tariff;
    const markup = land * (s.markup / 100);
    return { cost, ship: s.ship, tariff, markup, shelf: land + markup };
  }
  const cost = s.price * rate;
  const ship = s.ship * rate;
  const tariff = cost * (s.tariff / 100);
  const land = cost + ship + tariff;
  const markup = land * (s.markup / 100);
  return { cost, ship, tariff, markup, shelf: land + markup };
}

export function initCurrencyTrade(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  let bigPrices = false; // whole-unit prices (kayaks, yen) skip cents everywhere, so numbers line up
  const fmt = (n, code, d) => {
    const digits = d ?? (bigPrices || Math.abs(n) >= 1000 || code === 'JPY' || code === 'VND' ? 0 : 2);
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: code === 'USD' ? 'narrowSymbol' : 'symbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
    } catch {
      return `${n.toFixed(digits)} ${code}`;
    }
  };
  const buyerCur = () => (state.mode === 'import' ? 'USD' : state.cur);
  const sellerCur = () => (state.mode === 'import' ? state.cur : 'USD');

  const syncs = KEYS.map((k) =>
    linkRange(root, `fx-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncAll();
    render();
  });

  root.querySelectorAll('input[name="fx-mode"]').forEach((el) =>
    el.addEventListener('change', () => {
      state.mode = el.value;
      setActive(-1);
      labels();
      render();
    })
  );
  const curSel = $('[data-cur]');
  curSel.innerHTML = Object.entries(CURRENCIES).map(([c, n]) => `<option value="${c}">${c}: ${n}</option>`).join('');
  curSel.addEventListener('change', () => {
    state.cur = curSel.value;
    setActive(-1);
    labels();
    render();
  });

  function syncAll() {
    syncs.forEach((s) => s());
    root.querySelector(`input[name="fx-mode"][value="${state.mode}"]`).checked = true;
    curSel.value = state.cur;
    // slider ranges that fit the currency
    const set = (id, max, step) => {
      const el = $(`#fx-${id}`);
      el.max = max;
      el.step = step;
    };
    set('rate', Math.max(state.rate * 2, 2), state.rate >= 100 ? 1 : state.rate >= 10 ? 0.1 : 0.01);
    set('price', Math.max(state.price * 3, 10), state.price >= 10000 ? 1000 : state.price >= 100 ? 10 : 0.5);
    set('rival', Math.max(state.rival * 2, 10), state.rival >= 10000 ? 1000 : state.rival >= 100 ? 10 : 0.5);
    labels();
  }

  function labels() {
    const imp = state.mode === 'import';
    const name = CURRENCIES[state.cur];
    r('price-l').textContent = imp ? `Supplier's price (${state.cur})` : 'Your price (USD)';
    r('price-h').textContent = imp ? `What the foreign maker charges, in ${name}.` : 'What your U.S. company charges per unit, in dollars.';
    r('rate-l').textContent = `${state.cur} per $1`;
    r('rate-h').textContent = `How many ${name} one U.S. dollar buys. Example rate only: check today's real rate.`;
    r('ship-h').textContent = imp ? 'Shipping per unit to the U.S., in dollars.' : 'Shipping per unit to the buyer, in dollars.';
    r('tariff-h').textContent = imp ? 'Tax the U.S. charges on the import. The importer pays it.' : 'Tax the other country charges on your product. Their importer pays it.';
    r('markup-h').textContent = imp ? 'What the U.S. store adds to cover costs and profit.' : 'What the foreign store adds to cover costs and profit.';
    r('rival-l').textContent = `Competitor's price (${buyerCur()})`;
    r('rival-h').textContent = `Shelf price of ${state.rivalNote || 'a local competitor'}.`;
    root.querySelectorAll('[data-unit-cur]').forEach((el) => (el.textContent = state.mode === 'import' ? state.cur : '$'));
    root.querySelectorAll('[data-unit-buyer]').forEach((el) => (el.textContent = buyerCur() === 'USD' ? '$' : state.cur));
  }

  function render() {
    const b = landed(state);
    const bc = buyerCur();
    bigPrices = Math.max(b.shelf, state.rival) >= 1000;
    const imp = state.mode === 'import';
    r('shelf').textContent = fmt(b.shelf, bc);
    r('rival').textContent = fmt(state.rival, bc);
    r('cost').textContent = fmt(b.cost, bc);
    r('tariff').textContent = fmt(b.tariff * (1 + state.markup / 100), bc);
    const diff = state.rival - b.shelf;
    setTone(r('shelf-box'), diff >= 0 ? 'good' : 'bad');

    const v = r('verdict');
    const who = imp ? 'Your import' : `Your ${state.item} in the store abroad`;
    setTone(v, diff >= 0 ? 'good' : 'bad');
    v.textContent =
      `${who} sells for ${fmt(b.shelf, bc)}, ${fmt(Math.abs(diff), bc)} ${diff >= 0 ? 'less' : 'more'} than ${state.rivalNote || 'the competitor'}.` +
      (state.tariff > 0 ? ` The tariff adds ${fmt(b.tariff, bc)} per ${state.item}, and after the store's markup shoppers pay ${fmt(b.tariff * (1 + state.markup / 100), bc)} more because of it.` : '');

    const sc = sellerCur();
    r('formula').innerHTML = imp
      ? `Cost in dollars = ${fmt(state.price, sc)} ÷ ${state.rate} = ${fmt(b.cost, 'USD')}` +
        `<span>Landed cost = ${fmt(b.cost, 'USD')} + ${fmt(b.ship, 'USD')} shipping + ${fmt(b.tariff, 'USD')} tariff = ${fmt(b.cost + b.ship + b.tariff, 'USD')}</span>` +
        `<span>Shelf price = ${fmt(b.cost + b.ship + b.tariff, 'USD')} × ${1 + state.markup / 100} = ${fmt(b.shelf, 'USD')}</span>`
      : `Cost in ${state.cur} = (${fmt(state.price, 'USD')} + ${fmt(state.ship, 'USD')}) × ${state.rate} = ${fmt(b.cost + b.ship, bc)}` +
        `<span>Landed cost = ${fmt(b.cost + b.ship, bc)} + ${fmt(b.tariff, bc)} tariff = ${fmt(b.cost + b.ship + b.tariff, bc)}</span>` +
        `<span>Shelf price = ${fmt(b.cost + b.ship + b.tariff, bc)} × ${1 + state.markup / 100} = ${fmt(b.shelf, bc)}</span>`;

    drawStack(b, bc);
    drawSweep(bc);
  }

  // Bar: what makes up the shelf price
  function drawStack(b, bc) {
    const svg = $('[data-stack]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const H = 92;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const parts = [
      ['Product', b.cost, '--accent'],
      ['Shipping', b.ship, '--muted'],
      ['Tariff', b.tariff, '--bad'],
      ['Store markup', b.markup, '--good'],
    ];
    const total = Math.max(b.shelf, state.rival, 1);
    const span = W - 4;
    let x = 0;
    parts.forEach(([label, val, c]) => {
      const w = (val / total) * span;
      if (w <= 0) return;
      add('rect', { x, y: 6, width: w, height: 34, style: `fill:var(${c});stroke:var(--panel)`, 'stroke-width': 2 });
      if (w > 64) add('text', { x: x + 6, y: 27, style: 'fill:var(--panel);font-weight:600;font-size:11.5px' }, fmt(val, bc));
      x += w;
    });
    const rx = (state.rival / total) * span;
    add('line', { x1: rx, x2: rx, y1: 0, y2: 48, style: 'stroke:var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 3' });
    add('text', { x: Math.min(Math.max(rx, 60), W - 2), y: 64, 'text-anchor': rx > W - 60 ? 'end' : 'middle', style: 'fill:var(--ink);font-weight:600' }, `Competitor ${fmt(state.rival, bc)}`);
    let lx = 0;
    const ly = 84;
    parts.forEach(([label, val, c]) => {
      if (val <= 0) return;
      add('rect', { x: lx, y: ly - 9, width: 10, height: 10, rx: 2, style: `fill:var(${c})` });
      const t = add('text', { x: lx + 14, y: ly, style: 'font-family:var(--font-sans)' }, label);
      lx += 14 + label.length * 6.6 + 12;
    });
    svg.setAttribute('aria-label', `Shelf price ${fmt(b.shelf, bc)}: product ${fmt(b.cost, bc)}, shipping ${fmt(b.ship, bc)}, tariff ${fmt(b.tariff, bc)}, markup ${fmt(b.markup, bc)}. Competitor ${fmt(state.rival, bc)}.`);
  }

  // Line: shelf price as the dollar gets weaker or stronger
  function drawSweep(bc) {
    const svg = $('[data-sweep]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 220 : 240, L = narrow ? 62 : 78, R = 12, T = 14, B = 44;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const r0 = state.rate || 1;
    const rates = Array.from({ length: 41 }, (_, i) => r0 * (0.7 + (i * 0.6) / 40));
    const vals = rates.map((rt) => landed(state, rt).shelf);
    const lo0 = Math.min(...vals, state.rival);
    const hi0 = Math.max(...vals, state.rival);
    const step = niceMax(((hi0 - lo0) || hi0 || 1) / 4);
    const lo = Math.max(0, Math.floor(lo0 / step) * step), hi = Math.ceil(hi0 / step) * step + (hi0 % step === 0 ? step : 0);
    const x = (rt) => L + ((rt - rates[0]) / (rates[40] - rates[0])) * (W - L - R);
    const y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
    for (let v = lo; v <= hi + step / 1000; v += step) {
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, fmt(v, bc, step >= 1 ? 0 : 2));
    }
    [-30, -15, 0, 15, 30].forEach((pct) => {
      const rt = r0 * (1 + pct / 100);
      add('text', { x: x(rt), y: H - B + 16, 'text-anchor': pct === -30 ? 'start' : pct === 30 ? 'end' : 'middle' }, pct === 0 ? 'Today' : `${pct > 0 ? '+' : '−'}${Math.abs(pct)}%`);
    });
    add('text', { x: L, y: H - 6, style: 'font-family:var(--font-sans);font-size:12px' }, '← Weaker dollar');
    add('text', { x: W - R, y: H - 6, 'text-anchor': 'end', style: 'font-family:var(--font-sans);font-size:12px' }, 'Stronger dollar →');
    add('line', { x1: L, x2: W - R, y1: y(state.rival), y2: y(state.rival), style: 'stroke:var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
    add('text', { x: L + 6, y: y(state.rival) - 6, style: 'fill:var(--ink);font-weight:600' }, 'Competitor');
    add('polyline', { points: rates.map((rt, i) => `${x(rt)},${y(vals[i])}`).join(' '), fill: 'none', style: 'stroke:var(--accent)', 'stroke-width': 3 });
    const cur = landed(state).shelf;
    add('circle', { cx: x(r0), cy: y(cur), r: 6, style: 'fill:var(--accent);stroke:var(--panel)', 'stroke-width': 2 });
    svg.setAttribute('aria-label', `As the dollar gets stronger, the shelf price ${state.mode === 'import' ? 'falls' : 'rises'}.`);
  }

  onWidthChange($('[data-stack]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncAll();
  render();
}
