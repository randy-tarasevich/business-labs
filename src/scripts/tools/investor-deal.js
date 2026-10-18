// Investor Deal Lab
// Valuation (post-money) = Investment ÷ Equity %
// Pre-money = Post-money − Investment
// At a sale (exit), each owner gets their percent of the sale price.

import { money, svgEl, setTone, wireReveals } from '../lib/util.js';

const PRESETS = [
  { name: 'Smoothie truck', sales: 120000, askAmt: 50000, askPct: 10, offAmt: 50000, offPct: 25, exit: 1000000 },
  { name: 'Phone case startup', sales: 80000, askAmt: 100000, askPct: 20, offAmt: 100000, offPct: 35, exit: 2000000 },
  { name: 'Dog treat bakery', sales: 40000, askAmt: 25000, askPct: 20, offAmt: 25000, offPct: 30, exit: 300000 },
  { name: 'Gaming headset brand', sales: 900000, askAmt: 300000, askPct: 2, offAmt: 300000, offPct: 10, exit: 10000000 },
];
const FIELDS = ['askAmt', 'askPct', 'offAmt', 'offPct', 'sales', 'exit'];

/** All the deal math in one place, so it can be tested on its own. */
export function dealMath({ amt, pct, sales, exit }) {
  const share = pct / 100;
  const valid = amt > 0 && share > 0 && share < 1;
  const post = valid ? amt / share : NaN;
  return {
    valid,
    post,
    pre: valid ? post - amt : NaN,
    keep: 100 - pct,
    multiple: valid && sales > 0 ? post / sales : NaN,
    founderAtExit: exit * (1 - share),
    investorAtExit: exit * share,
    investorReturn: valid ? (exit * share) / amt : NaN,
  };
}

const short = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${n < 0 ? '−' : ''}$${+(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${n < 0 ? '−' : ''}$${+(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`;
  return money(n, 0);
};
const pctText = (p) => `${+p.toFixed(1)}%`;
const times = (x) => `${x >= 10 ? x.toFixed(0) : x.toFixed(1)}×`;

export function initInvestorDeal(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let state = { ...PRESETS[0] };
  let activePreset = 0;

  const presetWrap = $('[data-presets]');
  PRESETS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      activePreset = i;
      state = { ...p };
      syncInputs();
      render();
    });
    presetWrap.appendChild(b);
  });

  FIELDS.forEach((f) => {
    const range = $(`#dl-${f}`);
    const num = $(`#dl-${f}-n`);
    range.addEventListener('input', () => {
      state[f] = parseFloat(range.value) || 0;
      activePreset = -1;
      syncInputs(f);
      render();
    });
    num.addEventListener('input', () => {
      let v = parseFloat(num.value);
      if (Number.isNaN(v) || v < 0) return;
      if (f.endsWith('Pct')) v = Math.min(v, 99);
      state[f] = v;
      activePreset = -1;
      if (v > parseFloat(range.max)) range.max = Math.ceil(v * 1.5);
      range.value = v;
      syncPresetButtons();
      render();
    });
  });

  function syncPresetButtons() {
    [...presetWrap.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === activePreset)));
  }

  function syncInputs(skip) {
    FIELDS.forEach((f) => {
      const range = $(`#dl-${f}`);
      if (state[f] > parseFloat(range.max)) range.max = Math.ceil(state[f] * 1.5);
      if (f !== skip) range.value = state[f];
      $(`#dl-${f}-n`).value = state[f];
    });
    syncPresetButtons();
  }

  function render() {
    const { sales, exit } = state;
    const ask = dealMath({ amt: state.askAmt, pct: state.askPct, sales, exit });
    const off = dealMath({ amt: state.offAmt, pct: state.offPct, sales, exit });

    const fill = (key, d) => {
      r(`${key}-post`).textContent = d.valid ? money(d.post, 0) : '–';
      r(`${key}-pre`).textContent = d.valid ? money(d.pre, 0) : '–';
      r(`${key}-keep`).textContent = pctText(d.keep);
      r(`${key}-mult`).textContent = Number.isFinite(d.multiple) ? `${times(d.multiple)} sales` : '–';
      r(`${key}-founder`).textContent = money(d.founderAtExit, 0);
      r(`${key}-investor`).textContent = money(d.investorAtExit, 0);
      r(`${key}-return`).textContent = Number.isFinite(d.investorReturn) ? times(d.investorReturn) : '–';
    };
    fill('ask', ask);
    fill('off', off);

    const verdict = r('verdict');
    if (!ask.valid || !off.valid) {
      setTone(verdict, 'warn');
      verdict.textContent = 'Each deal needs an investment above $0 and an equity percent between 0% and 100%.';
    } else {
      const gap = ask.post - off.post;
      const cost = ask.founderAtExit - off.founderAtExit;
      let msg;
      if (Math.abs(gap) < 1) {
        msg = `Both deals value the business at ${money(ask.post, 0)}. You and the investor agree on what it's worth.`;
        setTone(verdict, 'good');
      } else if (gap > 0) {
        msg = `The investor thinks the business is worth ${money(off.post, 0)}, ${pctText((gap / ask.post) * 100)} less than your ${money(ask.post, 0)}. Taking their offer, you keep ${pctText(off.keep)} instead of ${pctText(ask.keep)}. If the business sells for ${money(exit, 0)}, that difference costs you ${money(cost, 0)}.`;
        setTone(verdict, 'bad');
      } else {
        msg = `The investor's offer values the business at ${money(off.post, 0)}, more than you asked for. Take the deal!`;
        setTone(verdict, 'good');
      }
      verdict.textContent = msg;
    }

    const lines = [];
    if (off.valid) {
      lines.push(`Their offer: ${money(state.offAmt, 0)} ÷ ${pctText(state.offPct)} = ${money(off.post, 0)}`);
      lines.push(`Before the money (pre-money) = ${money(off.post, 0)} − ${money(state.offAmt, 0)} = ${money(off.pre, 0)}`);
    }
    if (ask.valid) lines.unshift(`Your ask: ${money(state.askAmt, 0)} ÷ ${pctText(state.askPct)} = ${money(ask.post, 0)}`);
    r('formula').innerHTML = `Valuation = Investment ÷ Equity %${lines.map((l) => `<span>${l}</span>`).join('')}`;

    drawChart(ask, off, exit);
  }

  function drawChart(ask, off, exit) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    // Draw at the real on-screen width so text stays readable on phones.
    const W = Math.round(Math.min(Math.max(svg.parentElement.clientWidth || 640, 300), 760));
    const H = 236, R = 2, barH = 44;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (tag, attrs, text) => svg.appendChild(svgEl(tag, attrs, text));
    const span = W - R;
    const rows = [
      { label: 'Your ask', d: ask, y: 50 },
      { label: 'Their offer', d: off, y: 160 },
    ];
    add('text', { x: 0, y: 14, style: 'fill:var(--ink);font-weight:600;font-size:13px' }, `If the business sells for ${short(exit)}:`);
    rows.forEach(({ label, d, y }) => {
      const share = Math.min(Math.max(d.investorAtExit / (exit || 1), 0), 1);
      const fw = exit > 0 ? span * (1 - share) : 0;
      add('text', { x: 0, y: y - 8, style: 'fill:var(--ink);font-weight:600' }, label);
      if (exit <= 0) {
        add('rect', { x: 0, y, width: span, height: barH, rx: 4, style: 'fill:var(--grid)' });
        return;
      }
      add('rect', { x: 0, y, width: Math.max(fw, 0), height: barH, rx: 4, style: 'fill:var(--accent)' });
      add('rect', { x: fw, y, width: Math.max(span - fw, 0), height: barH, rx: 4, style: 'fill:var(--warn)' });
      if (fw > 56) add('text', { x: 10, y: y + barH / 2 + 5, style: 'fill:var(--panel);font-weight:600' }, pctText(d.keep));
      if (span - fw > 56) add('text', { x: span - 10, y: y + barH / 2 + 5, 'text-anchor': 'end', style: 'fill:var(--panel);font-weight:600' }, pctText(100 - d.keep));
      add('text', { x: 0, y: y + barH + 18 }, `You get ${short(d.founderAtExit)}`);
      add('text', { x: span, y: y + barH + 18, 'text-anchor': 'end' }, `Investor gets ${short(d.investorAtExit)}`);
    });
    svg.setAttribute('aria-label', `If the business sells for ${money(exit, 0)}: with your ask you get ${money(ask.founderAtExit, 0)}, with their offer you get ${money(off.founderAtExit, 0)}.`);
  }

  let lastW = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w && w !== lastW) { lastW = w; render(); }
  }).observe($('[data-chart]').parentElement);

  wireReveals(root);


  syncInputs();
  render();
}
