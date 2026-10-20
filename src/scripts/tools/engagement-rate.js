// Engagement Rate Lab
// Interactions = Likes + Comments + Shares
// Engagement rate (followers) = Interactions ÷ Followers × 100
// Engagement rate (reach) = Interactions ÷ People who saw the post × 100
// Bought followers add to the follower count, a few of them see the post, and none interact.

import { num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Big account, quiet fans', followers: 50000, reach: 4000, likes: 230, comments: 15, shares: 5 },
  { name: 'Small local account', followers: 4000, reach: 2500, likes: 260, comments: 40, shares: 20 },
  { name: 'Post that went viral', followers: 1200, reach: 90000, likes: 6300, comments: 450, shares: 1800 },
];
const KEYS = ['followers', 'reach', 'likes', 'comments', 'shares'];
export const BOUGHT = 20000;
// How many bought followers the app shows the post to.
export const BOUGHT_SEEN = 1000;

/** Every result for one post. */
export function engagement(s, bought = false) {
  const followers = s.followers + (bought ? BOUGHT : 0);
  const reach = s.reach + (bought ? BOUGHT_SEEN : 0);
  const inter = s.likes + s.comments + s.shares;
  return {
    followers,
    reach,
    inter,
    rateF: followers > 0 ? (inter / followers) * 100 : NaN,
    rateR: reach > 0 ? (inter / reach) * 100 : NaN,
    reachRate: followers > 0 ? (reach / followers) * 100 : NaN,
  };
}

/** Percent with two decimals under 1%, one decimal under 100%, whole numbers above. */
export function pct(p) {
  if (!Number.isFinite(p)) return '–';
  const d = p < 1 ? 2 : p < 100 ? 1 : 0;
  return `${num(p, d)}%`;
}

export function initEngagementRate(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };
  const boughtBox = $('[data-bought]');

  const syncs = KEYS.map((k) =>
    linkRange(root, `er-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = Math.round(v);
        setActive(-1);
        render();
      },
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });
  boughtBox.addEventListener('change', () => render());

  function render() {
    const bought = boughtBox.checked;
    const e = engagement(state, bought);
    const real = engagement(state, false);

    r('rate-f').textContent = pct(e.rateF);
    r('rate-r').textContent = pct(e.rateR);
    r('reach-rate').textContent = e.reach > e.followers ? 'All, and more' : pct(e.reachRate);
    r('inter').textContent = num(e.inter);
    setTone(r('rate-f-box'), bought ? 'bad' : '');

    const v = r('verdict');
    if (!e.followers) {
      setTone(v, 'warn');
      v.textContent = 'Add some followers to see the engagement rate.';
    } else if (e.reach > e.followers) {
      setTone(v, 'info');
      v.textContent = `This post spread past the account's followers: ${num(e.reach)} people saw it, ${num(e.reach / e.followers, e.reach / e.followers < 10 ? 1 : 0)} times the follower count. An engagement rate of ${pct(e.rateF)} doesn't mean much here. For posts that spread, engagement by reach (${pct(e.rateR)}) tells the real story.`;
    } else if (bought) {
      setTone(v, 'bad');
      v.textContent = `The bought followers made the account look ${Math.round((BOUGHT / state.followers) * 100)}% bigger, but engagement rate by followers fell from ${pct(real.rateF)} to ${pct(e.rateF)}. Brands check this number before they pay a creator.`;
    } else if (e.rateF < 1) {
      setTone(v, 'warn');
      v.textContent = `Only ${pct(e.reachRate)} of followers saw this post, and ${pct(e.rateF)} of followers interacted with it. A big follower count doesn't always mean a big audience.`;
    } else {
      setTone(v, 'good');
      v.textContent = `${pct(e.rateF)} of followers interacted with this post. That's about ${num(e.rateF, e.rateF < 10 ? 1 : 0)} out of every 100 followers liking, commenting, or sharing.`;
    }

    const fol = bought ? `(${num(state.followers)} + ${num(BOUGHT)} bought)` : num(e.followers);
    const rch = bought ? `(${num(state.reach)} + ${num(BOUGHT_SEEN)} bought)` : num(e.reach);
    r('formula').innerHTML =
      `Interactions = ${num(state.likes)} + ${num(state.comments)} + ${num(state.shares)} = ${num(e.inter)}` +
      `<span>Engagement rate (followers) = ${num(e.inter)} ÷ ${fol} × 100 = ${pct(e.rateF)}</span>` +
      `<span>Engagement rate (reach) = ${num(e.inter)} ÷ ${rch} × 100 = ${pct(e.rateR)}</span>` +
      `<span>Followers who saw it = ${num(e.reach)} ÷ ${num(e.followers)} × 100 = ${pct(e.reachRate)}</span>`;

    draw(e, bought);
  }

  function draw(e, bought) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const L = narrow ? 104 : 150;
    const span = W - L - 64;
    const barH = 34;
    const gap = 26;
    const rows = [
      { label: 'Followers', n: e.followers, fill: '--accent', fake: bought ? BOUGHT : 0 },
      { label: narrow ? 'Saw it' : 'Saw the post', n: e.reach, fill: '--accent', fake: bought ? BOUGHT_SEEN : 0 },
      { label: 'Interacted', n: e.inter, fill: '--good', fake: 0 },
    ];
    const H = rows.length * barH + (rows.length - 1) * gap + 24;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxV = Math.max(e.followers, e.reach, 1);

    rows.forEach((row, i) => {
      const y = 4 + i * (barH + gap);
      add('text', { x: L - 8, y: y + barH / 2 + 5, 'text-anchor': 'end', style: 'fill:var(--ink);font-weight:600;font-size:13px;font-family:var(--font-sans)' }, row.label);
      const w = (row.n / maxV) * span;
      const realW = ((row.n - row.fake) / maxV) * span;
      add('rect', { x: L, y, width: Math.max(realW, row.n > 0 ? 2 : 0), height: barH, rx: 4, style: `fill:var(${row.fill})` });
      if (row.fake > 0) {
        // Bought followers: an outlined, muted segment so they read as "not real".
        add('rect', { x: L + realW, y: y + 1, width: Math.max(w - realW - 1, 1), height: barH - 2, rx: 4, style: 'fill:var(--line);stroke:var(--muted);stroke-dasharray:4 3' });
      }
      const label = num(row.n);
      const inside = realW > label.length * 9 + 20 && row.fake === 0;
      add('text', { x: inside ? L + realW - 8 : L + Math.max(w, 2) + 6, y: y + barH / 2 + 5, 'text-anchor': inside ? 'end' : 'start', style: `fill:var(${inside ? '--panel' : '--ink'});font-weight:600;font-size:13px` }, label);
    });

    const yb = 4 + (rows.length - 1) * (barH + gap) + barH + 16;
    add('text', { x: L, y: yb, style: 'font-size:12px;font-family:var(--font-sans)' }, `${num(state.likes)} likes, ${num(state.comments)} comments, ${num(state.shares)} shares`);

    svg.setAttribute('aria-label', `${num(e.followers)} followers${bought ? `, ${num(BOUGHT)} of them bought` : ''}. ${num(e.reach)} people saw the post and ${num(e.inter)} interacted with it.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
