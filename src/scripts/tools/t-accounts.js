// T-Account Lab
// Maya's Food Truck, the same first month as the Accounting Equation Lab, now with debits and credits.
// Students journalize each transaction (one debit, one credit), check it, and post it to T-accounts.
// A trial balance under the T-accounts proves debits = credits after every entry.

import { money, setTone, wireReveals } from '../lib/util.js';

// type: A asset, L liability, C capital, D drawing, R revenue, X expense
export const ACCOUNTS = [
  { id: 'cash', name: 'Cash', type: 'A' },
  { id: 'ar', name: 'Accounts Receivable', type: 'A' },
  { id: 'supplies', name: 'Supplies', type: 'A' },
  { id: 'equipment', name: 'Equipment', type: 'A' },
  { id: 'ap', name: 'Accounts Payable', type: 'L' },
  { id: 'loan', name: 'Loan Payable', type: 'L' },
  { id: 'capital', name: 'Maya, Capital', type: 'C' },
  { id: 'drawing', name: 'Maya, Drawing', type: 'D' },
  { id: 'sales', name: 'Sales Revenue', type: 'R' },
  { id: 'fuel', name: 'Fuel and Permits Expense', type: 'X' },
  { id: 'supexp', name: 'Supplies Expense', type: 'X' },
];
const TYPES = {
  A: { name: 'asset', debitUp: true },
  L: { name: 'liability', debitUp: false },
  C: { name: 'owner\'s capital account', debitUp: false },
  D: { name: 'drawing account', debitUp: true },
  R: { name: 'revenue account', debitUp: false },
  X: { name: 'expense account', debitUp: true },
};
const GROUPS = [
  ['Assets', ['A']],
  ['Liabilities', ['L']],
  ['Owner\'s equity', ['C', 'D']],
  ['Revenue and expenses', ['R', 'X']],
];
const byId = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));

export const TRANSACTIONS = [
  { text: 'Maya puts $10,000 of her own savings into the business bank account to start her food truck.', dr: 'cash', cr: 'capital', amt: 10000, why: 'Cash is an asset, so an increase is a debit. Maya\'s investment raises her capital, which increases on the credit side.' },
  { text: 'The business borrows $15,000 from the bank.', dr: 'cash', cr: 'loan', amt: 15000, why: 'Cash goes up (debit). The business now owes the bank, and liabilities increase on the credit side.' },
  { text: 'The business buys a used food truck for $20,000, paid in cash.', dr: 'equipment', cr: 'cash', amt: 20000, why: 'Equipment goes up (debit). Cash goes down, and an asset decreases on the credit side.' },
  { text: 'The business buys $800 of ingredients and supplies on account, to be paid next month.', dr: 'supplies', cr: 'ap', amt: 800, why: 'Supplies go up (debit). "On account" means the business owes the supplier, so Accounts Payable goes up (credit).' },
  { text: 'The truck sells $1,500 of meals for cash on its first weekend.', dr: 'cash', cr: 'sales', amt: 1500, why: 'Cash goes up (debit). Revenue increases owner\'s equity, so it increases on the credit side.' },
  { text: 'The truck caters a school event for $600. The school will pay in 30 days.', dr: 'ar', cr: 'sales', amt: 600, why: 'The revenue is earned now (credit Sales Revenue). Instead of cash, the business gets a promise to pay: Accounts Receivable goes up (debit).' },
  { text: 'The business pays $300 cash for fuel and a parking permit.', dr: 'fuel', cr: 'cash', amt: 300, why: 'Expenses increase on the debit side because they reduce owner\'s equity. Cash goes down (credit).' },
  { text: 'The business pays the supplier $500 of the $800 it owes.', dr: 'ap', cr: 'cash', amt: 500, why: 'Paying a bill shrinks what you owe: a liability decreases on the debit side. Cash goes down (credit). No expense here; the supplies were recorded in transaction 4.' },
  { text: 'The school pays the $600 it owed for the catering job.', dr: 'cash', cr: 'ar', amt: 600, why: 'Cash goes up (debit) and Accounts Receivable goes down (credit). No new revenue: it was recorded in transaction 6.' },
  { text: 'The business makes a $1,000 payment on the bank loan (all principal, no interest).', dr: 'loan', cr: 'cash', amt: 1000, why: 'The amount owed goes down, so debit Loan Payable. Cash goes down (credit). Repaying principal is not an expense.' },
  { text: 'By the end of the month, the truck has used $400 of its supplies cooking meals.', dr: 'supexp', cr: 'supplies', amt: 400, why: 'Used-up supplies become an expense (debit Supplies Expense). The Supplies asset goes down (credit). No cash moves.' },
  { text: 'Maya takes $700 out of the business for personal use.', dr: 'drawing', cr: 'cash', amt: 700, why: 'Withdrawals go in Maya, Drawing, which increases on the debit side because it reduces her equity. Cash goes down (credit). It is not a business expense.' },
];

const fmt = (n) => money(n, 0);
/** How an account's debit or credit changes it, in words. */
const effect = (id, side) => {
  const t = TYPES[byId[id].type];
  const up = side === 'dr' ? t.debitUp : !t.debitUp;
  return up ? 'increase' : 'decrease';
};

/** Balance of each account from posted entries, positive on its normal side. */
export function balances(posted) {
  const dr = {}, cr = {};
  ACCOUNTS.forEach((a) => ((dr[a.id] = 0), (cr[a.id] = 0)));
  posted.forEach((t) => ((dr[t.dr] += t.amt), (cr[t.cr] += t.amt)));
  return { dr, cr };
}

export function initTAccounts(root) {
  const q = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const drSel = q('#ta-dr'), crSel = q('#ta-cr'), drAmt = q('#ta-dr-amt'), crAmt = q('#ta-cr-amt');

  // Fill both account menus once.
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

  // T-accounts, built once and filled by render().
  const tGrid = r('tgrid');
  const tEls = {};
  for (const [label, types] of GROUPS) {
    const h = document.createElement('h3');
    h.className = 'col-span-full font-sans text-[12px] tracking-[.06em] uppercase text-muted font-semibold mt-1';
    h.textContent = label;
    tGrid.appendChild(h);
    ACCOUNTS.filter((a) => types.includes(a.type)).forEach((a) => {
      const box = document.createElement('div');
      box.className = 'rounded-lg border border-line p-2.5 grid gap-1 min-w-0 data-changed:border-accent data-changed:bg-accent/6';
      box.innerHTML =
        `<span class="text-center font-semibold text-[13.5px] pb-1 border-b-2 border-ink">${a.name}</span>` +
        `<div class="grid grid-cols-2 min-h-[2.2rem] font-mono text-[12px] tabular-nums whitespace-nowrap">` +
        `<div class="pr-1.5 border-r-2 border-ink grid content-start gap-0.5" data-side="dr"></div>` +
        `<div class="pl-1.5 grid content-start gap-0.5 text-right" data-side="cr"></div></div>` +
        `<div class="grid grid-cols-2 font-mono text-[12px] font-semibold tabular-nums whitespace-nowrap border-t border-line pt-1" data-bal></div>`;
      tGrid.appendChild(box);
      tEls[a.id] = box;
    });
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
  wireReveals(root);

  function reset() {
    step = 0;
    posted = [];
    startCard();
    render(null);
  }

  function startCard() {
    phase = 'predict';
    tries = 0;
    const t = TRANSACTIONS[step];
    r('progress').textContent = `Transaction ${step + 1} of ${TRANSACTIONS.length}`;
    r('bar').style.width = `${(step / TRANSACTIONS.length) * 100}%`;
    r('text').textContent = t.text;
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
    q('[data-act="next"]').textContent = step === TRANSACTIONS.length - 1 ? 'See the trial balance' : 'Next transaction';
    q('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  function check() {
    if (phase !== 'predict') return;
    const t = TRANSACTIONS[step];
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
    let msg;
    if (g.da !== g.ca) msg = 'Debits must equal credits. Your two amounts don\'t match.';
    else if (g.dr === t.cr && g.cr === t.dr) msg = 'Right accounts, wrong sides. Swap them.';
    else if (g.da !== t.amt) msg = `Check the amount. The transaction is for ${fmt(t.amt)}.`;
    else {
      const wrong = !drOk ? 'debit' : 'credit';
      const right = byId[wrong === 'debit' ? t.dr : t.cr];
      const ty = TYPES[right.type];
      msg = `Your ${wrong} is off. Hint: one account here is a${/^[aeiou]/.test(ty.name) ? 'n' : ''} ${ty.name}, and it should ${effect(right.id, wrong === 'debit' ? 'dr' : 'cr')}.`;
      if (tries > 1) msg += ` It's ${right.name}.`;
    }
    setFeedback('bad', msg);
  }

  function post(earned) {
    const t = TRANSACTIONS[step];
    phase = 'posted';
    drSel.value = t.dr;
    crSel.value = t.cr;
    drAmt.value = crAmt.value = String(t.amt);
    [drSel, crSel, drAmt, crAmt].forEach((el) => (el.disabled = true));
    setTone(r('dr-row'), 'good');
    setTone(r('cr-row'), 'good');
    posted.push({ ...t, n: step + 1, earned });
    setFeedback(earned ? 'good' : 'info', earned ? (tries === 0 ? 'Correct on the first try. Posted.' : 'Correct. Posted.') : 'Here is the correct entry. Posted.');
    r('why').hidden = false;
    r('why').textContent = `${t.why} ${byId[t.dr].name} ${effect(t.dr, 'dr')}s by ${fmt(t.amt)}; ${byId[t.cr].name} ${effect(t.cr, 'cr')}s by ${fmt(t.amt)}.`;
    buttons();
    render(t);
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < TRANSACTIONS.length - 1) {
      step++;
      startCard();
      render(null);
      drSel.focus({ preventScroll: true });
    } else {
      phase = 'done';
      r('bar').style.width = '100%';
      r('progress').textContent = 'All transactions posted';
      const mine = posted.filter((p) => p.earned).length;
      r('text').textContent = `Maya's first month is posted. You got ${mine} of ${TRANSACTIONS.length} entries yourself. Check the trial balance: total debits equal total credits.`;
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
    const { dr, cr } = balances(posted);
    for (const a of ACCOUNTS) {
      const box = tEls[a.id];
      box.toggleAttribute('data-changed', !!last && (last.dr === a.id || last.cr === a.id));
      for (const side of ['dr', 'cr']) {
        const col = box.querySelector(`[data-side="${side}"]`);
        col.replaceChildren();
        posted.filter((p) => p[side] === a.id).forEach((p) => {
          const s = document.createElement('span');
          s.innerHTML = `<span class="text-muted">(${p.n})</span> ${fmt(p.amt).replace('$', '')}`;
          col.appendChild(s);
        });
      }
      const bal = box.querySelector('[data-bal]');
      const net = dr[a.id] - cr[a.id];
      bal.innerHTML = net > 0 ? `<span>Bal. ${fmt(net).replace('$', '')}</span><span></span>`
        : net < 0 ? `<span></span><span class="text-right">Bal. ${fmt(-net).replace('$', '')}</span>`
        : `<span class="text-muted font-normal col-span-2 text-center">${dr[a.id] ? 'Bal. 0' : ''}</span>`;
    }

    // Trial balance
    const body = r('tb');
    body.replaceChildren();
    let tdr = 0, tcr = 0;
    for (const a of ACCOUNTS) {
      const net = dr[a.id] - cr[a.id];
      if (net === 0) continue;
      const tr = document.createElement('tr');
      tr.innerHTML = `<th scope="row">${a.name}</th><td>${net > 0 ? fmt(net) : ''}</td><td>${net < 0 ? fmt(-net) : ''}</td>`;
      body.appendChild(tr);
      if (net > 0) tdr += net; else tcr -= net;
    }
    r('tb-dr').textContent = fmt(tdr);
    r('tb-cr').textContent = fmt(tcr);
    r('tb-empty').hidden = posted.length > 0;
    const v = r('tb-verdict');
    if (!posted.length) {
      setTone(v, '');
      v.textContent = '';
    } else {
      setTone(v, tdr === tcr ? 'good' : 'bad');
      v.textContent = tdr === tcr ? `Debits ${fmt(tdr)} = Credits ${fmt(tcr)}. The ledger is in balance.` : 'Debits and credits don\'t match.';
    }
  }

  reset();
}
