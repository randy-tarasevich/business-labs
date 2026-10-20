// Influencer Deal Lab
// Real fans = Followers × Engagement rate × (1 − Fake followers)
// Cost per real fan = Fee ÷ Real fans
// Customers = Real fans × Click rate × Buy rate
// Profit after fee = Customers × Average order × Margin − Fee

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

export const NAMES = ['Big creator', 'Mid creator', 'Small creator'];

const PRESETS = [
  {
    name: 'Phone cases',
    aov: 30, margin: 65, click: 10, buy: 12,
    creators: [
      { fee: 6000, followers: 800000, eng: 1.2, fake: 30 },
      { fee: 350, followers: 60000, eng: 4, fake: 8 },
      { fee: 80, followers: 8000, eng: 8, fake: 3 },
    ],
  },
  {
    name: 'Sneaker shop',
    aov: 90, margin: 40, click: 8, buy: 6,
    creators: [
      { fee: 7000, followers: 1000000, eng: 1, fake: 20 },
      { fee: 600, followers: 90000, eng: 6, fake: 45 },
      { fee: 90, followers: 9000, eng: 7, fake: 4 },
    ],
  },
  {
    name: 'Video game launch',
    aov: 40, margin: 50, click: 12, buy: 10,
    creators: [
      { fee: 2500, followers: 400000, eng: 3.5, fake: 5 },
      { fee: 400, followers: 50000, eng: 5, fake: 20 },
      { fee: 60, followers: 5000, eng: 7, fake: 2 },
    ],
  },
];
const PRODUCT_KEYS = ['aov', 'margin', 'click', 'buy'];
const CREATOR_KEYS = ['fee', 'followers', 'eng', 'fake'];

const copy = (p) => ({ ...p, creators: p.creators.map((c) => ({ ...c })) });

/** Results for one creator under one campaign. */
export function deal(c, s) {
  const fans = c.followers * (c.eng / 100) * (1 - c.fake / 100);
  const customers = fans * (s.click / 100) * (s.buy / 100);
  const revenue = customers * s.aov;
  const gross = revenue * (s.margin / 100);
  return {
    fans,
    customers,
    revenue,
    gross,
    profit: gross - c.fee,
    cpf: fans > 0 ? c.fee / fans : NaN,
  };
}

export function initInfluencerDeal(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = copy(PRESETS[0]);
  let sel = 0;

  const edited = (fn) => (v) => {
    fn(v);
    setActive(-1);
    render();
  };
  const productSyncs = PRODUCT_KEYS.map((k) =>
    linkRange(root, `inf-${k}`, { get: () => state[k], set: edited((v) => (state[k] = v)), max: k === 'aov' ? undefined : 100 })
  );
  const creatorSyncs = CREATOR_KEYS.map((k) =>
    linkRange(root, `inf-${k}`, {
      get: () => state.creators[sel][k],
      set: edited((v) => (state.creators[sel][k] = k === 'followers' ? Math.round(v) : v)),
      max: k === 'eng' || k === 'fake' ? 100 : undefined,
    })
  );

  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, copy(p));
    productSyncs.forEach((s) => s());
    creatorSyncs.forEach((s) => s());
    render();
  });
  const setPick = presetButtons($('[data-pick]'), NAMES.map((name) => ({ name })), (_, i) => {
    sel = i;
    creatorSyncs.forEach((s) => s());
    render();
  });

  function render() {
    const ds = state.creators.map((c) => deal(c, state));
    const d = ds[sel];
    const c = state.creators[sel];

    r('editing').textContent = NAMES[sel];

    // Comparison table
    const cells = (name, fmt) => ds.forEach((x, i) => (r(`${name}-${i}`).textContent = fmt(x, state.creators[i])));
    cells('fol', (x, cr) => num(cr.followers));
    cells('fee', (x, cr) => money(cr.fee, 0));
    cells('fans', (x) => num(Math.round(x.fans)));
    cells('cpf', (x) => (Number.isFinite(x.cpf) ? money(x.cpf, 2) : '–'));
    cells('cust', (x) => num(x.customers, x.customers < 10 && x.customers % 1 ? 1 : 0));
    cells('profit', (x) => money(x.profit, 0));
    ds.forEach((x, i) => setTone(r(`profit-${i}`), x.profit >= 0 ? 'good' : 'bad'));
    ds.forEach((x, i) => r(`col-${i}`).setAttribute('aria-current', String(i === sel)));

    // Verdict
    const best = ds.reduce((b, x, i) => (x.profit > ds[b].profit ? i : b), 0);
    const cheap = ds.reduce((b, x, i) => ((Number.isFinite(x.cpf) && (!Number.isFinite(ds[b].cpf) || x.cpf < ds[b].cpf)) ? i : b), 0);
    const biggest = state.creators.reduce((b, cr, i) => (cr.followers > state.creators[b].followers ? i : b), 0);
    const v = r('verdict');
    if (ds[best].profit < 0) {
      setTone(v, 'bad');
      v.textContent = `None of these deals pay off. The closest is the ${NAMES[best].toLowerCase()}, which loses ${money(-ds[best].profit, 0)}. A lower fee or a higher buy rate could change that.`;
    } else {
      setTone(v, 'good');
      let t = `Best deal: the ${NAMES[best].toLowerCase()}, with ${money(ds[best].profit, 0)} profit after the fee.`;
      if (cheap !== best) t += ` The ${NAMES[cheap].toLowerCase()} reaches real fans for less (${money(ds[cheap].cpf, 2)} each) but doesn't have as many.`;
      if (biggest !== best && ds[biggest].profit < 0) t += ` The ${NAMES[biggest].toLowerCase()} has the most followers and still loses ${money(-ds[biggest].profit, 0)}.`;
      v.textContent = t;
    }

    const whole = (n) => num(Math.round(n));
    r('formula').innerHTML =
      `${NAMES[sel]}: real fans = ${num(c.followers)} × ${c.eng}% × (100% − ${c.fake}%) = ${whole(d.fans)}` +
      `<span>Cost per real fan = ${money(c.fee, 0)} ÷ ${whole(d.fans)} = ${Number.isFinite(d.cpf) ? money(d.cpf, 2) : '–'}</span>` +
      `<span>Customers = ${whole(d.fans)} × ${state.click}% × ${state.buy}% = ${num(d.customers, 1)}</span>` +
      `<span>Profit after fee = ${num(d.customers, 1)} × ${money(state.aov, 2)} × ${state.margin}% − ${money(c.fee, 0)} = ${money(d.profit, 0)}</span>`;

    draw(ds);
  }

  function draw(ds) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const L = narrow ? 74 : 112;
    const span = W - L - 70;
    const barH = 20;
    const groupGap = 22;
    const groupH = barH * 2 + 4;
    const H = 3 * groupH + 2 * groupGap + 8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxV = Math.max(...ds.map((x, i) => Math.max(state.creators[i].fee, x.gross)), 1);

    ds.forEach((x, i) => {
      const y0 = 4 + i * (groupH + groupGap);
      const label = narrow ? NAMES[i].replace(' creator', '') : NAMES[i];
      add('text', { x: L - 8, y: y0 + groupH / 2 + 5, 'text-anchor': 'end', style: `fill:var(--ink);font-weight:${i === sel ? 700 : 600};font-size:13px;font-family:var(--font-sans)` }, label);
      [
        [state.creators[i].fee, '--bad'],
        [x.gross, '--good'],
      ].forEach(([val, fill], j) => {
        const y = y0 + j * (barH + 4);
        const w = (val / maxV) * span;
        add('rect', { x: L, y, width: Math.max(w, val > 0 ? 2 : 0), height: barH, rx: 3, style: `fill:var(${fill})` });
        add('text', { x: L + Math.max(w, 2) + 6, y: y + barH / 2 + 4, style: 'fill:var(--ink);font-weight:600;font-size:12.5px' }, money(val, 0));
      });
    });
    svg.setAttribute(
      'aria-label',
      ds.map((x, i) => `${NAMES[i]}: fee ${money(state.creators[i].fee, 0)}, profit from sales ${money(x.gross, 0)}.`).join(' ')
    );
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  setPick(0);
  productSyncs.forEach((s) => s());
  creatorSyncs.forEach((s) => s());
  render();
}
