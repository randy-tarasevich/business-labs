// Bad Debts Lab (Accounting): the allowance method for uncollectible accounts.
// Accounts Receivable = the total of the aging schedule.
// Percent of sales (income statement method): Bad Debt Expense = credit sales × percent.
//   The allowance's old balance is ignored; the expense is simply added to it.
// Aging of receivables (balance sheet method): the allowance should end at Σ (each age group × its percent).
//   Bad Debt Expense = that target − the allowance's balance before adjusting (a debit balance makes it bigger).
// Adjusting entry either way: debit Bad Debt Expense, credit Allowance for Doubtful Accounts.
// Net realizable value = Accounts Receivable − the allowance after adjusting.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone, setBox, tidyOnBlur } from '../lib/util.js';

export const BUCKETS = ['Not yet due', '1 to 30 days past due', '31 to 90 days past due', 'Over 90 days past due'];
export const METHODS = [
  { key: 'sales', label: 'Percent of sales' },
  { key: 'aging', label: 'Aging of receivables' },
];
const PRESETS = [
  { name: 'Furniture store', sales: 400000, before: 1200, pctSales: 1, ages: [60000, 18000, 8000, 4000], pcts: [1, 5, 20, 50] },
  { name: 'Write-offs ran high', sales: 400000, before: -800, pctSales: 1, ages: [60000, 18000, 8000, 4000], pcts: [1, 5, 20, 50] },
  { name: 'Collections improved', sales: 400000, before: 1200, pctSales: 1, ages: [75000, 12000, 2000, 1000], pcts: [1, 5, 20, 50] },
];

const cents = (x) => Math.round(x * 100) / 100;

/** The adjustment for one method. s: { sales, before, pctSales, ages[], pcts[] }, method: 'sales' | 'aging' */
export function badDebts(s, method) {
  const ar = cents(s.ages.reduce((t, a) => t + a, 0));
  const estimates = s.ages.map((a, i) => cents((a * s.pcts[i]) / 100));
  const target = cents(estimates.reduce((t, e) => t + e, 0));
  const expense = method === 'aging' ? cents(target - s.before) : cents((s.sales * s.pctSales) / 100);
  const after = cents(s.before + expense);
  return { ar, estimates, target, expense, after, nrv: cents(ar - after) };
}

export function initBadDebts(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const clone = (p) => ({ ...p, ages: [...p.ages], pcts: [...p.pcts] });
  let state = clone(PRESETS[0]);
  let method = 'aging';

  const syncs = [
    linkRange(root, 'bd-sales', { get: () => state.sales, set: (v) => { state.sales = v; setActive(-1); render(); } }),
    linkRange(root, 'bd-pct-sales', { get: () => state.pctSales, set: (v) => { state.pctSales = v; setActive(-1); render(); }, fit: false, max: 20 }),
    linkRange(root, 'bd-before', { get: () => state.before, set: (v) => { state.before = v; setActive(-1); render(); }, allowNegative: true, fit: false }),
  ];
  // Aging schedule: plain number boxes, two per age group.
  const boxes = [];
  BUCKETS.forEach((_, i) => {
    for (const [kind, arr] of [['age', 'ages'], ['pct', 'pcts']]) {
      const box = $(`#bd-${kind}-${i}`);
      tidyOnBlur(box);
      box.addEventListener('input', () => {
        const v = parseFloat(box.value);
        if (Number.isNaN(v) || v < 0) return;
        state[arr][i] = kind === 'pct' ? Math.min(v, 100) : v;
        setActive(-1);
        render();
      });
      boxes.push(() => setBox(box, state[arr][i]));
    }
  });
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    state = clone(p);
    syncs.forEach((s) => s());
    boxes.forEach((b) => b());
    render();
  });

  const tabs = $('[data-tabs]');
  METHODS.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.m = m.key;
    b.textContent = m.label;
    b.addEventListener('click', () => {
      method = m.key;
      render();
    });
    tabs.appendChild(b);
  });

  function render() {
    [...tabs.children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === method)));
    const d = badDebts(state, method);
    const other = badDebts(state, method === 'aging' ? 'sales' : 'aging');
    r('ar').textContent = money(d.ar, 2);
    r('expense').textContent = money(d.expense, 2);
    r('after').textContent = money(d.after, 2);
    r('nrv').textContent = money(d.nrv, 2);
    r('pct-sales-row').hidden = method !== 'sales';
    BUCKETS.forEach((_, i) => {
      r(`est-${i}`).textContent = `${money(d.estimates[i], 2)} expected uncollectible`;
    });

    r('entry').innerHTML =
      `<tr><th scope="row">Bad Debt Expense</th><td>${money(d.expense, 2)}</td><td></td></tr>` +
      `<tr><th scope="row" class="pl-6!">Allowance for Doubtful Accounts</th><td></td><td>${money(d.expense, 2)}</td></tr>`;

    const beforeTxt = state.before < 0 ? `a ${money(-state.before, 2)} debit balance` : `a ${money(state.before, 2)} credit balance`;
    const v = r('verdict');
    if (d.expense < 0) {
      setTone(v, 'warn');
      v.textContent = `The allowance already has more than the aging schedule calls for, so the adjustment would reduce it by ${money(-d.expense, 2)}. Most businesses would check their estimates first.`;
    } else {
      setTone(v, 'info');
      v.textContent = method === 'aging'
        ? `The aging schedule says ${money(d.target, 2)} of receivables won't be collected. The allowance starts with ${beforeTxt}, so the adjustment is ${money(d.expense, 2)}. Percent of sales would have recorded ${money(other.expense, 2)}.`
        : `Percent of sales records ${num(state.pctSales, 2)}% of ${money(state.sales, 0)} = ${money(d.expense, 2)}, no matter what the allowance had before (${beforeTxt}). The aging method would have recorded ${money(other.expense, 2)}.`;
    }

    r('formula').innerHTML = method === 'aging'
      ? `Target allowance = ${state.ages.map((a, i) => `${money(a, 0)} × ${num(state.pcts[i], 1)}%`).join(' + ')} = ${money(d.target, 2)}` +
        `<span>Bad Debt Expense = ${money(d.target, 2)} target − (${state.before < 0 ? '−' : ''}${money(Math.abs(state.before), 2)} before) = ${money(d.expense, 2)}</span>` +
        `<span>Net realizable value = ${money(d.ar, 2)} A/R − ${money(d.after, 2)} allowance = ${money(d.nrv, 2)}</span>`
      : `Bad Debt Expense = ${money(state.sales, 0)} credit sales × ${num(state.pctSales, 2)}% = ${money(d.expense, 2)}` +
        `<span>Allowance after = ${state.before < 0 ? '−' : ''}${money(Math.abs(state.before), 2)} before + ${money(d.expense, 2)} = ${money(d.after, 2)}</span>` +
        `<span>Net realizable value = ${money(d.ar, 2)} A/R − ${money(d.after, 2)} allowance = ${money(d.nrv, 2)}</span>`;

    draw(d);
  }

  function draw(d) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 230 : 250;
    const L = narrow ? 58 : 70, R = 12, T = 16, B = 40;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxY = niceMax(Math.max(...state.ages, 1000));
    const y = (v) => T + (1 - v / maxY) * (H - T - B);
    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxY / n) * i;
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }
    const short = ['Not due', '1-30', '31-90', '90+'];
    const slot = (W - L - R) / BUCKETS.length;
    const bw = Math.min(70, slot * 0.6);
    state.ages.forEach((a, i) => {
      const cx = L + slot * (i + 0.5);
      const bad = Math.min(d.estimates[i], a);
      add('rect', { x: cx - bw / 2, y: y(a), width: bw, height: Math.max(0, y(a - bad) - y(a)), style: 'fill:var(--bad);opacity:0.75' });
      add('rect', { x: cx - bw / 2, y: y(a - bad), width: bw, height: Math.max(0, y(0) - y(a - bad)), style: 'fill:var(--accent)' });
      add('text', { x: cx, y: H - B + 18, 'text-anchor': 'middle' }, narrow ? short[i] : `${short[i]} days`.replace('Not due days', 'Not yet due'));
    });
    add('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, 'How late each group of customers is');
    svg.setAttribute('aria-label', 'Accounts receivable by age. ' + state.ages.map((a, i) => `${BUCKETS[i]}: ${money(a, 0)}, ${money(d.estimates[i], 0)} expected uncollectible`).join('. ') + '.');
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  syncs.forEach((s) => s());
  boxes.forEach((b) => b());
  render();
}
