// Financial Statements Lab
// One month of transactions builds three statements, in order:
// Income statement -> net income -> Statement of owner's equity -> ending capital -> Balance sheet.

import { money, presetButtons, wireReveals, setTone } from '../lib/util.js';

const ASSETS = { cash: 'Cash', ar: 'Accounts receivable', supplies: 'Supplies', equip: 'Equipment' };
const LIABS = { ap: 'Accounts payable', loan: 'Loan payable' };

// fx: account changes per $1 of the amount. kind/name: how it touches owner's equity.
export const PRESETS = [
  {
    name: 'Bakery, March',
    title: 'Sweet Spot Bakery',
    period: 'For the month ended March 31',
    asOf: 'March 31',
    start: { cash: 8000, ar: 0, supplies: 500, equip: 4000, ap: 300, loan: 5000 },
    tx: [
      { text: 'Cash sales of cakes and bread', amt: 3200, fx: { cash: 1 }, kind: 'revenue', name: 'Sales' },
      { text: 'Catered a wedding, customer will pay in April', amt: 1100, fx: { ar: 1 }, kind: 'revenue', name: 'Sales' },
      { text: 'Paid rent', amt: 1000, fx: { cash: -1 }, kind: 'expense', name: 'Rent expense' },
      { text: 'Paid part-time wages', amt: 1400, fx: { cash: -1 }, kind: 'expense', name: 'Wages expense' },
      { text: 'Paid the electric bill', amt: 250, fx: { cash: -1 }, kind: 'expense', name: 'Utilities expense' },
      { text: 'Bought flour and sugar on account', amt: 600, fx: { supplies: 1, ap: 1 } },
      { text: 'Used up supplies baking this month', amt: 700, fx: { supplies: -1 }, kind: 'expense', name: 'Supplies expense' },
      { text: 'Paid the supplier part of what is owed', amt: 500, fx: { cash: -1, ap: -1 } },
      { text: 'Made a loan payment', amt: 300, fx: { cash: -1, loan: -1 } },
      { text: 'Owner invested more cash', amt: 1000, fx: { cash: 1 }, kind: 'investment' },
      { text: 'Owner withdrew cash for personal use', amt: 800, fx: { cash: -1 }, kind: 'withdrawal' },
    ],
  },
  {
    name: 'Lawn care, June',
    title: 'Green Edge Lawn Care',
    period: 'For the month ended June 30',
    asOf: 'June 30',
    start: { cash: 2400, ar: 300, supplies: 150, equip: 3500, ap: 0, loan: 0 },
    tx: [
      { text: 'Mowing jobs paid in cash', amt: 2600, fx: { cash: 1 }, kind: 'revenue', name: 'Mowing revenue' },
      { text: 'Landscaping job billed to customer', amt: 900, fx: { ar: 1 }, kind: 'revenue', name: 'Landscaping revenue' },
      { text: 'Collected money customers owed', amt: 700, fx: { cash: 1, ar: -1 } },
      { text: 'Paid helper wages', amt: 1200, fx: { cash: -1 }, kind: 'expense', name: 'Wages expense' },
      { text: 'Paid for gas', amt: 320, fx: { cash: -1 }, kind: 'expense', name: 'Fuel expense' },
      { text: 'Bought a leaf blower on account', amt: 450, fx: { equip: 1, ap: 1 } },
      { text: 'Paid for advertising flyers', amt: 150, fx: { cash: -1 }, kind: 'expense', name: 'Advertising expense' },
      { text: 'Owner withdrew cash for personal use', amt: 1000, fx: { cash: -1 }, kind: 'withdrawal' },
    ],
  },
];

/** Build all three statements from starting balances and the included transactions. */
export function buildStatements(p, rows) {
  const bal = { ...p.start };
  const rev = {};
  const exp = {};
  let invest = 0;
  let draw = 0;
  const startCap = Object.keys(ASSETS).reduce((t, k) => t + p.start[k], 0) - Object.keys(LIABS).reduce((t, k) => t + p.start[k], 0);
  rows.forEach(({ t, on, amt }) => {
    if (!on) return;
    for (const [a, s] of Object.entries(t.fx)) bal[a] += s * amt;
    if (t.kind === 'revenue') rev[t.name] = (rev[t.name] || 0) + amt;
    if (t.kind === 'expense') exp[t.name] = (exp[t.name] || 0) + amt;
    if (t.kind === 'investment') invest += amt;
    if (t.kind === 'withdrawal') draw += amt;
  });
  const totRev = Object.values(rev).reduce((a, b) => a + b, 0);
  const totExp = Object.values(exp).reduce((a, b) => a + b, 0);
  const ni = totRev - totExp;
  const endCap = startCap + invest + ni - draw;
  const totA = Object.keys(ASSETS).reduce((t, k) => t + bal[k], 0);
  const totL = Object.keys(LIABS).reduce((t, k) => t + bal[k], 0);
  return { bal, rev, exp, totRev, totExp, ni, startCap, invest, draw, endCap, totA, totL, balanced: Math.abs(totA - (totL + endCap)) < 0.005 };
}

/** Statement lines each transaction touches, for highlighting. */
function keysFor(t) {
  const keys = Object.keys(t.fx);
  if (t.kind === 'revenue') keys.push(`rev:${t.name}`, 'totrev', 'ni', 'ni2', 'cap');
  if (t.kind === 'expense') keys.push(`exp:${t.name}`, 'totexp', 'ni', 'ni2', 'cap');
  if (t.kind === 'investment') keys.push('invest', 'cap');
  if (t.kind === 'withdrawal') keys.push('draw', 'cap');
  return keys;
}

export function initFinancialStatements(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let p = PRESETS[0];
  let rows = [];

  const setActive = presetButtons($('[data-presets]'), PRESETS, (preset) => load(preset));

  function load(preset) {
    p = preset;
    rows = p.tx.map((t) => ({ t, on: true, amt: t.amt }));
    r('title').textContent = p.title;
    const list = r('tx');
    list.replaceChildren();
    rows.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-center py-1.5 px-2 rounded-md border border-transparent hover:border-line hover:bg-bg focus-within:border-line focus-within:bg-bg data-off:[&_label]:text-muted data-off:[&_label]:line-through data-off:[&_input[type=number]]:opacity-50';
      li.tabIndex = -1;
      const cid = `fs-on-${i}`;
      li.innerHTML = `<input type="checkbox" id="${cid}" checked class="w-[17px] h-[17px] accent-accent m-0" /><label for="${cid}" class="text-[13.5px] cursor-pointer">${row.t.text}${row.t.kind ? ` <em class="not-italic text-[11.5px] text-muted border border-line rounded-full px-1.5 ml-0.5 whitespace-nowrap">${row.t.kind}</em>` : ''}</label><div class="flex items-center gap-[3px]"><span class="text-muted font-mono text-[13px]">$</span><input type="number" class="w-[78px] font-mono font-medium text-[14px] leading-[normal] text-ink bg-bg border border-line rounded-md py-[3px] px-1.5 text-right" min="0" step="50" inputmode="decimal" value="${row.amt}" aria-label="Amount for: ${row.t.text}" /></div>`;
      const [box, amtIn] = li.querySelectorAll('input');
      box.addEventListener('change', () => {
        row.on = box.checked;
        li.toggleAttribute('data-off', !row.on);
        render();
        hit(row.t);
      });
      amtIn.addEventListener('input', () => {
        const v = parseFloat(amtIn.value);
        if (Number.isNaN(v) || v < 0) return;
        row.amt = v;
        render();
        hit(row.t);
      });
      li.addEventListener('mouseenter', () => hit(row.t));
      li.addEventListener('focusin', () => hit(row.t));
      list.appendChild(li);
    });
    list.addEventListener('mouseleave', () => hit(null));
    render();
  }

  function hit(t) {
    const keys = t ? keysFor(t) : [];
    root.querySelectorAll('[data-k]').forEach((el) => el.toggleAttribute('data-hit', keys.includes(el.dataset.k)));
  }

  // Statement rows. kind is a space-separated list: sec, ind, none, sub, total, good, bad, link, link2.
  // A row lights up (data-hit) when its transaction is pointed at.
  const HIT = 'data-hit:*:bg-warn-soft data-hit:*:outline data-hit:*:outline-warn';
  function cells(kind) {
    const k = new Set(kind.split(' ').filter(Boolean));
    const edge = k.has('total') ? '[border-top:2px_solid_var(--ink)] [border-bottom:3px_double_var(--ink)]' : k.has('sub') ? 'border-y border-line' : 'border-b border-line';
    const bg = k.has('link') ? 'bg-accent/12' : k.has('link2') ? 'bg-good/14' : '';
    const th = ['text-left pb-[3px] pr-1', k.has('sec') ? 'pt-2 text-[13px]' : 'pt-[3px]', k.has('sec') || k.has('total') ? 'font-semibold' : 'font-normal', k.has('ind') ? 'pl-3.5' : 'pl-0', k.has('none') ? 'text-muted' : '', edge, bg];
    const td = ['text-right font-mono font-medium text-[13.5px] leading-[normal] tabular-nums whitespace-nowrap py-[3px] px-1', k.has('good') ? 'text-good' : k.has('bad') ? 'text-bad' : k.has('none') ? 'text-muted' : '', edge, bg];
    return [th.filter(Boolean).join(' '), td.filter(Boolean).join(' ')];
  }
  const line = (k, label, v, kind = '') => {
    const [th, td] = cells(kind);
    return `<tr data-k="${k}" class="${HIT}"><th scope="row" class="${th}">${label}</th><td class="${td}">${money(v, 0)}</td></tr>`;
  };
  const section = (label) => `<tr><th scope="rowgroup" colspan="2" class="${cells('sec')[0]}">${label}</th></tr>`;
  const none = () => {
    const [th, td] = cells('ind none');
    return `<tr><th scope="row" class="${th}">None</th><td class="${td}">$0</td></tr>`;
  };

  function render() {
    const s = buildStatements(p, rows);
    root.querySelectorAll('[data-r="period"]').forEach((el) => (el.textContent = p.period));
    r('asof').textContent = `As of ${p.asOf}`;

    const revLines = Object.entries(s.rev).map(([n, v]) => line(`rev:${n}`, n, v, 'ind')).join('');
    const expLines = Object.entries(s.exp).map(([n, v]) => line(`exp:${n}`, n, v, 'ind')).join('');
    r('is').innerHTML =
      `${section('Revenue')}${revLines || none()}` +
      line('totrev', 'Total revenue', s.totRev, 'sub') +
      `${section('Expenses')}${expLines || none()}` +
      line('totexp', 'Total expenses', s.totExp, 'sub') +
      line('ni', s.ni >= 0 ? 'Net income' : 'Net loss', s.ni, `total link ${s.ni >= 0 ? 'good' : 'bad'}`);

    r('oe').innerHTML =
      line('startcap', `Capital, start of month`, s.startCap) +
      line('invest', 'Plus: Owner investments', s.invest) +
      line('ni2', s.ni >= 0 ? 'Plus: Net income' : 'Minus: Net loss', Math.abs(s.ni), 'link') +
      line('draw', 'Minus: Withdrawals', s.draw) +
      line('cap', 'Capital, end of month', s.endCap, 'total link2');

    r('bs-a').innerHTML =
      Object.entries(ASSETS).map(([k, n]) => line(k, n, s.bal[k], 'ind')).join('') + line('tota', 'Total assets', s.totA, 'total');
    r('bs-l').innerHTML =
      section('Liabilities') +
      Object.entries(LIABS).map(([k, n]) => line(k, n, s.bal[k], 'ind')).join('') +
      line('totl', 'Total liabilities', s.totL, 'sub') +
      section("Owner's equity") +
      line('cap', 'Capital, end of month', s.endCap, 'ind link2') +
      line('totle', 'Total liabilities and equity', s.totL + s.endCap, 'total');

    const v = r('verdict');
    const negCash = s.bal.cash < 0;
    setTone(v, s.balanced && !negCash ? 'good' : 'warn');
    v.textContent = !s.balanced
      ? 'Out of balance.'
      : negCash
        ? `Balanced, but cash is ${money(s.bal.cash, 0)}. A real business can't spend money it doesn't have.`
        : `Balanced: assets of ${money(s.totA, 0)} equal liabilities plus equity. ${s.ni >= 0 ? `Net income of ${money(s.ni, 0)}` : `A net loss of ${money(-s.ni, 0)}`} flowed into capital.`;
  }

  wireReveals(root);
  setActive(0);
  load(PRESETS[0]);
}
