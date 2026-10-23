// Paycheck Lab
// Yearly pay = hourly pay × hours a week × 52. A 401(k) contribution comes out before income taxes
// (federal and state) but not before Social Security and Medicare.
// Federal income tax: yearly pay - 401(k) - standard deduction, run through the single-filer brackets.
// Each paycheck is the yearly amount ÷ the number of paychecks. Real withholding uses the IRS tables
// and a W-4, so a real paystub can be a little different.

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';
import {
  TAX_YEAR,
  STANDARD_DEDUCTION,
  BRACKETS,
  SOCIAL_SECURITY_RATE,
  SOCIAL_SECURITY_WAGE_BASE,
  MEDICARE_RATE,
  ADDITIONAL_MEDICARE_RATE,
  ADDITIONAL_MEDICARE_OVER,
} from '../../data/paycheck.js';
import { SWATCH } from '../lib/ui.js';

const PRESETS = [
  { name: 'Part-time job', hourly: 17, hours: 20, k: 0, state: 3, freq: 52 },
  { name: 'First full-time job', hourly: 22, hours: 40, k: 3, state: 3, freq: 26 },
  { name: 'Skilled full-time job', hourly: 40, hours: 40, k: 6, state: 4.5, freq: 26 },
];
const KEYS = ['hourly', 'hours', 'k', 'state'];
export const SCHEDULES = [
  { n: 52, label: 'Every week' },
  { n: 26, label: 'Every 2 weeks' },
  { n: 24, label: 'Twice a month' },
  { n: 12, label: 'Once a month' },
];

/** Federal income tax on taxable income, plus how much falls in each bracket. */
export function federalTax(taxable) {
  const parts = [];
  let tax = 0;
  BRACKETS.forEach((b, i) => {
    const top = BRACKETS[i + 1]?.over ?? Infinity;
    const amt = Math.max(0, Math.min(taxable, top) - b.over);
    if (amt > 0) {
      parts.push({ rate: b.rate, from: b.over, amt, tax: (amt * b.rate) / 100 });
      tax += (amt * b.rate) / 100;
    }
  });
  const marginal = parts.length ? parts[parts.length - 1].rate : 0;
  return { tax, parts, marginal };
}

/** One year of pay. s: { hourly, hours, k (401(k) %), state (state rate %) } */
export function paycheck(s) {
  const gross = s.hourly * s.hours * 52;
  const k401 = (gross * s.k) / 100;
  const taxable = Math.max(0, gross - k401 - STANDARD_DEDUCTION);
  const fed = federalTax(taxable);
  const ss = (Math.min(gross, SOCIAL_SECURITY_WAGE_BASE) * SOCIAL_SECURITY_RATE) / 100;
  const medicare = (gross * MEDICARE_RATE) / 100 + (Math.max(0, gross - ADDITIONAL_MEDICARE_OVER) * ADDITIONAL_MEDICARE_RATE) / 100;
  const state = (Math.max(0, gross - k401) * s.state) / 100;
  const net = gross - k401 - fed.tax - ss - medicare - state;
  return { gross, k401, taxable, fed: fed.tax, parts: fed.parts, marginal: fed.marginal, ss, medicare, state, net };
}

export function initPaycheck(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[1] };
  const freq = $('#pc-freq');

  const syncs = KEYS.map((k) =>
    linkRange(root, `pc-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = v;
        setActive(-1);
        render();
      },
      max: k === 'hours' ? 80 : k === 'k' ? 50 : k === 'state' ? 15 : undefined,
      fit: k === 'hourly',
    })
  );
  freq.addEventListener('change', () => {
    state.freq = parseInt(freq.value, 10);
    render();
  });
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    freq.value = String(state.freq);
    render();
  });

  r('year').textContent = `Uses ${TAX_YEAR} federal numbers for a single filer: a ${money(STANDARD_DEDUCTION, 0)} standard deduction, Social Security on pay up to ${money(SOCIAL_SECURITY_WAGE_BASE, 0)}.`;

  function render() {
    const y = paycheck(state);
    const n = state.freq;
    const per = (v) => v / n;
    const schedule = SCHEDULES.find((x) => x.n === n)?.label.toLowerCase() ?? '';

    r('gross').textContent = money(per(y.gross), 2);
    r('net').textContent = money(per(y.net), 2);
    r('marginal').textContent = `${y.marginal}%`;
    r('effective').textContent = y.gross ? `${num((y.fed / y.gross) * 100, 1)}%` : '0%';

    const rows = [
      ['Gross pay', y.gross],
      ['401(k), before taxes', -y.k401],
      ['Federal income tax', -y.fed],
      ['Social Security', -y.ss],
      ['Medicare', -y.medicare],
      ['State income tax', -y.state],
      ['Net pay (take-home)', y.net],
    ];
    r('stub').replaceChildren(
      ...rows.map(([label, v], i) => {
        const tr = document.createElement('tr');
        const strong = i === 0 || i === rows.length - 1;
        tr.innerHTML = strong
          ? `<th scope="row" class="font-semibold!">${label}</th><td class="font-semibold!">${money(per(v), 2)}</td><td class="font-semibold!">${money(v, 0)}</td>`
          : `<th scope="row">${label}</th><td>${money(per(v), 2)}</td><td>${money(v, 0)}</td>`;
        return tr;
      })
    );
    r('stub-head').textContent = `Each paycheck (${schedule})`;

    const v = r('verdict');
    if (!y.gross) {
      setTone(v, 'warn');
      v.textContent = 'Set an hourly pay and hours to see a paycheck.';
    } else {
      setTone(v, 'info');
      const keep = (y.net / y.gross) * 100;
      v.textContent = `Out of every $100 you earn, you take home about $${Math.round(keep)}` +
        (y.k401 ? `, and $${Math.round((y.k401 / y.gross) * 100)} goes into your 401(k).` : '.') +
        ` You're in the ${y.marginal}% federal bracket, but federal tax takes only ${num((y.fed / y.gross) * 100, 1)}% of your pay.`;
    }

    const bracketLines = y.parts.length
      ? y.parts.map((p) => `<span>${p.rate}% on ${money(p.amt, 0)} = ${money(p.tax, 0)}</span>`).join('')
      : '<span>Taxable pay is $0, so there is no federal income tax.</span>';
    r('formula').innerHTML =
      `Yearly pay = ${money(state.hourly, 2)} × ${num(state.hours)} hours × 52 weeks = ${money(y.gross, 0)}` +
      `<span>Taxable for federal = ${money(y.gross, 0)} − ${money(y.k401, 0)} 401(k) − ${money(STANDARD_DEDUCTION, 0)} standard deduction = ${money(y.taxable, 0)}</span>` +
      bracketLines +
      `<span>Social Security = ${SOCIAL_SECURITY_RATE}% × ${money(Math.min(y.gross, SOCIAL_SECURITY_WAGE_BASE), 0)} = ${money(y.ss, 0)}. Medicare = ${MEDICARE_RATE}% × ${money(y.gross, 0)}${y.gross > ADDITIONAL_MEDICARE_OVER ? ' plus 0.9% over $200,000' : ''} = ${money(y.medicare, 0)}</span>` +
      `<span>State = ${state.state}% × ${money(y.gross - y.k401, 0)} = ${money(y.state, 0)}</span>`;

    draw(y);
  }

  function draw(y) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const H = 64;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const segs = [
      ['Take-home', y.net, '--good', 1],
      ['401(k)', y.k401, '--accent', 1],
      ['Federal', y.fed, '--bad', 1],
      ['Social Security', y.ss, '--warn', 1],
      ['Medicare', y.medicare, '--warn', 0.55],
      ['State', y.state, '--bad', 0.55],
    ];
    if (!y.gross) {
      r('key').replaceChildren();
      add('rect', { x: 0, y: 8, width: W, height: 40, rx: 6, style: 'fill:var(--grid)' });
      svg.setAttribute('aria-label', 'No pay entered yet.');
      return;
    }
    let x = 0;
    const key = r('key');
    key.replaceChildren();
    for (const [label, val, color, op] of segs) {
      const w = (val / y.gross) * W;
      if (w <= 0) continue;
      add('rect', { x, y: 8, width: w, height: 40, style: `fill:var(${color});opacity:${op}` });
      x += w;
      const item = document.createElement('span');
      const sw = document.createElement('i');
      sw.className = SWATCH;
      sw.style.background = `var(${color})`;
      sw.style.opacity = String(op);
      item.append(sw, `${label} ${Math.round((val / y.gross) * 100)}%`);
      key.append(item);
    }
    const parts = segs.filter(([, val]) => val > 0).map(([label, val]) => `${label} ${Math.round((val / y.gross) * 100)}%`);
    svg.setAttribute('aria-label', `Where your pay goes: ${parts.join(', ')}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(1);
  syncs.forEach((s) => s());
  freq.value = String(state.freq);
  render();
}
