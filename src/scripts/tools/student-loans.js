// Student Loan Simulator
// Each year in school: the gap = cost - grants - family help. Federal loans fill the gap first, up to the
// yearly and lifetime limits (src/data/student-loans.js). Private loans cover whatever is left.
// Interest during school and the grace period: subsidized loans none, unsubsidized and private loans
// simple interest from the day the money arrives (the start of each school year) until payments start.
// That interest is added to the balance (capitalized), then each loan is paid off with equal monthly payments.

import { money, num, niceMax, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';
import {
  AS_OF,
  FEDERAL_RATE,
  ANNUAL_LIMIT,
  SUBSIDIZED_LIMIT,
  AGGREGATE_LIMIT,
  AGGREGATE_SUBSIDIZED,
  GRACE_MONTHS,
} from '../../data/student-loans.js';

const PRESETS = [
  { name: 'Community college', cost: 12000, aid: 4000, family: 4000, years: 2 },
  { name: 'In-state public', cost: 28000, aid: 6000, family: 10000, years: 4 },
  { name: 'Out-of-state public', cost: 45000, aid: 8000, family: 10000, years: 4 },
  { name: 'Private college', cost: 65000, aid: 30000, family: 10000, years: 4 },
];
const KEYS = ['cost', 'aid', 'family', 'years', 'rate', 'salary'];
export const TERMS = [10, 20, 25];
/** Rough share of pay left after taxes, for the take-home estimate. */
export const TAKE_HOME = 0.78;

/** Loans for each year in school. s: { cost, aid, family, years, sub } */
export function yearLoans(s) {
  const rows = [];
  let fedSoFar = 0;
  let subSoFar = 0;
  for (let y = 0; y < s.years; y++) {
    const gap = Math.max(0, s.cost - s.aid - s.family);
    const limit = ANNUAL_LIMIT[Math.min(y, ANNUAL_LIMIT.length - 1)];
    const fed = Math.min(gap, limit, Math.max(0, AGGREGATE_LIMIT - fedSoFar));
    const subLimit = SUBSIDIZED_LIMIT[Math.min(y, SUBSIDIZED_LIMIT.length - 1)];
    const sub = s.sub ? Math.min(fed, subLimit, Math.max(0, AGGREGATE_SUBSIDIZED - subSoFar)) : 0;
    fedSoFar += fed;
    subSoFar += sub;
    rows.push({ year: y + 1, gap, fed, sub, unsub: fed - sub, priv: gap - fed });
  }
  return rows;
}

/** Months from the start of school year `year` (1-based) until the first payment. */
export const monthsToRepay = (year, years) => (years - year + 1) * 12 + GRACE_MONTHS;

/** Everything owed when payments start. s also needs rate (private loan rate, %). */
export function plan(s) {
  const rows = yearLoans(s).map((r) => {
    const t = monthsToRepay(r.year, s.years) / 12;
    const fedInt = r.unsub * (FEDERAL_RATE / 100) * t;
    const privInt = r.priv * (s.rate / 100) * t;
    return { ...r, fedInt, privInt, interest: fedInt + privInt };
  });
  const total = (k) => rows.reduce((t, r) => t + r[k], 0);
  const fedBorrowed = total('fed');
  const privBorrowed = total('priv');
  const fedInt = total('fedInt');
  const privInt = total('privInt');
  return {
    rows,
    fedBorrowed,
    privBorrowed,
    subBorrowed: total('sub'),
    borrowed: fedBorrowed + privBorrowed,
    accrued: fedInt + privInt,
    fedOwed: fedBorrowed + fedInt,
    privOwed: privBorrowed + privInt,
    owed: fedBorrowed + privBorrowed + fedInt + privInt,
  };
}

/** Equal monthly payment that pays off `principal` at `ratePct` a year over `months`. */
export function payment(principal, ratePct, months) {
  if (principal <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - (1 + r) ** -months);
}

/** Paying it back over `years`. Total interest includes what piled up before payments started. */
export function repay(p, privRate, years) {
  const n = years * 12;
  const fedPay = payment(p.fedOwed, FEDERAL_RATE, n);
  const privPay = payment(p.privOwed, privRate, n);
  const monthly = fedPay + privPay;
  const totalPaid = monthly * n;
  return { years, monthly, fedPay, privPay, totalPaid, totalInterest: totalPaid - p.borrowed };
}

export function initStudentLoans(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = { ...PRESETS[1], rate: 10, salary: 55000, sub: true };
  const subBox = $('#sl-sub');

  const syncs = KEYS.map((k) =>
    linkRange(root, `sl-${k}`, {
      get: () => state[k],
      set: (v) => {
        state[k] = k === 'years' ? Math.max(1, Math.min(6, Math.round(v))) : v;
        if (k !== 'rate' && k !== 'salary') setActive(-1);
        render();
      },
      max: k === 'years' ? 6 : k === 'rate' ? 30 : undefined,
      fit: k !== 'years' && k !== 'rate',
    })
  );
  subBox.addEventListener('change', () => {
    state.sub = subBox.checked;
    render();
  });
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, p);
    syncs.forEach((s) => s());
    render();
  });

  r('asof').textContent = `Federal rate for the ${AS_OF}: ${FEDERAL_RATE}% fixed. Federal limits for a dependent student: ${ANNUAL_LIMIT.map((v) => money(v, 0)).join(', ')} a year, ${money(AGGREGATE_LIMIT, 0)} in all.`;

  function render() {
    const p = plan(state);
    const ten = repay(p, state.rate, 10);
    const takeHome = (state.salary * TAKE_HOME) / 12;
    const ratio = state.salary > 0 ? p.borrowed / state.salary : Infinity;

    r('borrowed').textContent = money(p.borrowed, 0);
    r('owed').textContent = money(p.owed, 0);
    r('monthly').textContent = money(ten.monthly, 0);
    r('interest').textContent = money(ten.totalInterest, 0);

    const v = r('verdict');
    if (p.borrowed === 0) {
      setTone(v, 'good');
      v.textContent = 'No loans needed. Grants, family help, and work cover the full cost.';
    } else if (state.salary <= 0) {
      setTone(v, 'warn');
      v.textContent = 'Add a starting salary to see if the payment fits your paycheck.';
    } else if (ratio <= 0.8) {
      setTone(v, 'good');
      v.textContent = `You'd borrow ${money(p.borrowed, 0)}, less than a year of your starting pay (${money(state.salary, 0)}). The 10-year payment takes ${pct(ten.monthly / takeHome)} of your take-home pay.`;
    } else if (ratio <= 1) {
      setTone(v, 'warn');
      v.textContent = `You'd borrow ${money(p.borrowed, 0)}, close to a full year of your starting pay (${money(state.salary, 0)}). The 10-year payment takes ${pct(ten.monthly / takeHome)} of your take-home pay.`;
    } else {
      setTone(v, 'bad');
      v.textContent = `You'd borrow ${money(p.borrowed, 0)}, more than a year of your starting pay (${money(state.salary, 0)}). The 10-year payment takes ${pct(ten.monthly / takeHome)} of your take-home pay.`;
    }

    // Paying it back: one row per term.
    r('terms').replaceChildren(
      ...TERMS.map((y) => {
        const t = repay(p, state.rate, y);
        const tr = document.createElement('tr');
        tr.innerHTML = `<th scope="row">${y} years</th><td>${money(t.monthly, 0)}</td><td>${money(t.totalInterest, 0)}</td><td>${money(t.totalPaid, 0)}</td><td>${pct(takeHome > 0 ? t.monthly / takeHome : 0)}</td>`;
        return tr;
      })
    );
    r('takehome').textContent = `Take-home pay estimate: ${money(state.salary, 0)} a year, about ${money(takeHome, 0)} a month after taxes.`;

    // Federal vs private for this plan.
    r('split').textContent = p.borrowed
      ? `In this plan: ${money(p.fedBorrowed, 0)} federal (${money(p.subBorrowed, 0)} subsidized) and ${money(p.privBorrowed, 0)} private.`
      : 'In this plan: no loans.';

    const first = p.rows[0];
    const firstT = monthsToRepay(1, state.years);
    r('formula').innerHTML =
      `Gap each year = ${money(state.cost, 0)} cost − ${money(state.aid, 0)} grants − ${money(state.family, 0)} family help = ${money(first.gap, 0)}` +
      `<span>Year 1 federal loan = ${money(first.fed, 0)} (limit ${money(ANNUAL_LIMIT[0], 0)}): ${money(first.sub, 0)} subsidized, ${money(first.unsub, 0)} unsubsidized. Private loan = ${money(first.priv, 0)}</span>` +
      `<span>Year 1 money waits ${firstT} months for payments to start (${state.years * 12} in school + ${GRACE_MONTHS} grace)</span>` +
      `<span>Year 1 interest = ${money(first.unsub, 0)} × ${FEDERAL_RATE}% × ${num(firstT / 12, 1)} yr + ${money(first.priv, 0)} × ${state.rate}% × ${num(firstT / 12, 1)} yr = ${money(first.interest, 0)}</span>` +
      `<span>Owed when payments start = ${money(p.borrowed, 0)} borrowed + ${money(p.accrued, 0)} interest = ${money(p.owed, 0)}</span>` +
      `<span>10-year payment = ${money(ten.fedPay, 2)} federal + ${money(ten.privPay, 2)} private = ${money(ten.monthly, 2)} a month</span>`;

    draw(p);
  }

  function draw(p) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const H = narrow ? 240 : 280;
    const L = narrow ? 52 : 64, R = 12, T = 22, B = 34;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));

    const tops = p.rows.map((row) => row.gap + row.interest);
    const maxY = niceMax(Math.max(...tops, 1000));
    const y = (val) => T + (1 - val / maxY) * (H - T - B);
    const n = String(maxY)[0] === '2' && String(maxY)[1] !== '5' ? 4 : 5;
    for (let i = 0; i <= n; i++) {
      const val = (maxY / n) * i;
      add('line', { x1: L, x2: W - R, y1: y(val), y2: y(val), style: 'stroke:var(--grid)' });
      add('text', { x: L - 6, y: y(val) + 4, 'text-anchor': 'end' }, money(val, 0));
    }

    const slot = (W - L - R) / p.rows.length;
    const bw = Math.min(64, slot * 0.6);
    p.rows.forEach((row, i) => {
      const cx = L + slot * (i + 0.5);
      let base = 0;
      for (const [val, color, op] of [
        [row.fed, '--accent', 1],
        [row.priv, '--warn', 1],
        [row.interest, '--bad', 0.55],
      ]) {
        if (val <= 0) continue;
        add('rect', { x: cx - bw / 2, y: y(base + val), width: bw, height: Math.max(0, y(base) - y(base + val)), style: `fill:var(${color});opacity:${op}` });
        base += val;
      }
      if (base > 0) add('text', { x: cx, y: y(base) - 6, 'text-anchor': 'middle', style: 'fill:var(--ink)' }, money(base, 0));
      add('text', { x: cx, y: H - B + 18, 'text-anchor': 'middle' }, narrow ? `Yr ${row.year}` : `Year ${row.year}`);
    });

    const parts = p.rows.map((row) => `year ${row.year} borrows ${money(row.gap, 0)} and adds ${money(row.interest, 0)} of interest`);
    svg.setAttribute('aria-label', `Each year's loans and the interest they add before payments start: ${parts.join('; ')}. Total owed when payments start: ${money(p.owed, 0)}.`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(1);
  syncs.forEach((s) => s());
  subBox.checked = state.sub;
  render();
}

function pct(x) {
  return Number.isFinite(x) ? `${Math.round(x * 100)}%` : '–';
}
