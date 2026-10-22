// Bank Reconciliation Lab
// Maya's Food Truck at the end of month 3. Her bank statement and her Cash account don't agree.
// Students place eight items one at a time: does each one fix the bank's balance or Maya's, up or down,
// by how much, or not at all? The two adjusted balances should meet at Maya's true cash balance.
// Every item on Maya's side also needs a journal entry, which builds up as students go.

import { money, setTone } from '../lib/util.js';

export const BANK_START = 6087;
export const BOOK_START = 6240;

/** Where an item goes: which balance it fixes, and which way. */
export const PLACES = {
  'bank+': { side: 'bank', sign: 1, name: 'Add to the bank balance' },
  'bank-': { side: 'bank', sign: -1, name: 'Subtract from the bank balance' },
  'book+': { side: 'book', sign: 1, name: 'Add to Maya\'s balance' },
  'book-': { side: 'book', sign: -1, name: 'Subtract from Maya\'s balance' },
  none: { side: null, sign: 0, name: 'No adjustment needed' },
};

const BANK_SIDE = 'The bank already knows about this. Maya\'s records are the ones that are missing it.';
const BOOK_SIDE = 'Maya already recorded this. It\'s the bank that hasn\'t caught up yet.';

// kind: the textbook name, shown after the item is placed. entry: the journal entry Maya records (book side only).
export const ITEMS = [
  {
    text: 'On the last day of the month, Maya deposited $650 from the weekend\'s sales. It\'s in her records but not on the bank statement.',
    place: 'bank+', amt: 650, kind: 'Deposit in transit', label: 'Deposit in transit',
    why: 'The bank will count this deposit in a day or two. Until then, its balance is $650 too low.',
    traps: [{ test: (g) => PLACES[g.place].side === 'book', msg: BOOK_SIDE }],
  },
  {
    text: 'Check #218 for $180 of supplies is in Maya\'s records, but it isn\'t on the bank statement yet.',
    place: 'bank-', amt: 180, kind: 'Outstanding check', label: 'Check #218',
    why: 'Maya subtracted this check when she wrote it. The supplier hasn\'t cashed it, so the bank still shows that money in the account.',
    traps: [{ test: (g) => PLACES[g.place].side === 'book', msg: 'Maya already subtracted this check when she wrote it. The bank hasn\'t paid it yet.' }],
  },
  {
    text: 'The bank statement shows a $15 monthly service fee. Maya hasn\'t recorded it.',
    place: 'book-', amt: 15, kind: 'Bank service charge', label: 'Service fee',
    why: 'The bank already took the fee out. Maya\'s records still include that $15.',
    entry: { dr: 'Bank Service Charge Expense', cr: 'Cash' },
    traps: [{ test: (g) => PLACES[g.place].side === 'bank', msg: BANK_SIDE }],
  },
  {
    text: 'Check #215 for $300 of fuel is in Maya\'s records and on the bank statement.',
    place: 'none', amt: 0, kind: 'Cleared check', label: 'Check #215',
    why: 'Both balances already include it, so it doesn\'t explain any of the difference.',
  },
  {
    text: 'A customer paid Maya with a $120 check, and she deposited it. The bank statement shows it bounced: the customer didn\'t have the money.',
    place: 'book-', amt: 120, kind: 'NSF check', label: 'Bounced check',
    why: 'Maya counted $120 that never arrived. The customer still owes her, so the amount goes back to Accounts Receivable.',
    entry: { dr: 'Accounts Receivable', cr: 'Cash' },
    traps: [
      { test: (g) => PLACES[g.place].side === 'bank', msg: BANK_SIDE },
      { test: (g) => g.place === 'book+', msg: 'The bounced check means money Maya counted never arrived. Is her balance too high or too low?' },
    ],
  },
  {
    text: 'Check #221 for $420 to Maya\'s helper is in her records, but it isn\'t on the bank statement yet.',
    place: 'bank-', amt: 420, kind: 'Outstanding check', label: 'Check #221',
    why: 'Another outstanding check. Once the helper cashes it, the bank\'s balance will drop by $420.',
    traps: [{ test: (g) => PLACES[g.place].side === 'book', msg: 'Maya already subtracted this check when she wrote it. The bank hasn\'t paid it yet.' }],
  },
  {
    text: 'The bank paid $5 of interest on Maya\'s account. She hasn\'t recorded it.',
    place: 'book+', amt: 5, kind: 'Interest earned', label: 'Interest',
    why: 'The bank already added it. Maya\'s records are $5 short.',
    entry: { dr: 'Cash', cr: 'Interest Revenue' },
    traps: [{ test: (g) => PLACES[g.place].side === 'bank', msg: BANK_SIDE }],
  },
  {
    text: 'Check #212 for fuel cleared the bank at $69. Maya wrote it in her records as $96.',
    place: 'book+', amt: 27, kind: 'Recording error', label: 'Check #212 error',
    calc: '$96 recorded − $69 actually paid = $27.',
    why: 'Maya subtracted $27 too much, so her balance is $27 too low. Swapped digits like 69 and 96 always make a difference that divides evenly by 9.',
    entry: { dr: 'Cash', cr: 'Fuel and Permits Expense' },
    traps: [
      { test: (g) => PLACES[g.place].side === 'bank', msg: 'The bank paid the right amount. The mistake is in Maya\'s records.' },
      { test: (g) => g.place === 'book-', msg: 'Maya subtracted $96 but only $69 left the account. Did she take out too much or too little?' },
      { test: (g) => g.amt === 96 || g.amt === 69, msg: 'Fix only the mistake: the difference between what she recorded and what the check was for.' },
    ],
  },
];

/** Adjusted bank and book balances after the first n items. */
export function balances(n = ITEMS.length) {
  let bank = BANK_START, book = BOOK_START;
  for (const t of ITEMS.slice(0, n)) {
    const p = PLACES[t.place];
    if (p.side === 'bank') bank += p.sign * t.amt;
    if (p.side === 'book') book += p.sign * t.amt;
  }
  return { bank, book };
}

const fmt = (n) => money(n, 0);
const NUM = 'font-mono tabular-nums';

export function initBankReconciliation(root) {
  const q = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const placeSel = q('#br-place'), amt = q('#br-amt');

  const blank = new Option('Pick one', '');
  placeSel.appendChild(blank);
  for (const [id, p] of Object.entries(PLACES)) placeSel.appendChild(new Option(p.name, id));

  let step, tries, phase, posted;

  q('[data-act="check"]').addEventListener('click', check);
  q('[data-act="reveal"]').addEventListener('click', () => post(false));
  q('[data-act="next"]').addEventListener('click', next);
  q('[data-act="restart"]').addEventListener('click', reset);
  [placeSel, amt].forEach((el) => el.addEventListener('input', () => setTone(r('row'), '')));
  placeSel.addEventListener('change', syncAmount);
  amt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  });

  // "No adjustment" needs no amount.
  function syncAmount() {
    const none = placeSel.value === 'none';
    amt.disabled = none || phase !== 'predict';
    if (none) amt.value = '';
  }

  function reset() {
    step = 0;
    posted = [];
    startCard();
    render(null);
  }

  function startCard() {
    phase = 'predict';
    tries = 0;
    const t = ITEMS[step];
    r('progress').textContent = `Item ${step + 1} of ${ITEMS.length}`;
    r('bar').style.width = `${(step / ITEMS.length) * 100}%`;
    r('text').textContent = t.text;
    r('kind').hidden = true;
    placeSel.value = '';
    placeSel.disabled = false;
    amt.value = '';
    amt.disabled = false;
    setTone(r('row'), '');
    setFeedback('', '');
    r('why').hidden = true;
    buttons();
  }

  function buttons() {
    q('[data-act="check"]').hidden = phase !== 'predict';
    q('[data-act="reveal"]').hidden = phase !== 'predict';
    q('[data-act="next"]').hidden = phase !== 'posted';
    q('[data-act="next"]').textContent = step === ITEMS.length - 1 ? 'Finish the reconciliation' : 'Next item';
    q('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  function check() {
    if (phase !== 'predict') return;
    const t = ITEMS[step];
    const g = { place: placeSel.value, amt: Math.round(parseFloat(amt.value) || 0) };
    if (!g.place) {
      setFeedback('bad', 'Pick where this item goes.');
      return;
    }
    if (g.place !== 'none' && !g.amt) {
      setFeedback('bad', 'Enter the amount.');
      return;
    }
    if (g.place === t.place && (t.place === 'none' || g.amt === t.amt)) {
      post(true);
      return;
    }
    setTone(r('row'), 'bad');
    tries++;
    const want = PLACES[t.place], got = PLACES[g.place];
    const trap = (t.traps ?? []).find((x) => x.test(g));
    let msg;
    if (t.place === 'none') msg = 'This one is on the bank statement and in Maya\'s records. Does it explain any of the difference?';
    else if (g.place === 'none') msg = 'This one shows up in only one place, so it explains part of the difference.';
    else if (trap) msg = trap.msg;
    else if (got.side === want.side && got.sign !== want.sign) msg = 'Right balance, wrong direction. Is that balance too high or too low right now?';
    else if (got.side !== want.side) msg = want.side === 'bank' ? BOOK_SIDE : BANK_SIDE;
    else msg = 'Right place. Check the amount.';
    if (tries > 1 && t.place !== g.place) msg += ` It goes here: ${want.name.toLowerCase()}.`;
    if (tries > 1 && t.calc && g.amt !== t.amt) msg += ` ${t.calc}`;
    setFeedback('bad', msg);
  }

  function post(earned) {
    const t = ITEMS[step];
    phase = 'posted';
    placeSel.value = t.place;
    amt.value = t.place === 'none' ? '' : String(t.amt);
    placeSel.disabled = amt.disabled = true;
    setTone(r('row'), 'good');
    posted.push({ ...t, earned });
    setFeedback(earned ? 'good' : 'info', earned ? (tries === 0 ? 'Correct on the first try.' : 'Correct.') : 'Here is where it goes.');
    r('kind').hidden = false;
    r('kind').textContent = t.kind;
    r('why').hidden = false;
    r('why').textContent = [t.calc, t.why, t.entry ? `Maya records it: debit ${t.entry.dr}, credit ${t.entry.cr}, ${fmt(t.amt)}.` : ''].filter(Boolean).join(' ');
    buttons();
    render(t);
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < ITEMS.length - 1) {
      step++;
      startCard();
      render(null);
      placeSel.focus({ preventScroll: true });
      return;
    }
    phase = 'done';
    r('bar').style.width = '100%';
    r('progress').textContent = 'Reconciled';
    const mine = posted.filter((p) => p.earned).length;
    const { book } = balances();
    const entries = ITEMS.filter((t) => t.entry).length;
    r('text').textContent = `Both sides match at ${fmt(book)}, Maya's true cash balance. You placed ${mine} of ${ITEMS.length} items yourself. Her Cash account needs ${entries} journal entries to get there.`;
    r('kind').hidden = true;
    setFeedback('', '');
    r('why').hidden = true;
    buttons();
    render(null);
  }

  function setFeedback(tone, msg) {
    const el = r('feedback');
    setTone(el, tone);
    el.textContent = msg;
    el.hidden = !msg;
  }

  function render(last) {
    const { bank, book } = balances(posted.length);
    for (const side of ['bank', 'book']) {
      const list = r(`${side}-list`);
      list.replaceChildren();
      for (const p of posted.filter((x) => PLACES[x.place].side === side)) {
        const sign = PLACES[p.place].sign;
        const li = document.createElement('li');
        li.className = `flex justify-between gap-3 py-1 px-1.5 -mx-1.5 rounded ${p === last ? 'bg-accent/10 font-semibold' : ''}`;
        li.innerHTML = `<span>${sign > 0 ? 'Add' : 'Less'}: ${p.label}</span><span class="${NUM} ${sign > 0 ? 'text-good' : 'text-bad'}">${sign > 0 ? '+' : '−'}${fmt(p.amt)}</span>`;
        list.appendChild(li);
      }
      if (!list.children.length) {
        const li = document.createElement('li');
        li.className = 'text-muted py-1';
        li.textContent = 'No items yet';
        list.appendChild(li);
      }
    }
    r('bank-start').textContent = fmt(BANK_START);
    r('book-start').textContent = fmt(BOOK_START);
    r('bank-adj').textContent = fmt(bank);
    r('book-adj').textContent = fmt(book);
    const diff = Math.abs(bank - book);
    r('diff').textContent = fmt(diff);
    const v = r('verdict');
    const done = posted.length === ITEMS.length;
    setTone(v, done ? 'good' : posted.length ? 'info' : '');
    v.textContent = done
      ? `Reconciled: both adjusted balances are ${fmt(book)}.`
      : posted.length
        ? `${fmt(diff)} apart for now. The gap can grow before it closes; the two sides only match once every item is placed.`
        : `The two balances are ${fmt(diff)} apart. Neither one is Maya's true cash balance yet.`;

    // Journal entries Maya needs, for the items on her side.
    const entries = posted.filter((p) => p.entry);
    const body = r('je');
    body.replaceChildren();
    for (const p of entries) {
      for (const [acct, side] of [[p.entry.dr, 'dr'], [p.entry.cr, 'cr']]) {
        const tr = document.createElement('tr');
        if (p === last) tr.className = 'bg-accent/8';
        tr.innerHTML = `<th scope="row" class="${side === 'cr' ? 'pl-6!' : ''}">${acct}</th><td>${side === 'dr' ? fmt(p.amt) : ''}</td><td>${side === 'cr' ? fmt(p.amt) : ''}</td>`;
        body.appendChild(tr);
      }
    }
    r('je-empty').hidden = entries.length > 0;
    r('je-table').hidden = entries.length === 0;
  }

  reset();
}
