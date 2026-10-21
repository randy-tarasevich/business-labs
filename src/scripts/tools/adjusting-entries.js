// Adjusting Entries Lab
// Maya's Food Truck at the end of month 2. The trial balance is posted, but some numbers are out of date:
// supplies got used, insurance got used up, the truck wore down, revenue was earned, and bills piled up
// that haven't been paid. Students work out each adjustment (accounts AND amount) and watch the worksheet
// and net income change.

import { money, setTone } from '../lib/util.js';

// type: A asset, K contra-asset, L liability, C capital, D drawing, R revenue, X expense
export const ACCOUNTS = [
  { id: 'cash', name: 'Cash', type: 'A' },
  { id: 'ar', name: 'Accounts Receivable', type: 'A' },
  { id: 'supplies', name: 'Supplies', type: 'A' },
  { id: 'prepaid', name: 'Prepaid Insurance', type: 'A' },
  { id: 'equipment', name: 'Equipment', type: 'A' },
  { id: 'accdep', name: 'Accumulated Depreciation', type: 'K' },
  { id: 'ap', name: 'Accounts Payable', type: 'L' },
  { id: 'wagespay', name: 'Wages Payable', type: 'L' },
  { id: 'intpay', name: 'Interest Payable', type: 'L' },
  { id: 'unearned', name: 'Unearned Revenue', type: 'L' },
  { id: 'loan', name: 'Loan Payable', type: 'L' },
  { id: 'capital', name: 'Maya, Capital', type: 'C' },
  { id: 'drawing', name: 'Maya, Drawing', type: 'D' },
  { id: 'sales', name: 'Sales Revenue', type: 'R' },
  { id: 'supexp', name: 'Supplies Expense', type: 'X' },
  { id: 'insexp', name: 'Insurance Expense', type: 'X' },
  { id: 'depexp', name: 'Depreciation Expense', type: 'X' },
  { id: 'wagesexp', name: 'Wages Expense', type: 'X' },
  { id: 'intexp', name: 'Interest Expense', type: 'X' },
  { id: 'fuel', name: 'Fuel and Permits Expense', type: 'X' },
];
const TYPES = {
  A: { name: 'asset', debitUp: true },
  K: { name: 'contra-asset account', debitUp: false },
  L: { name: 'liability', debitUp: false },
  C: { name: 'owner\'s capital account', debitUp: false },
  D: { name: 'drawing account', debitUp: true },
  R: { name: 'revenue account', debitUp: false },
  X: { name: 'expense account', debitUp: true },
};
const DEBIT_NORMAL = new Set(['A', 'D', 'X']);
const GROUPS = [
  ['Assets', ['A', 'K']],
  ['Liabilities', ['L']],
  ['Owner\'s equity', ['C', 'D']],
  ['Revenue and expenses', ['R', 'X']],
];
const byId = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));

/** Trial balance before adjustments: balance on each account's normal side. Totals $31,200 each side. */
export const UNADJUSTED = {
  cash: 5900, ar: 350, supplies: 1100, prepaid: 1200, equipment: 20000, accdep: 300,
  ap: 600, unearned: 900, loan: 13500, capital: 10700, drawing: 800,
  sales: 5200, wagesexp: 1200, fuel: 650,
};

// kind: the four types of adjustments textbooks teach (shown on the chip). label: a short name for the net income list. calc: how to get the amount, shown after misses.
// traps: common wrong answers with a hint aimed at that mistake (checked before the general hints).
export const ADJUSTMENTS = [
  {
    text: 'The Supplies account shows $1,100. Maya counts what\'s left on the truck: $450 of supplies.',
    dr: 'supexp', cr: 'supplies', amt: 650, kind: 'Supplies used', label: 'Supplies used',
    calc: '$1,100 on the books − $450 still on the truck = $650 used up.',
    why: 'Supplies that got used are no longer an asset. They became an expense this month.',
    traps: [{ test: (g) => g.da === 450, msg: '$450 is what\'s left. The adjustment records what was used up.' }],
  },
  {
    text: 'On the 1st of this month, Maya paid $1,200 for six months of truck insurance. One month has now passed.',
    dr: 'insexp', cr: 'prepaid', amt: 200, kind: 'Prepaid expense', label: 'Insurance used',
    calc: '$1,200 ÷ 6 months = $200 for one month.',
    why: 'Prepaid insurance is an asset until it\'s used. One month of coverage is used up, so $200 moves from the asset to an expense.',
    traps: [{ test: (g) => g.da === 1200, msg: '$1,200 is the whole six-month policy. Only one month has been used.' }],
  },
  {
    text: 'The food truck cost $20,000. Maya expects it to last 5 years and sell for $2,000 at the end. Record this month\'s straight-line depreciation.',
    dr: 'depexp', cr: 'accdep', amt: 300, kind: 'Depreciation', label: 'Truck depreciation',
    calc: '($20,000 − $2,000) ÷ 5 years = $3,600 a year. $3,600 ÷ 12 months = $300 a month.',
    why: 'Depreciation spreads the truck\'s cost over the years it\'s used. It goes in Accumulated Depreciation so the truck\'s original cost stays on the books.',
    traps: [
      { test: (g) => g.cr === 'equipment', msg: 'Depreciation never touches the Equipment account. Credit Accumulated Depreciation, so the original cost stays visible.' },
      { test: (g) => g.da === 3600, msg: '$3,600 is a full year. Adjust for one month.' },
      { test: (g) => g.da === 4000 || g.da === 333, msg: 'Don\'t forget the $2,000 the truck will still be worth. Only $18,000 gets depreciated.' },
    ],
  },
  {
    text: 'Last month a school paid Maya $900 in advance to cater three events, recorded as Unearned Revenue. She catered the first one this month.',
    dr: 'unearned', cr: 'sales', amt: 300, kind: 'Unearned revenue', label: 'Catering earned',
    calc: '$900 ÷ 3 events = $300 earned for the one event catered.',
    why: 'Unearned revenue is a liability: Maya owes the school food or its money back. Catering one event earns $300, so the liability shrinks and revenue grows.',
    traps: [{ test: (g) => g.da === 900, msg: 'Only one of the three events has happened. The other two are still owed.' }],
  },
  {
    text: 'Maya\'s helper worked the last 4 days of the month at $60 a day. He\'ll be paid on the 5th of next month.',
    dr: 'wagesexp', cr: 'wagespay', amt: 240, kind: 'Accrued expense', label: 'Wages owed',
    calc: '4 days × $60 = $240 earned by the helper but not paid yet.',
    why: 'The helper did the work this month, so it\'s this month\'s expense even though the cash goes out next month. Until then, Maya owes it: Wages Payable.',
  },
  {
    text: 'The $13,500 bank loan charges 8% interest a year. No interest has been paid or recorded this month.',
    dr: 'intexp', cr: 'intpay', amt: 90, kind: 'Accrued expense', label: 'Interest owed',
    calc: '$13,500 × 8% = $1,080 a year. $1,080 ÷ 12 months = $90 for this month.',
    why: 'Interest builds up every day the loan is out, whether or not it has been paid. This month\'s $90 is an expense now and a debt until it\'s paid.',
    traps: [
      { test: (g) => g.da === 1080, msg: '$1,080 is a full year of interest. Adjust for one month.' },
      { test: (g) => g.dr === 'loan' || g.cr === 'loan', msg: 'Interest isn\'t part of the loan itself. It goes in Interest Payable until it\'s paid.' },
    ],
  },
  {
    text: 'On the last day of the month, Maya catered an office lunch for $400. She\'ll send the bill next month.',
    dr: 'ar', cr: 'sales', amt: 400, kind: 'Accrued revenue', label: 'Lunch billed later',
    calc: 'The full $400 was earned this month.',
    why: 'Revenue counts when it\'s earned, not when the cash comes in. The office now owes Maya $400: Accounts Receivable.',
    traps: [{ test: (g) => g.cr === 'unearned', msg: 'Unearned Revenue is for cash received before the work. Here the work is done and the cash comes later.' }],
  },
];
export const LETTERS = 'abcdefg';

/** Balances after the first n adjustments, positive on each account's normal side. */
export function adjustedBalances(n = ADJUSTMENTS.length) {
  const bal = Object.fromEntries(ACCOUNTS.map((a) => [a.id, UNADJUSTED[a.id] || 0]));
  for (const t of ADJUSTMENTS.slice(0, n)) {
    bal[t.dr] += DEBIT_NORMAL.has(byId[t.dr].type) ? t.amt : -t.amt;
    bal[t.cr] += DEBIT_NORMAL.has(byId[t.cr].type) ? -t.amt : t.amt;
  }
  return bal;
}

/** Revenue minus expenses for a set of balances. */
export function netIncome(bal) {
  return ACCOUNTS.reduce((t, a) => t + (a.type === 'R' ? bal[a.id] : a.type === 'X' ? -bal[a.id] : 0), 0);
}

/** How a debit or credit changes an account, in words. */
const effect = (id, side) => {
  const t = TYPES[byId[id].type];
  return (side === 'dr' ? t.debitUp : !t.debitUp) ? 'increase' : 'decrease';
};
/** An adjustment's effect on net income: + for revenue up, − for expenses up. */
const incomeEffect = (t) => (byId[t.cr].type === 'R' ? t.amt : 0) - (byId[t.dr].type === 'X' ? t.amt : 0) + (byId[t.dr].type === 'R' ? -t.amt : 0);

const fmt = (n) => money(n, 0);

export function initAdjustingEntries(root) {
  const q = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const drSel = q('#ae-dr'), crSel = q('#ae-cr'), drAmt = q('#ae-dr-amt'), crAmt = q('#ae-cr-amt');

  for (const sel of [drSel, crSel]) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Pick an account';
    sel.appendChild(blank);
    for (const [label, types] of GROUPS) {
      const og = document.createElement('optgroup');
      og.label = label;
      ACCOUNTS.filter((a) => types.includes(a.type)).forEach((a) => {
        const o = document.createElement('option');
        o.value = a.id;
        o.textContent = a.name;
        og.appendChild(o);
      });
      sel.appendChild(og);
    }
  }

  // Worksheet rows, built once.
  const rows = {};
  const body = r('ws');
  for (const a of ACCOUNTS) {
    const tr = document.createElement('tr');
    tr.className = 'data-changed:bg-accent/8 data-changed:[&>th]:font-semibold data-changed:[&>th]:bg-[color-mix(in_srgb,var(--accent)_8%,var(--panel))]';
    tr.innerHTML = `<th scope="row">${a.name}</th>` + '<td></td>'.repeat(6);
    body.appendChild(tr);
    rows[a.id] = tr;
  }

  let step, tries, phase, posted;

  q('[data-act="check"]').addEventListener('click', check);
  q('[data-act="reveal"]').addEventListener('click', () => post(false));
  q('[data-act="next"]').addEventListener('click', next);
  q('[data-act="restart"]').addEventListener('click', reset);
  [drSel, crSel, drAmt, crAmt].forEach((el) => el.addEventListener('input', () => {
    setTone(r('dr-row'), '');
    setTone(r('cr-row'), '');
  }));
  [drAmt, crAmt].forEach((el) => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  }));

  function reset() {
    step = 0;
    posted = [];
    startCard();
    render(null);
  }

  function startCard() {
    phase = 'predict';
    tries = 0;
    const t = ADJUSTMENTS[step];
    r('progress').textContent = `Adjustment ${LETTERS[step]} (${step + 1} of ${ADJUSTMENTS.length})`;
    r('bar').style.width = `${(step / ADJUSTMENTS.length) * 100}%`;
    r('text').textContent = t.text;
    r('kind').hidden = true;
    [drSel, crSel].forEach((s) => ((s.value = ''), (s.disabled = false)));
    [drAmt, crAmt].forEach((s) => ((s.value = ''), (s.disabled = false)));
    setTone(r('dr-row'), '');
    setTone(r('cr-row'), '');
    setFeedback('', '');
    r('why').hidden = true;
    buttons();
  }

  function buttons() {
    q('[data-act="check"]').hidden = phase !== 'predict';
    q('[data-act="reveal"]').hidden = phase !== 'predict';
    q('[data-act="next"]').hidden = phase !== 'posted';
    q('[data-act="next"]').textContent = step === ADJUSTMENTS.length - 1 ? 'See the adjusted trial balance' : 'Next adjustment';
    q('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  function check() {
    if (phase !== 'predict') return;
    const t = ADJUSTMENTS[step];
    const g = { dr: drSel.value, cr: crSel.value, da: Math.round(parseFloat(drAmt.value) || 0), ca: Math.round(parseFloat(crAmt.value) || 0) };
    if (!g.dr || !g.cr || !g.da || !g.ca) {
      setFeedback('bad', 'Pick an account and enter an amount for both the debit and the credit.');
      return;
    }
    const drOk = g.dr === t.dr && g.da === t.amt;
    const crOk = g.cr === t.cr && g.ca === t.amt;
    setTone(r('dr-row'), drOk ? 'good' : 'bad');
    setTone(r('cr-row'), crOk ? 'good' : 'bad');
    if (drOk && crOk) {
      post(true);
      return;
    }
    tries++;
    const amountWrong = g.da !== t.amt || g.ca !== t.amt;
    const trap = (t.traps ?? []).find((x) => x.test(g));
    let msg;
    if (g.da !== g.ca) msg = 'Debits must equal credits. Your two amounts don\'t match.';
    else if (g.dr === 'cash' || g.cr === 'cash') msg = 'Adjusting entries never use Cash. If cash had moved, it would already be in the books as a regular transaction.';
    else if (trap) msg = trap.msg;
    else if (g.dr === t.cr && g.cr === t.dr) msg = 'Right accounts, wrong sides. Swap them.';
    else if (g.dr !== t.dr || g.cr !== t.cr) {
      const wrong = g.dr !== t.dr ? 'debit' : 'credit';
      const right = byId[wrong === 'debit' ? t.dr : t.cr];
      const ty = TYPES[right.type];
      msg = `Your ${wrong} account is off. Hint: it's a${/^[aeiou]/.test(ty.name) ? 'n' : ''} ${ty.name}, and it should ${effect(right.id, wrong === 'debit' ? 'dr' : 'cr')}.`;
      if (tries > 1) msg += ` It's ${right.name}.`;
    } else msg = 'Right accounts. Check the amount: how much belongs to this month?';
    if (amountWrong && tries > 1) msg += ` Here's how to find it: ${t.calc}`;
    setFeedback('bad', msg);
  }

  function post(earned) {
    const t = ADJUSTMENTS[step];
    phase = 'posted';
    drSel.value = t.dr;
    crSel.value = t.cr;
    drAmt.value = crAmt.value = String(t.amt);
    [drSel, crSel, drAmt, crAmt].forEach((el) => (el.disabled = true));
    setTone(r('dr-row'), 'good');
    setTone(r('cr-row'), 'good');
    posted.push({ ...t, letter: LETTERS[step], earned });
    setFeedback(earned ? 'good' : 'info', earned ? (tries === 0 ? 'Correct on the first try. Posted.' : 'Correct. Posted.') : 'Here is the correct entry. Posted.');
    r('kind').hidden = false;
    r('kind').textContent = t.kind;
    r('why').hidden = false;
    r('why').textContent = `${t.calc} ${t.why}`;
    buttons();
    render(t);
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < ADJUSTMENTS.length - 1) {
      step++;
      startCard();
      render(null);
      drSel.focus({ preventScroll: true });
    } else {
      phase = 'done';
      r('bar').style.width = '100%';
      r('progress').textContent = 'All adjustments posted';
      const mine = posted.filter((p) => p.earned).length;
      const before = netIncome(adjustedBalances(0));
      const after = netIncome(adjustedBalances());
      r('text').textContent = `The books are up to date. You got ${mine} of ${ADJUSTMENTS.length} adjustments yourself. Without them, Maya would have reported ${fmt(before)} of profit instead of ${fmt(after)}.`;
      r('kind').hidden = true;
      setFeedback('', '');
      r('why').hidden = true;
      buttons();
      render(null);
    }
  }

  function setFeedback(tone, msg) {
    const el = r('feedback');
    setTone(el, tone);
    el.textContent = msg;
    el.hidden = !msg;
  }

  function render(last) {
    const done = posted.length;
    const bal = adjustedBalances(done);
    let u = [0, 0], adj = [0, 0], fin = [0, 0];
    for (const a of ACCOUNTS) {
      const debitNormal = DEBIT_NORMAL.has(a.type);
      const ub = UNADJUSTED[a.id] || 0;
      const dr = posted.filter((p) => p.dr === a.id);
      const cr = posted.filter((p) => p.cr === a.id);
      const cells = rows[a.id].querySelectorAll('td');
      cells[0].textContent = debitNormal && ub ? fmt(ub) : '';
      cells[1].textContent = !debitNormal && ub ? fmt(ub) : '';
      cells[2].innerHTML = dr.map((p) => `<span class="text-muted">(${p.letter})</span> ${fmt(p.amt)}`).join('<br>');
      cells[3].innerHTML = cr.map((p) => `<span class="text-muted">(${p.letter})</span> ${fmt(p.amt)}`).join('<br>');
      cells[4].textContent = debitNormal && bal[a.id] ? fmt(bal[a.id]) : '';
      cells[5].textContent = !debitNormal && bal[a.id] ? fmt(bal[a.id]) : '';
      rows[a.id].toggleAttribute('data-changed', !!last && (last.dr === a.id || last.cr === a.id));
      if (debitNormal) { u[0] += ub; fin[0] += bal[a.id]; } else { u[1] += ub; fin[1] += bal[a.id]; }
      adj[0] += dr.reduce((t, p) => t + p.amt, 0);
      adj[1] += cr.reduce((t, p) => t + p.amt, 0);
    }
    ['u-dr', 'u-cr', 'a-dr', 'a-cr', 'f-dr', 'f-cr'].forEach((k, i) => (r(k).textContent = fmt([u[0], u[1], adj[0], adj[1], fin[0], fin[1]][i])));
    const v = r('ws-verdict');
    setTone(v, fin[0] === fin[1] ? 'good' : 'bad');
    v.textContent = done
      ? `Adjusted trial balance: debits ${fmt(fin[0])} = credits ${fmt(fin[1])}.${done === ADJUSTMENTS.length ? ' Ready for the financial statements.' : ''}`
      : `Unadjusted trial balance: debits ${fmt(u[0])} = credits ${fmt(u[1])}. In balance, but not up to date.`;

    // Net income tracker
    const start = netIncome(adjustedBalances(0));
    r('ni-start').textContent = fmt(start);
    const list = r('ni-list');
    list.replaceChildren();
    posted.forEach((p) => {
      const e = incomeEffect(p);
      const li = document.createElement('li');
      li.className = 'flex justify-between gap-3 py-1 border-b border-line text-[13.5px]';
      li.innerHTML = `<span>(${p.letter}) ${p.label}</span><span class="font-mono tabular-nums ${e < 0 ? 'text-bad' : e > 0 ? 'text-good' : 'text-muted'}">${e > 0 ? '+' : e < 0 ? '−' : ''}${fmt(Math.abs(e))}</span>`;
      list.appendChild(li);
    });
    const now = netIncome(bal);
    r('ni-now').textContent = fmt(now);
    r('ni-now-k').textContent = done === ADJUSTMENTS.length ? 'Adjusted net income' : 'Net income so far';
    const nv = r('ni-verdict');
    setTone(nv, done ? 'info' : '');
    nv.textContent = done
      ? `So far, adjustments have ${now < start ? 'lowered' : now > start ? 'raised' : 'not changed'} net income by ${fmt(Math.abs(now - start))}.`
      : '';
  }

  reset();
}
