// Positioning Map Lab
// A perceptual map: price across, a quality-like feature up. Rival brands and groups of customers
// sit on it. Students place a new brand and see how many customers it would win.
//
// How customers choose (simple on purpose, explained in the teacher notes):
//   - A customer group only considers brands within REACH of where it sits on the map.
//   - It splits among those brands by weight ÷ (distance + 0.5)², so closer brands get more.
//   - Established brands have LOYAL times the weight of a new one: they already have regulars.
// So a brand that sits right on a crowded group gets a slice, and a brand that fills an empty
// spot where customers are waiting gets the whole group.

import { num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

export const REACH = 3;
export const LOYAL = 3;
/** Feature this much higher than price (on the 0–10 scale) is hard to make at a profit. */
export const STRETCH = 5;
export const START = { x: 9, y: 2 };

export const MARKETS = [
  {
    name: 'Pizza in town', feature: 'Quality', low: 'Basic', high: 'Premium',
    brands: [
      { name: 'Slice Shack', x: 2, y: 2.5, label: 'r' },
      { name: 'Planet Pie', x: 3.5, y: 4, label: 'b' },
      { name: 'Crust & Co.', x: 6, y: 5, label: 'r' },
      { name: 'Brick Oven Bros.', x: 8.5, y: 9, label: 'b' },
    ],
    segments: [
      { name: 'Budget students', x: 2, y: 2, size: 300 },
      { name: 'Families', x: 4, y: 4.5, size: 400 },
      { name: 'Date night', x: 8, y: 8.5, size: 200 },
      { name: 'Good pizza, fair price', x: 4.5, y: 8, size: 350 },
    ],
  },
  {
    name: 'Snack bars', feature: 'Healthiness', low: 'Treat', high: 'Healthy',
    brands: [
      { name: 'ChocoCrunch', x: 2.5, y: 2, label: 'b' },
      { name: 'Sweet Stack', x: 3, y: 3, label: 'r' },
      { name: 'Harvest Oat', x: 6.5, y: 5.5, label: 'r' },
      { name: 'Peak Protein', x: 8.5, y: 8.5, label: 'b' },
    ],
    segments: [
      { name: 'After-school treat', x: 2.5, y: 2.5, size: 450 },
      { name: 'Busy parents', x: 6, y: 5, size: 250 },
      { name: 'Gym regulars', x: 8, y: 8, size: 200 },
      { name: 'Healthy on a budget', x: 3.5, y: 7.5, size: 300 },
    ],
  },
  {
    name: 'Running shoes', feature: 'Performance', low: 'Casual', high: 'Race-ready',
    brands: [
      { name: 'Stride', x: 2, y: 3, label: 'b' },
      { name: 'Volt', x: 8, y: 8.5, label: 'l' },
      { name: 'Apex', x: 8.5, y: 9, label: 'r' },
      { name: 'Summit', x: 9, y: 8, label: 'b' },
    ],
    segments: [
      { name: 'Everyday walkers', x: 2.5, y: 3, size: 350 },
      { name: 'Serious racers', x: 8.5, y: 8.5, size: 250 },
      { name: 'New runners', x: 5, y: 6.5, size: 400 },
    ],
  },
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const listOf = (a) => (a.length < 3 ? a.join(' and ') : `${a.slice(0, -1).join(', ')}, and ${a.at(-1)}`);

/** Who wins each customer group, with your brand at `you` (or no brand of yours if `you` is null). */
export function compete(market, you) {
  const brands = market.brands.map((b) => ({ ...b, weight: LOYAL }));
  if (you) brands.push({ name: 'You', x: you.x, y: you.y, weight: 1, you: true });
  const won = new Map(brands.map((b) => [b.name, 0]));
  const groups = market.segments.map((s) => {
    const w = brands.map((b) => (dist(b, s) <= REACH ? b.weight / (dist(b, s) + 0.5) ** 2 : 0));
    const total = w.reduce((a, b) => a + b, 0);
    const split = brands.map((b, i) => (total ? (s.size * w[i]) / total : 0));
    brands.forEach((b, i) => won.set(b.name, won.get(b.name) + split[i]));
    const rivals = brands.filter((b, i) => !b.you && split[i] > 0).map((b) => b.name);
    return { ...s, split, youGet: you ? split.at(-1) : 0, unserved: total ? 0 : s.size, rivals };
  });
  const total = market.segments.reduce((t, s) => t + s.size, 0);
  const yours = you ? won.get('You') : 0;
  const nearest = market.brands.reduce((best, b) => (!best || dist(b, you ?? b) < dist(best, you ?? best) ? b : best), null);
  return {
    total,
    yours,
    share: total ? yours / total : 0,
    unserved: groups.reduce((t, g) => t + g.unserved, 0),
    groups,
    won,
    nearest,
    nearestDist: you && nearest ? dist(nearest, you) : NaN,
    stretch: you ? you.y - you.x >= STRETCH : false,
  };
}

export function initPositioningMap(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let market = MARKETS[0];
  const pos = { ...START };

  const syncs = ['x', 'y'].map((k) =>
    linkRange(root, `pm-${k}`, {
      get: () => pos[k],
      set: (v) => {
        pos[k] = Math.min(10, v);
        render();
      },
      max: 10,
      fit: false,
    })
  );
  const setActive = presetButtons($('[data-presets]'), MARKETS, (m) => {
    market = m;
    Object.assign(pos, START);
    syncs.forEach((s) => s());
    render();
  });

  // Click the map to move there: same events as typing in the boxes, so share links follow.
  $('[data-chart]').addEventListener('click', (e) => {
    const svg = e.currentTarget;
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const px = ((e.clientX - box.left) / box.width) * vb.width;
    const py = ((e.clientY - box.top) / box.height) * vb.height;
    const { L, R, T, B, W, H } = geom;
    if (px < L || px > W - R || py < T || py > H - B) return;
    const snap = (v) => Math.round(Math.min(10, Math.max(0, v)) * 2) / 2;
    const to = { x: snap(((px - L) / (W - L - R)) * 10), y: snap((1 - (py - T) / (H - T - B)) * 10) };
    for (const k of ['x', 'y']) {
      const input = $(`#pm-${k}-n`);
      input.value = to[k];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  let geom = {};

  function render() {
    r('y-label').textContent = market.feature;
    r('y-hint').textContent = `0 = ${market.low.toLowerCase()}, 10 = ${market.high.toLowerCase()}.`;
    const c = compete(market, pos);
    r('won').textContent = num(Math.round(c.yours));
    r('share').textContent = `${Math.round(c.share * 100)}%`;
    r('rival').textContent = c.nearest ? `${c.nearest.name}` : '–';
    r('unserved').textContent = num(c.unserved);
    setTone(r('won-box'), c.yours < 1 ? 'bad' : c.stretch ? 'warn' : '');

    const best = [...c.groups].sort((a, b) => b.youGet - a.youGet)[0];
    const v = r('verdict');
    if (c.yours < 1) {
      setTone(v, 'bad');
      v.textContent = `No customers are close enough to this spot. ${c.stretch ? 'And this much ' + market.feature.toLowerCase() + ' at this price would be hard to afford. ' : ''}An empty spot on the map is only worth filling if people want what you'd sell there.`;
    } else if (c.stretch) {
      setTone(v, 'warn');
      v.textContent = `You'd win ${num(Math.round(c.yours))} customers, but this much ${market.feature.toLowerCase()} at this low a price is hard to afford. Could you make it for less than you charge?`;
    } else if (best.youGet >= best.size * 0.9) {
      setTone(v, 'good');
      v.textContent = `You own "${best.name}": ${num(best.size)} customers that no other brand is close to. That's a real gap in the market.`;
    } else {
      setTone(v, 'warn');
      v.textContent = `You win ${num(Math.round(c.yours))} customers, mostly from "${best.name}", but you're splitting them with ${listOf(best.rivals)}. Established brands keep most of their regulars.`;
    }

    draw(c);
  }

  function draw(c) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 640);
    const narrow = W < 460;
    const H = Math.round(W * (narrow ? 1.25 : 0.78));
    const L = narrow ? 30 : 38, R = 10, T = 24, B = narrow ? 30 : 34;
    geom = { L, R, T, B, W, H };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const x = (v) => L + (v / 10) * (W - L - R);
    const y = (v) => T + (1 - v / 10) * (H - T - B);
    const unit = (W - L - R) / 10;
    const halo = { stroke: 'var(--panel)', 'stroke-width': 4, 'stroke-linejoin': 'round', 'paint-order': 'stroke' };
    const fs = narrow ? 9.5 : 12;

    for (let k = 0; k <= 10; k += 2) {
      add('line', { x1: x(k), x2: x(k), y1: y(0), y2: y(10), stroke: 'var(--grid)', 'stroke-width': 1 });
      add('line', { x1: x(0), x2: x(10), y1: y(k), y2: y(k), stroke: 'var(--grid)', 'stroke-width': 1 });
      add('text', { x: x(k), y: H - B + 14, 'text-anchor': 'middle' }, String(k));
      add('text', { x: L - 6, y: y(k) + 4, 'text-anchor': 'end' }, String(k));
    }
    add('text', { x: x(0), y: H - 4, 'text-anchor': 'start' }, '← Lower price');
    add('text', { x: x(10), y: H - 4, 'text-anchor': 'end' }, 'Higher price →');
    add('text', { x: x(0) + 4, y: y(10) + 12, style: `font-size:${fs}px` }, `↑ ${market.high}`);
    add('text', { x: x(0) + 4, y: y(0) - 6, style: `font-size:${fs}px` }, `↓ ${market.low}`);

    // Customer groups: bubble size shows how many customers.
    for (const g of c.groups) {
      const rad = Math.sqrt(g.size) * unit * 0.05;
      const mine = g.youGet >= 1;
      add('circle', { cx: x(g.x), cy: y(g.y), r: rad, style: `fill:var(--accent);fill-opacity:${mine ? 0.28 : 0.1};stroke:var(--accent);stroke-opacity:0.55`, 'stroke-dasharray': g.rivals.length || mine ? '' : '4 3' });
      const above = y(g.y) - rad - fs - 8 >= fs + 2;
      const ny = above ? y(g.y) - rad - fs - 8 : y(g.y) + rad + fs + 2;
      add('text', { x: x(g.x), y: ny, 'text-anchor': 'middle', ...halo, style: `fill:var(--ink);font-family:var(--font-sans);font-weight:600;font-size:${fs}px` }, g.name);
      add('text', { x: x(g.x), y: ny + fs + 3, 'text-anchor': 'middle', ...halo, style: `fill:var(${mine ? '--accent' : '--muted'});font-weight:${mine ? 700 : 400};font-size:${fs}px` }, mine ? `you: ${num(Math.round(g.youGet))} of ${num(g.size)}` : narrow ? num(g.size) : `${num(g.size)} customers`);
    }
    // Rival brands
    for (const b of market.brands) {
      add('rect', { x: x(b.x) - 5, y: y(b.y) - 5, width: 10, height: 10, rx: 2, style: 'fill:var(--muted)', transform: `rotate(45 ${x(b.x)} ${y(b.y)})` });
      const at = { r: [9, 4, 'start'], l: [-9, 4, 'end'], t: [0, -10, 'middle'], b: [0, 18, 'middle'] }[b.label || 'r'];
      add('text', { x: x(b.x) + at[0], y: y(b.y) + at[1], 'text-anchor': at[2], ...halo, style: `fill:var(--muted);font-family:var(--font-sans);font-size:${fs}px` }, b.name);
    }
    // Your brand and how far customers will look
    const clip = svgEl('clipPath', { id: 'pm-plot' });
    clip.appendChild(svgEl('rect', { x: x(0), y: y(10), width: x(10) - x(0), height: y(0) - y(10) }));
    svg.prepend(clip);
    add('circle', { cx: x(pos.x), cy: y(pos.y), r: REACH * unit, 'clip-path': 'url(#pm-plot)', style: 'fill:none;stroke:var(--accent);stroke-opacity:0.5', 'stroke-dasharray': '2 4' });
    add('circle', { cx: x(pos.x), cy: y(pos.y), r: 9, style: 'fill:var(--accent);stroke:var(--panel);stroke-width:2.5' });
    add('text', { x: x(pos.x), y: y(pos.y) + 4, 'text-anchor': 'middle', style: 'fill:var(--panel);font-family:var(--font-sans);font-weight:700;font-size:10px' }, 'You');

    const owned = c.groups.filter((g) => g.youGet >= 1).map((g) => `${num(Math.round(g.youGet))} of ${num(g.size)} ${g.name.toLowerCase()}`);
    svg.setAttribute('aria-label',
      `${market.name} positioning map, price across and ${market.feature.toLowerCase()} up, both 0 to 10. ` +
      `Rival brands: ${market.brands.map((b) => `${b.name} at price ${b.x}, ${market.feature.toLowerCase()} ${b.y}`).join('; ')}. ` +
      `Customer groups: ${c.groups.map((g) => `${g.name}, ${num(g.size)} customers, at ${g.x}, ${g.y}`).join('; ')}. ` +
      `Your brand is at price ${pos.x}, ${market.feature.toLowerCase()} ${pos.y}${owned.length ? `, winning ${owned.join(' and ')}` : ', winning no customers'}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
