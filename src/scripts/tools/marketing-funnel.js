// Marketing Funnel and Ad ROI
// Views = Budget ÷ Cost per 1,000 views × 1,000
// Clicks = Views × Click rate. Customers = Clicks × Conversion rate.
// Revenue = Customers × Average order. Profit after ads = Revenue × Margin − Budget.

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

const PRESETS = [
  { name: 'Bakery: social media ads', budget: 500, cpm: 8, ctr: 1.2, conv: 4, aov: 28, margin: 60 },
  { name: 'Tutoring: search ads', budget: 800, cpm: 40, ctr: 4, conv: 3, aov: 300, margin: 70 },
  { name: 'T-shirts: video ads', budget: 1000, cpm: 5, ctr: 0.8, conv: 2, aov: 25, margin: 45 },
];
const KEYS = ['budget', 'cpm', 'ctr', 'conv', 'aov', 'margin'];

/** The whole funnel for one set of inputs. */
export function funnel(s) {
  const views = s.cpm > 0 ? (s.budget / s.cpm) * 1000 : 0;
  const clicks = views * (s.ctr / 100);
  const customers = clicks * (s.conv / 100);
  const revenue = customers * s.aov;
  const gross = revenue * (s.margin / 100);
  const profit = gross - s.budget;
  return {
    views, clicks, customers, revenue, gross, profit,
    roas: s.budget > 0 ? revenue / s.budget : NaN,
    roi: s.budget > 0 ? profit / s.budget : NaN,
    cpc: clicks > 0 ? s.budget / clicks : NaN,
    cac: customers > 0 ? s.budget / customers : NaN,
    // Conversion rate needed for gross profit to cover the ad budget
    breakEvenConv: clicks > 0 && s.aov * s.margin > 0 ? (s.budget / (clicks * s.aov * (s.margin / 100))) * 100 : NaN,
  };
}

export function initMarketingFunnel(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[0] };

  const syncs = KEYS.map((k) =>
    linkRange(root, `fn-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
      max: ['ctr', 'conv', 'margin'].includes(k) ? 100 : undefined,
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  function render() {
    const f = funnel(state);
    const whole = (n) => num(Math.round(n));
    r('roas').textContent = Number.isFinite(f.roas) ? `${f.roas.toFixed(2)}×` : '–';
    r('cac').textContent = Number.isFinite(f.cac) ? money(f.cac, 2) : '–';
    r('cpc').textContent = Number.isFinite(f.cpc) ? money(f.cpc, 2) : '–';
    r('profit').textContent = money(f.profit, 0);
    setTone(r('profit-box'), f.profit >= 0 ? 'good' : 'bad');

    const v = r('verdict');
    if (!state.budget) {
      setTone(v, 'warn');
      v.textContent = 'Set an ad budget to see the funnel.';
    } else if (f.profit >= 0) {
      setTone(v, 'good');
      v.textContent = `The ads paid for themselves. Every $1 of ads brought in ${money(f.roas, 2)} in sales. After paying for the ads, you kept ${money(f.profit, 0)}, a ${Math.round(f.roi * 100)}% return.`;
    } else {
      setTone(v, 'bad');
      v.textContent = `The ads lost ${money(-f.profit, 0)}. To break even with these clicks, ${Number.isFinite(f.breakEvenConv) ? `about ${f.breakEvenConv.toFixed(1)}% of clickers would need to buy, not ${state.conv}%` : 'something has to change'}.`;
    }

    r('formula').innerHTML =
      `Views = ${money(state.budget, 0)} ÷ ${money(state.cpm, 2)} × 1,000 = ${whole(f.views)}` +
      `<span>Clicks = ${whole(f.views)} × ${state.ctr}% = ${whole(f.clicks)}</span>` +
      `<span>Customers = ${whole(f.clicks)} × ${state.conv}% = ${num(f.customers, 1)}</span>` +
      `<span>Revenue = ${num(f.customers, 1)} × ${money(state.aov, 2)} = ${money(f.revenue, 0)}</span>` +
      `<span>Profit after ads = ${money(f.revenue, 0)} × ${state.margin}% − ${money(state.budget, 0)} = ${money(f.profit, 0)}</span>`;

    draw(f);
  }

  function draw(f) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const stages = [
      { label: 'Saw the ad', n: f.views, rate: null },
      { label: 'Clicked', n: f.clicks, rate: `${state.ctr}% click` },
      { label: 'Bought', n: f.customers, rate: `${state.conv}% buy` },
    ];
    const stageH = narrow ? 64 : 70;
    const gap = narrow ? 30 : 28;
    const top = 4;
    const H = top + stages.length * stageH + (stages.length - 1) * gap + 6;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const cx = W / 2;
    // Funnel shape, not drawn to scale: counts shrink far too fast to show fairly.
    const widths = [W * 0.96, W * 0.66, W * 0.38, W * 0.2];
    stages.forEach((s, i) => {
      const y = top + i * (stageH + gap);
      const w1 = widths[i], w2 = widths[i + 1];
      add('polygon', {
        points: `${cx - w1 / 2},${y} ${cx + w1 / 2},${y} ${cx + w2 / 2},${y + stageH} ${cx - w2 / 2},${y + stageH}`,
        style: `fill:var(${i === 2 ? '--good' : '--accent'});opacity:${1 - i * 0.18}`,
      });
      add('text', { x: cx, y: y + stageH / 2 - 2, 'text-anchor': 'middle', style: 'fill:var(--panel);font-weight:600;font-size:18px' }, i === 2 ? num(f.customers, f.customers < 10 && f.customers % 1 ? 1 : 0) : num(Math.round(s.n)));
      add('text', { x: cx, y: y + stageH / 2 + 15, 'text-anchor': 'middle', style: 'fill:var(--panel);font-size:12px;font-family:var(--font-sans)' }, s.label);
      if (s.rate) {
        const ry = y - gap / 2 + 4;
        add('text', { x: cx, y: ry, 'text-anchor': 'middle', style: 'fill:var(--ink);font-weight:600;font-size:12.5px' }, `↓ ${s.rate}`);
      }
    });
    svg.setAttribute('aria-label', `${num(Math.round(f.views))} people saw the ad, ${num(Math.round(f.clicks))} clicked, ${num(f.customers, 1)} bought.`);

    // Money bar: ad spend vs. gross profit from the sales
    const mb = $('[data-money]');
    mb.replaceChildren();
    const MH = 92;
    mb.setAttribute('viewBox', `0 0 ${W} ${MH}`);
    const addm = (t, a, x) => mb.appendChild(svgEl(t, a, x));
    const maxV = Math.max(state.budget, f.gross, 1);
    const L = narrow ? 130 : 140;
    const span = W - L - 8;
    [
      ['Ad spend', state.budget, '--bad', 8],
      ['Profit from sales', f.gross, '--good', 50],
    ].forEach(([label, val, c, y]) => {
      addm('text', { x: L - 8, y: y + 20, 'text-anchor': 'end', style: 'fill:var(--ink);font-weight:600;font-size:12.5px;font-family:var(--font-sans)' }, label);
      const w = (val / maxV) * span;
      addm('rect', { x: L, y, width: Math.max(w, 1), height: 30, rx: 4, style: `fill:var(${c})` });
      const inside = w > 90;
      addm('text', { x: inside ? L + w - 8 : L + w + 6, y: y + 20, 'text-anchor': inside ? 'end' : 'start', style: `fill:var(${inside ? '--panel' : '--ink'});font-weight:600` }, money(val, 0));
    });
    mb.setAttribute('aria-label', `Ad spend ${money(state.budget, 0)} compared with ${money(f.gross, 0)} profit from the sales it brought in.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  render();
}
