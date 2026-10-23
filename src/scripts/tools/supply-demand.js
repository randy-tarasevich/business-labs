// Supply and Demand Lab
// Straight-line curves, with shifts that move a whole curve left or right by a number of units:
//   Buyers want   = a + demand shift − b × Price
//   Sellers offer = d × (Price − lowest price sellers take) + supply shift
// Market price: set them equal. Price = (a + demand shift + d × lowest − supply shift) ÷ (b + d)

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

// Each market starts in balance at a round price and quantity. pMax/qMax fix the chart axes so a
// shift visibly moves a curve instead of rescaling the chart. Events add units to a shift.
export const PRESETS = [
  {
    name: 'Strawberries', unit: 'quarts', per: 'per week', cents: true,
    a: 1600, b: 150, d: 400, low: 1.5, pMax: 10, qMax: 2000, shiftStep: 10,
    events: [
      { label: 'Drought hits local farms', ss: -400 },
      { label: 'Study says berries help you sleep', ds: 300 },
      { label: 'A new farm opens nearby', ss: 300 },
      { label: 'Blueberries go on sale', ds: -250 },
    ],
  },
  {
    name: 'Gasoline', unit: 'gallons', per: 'per week', cents: true,
    a: 23500, b: 1000, d: 8000, low: 1, pMax: 8, qMax: 40000, shiftStep: 100,
    events: [
      { label: 'Hurricane shuts down refineries', ss: -6000 },
      { label: 'Summer road trip season', ds: 2000 },
      { label: 'More people drive electric cars', ds: -2000 },
      { label: 'A new pipeline opens', ss: 4000 },
    ],
  },
  {
    name: 'Sneakers', unit: 'pairs', per: 'per month', cents: false,
    a: 1100, b: 5, d: 10, low: 70, pMax: 250, qMax: 1000, shiftStep: 5,
    events: [
      { label: 'A famous athlete wears them', ds: 300 },
      { label: 'Factory delays', ss: -250 },
      { label: 'A rival drops a cheaper shoe', ds: -200 },
      { label: 'Materials get cheaper', ss: 200 },
    ],
  },
  {
    name: 'Pumpkins', unit: 'pumpkins', per: 'per week', cents: true,
    a: 1400, b: 100, d: 200, low: 2, pMax: 15, qMax: 1600, shiftStep: 10,
    events: [
      { label: 'The week before Halloween', ds: 400 },
      { label: 'Early frost ruins crops', ss: -300 },
      { label: 'Halloween is over', ds: -500 },
      { label: 'Farmers grow a huge crop', ss: 300 },
    ],
  },
];

/** Units buyers want and sellers offer at one price (never below zero). */
export function at(m, s, price) {
  const want = Math.max(0, m.a + s.ds - m.b * price);
  const offer = Math.max(0, m.d * (price - m.low) + s.ss);
  return { want, offer };
}

/** Where the curves cross. trades is false when no price works for both sides. */
export function equilibrium(m, s) {
  const price = (m.a + s.ds + m.d * m.low - s.ss) / (m.b + m.d);
  const qty = m.a + s.ds - m.b * price;
  return { price, qty, trades: price > 0 && qty > 0 };
}

export function initSupplyDemand(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let m = PRESETS[0];
  const state = { ds: 0, ss: 0, price: 0, control: false };
  const picked = new Set();

  const fmt = (p) => money(p, m.cents ? 2 : 0);
  const units = (q) => num(Math.round(q));
  const Unit = () => m.unit[0].toUpperCase() + m.unit.slice(1);

  // Sliders. Shifts and the locked price are sized per market, so the script sets their ranges.
  const syncDs = linkRange(root, 'sd-ds', { get: () => state.ds, set: (v) => manualShift('ds', v), allowNegative: true, fit: false });
  const syncSs = linkRange(root, 'sd-ss', { get: () => state.ss, set: (v) => manualShift('ss', v), allowNegative: true, fit: false });
  const syncPrice = linkRange(root, 'sd-price', { get: () => state.price, set: (v) => { state.price = v; render(); }, fit: false });

  function manualShift(k, v) {
    state[k] = v;
    picked.clear();
    markEvents();
    render();
  }

  // Market presets
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => loadMarket(p));

  function loadMarket(p) {
    m = p;
    state.ds = 0;
    state.ss = 0;
    picked.clear();
    buildEvents();
    const span = p.qMax / 2;
    ['sd-ds', 'sd-ss'].forEach((id) => {
      const range = $(`#${id}`);
      range.min = -span;
      range.max = span;
      range.step = p.shiftStep;
      $(`#${id}-n`).step = p.shiftStep;
    });
    const priceRange = $('#sd-price');
    priceRange.max = p.pMax;
    priceRange.step = p.cents ? 0.05 : 1;
    $('#sd-price-n').step = p.cents ? 0.05 : 1;
    r('ds-hint').textContent = `Extra ${p.unit} buyers want at every price. Below 0 means fewer.`;
    r('ss-hint').textContent = `Extra ${p.unit} sellers offer at every price. Below 0 means fewer.`;
    if (state.control) state.price = roundPrice(equilibrium(m, state).price);
    syncDs();
    syncSs();
    syncPrice();
    render();
  }

  const roundPrice = (p) => (m.cents ? Math.round(p * 20) / 20 : Math.round(p));

  // "What happened?" buttons toggle on and off; the shifts are the sum of the ones picked.
  function buildEvents() {
    const wrap = $('[data-events]');
    wrap.replaceChildren();
    m.events.forEach((e, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = e.label;
      b.addEventListener('click', () => {
        if (picked.has(i)) picked.delete(i);
        else picked.add(i);
        state.ds = 0;
        state.ss = 0;
        picked.forEach((j) => {
          state.ds += m.events[j].ds ?? 0;
          state.ss += m.events[j].ss ?? 0;
        });
        markEvents();
        syncDs();
        syncSs();
        render();
      });
      wrap.appendChild(b);
    });
    markEvents();
  }

  function markEvents() {
    [...$('[data-events]').children].forEach((b, i) => b.setAttribute('aria-pressed', String(picked.has(i))));
  }

  $('[data-reset]').addEventListener('click', () => {
    state.ds = 0;
    state.ss = 0;
    picked.clear();
    markEvents();
    syncDs();
    syncSs();
    render();
  });

  $('[data-control]').addEventListener('change', (e) => {
    state.control = e.target.checked;
    r('price-wrap').hidden = !state.control;
    if (state.control) {
      const eq = equilibrium(m, state);
      state.price = roundPrice(eq.trades ? eq.price : m.pMax / 2);
      syncPrice();
    }
    render();
  });

  function render() {
    const start = equilibrium(m, { ds: 0, ss: 0 });
    const eq = equilibrium(m, state);
    const shifted = state.ds !== 0 || state.ss !== 0;
    const v = r('verdict');

    if (state.control) {
      const { want, offer } = at(m, state, state.price);
      const sold = Math.min(want, offer);
      r('price-k').textContent = 'Locked price';
      r('price').textContent = fmt(state.price);
      r('qty-k').textContent = `${Unit()} sold`;
      r('qty').textContent = units(sold);
      r('c3-k').textContent = 'Buyers want';
      r('c3').textContent = units(want);
      r('c4-k').textContent = 'Sellers offer';
      r('c4').textContent = units(offer);
      const gap = want - offer;
      const close = Math.abs(gap) < Math.max(start.qty * 0.01, 1);
      if (close) {
        setTone(v, 'good');
        v.textContent = `Right at the market price. Nothing is left over and nobody goes without.`;
      } else if (gap > 0) {
        setTone(v, 'bad');
        v.textContent = `Shortage: at ${fmt(state.price)}, buyers want ${units(want)} ${m.unit} but sellers only offer ${units(offer)}. Buyers who want ${units(gap)} go without, and sellers know they could charge more.`;
      } else {
        setTone(v, 'warn');
        v.textContent = `Surplus: at ${fmt(state.price)}, sellers offer ${units(offer)} ${m.unit} but buyers only want ${units(want)}. ${units(-gap)} go unsold, so sellers would want to cut the price.`;
      }
      r('formula').innerHTML =
        `At a locked price of ${fmt(state.price)}:` +
        `<span>Buyers want = ${demandText()} = ${units(want)}</span>` +
        `<span>Sellers offer = ${supplyText()} = ${units(offer)}</span>` +
        `<span>${gap > 0 ? 'Shortage' : 'Surplus'} = ${units(Math.max(want, offer))} − ${units(Math.min(want, offer))} = ${units(Math.abs(gap))}</span>`;
    } else {
      r('price-k').textContent = 'Market price';
      r('qty-k').textContent = `${Unit()} sold`;
      r('c3-k').textContent = 'Price change';
      r('c4-k').textContent = 'Quantity change';
      if (!eq.trades) {
        r('price').textContent = '–';
        r('qty').textContent = '0';
        r('c3').textContent = '–';
        r('c4').textContent = '–';
        setTone(v, 'bad');
        v.textContent = 'No sales happen. The lowest price sellers will take is higher than any buyer will pay.';
        r('formula').innerHTML = `Buyers want = ${demandText()}<span>Sellers offer = ${supplyText()}</span><span>No price makes these equal with both above zero.</span>`;
      } else {
        r('price').textContent = fmt(eq.price);
        r('qty').textContent = units(eq.qty);
        r('c3').textContent = change(eq.price - start.price, start.price, fmt);
        r('c4').textContent = change(eq.qty - start.qty, start.qty, units);
        setTone(v, 'info');
        if (!shifted) {
          v.textContent = `The market starts in balance: at ${fmt(start.price)}, buyers want ${units(start.qty)} ${m.unit} ${m.per} and sellers offer ${units(start.qty)}. Pick something that happened.`;
        } else {
          v.textContent = `${shiftWords()} ${moveWords('Price', start.price, eq.price, fmt)}, and ${moveWords('quantity', start.qty, eq.qty, units)}.`;
        }
        r('formula').innerHTML =
          `Market price is where buyers want = sellers offer` +
          `<span>Buyers want = ${demandText()}</span>` +
          `<span>Sellers offer = ${supplyText()}</span>` +
          `<span>They match at ${fmt(eq.price)}, where both sides trade ${units(eq.qty)} ${m.unit}.</span>`;
      }
    }
    draw(start, eq, shifted);
  }

  const signed = (n) => (n > 0 ? ` + ${num(n)}` : n < 0 ? ` − ${num(-n)}` : '');
  const demandText = () => `${num(m.a)}${signed(state.ds)} − ${num(m.b)} × Price`;
  const supplyText = () => `${num(m.d)} × (Price − ${fmt(m.low)})${signed(state.ss)}`;

  function change(diff, base, f) {
    if (Math.abs(diff) < Math.abs(base) * 0.001) return 'No change';
    const pct = Math.round((diff / base) * 100);
    return `${diff > 0 ? '+' : '−'}${f(Math.abs(diff))} (${diff > 0 ? '+' : '−'}${Math.abs(pct)}%)`;
  }

  function shiftWords() {
    const parts = [];
    if (state.ds > 0) parts.push('Demand increased (the curve shifted right)');
    if (state.ds < 0) parts.push('Demand decreased (the curve shifted left)');
    if (state.ss > 0) parts.push('supply increased (the curve shifted right)');
    if (state.ss < 0) parts.push('supply decreased (the curve shifted left)');
    const text = parts.join(' and ');
    return `${text[0].toUpperCase()}${text.slice(1)}.`;
  }

  function moveWords(what, from, to, f) {
    if (Math.abs(to - from) < Math.abs(from) * 0.005) return `${what} stayed about the same at ${f(to)}`;
    return `${what} went ${to > from ? 'up' : 'down'} from ${f(from)} to ${f(to)}`;
  }

  function draw(start, eq, shifted) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 280 : 340, L = narrow ? 50 : 62, R = 14, T = 24, B = 44;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));

    // Axes stay put for each market. Only grow them if a big custom shift runs off the chart.
    let pMax = m.pMax, qMax = m.qMax;
    if (eq.trades && eq.price > pMax * 0.95) pMax = niceMax(eq.price * 1.15);
    if (eq.trades && eq.qty > qMax * 0.95) qMax = niceMax(eq.qty * 1.15);
    if (state.control && state.price > pMax) pMax = niceMax(state.price * 1.1);
    const x = (q) => L + (q / qMax) * (W - L - R);
    const y = (p) => T + (1 - p / pMax) * (H - T - B);

    const pStep = niceMax(pMax / 5);
    for (let p = 0; p <= pMax + 1e-9; p += pStep) {
      add('line', { x1: L, x2: W - R, y1: y(p), y2: y(p), style: `stroke:var(${p === 0 ? '--muted' : '--grid'})`, 'stroke-width': p === 0 ? 1.2 : 1 });
      add('text', { x: L - 6, y: y(p) + 4, 'text-anchor': 'end' }, money(p, pStep % 1 ? 2 : 0));
    }
    const qStep = niceMax(qMax / (narrow ? 3 : 5));
    add('line', { x1: L, x2: L, y1: T, y2: H - B, style: 'stroke:var(--muted)', 'stroke-width': 1.2 });
    for (let q = 0; q <= qMax + 1e-9; q += qStep) add('text', { x: x(q), y: H - B + 16, 'text-anchor': x(q) > W - R - 20 ? 'end' : 'middle' }, shortNum(q));
    add('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, `${Unit()} ${m.per}`);
    add('text', { x: 4, y: 13, 'text-anchor': 'start' }, 'Price');

    // A straight line Q = slope × P + k, clipped to the chart. Returns its two ends, or null.
    const seg = (slope, k) => {
      let lo = 0, hi = pMax;
      const a1 = (0 - k) / slope, a2 = (qMax - k) / slope;
      lo = Math.max(lo, Math.min(a1, a2));
      hi = Math.min(hi, Math.max(a1, a2));
      if (hi <= lo) return null;
      return [{ q: slope * lo + k, p: lo }, { q: slope * hi + k, p: hi }];
    };
    const demandSeg = (ds) => seg(-m.b, m.a + ds);
    const supplySeg = (ss) => seg(m.d, -m.d * m.low + ss);
    const line = (s, color, dashed) => {
      if (!s) return;
      const attrs = { x1: x(s[0].q), y1: y(s[0].p), x2: x(s[1].q), y2: y(s[1].p), style: `stroke:var(${dashed ? '--muted' : color})`, 'stroke-width': dashed ? 1.75 : 3, 'stroke-linecap': 'round' };
      if (dashed) attrs['stroke-dasharray'] = '6 5';
      add('line', attrs);
    };
    // Text with a halo in the panel color, so it stays readable where it crosses a line.
    const HALO = 'paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round';
    // Label each curve where the textbook does, on the side away from the line:
    // demand at its low end (it runs up to the left), supply at its high end (it runs down to the left).
    const tag = (s, text, color, kind) => {
      if (!s) return;
      const end = kind === 'demand' ? (s[0].p < s[1].p ? s[0] : s[1]) : (s[0].p > s[1].p ? s[0] : s[1]);
      const tx = x(end.q), ty = y(end.p);
      let ax, ay, anchor;
      if (kind === 'demand') {
        const roomRight = tx < W - R - 30;
        [ax, ay, anchor] = roomRight ? [tx + 6, ty - 6, 'start'] : [tx - 6, ty + 14, 'end'];
      } else {
        const roomLeft = tx - L > 34;
        [ax, ay, anchor] = roomLeft ? [tx - 8, ty - 8, 'end'] : [tx + 8, ty - 8, 'start'];
      }
      add('text', { x: ax, y: Math.min(Math.max(ay, T + 10), H - B - 6), 'text-anchor': anchor, style: `fill:var(${color});font-weight:700;font-size:13px;${HALO}` }, text);
    };

    if (state.ds !== 0) line(demandSeg(0), '--accent', true);
    if (state.ss !== 0) line(supplySeg(0), '--warn', true);
    const dNow = demandSeg(state.ds), sNow = supplySeg(state.ss);
    line(dNow, '--accent', false);
    line(sNow, '--warn', false);
    if (state.ds !== 0) tag(demandSeg(0), 'D1', '--muted', 'demand');
    if (state.ss !== 0) tag(supplySeg(0), 'S1', '--muted', 'supply');
    tag(dNow, state.ds !== 0 ? 'D2' : 'D', '--accent', 'demand');
    tag(sNow, state.ss !== 0 ? 'S2' : 'S', '--warn', 'supply');

    const guides = (q, p, color) => {
      add('line', { x1: L, x2: x(q), y1: y(p), y2: y(p), style: `stroke:var(${color})`, 'stroke-width': 1, 'stroke-dasharray': '2 4' });
      add('line', { x1: x(q), x2: x(q), y1: y(p), y2: H - B, style: `stroke:var(${color})`, 'stroke-width': 1, 'stroke-dasharray': '2 4' });
    };

    if (shifted && start.trades) add('circle', { cx: x(start.qty), cy: y(start.price), r: 5, style: 'fill:var(--panel);stroke:var(--muted)', 'stroke-width': 2 });

    if (state.control) {
      const { want, offer } = at(m, state, state.price);
      const yp = y(state.price);
      add('line', { x1: L, x2: W - R, y1: yp, y2: yp, style: 'stroke:var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });
      if (eq.trades) add('circle', { cx: x(eq.qty), cy: y(eq.price), r: 5, style: 'fill:var(--panel);stroke:var(--ink)', 'stroke-width': 2 });
      const gap = Math.abs(want - offer);
      if (gap >= Math.max(start.qty * 0.01, 1)) {
        const x1 = x(Math.min(want, offer, qMax)), x2 = x(Math.min(Math.max(want, offer), qMax));
        const color = want > offer ? '--bad' : '--warn';
        add('line', { x1, x2, y1: yp, y2: yp, style: `stroke:var(${color})`, 'stroke-width': 6, 'stroke-linecap': 'round' });
        const above = yp > T + 30;
        add('text', { x: (x1 + x2) / 2, y: above ? yp - 10 : yp + 20, 'text-anchor': 'middle', style: `fill:var(${color});font-weight:700;${HALO}` }, `${want > offer ? 'Shortage' : 'Surplus'} ${units(gap)}`);
      }
      add('text', { x: W - R, y: yp - 6 > T ? yp - 6 : yp + 16, 'text-anchor': 'end', style: `fill:var(--ink);font-weight:600;${HALO}` }, `Locked at ${fmt(state.price)}`);
      svg.setAttribute('aria-label', `Supply and demand chart. At a locked price of ${fmt(state.price)}, buyers want ${units(want)} and sellers offer ${units(offer)}.`);
    } else if (eq.trades) {
      guides(eq.qty, eq.price, '--ink');
      add('circle', { cx: x(eq.qty), cy: y(eq.price), r: 6, style: 'fill:var(--ink);stroke:var(--panel)', 'stroke-width': 2 });
      // Market price on the price axis, quantity on the quantity axis.
      add('text', { x: L + 6, y: y(eq.price) - 6, 'text-anchor': 'start', style: `fill:var(--ink);font-weight:600;${HALO}` }, fmt(eq.price));
      add('text', { x: x(eq.qty) + 6, y: H - B - 6, 'text-anchor': x(eq.qty) > W - R - 60 ? 'end' : 'start', style: `fill:var(--ink);font-weight:600;${HALO}` }, units(eq.qty));
      svg.setAttribute('aria-label', `Supply and demand chart. The curves cross at ${fmt(eq.price)} and ${units(eq.qty)} ${m.unit}.`);
    } else {
      svg.setAttribute('aria-label', 'Supply and demand chart. The curves do not cross, so no sales happen.');
    }
  }

  const shortNum = (q) => (q >= 10000 ? `${+(q / 1000).toFixed(1)}K` : num(q));

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  loadMarket(PRESETS[0]);
}
