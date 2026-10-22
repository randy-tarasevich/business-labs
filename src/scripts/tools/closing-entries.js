// Closing Entries Lab
// Maya's Food Truck at the end of month 2, picking up from the Adjusting Entries Lab's adjusted trial balance.
// Students first sort which accounts close (temporary) and which carry over (permanent), then write the four
// closing entries through Income Summary and finish with a post-closing trial balance.

import { money, setTone } from '../lib/util.js';
import { ACCOUNTS as ADJ_ACCOUNTS, adjustedBalances } from './adjusting-entries.js';

// type: A asset, K contra-asset, L liability, C capital, D drawing, R revenue, X expense, S Income Summary
export const ACCOUNTS = [
  ...ADJ_ACCOUNTS,
  { id: 'incsum', name: 'Income Summary', type: 'S' },
];
const byId = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));
const DEBIT_NORMAL = new Set(['A', 'D', 'X']);
const TEMPORARY = new Set(['R', 'X', 'D', 'S']);
export const isTemporary = (id) => TEMPORARY.has(byId[id].type);

/** The adjusted trial balance from the Adjusting Entries Lab, plus Income Summary at zero. */
export const ADJUSTED = { ...adjustedBalances(), incsum: 0 };

export const EXPENSES = ACCOUNTS.filter((a) => a.type === 'X').map((a) => a.id);
// Pseudo-account for the compound entry that closes every expense at once.
const ALL_EXP = 'allexp';
const ALL_EXP_NAME = `All ${EXPENSES.length} expense accounts`;

/** Accounts students sort: everything on the adjusted trial balance (Income Summary isn't open yet). */
export const SORTABLE = ADJ_ACCOUNTS.map((a) => a.id);

const total = (ids) => ids.reduce((t, id) => t + ADJUSTED[id], 0);
const REVENUE = ADJUSTED.sales;
const EXPENSE_TOTAL = total(EXPENSES);
const NET_INCOME = REVENUE - EXPENSE_TOTAL;

const IS_FIRST = 'Revenue and expenses go to Income Summary first. Capital gets the net result in step 3.';

export const ENTRIES = [
  {
    text: 'Close the revenue account. Its balance moves into Income Summary, a temporary account used only while closing the books.',
    dr: 'sales', cr: 'incsum', amt: REVENUE, label: 'Close revenue',
    hint: 'Sales Revenue has a credit balance. To bring it to zero, debit it. The credit goes to Income Summary.',
    calc: 'Use the adjusted balance: $5,200 + $300 catering earned + $400 office lunch = $5,900.',
    why: 'Revenue is a temporary account. It measures one month, so it starts the next month at zero.',
    traps: [
      { test: (g) => g.cr === 'capital' || g.dr === 'capital', msg: IS_FIRST },
      { test: (g) => g.da === 5200, msg: '$5,200 is the balance before adjustments. Close the adjusted balance.' },
    ],
  },
  {
    text: `Close all ${EXPENSES.length} expense accounts in one compound entry. Their total moves into Income Summary.`,
    dr: 'incsum', cr: ALL_EXP, amt: EXPENSE_TOTAL, label: 'Close expenses',
    hint: 'Expenses have debit balances. To bring them to zero, credit them. The debit goes to Income Summary.',
    calc: '$650 + $200 + $300 + $1,440 + $90 + $650 = $3,330 of adjusted expenses.',
    why: 'Each expense account gets credited for its own balance, and Income Summary gets one debit for the total.',
    traps: [
      { test: (g) => EXPENSES.includes(g.cr) || EXPENSES.includes(g.dr), msg: `Close every expense at once in a compound entry. Pick "${ALL_EXP_NAME}".` },
      { test: (g) => g.cr === 'capital' || g.dr === 'capital', msg: IS_FIRST },
      { test: (g) => g.da === 1850, msg: '$1,850 is the expense total before adjustments. Use the adjusted balances.' },
      { test: (g) => g.da === NET_INCOME, msg: '$2,570 is net income. This entry closes the expenses: add up all six.' },
    ],
  },
  {
    text: 'Income Summary now holds the month\'s revenue and expenses. Close what\'s left into Maya, Capital.',
    dr: 'incsum', cr: 'capital', amt: NET_INCOME, label: 'Close Income Summary',
    hint: 'Income Summary has a credit balance because Maya made a profit. Debit it to close it, and credit Capital.',
    calc: '$5,900 credited − $3,330 debited = $2,570 left in Income Summary. That\'s Maya\'s net income.',
    why: 'A profit raises the owner\'s equity, so net income moves into Capital as a credit.',
    traps: [
      { test: (g) => g.dr === 'capital' && g.cr === 'incsum', msg: 'Maya made a profit, so Income Summary has a credit balance. Debit it to close it. Her capital goes up, so credit Capital.' },
      { test: (g) => g.da === REVENUE || g.da === EXPENSE_TOTAL, msg: 'Close only what\'s left in Income Summary: the credits minus the debits.' },
      { test: (g) => g.da === NET_INCOME - ADJUSTED.drawing, msg: 'Drawing gets its own entry next. Close Income Summary\'s full balance here.' },
    ],
  },
  {
    text: 'Last one. Close Maya, Drawing into Maya, Capital.',
    dr: 'capital', cr: 'drawing', amt: ADJUSTED.drawing, label: 'Close drawing',
    hint: 'Drawing has a debit balance, so credit it to close it. Taking money out lowers Maya\'s capital, so debit Capital.',
    calc: 'Maya, Drawing has an $800 balance from the money she took out this month.',
    why: 'Drawing isn\'t an expense. It never goes through Income Summary and doesn\'t change net income, but it does lower Capital.',
    traps: [
      { test: (g) => g.dr === 'incsum' || g.cr === 'incsum', msg: 'Drawing isn\'t an expense, so it skips Income Summary. It closes straight to Capital.' },
    ],
  },
];

/** Debit and credit lines each entry posts: [accountId, side, amount]. Expands the compound entry. */
export function entryLines(e) {
  const lines = [[e.dr, 'dr', e.amt]];
  if (e.cr === ALL_EXP) EXPENSES.forEach((id) => lines.push([id, 'cr', ADJUSTED[id]]));
  else lines.push([e.cr, 'cr', e.amt]);
  return lines;
}

/** Balances after the first n closing entries, positive on each account's normal side
    (Income Summary is shown as a credit balance). */
export function closedBalances(n = ENTRIES.length) {
  const bal = { ...ADJUSTED };
  for (const e of ENTRIES.slice(0, n)) {
    for (const [id, side, amt] of entryLines(e)) {
      const debitNormal = DEBIT_NORMAL.has(byId[id].type);
      bal[id] += (side === 'dr') === debitNormal ? amt : -amt;
    }
  }
  return bal;
}

/** [debit total, credit total] for a set of balances. */
export function totals(bal) {
  return ACCOUNTS.reduce(([d, c], a) => (DEBIT_NORMAL.has(a.type) ? [d + bal[a.id], c] : [d, c + bal[a.id]]), [0, 0]);
}

// Sorting misconceptions, checked in order. The first that matches is shown.
const SORT_HINTS = [
  { test: (picked) => picked.has('unearned'), msg: 'Unearned Revenue has "revenue" in its name, but it\'s a liability: Maya still owes the school two events. It carries over.' },
  { test: (picked) => picked.has('accdep'), msg: 'Accumulated Depreciation keeps growing for the truck\'s whole life. It carries over.' },
  { test: (picked) => picked.has('capital'), msg: 'Capital is where everything closes to. It carries over, with the month\'s results added in.' },
  { test: (picked) => !picked.has('drawing'), msg: 'Look again at Maya, Drawing. It tracks what she took out this month, so it starts over too.' },
  { test: (picked) => EXPENSES.some((id) => !picked.has(id)) || !picked.has('sales'), msg: 'Every revenue and expense account measures just this month. Find all of them.' },
  { test: () => true, msg: 'Assets and liabilities carry into next month. Truck, cash, and loans don\'t disappear when a month ends.' },
];

const fmt = (n) => money(n, 0);
const NUM = 'font-mono tabular-nums';

export function initClosingEntries(root) {
  const q = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const drSel = q('#ce-dr'), crSel = q('#ce-cr'), drAmt = q('#ce-dr-amt'), crAmt = q('#ce-cr-amt');
  const boxes = [...root.querySelectorAll('[data-sort] input[type="checkbox"]')];
  const STEPS = ENTRIES.length + 1;

  // Account pickers: every account on the books, Income Summary, and the compound expense option.
  const groups = [
    ['Assets', ['A', 'K']],
    ['Liabilities', ['L']],
    ['Owner\'s equity', ['C', 'D']],
    ['Revenue and expenses', ['R', 'X']],
    ['Closing', ['S']],
  ];
  for (const sel of [drSel, crSel]) {
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Pick an account';
    sel.appendChild(blank);
    for (const [label, types] of groups) {
      const og = document.createElement('optgroup');
      og.label = label;
      ACCOUNTS.filter((a) => types.includes(a.type)).forEach((a) => og.appendChild(new Option(a.name, a.id)));
      if (types.includes('X')) og.appendChild(new Option(ALL_EXP_NAME, ALL_EXP));
      sel.appendChild(og);
    }
  }

  // Balance table rows, built once.
  const rows = {};
  const body = r('tb');
  for (const a of ACCOUNTS) {
    const tr = document.createElement('tr');
    tr.className = 'data-changed:bg-accent/8 data-changed:[&>th]:font-semibold data-changed:[&>th]:bg-[color-mix(in_srgb,var(--accent)_8%,var(--panel))]';
    tr.innerHTML = `<th scope="row">${a.name}</th>` + '<td></td>'.repeat(4);
    body.appendChild(tr);
    rows[a.id] = tr;
  }

  let step, tries, phase, posted;

  q('[data-act="check"]').addEventListener('click', check);
  q('[data-act="reveal"]').addEventListener('click', () => (step === 0 ? sorted(false) : post(false)));
  q('[data-act="next"]').addEventListener('click', next);
  q('[data-act="restart"]').addEventListener('click', reset);
  [drSel, crSel, drAmt, crAmt].forEach((el) => el.addEventListener('input', () => {
    setTone(r('dr-row'), '');
    setTone(r('cr-row'), '');
  }));
  [drAmt, crAmt].forEach((el) => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); check(); }
  }));
  boxes.forEach((b) => b.addEventListener('change', () => setTone(b.closest('label'), '')));

  function reset() {
    step = 0;
    posted = [];
    boxes.forEach((b) => {
      b.checked = false;
      b.disabled = false;
      setTone(b.closest('label'), '');
    });
    startCard();
    render(null);
  }

  function startCard() {
    phase = 'predict';
    tries = 0;
    r('card').dataset.phase = step === 0 ? 'sort' : 'entry';
    r('progress').textContent = step === 0 ? `Step 1 of ${STEPS}: Which accounts close?` : `Step ${step + 1} of ${STEPS}: Closing entry ${step}`;
    r('bar').style.width = `${(step / STEPS) * 100}%`;
    r('text').textContent = step === 0
      ? 'At the end of each month, some accounts start over at zero and some carry into next month. Check every account that gets closed.'
      : ENTRIES[step - 1].text;
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
    q('[data-act="check"]').textContent = step === 0 ? 'Check my sort' : 'Check my entry';
    q('[data-act="reveal"]').hidden = phase !== 'predict';
    const nextBtn = q('[data-act="next"]');
    nextBtn.hidden = phase !== 'posted';
    nextBtn.textContent = step === 0 ? 'Start the closing entries' : step === ENTRIES.length ? 'See the post-closing trial balance' : 'Next closing entry';
    q('[data-act="restart"]').hidden = phase !== 'done';
    r('card').toggleAttribute('data-done', phase === 'done');
  }

  function check() {
    if (phase !== 'predict') return;
    if (step === 0) return checkSort();
    const e = ENTRIES[step - 1];
    const g = { dr: drSel.value, cr: crSel.value, da: Math.round(parseFloat(drAmt.value) || 0), ca: Math.round(parseFloat(crAmt.value) || 0) };
    if (!g.dr || !g.cr || !g.da || !g.ca) {
      setFeedback('bad', 'Pick an account and enter an amount for both the debit and the credit.');
      return;
    }
    const drOk = g.dr === e.dr && g.da === e.amt;
    const crOk = g.cr === e.cr && g.ca === e.amt;
    setTone(r('dr-row'), drOk ? 'good' : 'bad');
    setTone(r('cr-row'), crOk ? 'good' : 'bad');
    if (drOk && crOk) {
      post(true);
      return;
    }
    tries++;
    const used = [g.dr, g.cr].filter((id) => id !== ALL_EXP);
    const permanent = used.find((id) => !isTemporary(id) && id !== 'capital');
    const accountsWrong = g.dr !== e.dr || g.cr !== e.cr;
    const trap = (e.traps ?? []).find((x) => x.test(g));
    let msg;
    if (g.da !== g.ca) msg = 'Debits must equal credits. Your two amounts don\'t match.';
    else if (used.includes('cash')) msg = 'Closing entries never use Cash. No money moves when you close the books.';
    else if (permanent) msg = `${byId[permanent].name} is a permanent account. Only revenue, expenses, and drawing get closed.`;
    else if (trap) msg = trap.msg;
    else if (g.dr === e.cr && g.cr === e.dr) msg = 'Right accounts, wrong sides. To close an account, put its balance on the opposite side.';
    else if (accountsWrong) {
      msg = e.hint;
      if (tries > 1) msg += ` Debit ${nameOf(e.dr)}, credit ${nameOf(e.cr)}.`;
    } else msg = 'Right accounts. Check the amount: close the full adjusted balance.';
    if (g.da !== e.amt && tries > 1) msg += ` Here's the amount: ${e.calc}`;
    setFeedback('bad', msg);
  }

  function checkSort() {
    const picked = new Set(boxes.filter((b) => b.checked).map((b) => b.value));
    let right = 0;
    boxes.forEach((b) => {
      const ok = b.checked === isTemporary(b.value);
      if (ok && b.checked) right++;
      setTone(b.closest('label'), ok ? (b.checked ? 'good' : '') : 'bad');
    });
    const need = SORTABLE.filter(isTemporary).length;
    const wrong = boxes.filter((b) => b.checked !== isTemporary(b.value)).length;
    if (!wrong) {
      sorted(true);
      return;
    }
    tries++;
    const hint = SORT_HINTS.find((h) => h.test(picked)).msg;
    setFeedback('bad', `You found ${right} of ${need}, and ${wrong} ${wrong === 1 ? 'box is' : 'boxes are'} marked wrong. ${hint}`);
  }

  function sorted(earned) {
    phase = 'posted';
    boxes.forEach((b) => {
      b.checked = isTemporary(b.value);
      b.disabled = true;
      setTone(b.closest('label'), b.checked ? 'good' : '');
    });
    posted.push({ sort: true, earned });
    const n = SORTABLE.filter(isTemporary).length;
    setFeedback(earned ? 'good' : 'info', earned ? (tries === 0 ? 'All correct on the first try.' : 'All correct.') : 'Here is the correct sort.');
    r('why').hidden = false;
    r('why').textContent = `${n} temporary accounts close: revenue, the ${EXPENSES.length} expenses, and drawing. They measure one month, so they start the next one at zero. The other ${SORTABLE.length - n} are permanent. They carry into next month.`;
    buttons();
    render(null);
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function nameOf(id) {
    return id === ALL_EXP ? ALL_EXP_NAME : byId[id].name;
  }

  function post(earned) {
    const e = ENTRIES[step - 1];
    phase = 'posted';
    drSel.value = e.dr;
    crSel.value = e.cr;
    drAmt.value = crAmt.value = String(e.amt);
    [drSel, crSel, drAmt, crAmt].forEach((el) => (el.disabled = true));
    setTone(r('dr-row'), 'good');
    setTone(r('cr-row'), 'good');
    posted.push({ ...e, n: step, earned });
    setFeedback(earned ? 'good' : 'info', earned ? (tries === 0 ? 'Correct on the first try. Posted.' : 'Correct. Posted.') : 'Here is the correct entry. Posted.');
    r('why').hidden = false;
    r('why').textContent = `${e.calc} ${e.why}`;
    buttons();
    render(e);
    q('[data-act="next"]').focus({ preventScroll: true });
  }

  function next() {
    if (step < ENTRIES.length) {
      step++;
      startCard();
      render(null);
      drSel.focus({ preventScroll: true });
      return;
    }
    phase = 'done';
    r('bar').style.width = '100%';
    r('progress').textContent = 'The books are closed';
    r('card').dataset.phase = 'done';
    const entries = posted.filter((p) => !p.sort);
    const mine = entries.filter((p) => p.earned).length;
    const bal = closedBalances();
    r('text').textContent = `You wrote ${mine} of ${ENTRIES.length} closing entries yourself. Maya, Capital is now ${fmt(bal.capital)}, and every revenue, expense, and drawing account starts month 3 at zero.`;
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

  // A T-account: debits on the left, credits on the right, and the balance under the side that holds it.
  function drawT(el, lines, bal, balSide) {
    const item = (l) => `<li class="flex justify-between gap-3"><span class="text-muted">${l.label}</span><span class="${NUM}">${fmt(l.amt)}</span></li>`;
    const col = (side) => lines.filter((l) => l.side === side).map(item).join('');
    const balance = `<p class="flex justify-between gap-3 border-t-2 border-ink pt-1 mt-1 font-semibold"><span>Balance</span><span class="${NUM}">${fmt(bal)}</span></p>`;
    el.innerHTML = `
      <div class="grid grid-cols-2 border-t-2 border-ink text-[13.5px]">
        <div class="grid content-start pt-1.5 pr-3 border-r-2 border-ink min-h-[3.5rem]"><ul class="grid gap-1" aria-label="Debits">${col('dr')}</ul>${balSide === 'dr' ? balance : ''}</div>
        <div class="grid content-start pt-1.5 pl-3 min-h-[3.5rem]"><ul class="grid gap-1" aria-label="Credits">${col('cr')}</ul>${balSide === 'cr' ? balance : ''}</div>
      </div>`;
  }

  function render(last) {
    const entries = posted.filter((p) => !p.sort);
    const done = entries.length;
    const bal = closedBalances(done);
    const changed = new Set(last ? entryLines(last).map(([id]) => id) : []);

    let adj = [0, 0], fin = [0, 0];
    for (const a of ACCOUNTS) {
      const debitNormal = DEBIT_NORMAL.has(a.type);
      const cells = rows[a.id].querySelectorAll('td');
      const ab = ADJUSTED[a.id];
      cells[0].textContent = debitNormal && ab ? fmt(ab) : '';
      cells[1].textContent = !debitNormal && ab ? fmt(ab) : '';
      const touched = entries.some((p) => entryLines(p).some(([id]) => id === a.id));
      const closed = isTemporary(a.id) && touched && bal[a.id] === 0;
      const show = (v) => (v ? fmt(v) : '');
      cells[2].innerHTML = closed ? '<span class="text-muted font-sans font-normal">Closed</span>' : debitNormal ? show(bal[a.id]) : '';
      cells[3].innerHTML = closed ? '' : !debitNormal ? show(bal[a.id]) : '';
      if (closed) cells[2].colSpan = 2;
      else cells[2].colSpan = 1;
      cells[3].hidden = closed;
      rows[a.id].toggleAttribute('data-changed', changed.has(a.id));
      if (debitNormal) { adj[0] += ab; fin[0] += bal[a.id]; } else { adj[1] += ab; fin[1] += bal[a.id]; }
    }
    ['adj-dr', 'adj-cr', 'pc-dr', 'pc-cr'].forEach((k, i) => (r(k).textContent = fmt([adj[0], adj[1], fin[0], fin[1]][i])));
    const v = r('tb-verdict');
    setTone(v, done === ENTRIES.length ? 'good' : fin[0] === fin[1] ? '' : 'bad');
    v.textContent = done === ENTRIES.length
      ? `Post-closing trial balance: debits ${fmt(fin[0])} = credits ${fmt(fin[1])}. Only permanent accounts are left, ready for month 3.`
      : done
        ? `After ${done} of ${ENTRIES.length} closing entries: debits ${fmt(fin[0])} = credits ${fmt(fin[1])}. Still balanced after every entry.`
        : `Adjusted trial balance: debits ${fmt(adj[0])} = credits ${fmt(adj[1])}.`;

    // Income Summary and Capital T-accounts
    const isLines = [];
    const capLines = [{ side: 'cr', label: 'Start', amt: ADJUSTED.capital }];
    for (const p of entries) {
      for (const [id, side, amt] of entryLines(p)) {
        const line = { side, label: `(${p.n}) ${p.label.replace('Close ', '')}`, amt };
        if (id === 'incsum') isLines.push(line);
        if (id === 'capital') capLines.push(line);
      }
    }
    const isBal = bal.incsum;
    drawT(r('t-is'), isLines, Math.abs(isBal), isBal < 0 ? 'dr' : 'cr');
    drawT(r('t-cap'), capLines, bal.capital, 'cr');
    const tv = r('t-verdict');
    setTone(tv, done ? 'info' : '');
    tv.textContent = done === 0
      ? ''
      : done < 3
        ? `Income Summary holds ${fmt(Math.abs(isBal))} so far. Capital hasn't changed yet.`
        : done === 3
          ? `Income Summary is back to zero. Net income of ${fmt(NET_INCOME)} moved into Capital.`
          : `Capital: ${fmt(ADJUSTED.capital)} + ${fmt(NET_INCOME)} net income − ${fmt(ADJUSTED.drawing)} drawing = ${fmt(bal.capital)}.`;
  }

  reset();
}
