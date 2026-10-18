// Accounting Equation Lab
// Assets = Liabilities + Owner's Equity. Students predict how each transaction
// changes the accounts, check their entry, then post it to the balance sheet.

import { money, setTone, wireReveals } from '../lib/util.js';

const ACCOUNTS = [
  { id: 'cash', name: 'Cash', side: 'A' },
  { id: 'ar', name: 'Accounts Receivable', side: 'A', hint: 'Money customers owe you' },
  { id: 'supplies', name: 'Supplies', side: 'A', hint: 'Ingredients, napkins, containers' },
  { id: 'equipment', name: 'Equipment', side: 'A', hint: 'The truck, grill, fryer' },
  { id: 'ap', name: 'Accounts Payable', side: 'L', hint: 'Money you owe suppliers' },
  { id: 'loan', name: 'Loan Payable', side: 'L', hint: 'Money you owe the bank' },
  { id: 'equity', name: "Owner's Equity", side: 'E', hint: 'Owner investment + revenue − expenses − withdrawals' },
];

const SIDES = { A: 'Assets', L: 'Liabilities', E: "Owner's Equity" };

// Each transaction: description, the correct changes, a hint after a wrong try,
// and the explanation shown once it posts.
const TRANSACTIONS = [
  {
    text: 'Maya puts $10,000 of her own savings into the business bank account to start her food truck.',
    fx: { cash: 10000, equity: 10000 },
    hint: 'The business gets cash. Who does that money belong to?',
    why: 'The business gains $10,000 of cash, and that money belongs to Maya, so owner\'s equity rises by the same amount.',
  },
  {
    text: 'The business borrows $15,000 from the bank.',
    fx: { cash: 15000, loan: 15000 },
    hint: 'Borrowed money is not income. What does the business now owe?',
    why: 'Cash goes up, but so does what the business owes. A loan is a liability, not income, so equity does not change.',
  },
  {
    text: 'The business buys a used food truck for $20,000, paid in cash.',
    fx: { equipment: 20000, cash: -20000 },
    hint: 'Did the business lose value, or trade one asset for another?',
    why: 'One asset (cash) turned into another asset (equipment). Total assets stay the same, and Maya is not any poorer.',
  },
  {
    text: 'The business buys $800 of ingredients and supplies on account, to be paid next month.',
    fx: { supplies: 800, ap: 800 },
    hint: '"On account" means no cash moves today.',
    why: 'The business gains supplies and owes the supplier. No cash changes hands yet.',
  },
  {
    text: 'The truck sells $1,500 of meals for cash on its first weekend.',
    fx: { cash: 1500, equity: 1500 },
    hint: 'Revenue belongs to the owner. Which side of the equation is that?',
    why: 'Revenue brings in cash and increases what the owner has earned, so owner\'s equity rises.',
  },
  {
    text: 'The truck caters a school event for $600. The school will pay in 30 days.',
    fx: { ar: 600, equity: 600 },
    hint: 'The work is done and earned, even though no cash came in.',
    why: 'The revenue is earned now, so equity rises. Instead of cash, the business gets a promise to pay: accounts receivable.',
  },
  {
    text: 'The business pays $300 cash for fuel and a parking permit.',
    fx: { cash: -300, equity: -300 },
    hint: 'This cost is used up. It is an expense, not something the business owns.',
    why: 'Expenses reduce what the owner has earned. Cash goes down and equity goes down by the same amount.',
  },
  {
    text: 'The business pays the supplier $500 of the $800 it owes.',
    fx: { cash: -500, ap: -500 },
    hint: 'Is this a new expense, or paying off something already recorded?',
    why: 'Paying a bill you already recorded is not a new expense. Cash goes down and the amount owed goes down. Equity does not change.',
  },
  {
    text: 'The school pays the $600 it owed for the catering job.',
    fx: { cash: 600, ar: -600 },
    hint: 'The revenue was already recorded in transaction 6.',
    why: 'This is not new revenue. One asset (accounts receivable) turns into another (cash). Totals do not change.',
  },
  {
    text: 'The business makes a $1,000 payment on the bank loan (all principal, no interest).',
    fx: { cash: -1000, loan: -1000 },
    hint: 'Paying down a loan reduces what you owe. Is it an expense?',
    why: 'Repaying principal shrinks both cash and the loan. It is not an expense, so equity does not change.',
  },
  {
    text: 'By the end of the month, the truck has used $400 of its supplies cooking meals.',
    fx: { supplies: -400, equity: -400 },
    hint: 'Supplies that get used up become an expense.',
    why: 'Used-up supplies are an expense. The supplies asset goes down and equity goes down. No cash moves.',
  },
  {
    text: 'Maya takes $700 out of the business for personal use.',
    fx: { cash: -700, equity: -700 },
    hint: 'This money leaves the business and goes to the owner.',
    why: 'An owner withdrawal reduces cash and reduces owner\'s equity. It is not a business expense.',
  },
];

const fmt = (n) => money(n, 0);
const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + money(Math.abs(n), 0);

export function initAccountingEquation(root) {
  const q = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);

  let step = 0;
  let tries = 0;
  let phase = 'predict'; // 'predict' | 'posted' | 'done'
  let balances = {};
  let journal = [];

  // Entry rows. A checked row gets data-tone="good" (right) or "bad" (wrong); its mark shows ✓ or ✕.
  const ROW = 'group flex justify-between items-center gap-2.5 py-[5px] px-2 rounded-md border-l-[3px] border-transparent tone-good:bg-good-soft tone-good:border-good tone-bad:bg-bad-soft tone-bad:border-bad';
  const MARK = "w-4 text-center font-bold group-tone-good:after:content-['✓'] group-tone-good:after:text-good group-tone-bad:after:content-['✕'] group-tone-bad:after:text-bad";
  const INPUT = 'w-[104px] font-mono font-medium text-[15px] leading-[normal] text-ink bg-bg border border-line rounded-md py-[5px] px-2 text-right tabular-nums disabled:opacity-100 disabled:text-ink disabled:bg-transparent disabled:border-transparent';
  // Balance sheet lines. A line the last transaction changed gets a warm background and a +/− badge.
  const LINE = 'flex items-baseline gap-1.5 text-[14px] py-[3px] px-1.5 rounded-[5px]';
  const LINE_CHANGED = 'flex items-baseline gap-1.5 text-[14px] py-[3px] px-1.5 rounded-[5px] bg-warn-soft';

  // Build the entry rows once.
  const entry = r('entry');
  for (const side of ['A', 'L', 'E']) {
    const group = document.createElement('fieldset');
    group.className = 'border-0 p-0 m-0 grid gap-1 min-w-0';
    const legend = document.createElement('legend');
    legend.className = 'text-[12px] tracking-[.06em] uppercase text-muted font-semibold p-0 mb-0.5';
    legend.textContent = SIDES[side];
    group.appendChild(legend);
    for (const a of ACCOUNTS.filter((x) => x.side === side)) {
      const row = document.createElement('div');
      row.className = ROW;
      row.dataset.acct = a.id;
      const label = document.createElement('label');
      label.htmlFor = `ae-in-${a.id}`;
      label.className = 'font-semibold text-[14.5px] grid min-w-0';
      label.textContent = a.name;
      if (a.hint) {
        const h = document.createElement('span');
        h.className = 'font-normal text-[12px] text-muted';
        h.textContent = a.hint;
        label.appendChild(h);
      }
      const wrap = document.createElement('div');
      wrap.className = 'flex items-center gap-1 shrink-0';
      const dollar = document.createElement('span');
      dollar.className = 'text-muted font-mono';
      dollar.textContent = '$';
      const input = document.createElement('input');
      input.type = 'number';
      input.className = INPUT;
      input.step = '1';
      input.inputMode = 'numeric';
      input.id = `ae-in-${a.id}`;
      input.placeholder = '0';
      input.setAttribute('aria-label', `Change in ${a.name}, use a minus sign for a decrease`);
      input.addEventListener('input', () => {
        setTone(row, '');
        previewEntry();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); check(); }
      });
      const mark = document.createElement('span');
      mark.className = MARK;
      mark.setAttribute('aria-hidden', 'true');
      wrap.append(dollar, input, mark);
      row.append(label, wrap);
      group.appendChild(row);
    }
    entry.appendChild(group);
  }

  const inputs = () => ACCOUNTS.map((a) => [a, q(`#ae-in-${a.id}`)]);
  const readEntry = () => {
    const out = {};
    for (const [a, el] of inputs()) out[a.id] = Math.round(parseFloat(el.value) || 0);
    return out;
  };
  const sideTotals = (fx) => {
    const t = { A: 0, L: 0, E: 0 };
    for (const a of ACCOUNTS) t[a.side] += fx[a.id] || 0;
    return t;
  };

  q('[data-act="check"]').addEventListener('click', check);
  q('[data-act="reveal"]').addEventListener('click', () => post(false));
  q('[data-act="next"]').addEventListener('click', next);
  q('[data-act="restart"]').addEventListener('click', reset);
  wireReveals(root);


  function reset() {
    step = 0;
    balances = Object.fromEntries(ACCOUNTS.map((a) => [a.id, 0]));
    journal = [];
    startCard();
    renderSheet({});
    renderJournal();
  }

  function startCard() {
    phase = 'predict';
    tries = 0;
    const t = TRANSACTIONS[step];
    r('progress').textContent = `Transaction ${step + 1} of ${TRANSACTIONS.length}`;
    r('bar').style.width = `${(step / TRANSACTIONS.length) * 100}%`;
    r('text').textContent = t.text;
    for (const [, el] of inputs()) {
      el.value = '';
      el.disabled = false;
    }
    root.querySelectorAll('[data-acct]').forEach((row) => setTone(row, ''));
    setFeedback('', '');
    r('why').hidden = true;
    toggleButtons();
    previewEntry();
  }

  function toggleButtons() {
    q('[data-act="check"]').hidden = phase !== 'predict';
    q('[data-act="reveal"]').hidden = phase !== 'predict';
    q('[data-act="next"]').hidden = phase !== 'posted';
    q('[data-act="next"]').textContent = step === TRANSACTIONS.length - 1 ? 'See the final balance sheet' : 'Next transaction';
    q('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  // Live check of whether the student's entry keeps the equation balanced.
  function previewEntry() {
    if (phase !== 'predict') return;
    const t = sideTotals(readEntry());
    const lhs = t.A, rhs = t.L + t.E;
    const el = r('preview');
    if (lhs === 0 && rhs === 0) {
      setTone(el, '');
      el.textContent = 'Enter the change for each account that moves. Leave the rest blank.';
      return;
    }
    const ok = lhs === rhs;
    setTone(el, ok ? 'good' : 'bad');
    el.textContent = `Your entry: Assets ${signed(lhs)} ${ok ? '=' : '≠'} Liabilities + Equity ${signed(rhs)}${ok ? '. Balanced.' : '. Out of balance.'}`;
  }

  function check() {
    if (phase !== 'predict') return;
    const t = TRANSACTIONS[step];
    const guess = readEntry();
    let wrong = 0;
    for (const a of ACCOUNTS) {
      const row = q(`[data-acct="${a.id}"]`);
      const ok = (guess[a.id] || 0) === (t.fx[a.id] || 0);
      setTone(row, !ok ? 'bad' : (t.fx[a.id] || 0) !== 0 ? 'good' : '');
      if (!ok) wrong++;
    }
    if (wrong === 0) {
      post(true);
      return;
    }
    tries++;
    const s = sideTotals(guess);
    const balanced = s.A === s.L + s.E;
    const base = balanced
      ? `Your entry balances, but ${wrong === 1 ? '1 account is' : `${wrong} accounts are`} off. Balanced is necessary, not enough.`
      : `Not yet. ${wrong === 1 ? '1 account is' : `${wrong} accounts are`} off, and your entry is out of balance. Every transaction must change both sides by the same amount.`;
    setFeedback('bad', `${base} Hint: ${t.hint}`);
  }

  function post(earned) {
    const t = TRANSACTIONS[step];
    phase = 'posted';
    for (const a of ACCOUNTS) {
      const el = q(`#ae-in-${a.id}`);
      const d = t.fx[a.id] || 0;
      el.value = d === 0 ? '' : String(d);
      el.disabled = true;
      setTone(q(`[data-acct="${a.id}"]`), d !== 0 ? 'good' : '');
      balances[a.id] += d;
    }
    journal.push({ n: step + 1, text: t.text, fx: t.fx, earned });
    setFeedback(earned ? 'good' : 'neutral', earned ? (tries === 0 ? 'Correct on the first try.' : 'Correct.') : 'Here is the correct entry.');
    r('why').hidden = false;
    r('why').textContent = t.why;
    setTone(r('preview'), 'good');
    const s = sideTotals(t.fx);
    r('preview').textContent = `Posted: Assets ${signed(s.A)} = Liabilities + Equity ${signed(s.L + s.E)}. Still balanced.`;
    toggleButtons();
    renderSheet(t.fx);
    renderJournal();
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < TRANSACTIONS.length - 1) {
      step++;
      startCard();
      renderSheet({});
      q(`#ae-in-${ACCOUNTS[0].id}`).focus({ preventScroll: true });
    } else {
      phase = 'done';
      r('bar').style.width = '100%';
      r('progress').textContent = 'All transactions posted';
      const firstTry = journal.filter((j) => j.earned).length;
      r('text').textContent = `Maya's first month is on the books. You got ${firstTry} of ${TRANSACTIONS.length} entries yourself. Notice the equation balanced after every single transaction.`;
      setFeedback('', '');
      r('why').hidden = true;
      setTone(r('preview'), '');
      r('preview').textContent = '';
      toggleButtons();
      renderSheet({});
    }
  }

  function setFeedback(kind, msg) {
    const el = r('feedback');
    setTone(el, kind === 'neutral' ? 'info' : kind);
    el.textContent = msg;
    el.hidden = !msg;
  }

  function renderSheet(fx) {
    const t = { A: 0, L: 0, E: 0 };
    for (const a of ACCOUNTS) t[a.side] += balances[a.id];
    r('eq-a').textContent = fmt(t.A);
    r('eq-l').textContent = fmt(t.L);
    r('eq-e').textContent = fmt(t.E);
    r('eq-sign').textContent = t.A === t.L + t.E ? '=' : '≠';

    for (const side of ['A', 'L', 'E']) {
      const list = r(`list-${side}`);
      list.replaceChildren();
      for (const a of ACCOUNTS.filter((x) => x.side === side)) {
        const li = document.createElement('li');
        const d = fx[a.id] || 0;
        li.className = d ? LINE_CHANGED : LINE;
        const name = document.createElement('span');
        name.className = 'flex-1 min-w-0';
        name.textContent = a.name;
        const val = document.createElement('span');
        val.className = 'font-mono font-medium text-[14px] leading-[normal] tabular-nums';
        val.textContent = fmt(balances[a.id]);
        li.append(name);
        if (d) {
          const badge = document.createElement('span');
          badge.className = d > 0 ? 'font-mono font-semibold text-[11.5px] leading-[normal] py-px px-[5px] rounded-[4px] text-good' : 'font-mono font-semibold text-[11.5px] leading-[normal] py-px px-[5px] rounded-[4px] text-bad';
          badge.textContent = signed(d);
          li.append(badge);
        }
        li.append(val);
        list.appendChild(li);
      }
      r(`total-${side}`).textContent = fmt(t[side]);
    }
    r('total-le').textContent = fmt(t.L + t.E);
  }

  function renderJournal() {
    const body = r('journal');
    body.replaceChildren();
    r('journal-empty').hidden = journal.length > 0;
    for (const j of journal) {
      const tr = document.createElement('tr');
      const n = document.createElement('td');
      n.textContent = j.n;
      const d = document.createElement('td');
      d.textContent = j.text;
      const e = document.createElement('td');
      e.className = 'font-mono text-[12.5px] whitespace-pre-line min-w-[11em]';
      e.textContent = ACCOUNTS.filter((a) => j.fx[a.id])
        // Word joiner keeps the sign attached to its amount when the line wraps.
        .map((a) => `${a.name} ${signed(j.fx[a.id]).replace(/^([+−])/, '$1\u2060')}`)
        .join('\n');
      tr.append(n, d, e);
      body.appendChild(tr);
    }
  }

  reset();
}
