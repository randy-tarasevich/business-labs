// Payroll Lab (Accounting)
// One pay period for three hourly employees.
// Employee side (withheld from pay): federal income tax, Social Security, Medicare, state income tax, 401(k).
//   Federal income tax uses the Paycheck Lab's method: this check × paychecks a year, minus 401(k) and the
//   single-filer standard deduction, through the brackets, then ÷ paychecks a year.
// Employer side (paid on top of wages): Social Security and Medicare match, FUTA, and state unemployment (SUTA).
//   Assumes it's early in the year, so no one has passed the FUTA or state unemployment wage limits.
// Every amount is rounded to the cent, the way a real payroll is, so the journal entries balance to the penny.

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';
import { SWATCH } from '../lib/ui.js';
import { federalTax } from './paycheck.js';
import { STANDARD_DEDUCTION, SOCIAL_SECURITY_RATE, MEDICARE_RATE, FUTA_RATE, TAX_YEAR } from '../../data/paycheck.js';

export const EMPLOYEES = ['Ana', 'Ben', 'Cara'];
const PRESETS = [
  { name: 'Coffee shop (weekly)', a: [30, 16], b: [20, 15.5], c: [40, 19], freq: 52, k: 0, state: 3, suta: 2.8 },
  { name: 'Landscaping crew (every 2 weeks)', a: [80, 22], b: [80, 20], c: [60, 18], freq: 26, k: 3, state: 3, suta: 2.8 },
  { name: 'Small office (every 2 weeks)', a: [80, 28], b: [80, 35], c: [40, 20], freq: 26, k: 5, state: 4, suta: 2.8 },
];
export const SCHEDULES = [
  { n: 52, label: 'Every week' },
  { n: 26, label: 'Every 2 weeks' },
  { n: 24, label: 'Twice a month' },
  { n: 12, label: 'Once a month' },
];

const cents = (x) => Math.round(x * 100) / 100;

/** One employee's check for one pay period. */
export function employeeCheck({ hours, rate }, s) {
  const gross = cents(hours * rate);
  const k401 = cents((gross * s.k) / 100);
  const taxableYear = Math.max(0, (gross - k401) * s.freq - STANDARD_DEDUCTION);
  const fed = cents(federalTax(taxableYear).tax / s.freq);
  const ss = cents((gross * SOCIAL_SECURITY_RATE) / 100);
  const medicare = cents((gross * MEDICARE_RATE) / 100);
  const state = cents(((gross - k401) * s.state) / 100);
  const net = cents(gross - fed - ss - medicare - state - k401);
  const futa = cents((gross * FUTA_RATE) / 100);
  const suta = cents((gross * s.suta) / 100);
  return { gross, fed, ss, medicare, state, k401, net, employer: { ss, medicare, futa, suta, total: cents(ss + medicare + futa + suta) } };
}

/** The whole payroll: each check, the totals, and the two journal entries. */
export function runPayroll(s) {
  const checks = s.employees.map((e) => employeeCheck(e, s));
  const sum = (fn) => cents(checks.reduce((t, c) => t + fn(c), 0));
  const t = {
    gross: sum((c) => c.gross),
    fed: sum((c) => c.fed),
    ss: sum((c) => c.ss),
    medicare: sum((c) => c.medicare),
    state: sum((c) => c.state),
    k401: sum((c) => c.k401),
    net: sum((c) => c.net),
    erSs: sum((c) => c.employer.ss),
    erMedicare: sum((c) => c.employer.medicare),
    futa: sum((c) => c.employer.futa),
    suta: sum((c) => c.employer.suta),
    employer: sum((c) => c.employer.total),
  };
  const payrollEntry = [
    { account: 'Wages Expense', dr: t.gross },
    { account: 'Federal Income Tax Payable', cr: t.fed },
    { account: 'Social Security Tax Payable', cr: t.ss },
    { account: 'Medicare Tax Payable', cr: t.medicare },
    { account: 'State Income Tax Payable', cr: t.state },
    { account: '401(k) Payable', cr: t.k401 },
    { account: 'Cash', cr: t.net },
  ];
  const taxEntry = [
    { account: 'Payroll Tax Expense', dr: t.employer },
    { account: 'Social Security Tax Payable', cr: t.erSs },
    { account: 'Medicare Tax Payable', cr: t.erMedicare },
    { account: 'FUTA Tax Payable', cr: t.futa },
    { account: 'SUTA Tax Payable', cr: t.suta },
  ];
  return { checks, t, payrollEntry, taxEntry, cost: cents(t.gross + t.employer) };
}

/** Debits and credits of an entry, to the cent. */
export const entryTotals = (entry) => ({
  dr: cents(entry.reduce((x, l) => x + (l.dr ?? 0), 0)),
  cr: cents(entry.reduce((x, l) => x + (l.cr ?? 0), 0)),
});

export function initPayroll(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const fresh = (p) => ({ employees: [p.a, p.b, p.c].map(([hours, rate]) => ({ hours, rate })), freq: p.freq, k: p.k, state: p.state, suta: p.suta });
  let state = fresh(PRESETS[0]);
  const freq = $('#pr-freq');

  const links = [];
  ['a', 'b', 'c'].forEach((who, i) => {
    for (const field of ['hours', 'rate']) {
      links.push(
        linkRange(root, `pr-${who}-${field}`, {
          get: () => state.employees[i][field],
          set: (v) => {
            state.employees[i][field] = v;
            setActive(-1);
            render();
          },
          fit: field === 'rate',
          max: field === 'hours' ? 100 : undefined,
        })
      );
    }
  });
  for (const k of ['k', 'state', 'suta']) {
    links.push(
      linkRange(root, `pr-${k}`, {
        get: () => state[k],
        set: (v) => {
          state[k] = v;
          setActive(-1);
          render();
        },
        fit: false,
        max: 50,
      })
    );
  }
  freq.addEventListener('change', () => {
    state.freq = parseInt(freq.value, 10);
    setActive(-1);
    render();
  });
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    state = fresh(p);
    links.forEach((s) => s());
    freq.value = String(state.freq);
    render();
  });

  r('year').textContent = `Uses ${TAX_YEAR} federal numbers: single-filer brackets and a ${money(STANDARD_DEDUCTION, 0)} standard deduction for income tax, ${SOCIAL_SECURITY_RATE}% Social Security, ${MEDICARE_RATE}% Medicare, and ${FUTA_RATE}% FUTA.`;

  function render() {
    const p = runPayroll(state);
    const { t } = p;
    r('gross').textContent = money(t.gross, 2);
    r('net').textContent = money(t.net, 2);
    r('employer').textContent = money(t.employer, 2);
    r('cost').textContent = money(p.cost, 2);

    const td = (v) => `<td>${money(v, 2)}</td>`;
    const regRow = (name, c, strong) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row"${strong ? ' class="font-semibold!"' : ''}>${name}</th>` + [c.gross, c.fed, c.ss, c.medicare, c.state, c.k401, c.net].map(td).join('');
      return tr;
    };
    r('register').replaceChildren(...p.checks.map((c, i) => regRow(EMPLOYEES[i], c)), regRow('Total', t, true));

    const entryRows = (entry) => {
      const tot = entryTotals(entry);
      const rows = entry.map((l) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<th scope="row"${l.cr != null ? ' class="pl-6!"' : ''}>${l.account}</th><td>${l.dr != null ? money(l.dr, 2) : ''}</td><td>${l.cr != null ? money(l.cr, 2) : ''}</td>`;
        return tr;
      });
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row" class="font-semibold!">Totals</th><td class="font-semibold!">${money(tot.dr, 2)}</td><td class="font-semibold!">${money(tot.cr, 2)}</td>`;
      return [...rows, tr];
    };
    r('entry1').replaceChildren(...entryRows(p.payrollEntry));
    r('entry2').replaceChildren(...entryRows(p.taxEntry));

    const v = r('verdict');
    if (!t.gross) {
      setTone(v, 'warn');
      v.textContent = 'Give at least one employee some hours to run payroll.';
    } else {
      setTone(v, 'info');
      v.textContent = `Every $100 of wages costs the business about $${num((p.cost / t.gross) * 100, 2)}: the wages plus ${money(t.employer, 2)} of employer payroll taxes. Employees take home ${money(t.net, 2)}; the other ${money(t.gross - t.net, 2)} is withheld and owed to the government or the 401(k) plan.`;
    }

    const c0 = p.checks[0];
    r('formula').innerHTML =
      `${EMPLOYEES[0]}: ${num(state.employees[0].hours, 2)} hours × ${money(state.employees[0].rate, 2)} = ${money(c0.gross, 2)} gross pay` +
      `<span>Social Security = ${SOCIAL_SECURITY_RATE}% × ${money(c0.gross, 2)} = ${money(c0.ss, 2)}, withheld and matched by the business</span>` +
      `<span>Medicare = ${MEDICARE_RATE}% × ${money(c0.gross, 2)} = ${money(c0.medicare, 2)}, withheld and matched by the business</span>` +
      `<span>State income tax = ${state.state}% × ${money(c0.gross - c0.k401, 2)} = ${money(c0.state, 2)}</span>` +
      `<span>Net pay = ${money(c0.gross, 2)} − ${money(c0.fed, 2)} − ${money(c0.ss, 2)} − ${money(c0.medicare, 2)} − ${money(c0.state, 2)} − ${money(c0.k401, 2)} = ${money(c0.net, 2)}</span>` +
      `<span>Employer adds FUTA ${FUTA_RATE}% (${money(c0.employer.futa, 2)}) and SUTA ${state.suta}% (${money(c0.employer.suta, 2)})</span>`;

    draw(p);
  }

  function draw(p) {
    const { t } = p;
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const H = 72;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (tag, a, x) => svg.appendChild(svgEl(tag, a, x));
    const key = r('key');
    key.replaceChildren();
    if (!p.cost) {
      add('rect', { x: 0, y: 8, width: W, height: 40, rx: 6, style: 'fill:var(--grid)' });
      svg.setAttribute('aria-label', 'No payroll yet.');
      return;
    }
    const segs = [
      ['Take-home pay', t.net, '--good', 1],
      ['Withheld taxes', t.fed + t.ss + t.medicare + t.state, '--warn', 1],
      ['401(k)', t.k401, '--accent', 1],
      ['Employer payroll taxes', t.employer, '--bad', 0.7],
    ];
    let x = 0;
    for (const [label, val, color, op] of segs) {
      const w = (val / p.cost) * W;
      if (w <= 0) continue;
      add('rect', { x, y: 8, width: w, height: 40, style: `fill:var(${color});opacity:${op}` });
      x += w;
      const item = document.createElement('span');
      const sw = document.createElement('i');
      sw.className = SWATCH;
      sw.style.background = `var(${color})`;
      sw.style.opacity = String(op);
      item.append(sw, `${label} ${money(val, 2)}`);
      key.append(item);
    }
    const gx = (t.gross / p.cost) * W;
    add('line', { x1: gx, x2: gx, y1: 2, y2: 54, style: 'stroke:var(--ink);stroke-width:2;stroke-dasharray:3 3' });
    add('text', { x: Math.min(Math.max(gx, 40), W - 40), y: 68, 'text-anchor': 'middle', style: 'fill:var(--ink)' }, 'Gross pay ends here');
    svg.setAttribute('aria-label', `Total cost of payroll ${money(p.cost, 2)}: take-home pay ${money(t.net, 2)}, withheld taxes ${money(t.fed + t.ss + t.medicare + t.state, 2)}, 401(k) ${money(t.k401, 2)}, and employer payroll taxes ${money(t.employer, 2)}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  links.forEach((s) => s());
  freq.value = String(state.freq);
  render();
}
