// Product Life Cycle Lab
// Four products, each at a different stage. For each one, students:
//   1. name the stage from two years of sales plus a few facts,
//   2. try marketing moves and watch next year's sales respond (any number of tries),
//   3. pick a production decision for that stage.
// Each product lands on a classic life cycle curve as students go.
// The data are made up for teaching: realistic shapes, round numbers.

import { money, num, svgEl, setTone, wireReveals, fitWidth, onWidthChange, niceMax } from '../lib/util.js';

export const STAGES = {
  intro: { name: 'Introduction', signs: 'few sales, slow growth, losing money, almost no competitors' },
  growth: { name: 'Growth', signs: 'sales climbing fast, profit turning positive, competitors arriving' },
  maturity: { name: 'Maturity', signs: 'sales leveling off, lots of competitors, profits getting squeezed' },
  decline: { name: 'Decline', signs: 'sales and profit falling, competitors leaving' },
};
export const STAGE_IDS = Object.keys(STAGES);

// sales: units sold each quarter for the last 8 quarters. profit: dollars, last quarter.
// moves[].next: units sold in the next 4 quarters if the business makes that move.
export const PRODUCTS = [
  {
    name: 'Sleep-tracking smart ring',
    about: 'A ring that tracks sleep and sends tips to your phone. It launched two years ago at $299.',
    sales: [2000, 2000, 3000, 3000, 3000, 4000, 4000, 4000],
    profit: -180000, profitBefore: -400000, competitors: '1',
    stage: 'intro',
    moves: [
      { text: 'Run ads that explain what the ring does and why sleep data matters', best: true, next: [6000, 8000, 11000, 15000],
        why: 'Most people have never heard of a smart ring. Until they know what it does, they won\'t look for one. Explaining the product is the main job in introduction.' },
      { text: 'Cut the price in half to $149 to sell more', next: [5000, 5000, 6000, 6000],
        why: 'Sales barely move, and every ring now loses more money. People who don\'t know what the product is won\'t buy it at any price.' },
      { text: 'Run ads comparing it to the competition', next: [4000, 5000, 5000, 5000],
        why: 'There\'s only one competitor, and most shoppers don\'t know either one exists. You can\'t win a comparison nobody is making yet.' },
    ],
    ops: [
      { text: 'Make small batches and fix the problems early customers report', best: true,
        why: 'Sales are small and still uncertain. Small batches keep costs down and let the company improve the ring before it scales.' },
      { text: 'Build a huge production run now so you\'re ready for demand', why: 'Demand isn\'t there yet. A warehouse full of unsold rings ties up money the company needs for marketing.' },
      { text: 'Stop making it until sales pick up', why: 'Every new product starts slowly. With nothing to sell, sales can\'t pick up.' },
    ],
  },
  {
    name: 'Plant-based chicken nuggets',
    about: 'Frozen nuggets made from plants, sold in grocery stores and a few restaurant chains.',
    sales: [20000, 26000, 35000, 46000, 60000, 78000, 100000, 128000],
    profit: 520000, profitBefore: 110000, competitors: '9, up from 2 a year ago',
    stage: 'growth',
    moves: [
      { text: 'Get into more stores and restaurants, and build the brand so shoppers pick yours', best: true, next: [160000, 195000, 230000, 262000],
        why: 'Demand is booming and competitors are arriving. Growth is the time to win shelf space and make shoppers choose your brand before rivals lock it up.' },
      { text: 'Raise the price a lot while demand is hot', next: [130000, 128000, 124000, 120000],
        why: 'Seven new competitors are on the shelf next to you. A big price jump sends new customers straight to them.' },
      { text: 'Cut advertising to save money, since sales are growing anyway', next: [140000, 148000, 152000, 155000],
        why: 'Growth slows while competitors keep advertising and grab the shelf space you could have had.' },
    ],
    ops: [
      { text: 'Scale up: add production lines so you never run out', best: true,
        why: 'Sales more than doubled in a year. Running out of stock is the fastest way to lose a store to a competitor.' },
      { text: 'Keep the same small kitchen and see if demand lasts', why: 'Stores need reliable deliveries. If you can\'t fill orders, they hand your freezer space to a rival.' },
      { text: 'Make less and focus on the most profitable stores', why: 'That shrinks the business in its best years. Growth is when you build the volume that pays off later.' },
    ],
  },
  {
    name: 'Sports drink',
    about: 'A well-known sports drink sold everywhere, from gas stations to stadiums.',
    sales: [500000, 505000, 498000, 502000, 499000, 503000, 497000, 500000],
    profit: 790000, profitBefore: 850000, competitors: '25',
    stage: 'maturity',
    moves: [
      { text: 'Launch new flavors and a rewards app to win customers from rivals and keep your own', best: true, next: [510000, 520000, 526000, 530000],
        why: 'Everyone already knows what a sports drink is, so growth has to come from rivals. New flavors and loyalty rewards give people a reason to switch to you and stay.' },
      { text: 'Run big ads explaining what a sports drink is', next: [500000, 499000, 500000, 498000],
        why: 'Nothing changes. Everyone already knows the product. Explaining it is an introduction-stage move.' },
      { text: 'Cut the price 30% to grab market share', next: [540000, 550000, 520000, 505000],
        why: 'Sales jump at first, then rivals match the price and sales slide back. Now everyone sells at a lower price and earns less.' },
    ],
    ops: [
      { text: 'Find cheaper ways to make and ship it', best: true,
        why: 'With flat sales and 25 competitors, prices can\'t go up. Cutting costs is how a mature product protects its profit.' },
      { text: 'Build a second factory to double production', why: 'Sales are flat. Twice the capacity for the same customers means half of it sits idle.' },
      { text: 'Stop making it and move on to something new', why: 'It still sells half a million bottles a quarter at a profit. A mature product can pay the bills for years.' },
    ],
  },
  {
    name: 'DVD player',
    about: 'A basic DVD player. Most people now stream movies instead.',
    sales: [300000, 270000, 240000, 205000, 175000, 150000, 125000, 100000],
    profit: 45000, profitBefore: 170000, competitors: '6, down from 15 a few years ago',
    stage: 'decline',
    moves: [
      { text: 'Cut ad spending way down and sell to the loyal customers who still want one', best: true, next: [80000, 64000, 50000, 40000],
        why: 'Sales keep falling, but with almost no ad spending each player still earns a profit. Decline is about getting the most from what\'s left, not fighting the trend.' },
      { text: 'Launch a big ad campaign to bring DVD players back', next: [105000, 98000, 88000, 76000],
        why: 'Ads slow the fall a little but can\'t beat streaming. The campaign costs far more than the few extra sales bring in.' },
      { text: 'Add new features like Wi-Fi to restart growth', next: [98000, 90000, 80000, 70000],
        why: 'The redesign costs a lot, and the people who want new features already stream. It doesn\'t change the trend.' },
    ],
    ops: [
      { text: 'Sell off inventory and plan when to stop making it', best: true,
        why: 'Keep production lean, sell what\'s on hand, and pick a date to stop. That frees money and factory space for newer products.' },
      { text: 'Build up a big inventory in case sales come back', why: 'Sales are falling every quarter. Extra inventory will likely sit unsold and get marked down.' },
      { text: 'Buy a faster production line', why: 'Spending on new equipment for a product that sells less every quarter rarely pays back.' },
    ],
  },
];

/** Sales change from four quarters ago, as a fraction. */
export const yearChange = (sales) => sales[sales.length - 1] / sales[sales.length - 5] - 1;

// Where each stage sits on the classic curve (fraction of the way along), for placing products.
const CURVE_AT = { intro: 0.12, growth: 0.36, maturity: 0.6, decline: 0.86 };

const units = (n) => `${num(n)} units`;
const pct = (f) => {
  const n = Math.round(Math.abs(f) * 100);
  return n === 0 ? 'About the same' : `${f > 0 ? '+' : '−'}${n}%`;
};

export function initProductLifeCycle(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const optsEl = r('options');
  const STEPS = ['stage', 'move', 'ops'];
  const STEP_LEGEND = {
    stage: 'Which stage is this product in?',
    move: 'Pick a marketing move, then see what happens to sales next year.',
    ops: 'Pick a production decision for this stage.',
  };

  let item, step, tries, tried, phase, results, placed, shown;

  $('[data-act="check"]').addEventListener('click', check);
  $('[data-act="reveal"]').addEventListener('click', reveal);
  $('[data-act="next"]').addEventListener('click', next);
  $('[data-act="restart"]').addEventListener('click', reset);
  optsEl.addEventListener('change', () => setFeedback('', ''));

  function reset() {
    item = 0;
    results = PRODUCTS.map(() => ({}));
    placed = [];
    startItem();
  }

  function startItem() {
    step = 0;
    shown = null;
    const p = PRODUCTS[item];
    r('name').textContent = p.name;
    r('about').textContent = p.about;
    r('f-sales').textContent = units(p.sales.at(-1));
    r('f-change').textContent = pct(yearChange(p.sales));
    r('f-profit').textContent = money(p.profit, 0);
    r('f-profit-before').textContent = `a year ago: ${money(p.profitBefore, 0)}`;
    r('f-comp').textContent = p.competitors;
    startStep();
    drawProduct();
    drawCurve();
  }

  function startStep() {
    phase = 'ask';
    tries = 0;
    tried = new Set();
    const p = PRODUCTS[item];
    const s = STEPS[step];
    r('progress').textContent = `Product ${item + 1} of ${PRODUCTS.length}: ${['Name the stage', 'Try a marketing move', 'Plan production'][step]}`;
    r('bar').style.width = `${((item * 3 + step) / (PRODUCTS.length * 3)) * 100}%`;
    r('legend').textContent = STEP_LEGEND[s];
    const opts = s === 'stage' ? STAGE_IDS.map((id) => ({ id, text: STAGES[id].name })) : p[s === 'move' ? 'moves' : 'ops'].map((o, i) => ({ id: String(i), text: o.text }));
    optsEl.replaceChildren(...opts.map((o) => {
      const label = document.createElement('label');
      label.className = 'flex items-start gap-2.5 py-2 px-2.5 rounded-md border border-line cursor-pointer text-[14.5px] leading-snug hover:border-accent has-checked:border-accent has-checked:bg-accent/8 has-disabled:cursor-default tone-good:border-good tone-good:bg-good-soft tone-bad:border-bad tone-bad:bg-bad-soft';
      label.innerHTML = `<input type="radio" name="plc-opt" value="${o.id}" class="accent-accent w-4 h-4 mt-0.5 mx-0 mb-0 shrink-0" /> <span></span>`;
      label.querySelector('span').textContent = o.text;
      return label;
    }));
    $('[data-act="check"]').textContent = s === 'move' ? 'See what happens' : 'Check';
    setFeedback('', '');
    r('why').hidden = true;
    buttons();
  }

  function buttons() {
    const asking = phase === 'ask';
    $('[data-act="check"]').hidden = !asking;
    $('[data-act="reveal"]').hidden = !asking;
    $('[data-act="reveal"]').textContent = STEPS[step] === 'move' ? 'Show the best move' : 'Show answer';
    const nb = $('[data-act="next"]');
    nb.hidden = phase !== 'answered';
    nb.textContent = step < 2 ? 'Next step' : item < PRODUCTS.length - 1 ? 'Next product' : 'See the whole life cycle';
    $('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  const picked = () => optsEl.querySelector('input:checked')?.value;
  const labelFor = (id) => optsEl.querySelector(`input[value="${id}"]`)?.closest('label');

  function check() {
    if (phase !== 'ask') return;
    const id = picked();
    if (id === undefined) {
      setFeedback('bad', 'Pick one first.');
      return;
    }
    const p = PRODUCTS[item];
    const s = STEPS[step];
    if (s === 'stage') {
      const ok = id === p.stage;
      if (!tries) results[item].stage = ok;
      tries++;
      setTone(labelFor(id), ok ? 'good' : 'bad');
      if (ok) return answer('good', `Correct: ${STAGES[p.stage].name}.`, `Signs of ${STAGES[p.stage].name.toLowerCase()}: ${STAGES[p.stage].signs}.`);
      const msg = `Not quite. ${STAGES[id].name} looks like this: ${STAGES[id].signs}. Compare that with the sales trend, the profit, and the competitors.`;
      return setFeedback('bad', tries > 1 ? `${msg} The answer is ${STAGES[p.stage].name}.` : msg);
    }
    if (s === 'move') {
      const m = p.moves[+id];
      if (!tried.size) results[item].move = !!m.best;
      tried.add(id);
      setTone(labelFor(id), m.best ? 'good' : 'bad');
      shown = m;
      drawProduct();
      const change = m.next.at(-1) / p.sales.at(-1) - 1;
      setFeedback(m.best ? 'good' : 'bad', `${m.best ? 'Best move.' : 'Not the best move.'} Sales a year from now: ${units(m.next.at(-1))} (${pct(change)}). ${m.why}`);
      if (m.best) return answer(null);
      if (tried.size > 1) setFeedback('bad', `${r('feedback').textContent} Try another, or show the best move.`);
      return;
    }
    const o = p.ops[+id];
    if (!tries) results[item].ops = !!o.best;
    tries++;
    setTone(labelFor(id), o.best ? 'good' : 'bad');
    if (o.best) return answer('good', 'Good call.', o.why);
    const best = p.ops.find((x) => x.best);
    setFeedback('bad', `${o.why}${tries > 1 ? ` The better call: ${best.text.charAt(0).toLowerCase()}${best.text.slice(1)}.` : ''}`);
  }

  function reveal() {
    const p = PRODUCTS[item];
    const s = STEPS[step];
    if (s === 'stage') {
      if (!tries) results[item].stage = false;
      labelFor(p.stage).querySelector('input').checked = true;
      setTone(labelFor(p.stage), 'good');
      return answer('info', `It's ${STAGES[p.stage].name}.`, `Signs of ${STAGES[p.stage].name.toLowerCase()}: ${STAGES[p.stage].signs}.`);
    }
    const list = s === 'move' ? p.moves : p.ops;
    const i = list.findIndex((x) => x.best);
    if (s === 'move') {
      if (!tried.size) results[item].move = false;
      shown = list[i];
      drawProduct();
    } else if (!tries) results[item].ops = false;
    labelFor(String(i)).querySelector('input').checked = true;
    setTone(labelFor(String(i)), 'good');
    answer('info', s === 'move' ? `Best move: sales a year from now would be ${units(list[i].next.at(-1))}.` : 'Here\'s the better call.', list[i].why);
  }

  // Lock the options and show the explanation. tone null keeps the feedback that's already showing.
  function answer(tone, msg, why) {
    phase = 'answered';
    optsEl.querySelectorAll('input').forEach((el) => (el.disabled = true));
    if (tone) setFeedback(tone, msg);
    r('why').hidden = !why;
    r('why').textContent = why || '';
    if (STEPS[step] === 'stage' && !placed.includes(item)) {
      placed.push(item);
      drawCurve();
    }
    buttons();
    $('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < 2) {
      step++;
      startStep();
      optsEl.querySelector('input')?.focus({ preventScroll: true });
      return;
    }
    if (item < PRODUCTS.length - 1) {
      item++;
      startItem();
      optsEl.querySelector('input')?.focus({ preventScroll: true });
      return;
    }
    phase = 'done';
    r('bar').style.width = '100%';
    r('progress').textContent = 'All four products done';
    const count = (k) => results.filter((x) => x[k]).length;
    r('name').textContent = 'The whole life cycle';
    r('about').textContent = `First tries: you named ${count('stage')} of 4 stages, picked ${count('move')} of 4 best marketing moves, and made ${count('ops')} of 4 best production calls. The same product needs different decisions at different ages.`;
    setFeedback('', '');
    r('why').hidden = true;
    buttons();
    $('[data-r="curve-panel"]').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function setFeedback(tone, msg) {
    const el = r('feedback');
    setTone(el, tone);
    el.textContent = msg;
    el.hidden = !msg;
  }

  // Two years of sales, plus next year's if a move has been tried.
  function drawProduct() {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const p = PRODUCTS[item];
    const W = fitWidth(svg.parentElement, 280, 640);
    const H = W < 420 ? 210 : 240;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const all = [...p.sales, ...p.moves.flatMap((m) => m.next)];
    const yMax = niceMax(Math.max(...all) * 1.05);
    const L = 58, R = 12, T = 12, B = 30, Q = 12;
    const x = (i) => L + (i / (Q - 1)) * (W - L - R);
    const y = (v) => T + (1 - v / yMax) * (H - T - B);
    const short = (v) => (v >= 1e6 ? `${num(v / 1e6, v % 1e6 ? 1 : 0)}M` : v >= 1000 ? `${num(Math.round(v / 1000))}k` : num(v));
    for (let k = 0; k <= 4; k++) {
      const v = (yMax / 4) * k;
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: 'var(--grid)', 'stroke-width': 1 });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, short(v));
    }
    add('rect', { x: x(7.5), y: T, width: W - R - x(7.5), height: H - T - B, style: 'fill:var(--bg)' });
    add('text', { x: x(7.5) + 6, y: T + 12 }, 'next year');
    ['Year 1', 'Year 2', 'Next year'].forEach((t, k) => add('text', { x: x(k * 4 + 1.5), y: H - B + 18, 'text-anchor': 'middle' }, t));
    add('polyline', { points: p.sales.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    p.sales.forEach((v, i) => add('circle', { cx: x(i), cy: y(v), r: 3, fill: 'var(--accent)' }));
    if (shown) {
      const pts = [p.sales.at(-1), ...shown.next].map((v, i) => `${x(i + 7)},${y(v)}`).join(' ');
      add('polyline', { points: pts, fill: 'none', stroke: `var(${shown.best ? '--good' : '--bad'})`, 'stroke-width': 2.5, 'stroke-dasharray': '6 4', 'stroke-linejoin': 'round' });
      add('text', { x: W - R - 2, y: Math.max(y(shown.next.at(-1)) - 8, T + 26), 'text-anchor': 'end', stroke: 'var(--panel)', 'stroke-width': 4, 'paint-order': 'stroke', style: `fill:var(${shown.best ? '--good' : '--bad'});font-weight:600` }, short(shown.next.at(-1)));
    }
    svg.setAttribute('aria-label', `${p.name} sales by quarter for two years: ${p.sales.map(short).join(', ')} units.` +
      (shown ? ` With this move, next year's quarters would be ${shown.next.map(short).join(', ')}.` : ''));
  }

  // The classic curve, with each product placed once its stage has been named.
  function drawCurve() {
    const svg = $('[data-curve]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 1000);
    const narrow = W < 560;
    const H = narrow ? 220 : 250;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const L = 14, R = 14, T = 30, B = 26;
    const x = (f) => L + f * (W - L - R);
    const zero = T + (H - T - B) * 0.78;
    const y = (v) => zero - v * (zero - T);
    // Sales: an S-curve up, a plateau, a slide down. Profit: below zero early, peaks in late growth, falls sooner.
    const sales = (f) => (f < 0.72 ? 1 / (1 + Math.exp(-14 * (f - 0.3))) : 1 / (1 + Math.exp(-14 * (0.72 - 0.3))) * (1 - 2.2 * (f - 0.72) ** 2 * 3));
    const profit = (f) => 0.62 * Math.exp(-((f - 0.48) ** 2) / 0.035) - 0.22 * Math.exp(-((f - 0.06) ** 2) / 0.01) - 0.05;
    const bounds = [0, 0.24, 0.48, 0.72, 1];
    STAGE_IDS.forEach((id, k) => {
      if (k % 2) add('rect', { x: x(bounds[k]), y: T - 22, width: x(bounds[k + 1]) - x(bounds[k]), height: H - T - B + 22, style: 'fill:var(--bg)' });
      add('text', { x: (x(bounds[k]) + x(bounds[k + 1])) / 2, y: T - 8, 'text-anchor': 'middle', style: `fill:var(--ink);font-weight:600;font-size:${narrow ? 11 : 12.5}px;font-family:var(--font-sans)` }, STAGES[id].name);
    });
    add('line', { x1: L, x2: W - R, y1: zero, y2: zero, stroke: 'var(--ink)', 'stroke-width': 1 });
    add('text', { x: W - R, y: H - 6, 'text-anchor': 'end' }, 'Time →');
    const path = (fn) => Array.from({ length: 101 }, (_, i) => `${x(i / 100)},${y(fn(i / 100))}`).join(' ');
    add('polyline', { points: path(sales), fill: 'none', stroke: 'var(--accent)', 'stroke-width': 3 });
    add('polyline', { points: path(profit), fill: 'none', stroke: 'var(--good)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    for (const i of placed) {
      const f = CURVE_AT[PRODUCTS[i].stage];
      const cy = y(sales(f));
      add('circle', { cx: x(f), cy, r: 7, fill: 'var(--accent)', stroke: 'var(--panel)', 'stroke-width': 2.5 });
      add('text', { x: x(f), y: cy + 5, 'text-anchor': 'middle', style: 'fill:var(--panel);font-weight:700;font-size:10px' }, String(i + 1));
    }
    r('curve-key').replaceChildren(...placed.map((i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${PRODUCTS[i].name}: ${STAGES[PRODUCTS[i].stage].name}`;
      return li;
    }));
    svg.setAttribute('aria-label', 'The product life cycle: sales rise slowly in introduction, climb fast in growth, level off in maturity, and fall in decline. Profit is negative at first, peaks during growth, and starts falling in maturity.' +
      (placed.length ? ` Placed so far: ${placed.map((i) => `${PRODUCTS[i].name} in ${STAGES[PRODUCTS[i].stage].name}`).join(', ')}.` : ''));
  }

  onWidthChange($('[data-chart]').parentElement, () => drawProduct());
  onWidthChange($('[data-curve]').parentElement, () => drawCurve());
  wireReveals(root);
  reset();
}
