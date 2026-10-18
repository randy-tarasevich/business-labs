// Budget Balancer: label each line N/W/S, change amounts until the budget balances.
import { money, setTone } from '../lib/util.js';
import { CARDS, TAKE_HOME } from './budget-cards.js';

// on: the pressed color for that category's button, written out in full so Tailwind generates it.
const CATS = [
  { key: 'N', label: 'Need', name: 'Needs', target: 0.5, color: 'var(--accent)', on: 'aria-pressed:bg-accent' },
  { key: 'W', label: 'Want', name: 'Wants', target: 0.3, color: 'var(--warn)', on: 'aria-pressed:bg-warn' },
  { key: 'S', label: 'Savings', name: 'Savings', target: 0.2, color: 'var(--good)', on: 'aria-pressed:bg-good' },
];

// Budget table. On phones each row becomes a two-line card: name and planned amount, then label buttons and new amount.
// Rows carry data-changed and data-missing (no label yet); cells style themselves with group-data-* variants.
const ROW = 'group max-[640px]:grid max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:[grid-template-areas:"name_planned"_"cat_new"] max-[640px]:gap-x-2.5 max-[640px]:gap-y-1.5 max-[640px]:py-2.5 max-[640px]:border-b max-[640px]:border-line';
const TD = 'py-1.5 px-2 border-b border-line align-middle max-[640px]:border-0 max-[640px]:p-0';
const NUM = 'text-right font-mono tabular-nums';
const SEG = 'inline-flex border border-line rounded-lg overflow-hidden group-data-missing:border-warn';
const SEG_BTN = 'font-sans font-semibold text-[13px] leading-[normal] bg-transparent text-muted border-0 not-first:border-l not-first:border-line py-[5px] px-2.5 min-w-16 cursor-pointer aria-pressed:text-panel max-[640px]:min-w-0 max-[640px]:py-1.5 max-[640px]:px-[9px]';
const NEW = 'w-[84px] font-mono font-medium text-[15px] leading-[normal] text-ink bg-bg border border-line rounded-md py-1 px-2 text-right tabular-nums group-data-changed:border-accent';
const fmt = (n) => money(n, 0);

export function initBudgetBalancer(root) {
  const $ = (sel) => root.querySelector(sel);

  // Per-card working state, kept while students switch between cards.
  const states = {};
  const freshState = (card) => ({
    housing: false,
    trade: ['', ''],
    lines: card.lines.map(([name, planned]) => ({ name, planned, value: planned, cat: null })),
  });
  CARDS.forEach((c) => { states[c.id] = freshState(c); });

  let card = CARDS[0];
  let pay = TAKE_HOME;

  // Card tabs
  CARDS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = c.id;
    b.innerHTML = `Card ${c.id} <span>${c.name}, ${c.town}</span>`;
    b.addEventListener('click', () => { card = c; renderCard(); });
    $('[data-cards]').appendChild(b);
  });

  $('[data-pay]').addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v) && v >= 0) { pay = v; renderSummary(); }
  });

  $('[data-housing-toggle]').addEventListener('change', (e) => {
    const st = states[card.id];
    st.housing = e.target.checked;
    const swap = card.housingOption.replace;
    st.lines.forEach((line, i) => {
      const [origName, origAmt] = card.lines[i];
      if (swap[origName]) {
        const [newName, newAmt] = st.housing ? swap[origName] : [origName, origAmt];
        line.name = newName;
        line.planned = newAmt;
        line.value = newAmt;
      }
    });
    renderLines();
    renderSummary();
  });

  root.querySelectorAll('[data-trade]').forEach((ta) => {
    ta.addEventListener('input', () => { states[card.id].trade[+ta.dataset.trade] = ta.value; });
  });

  $('[data-reset]').addEventListener('click', () => {
    states[card.id] = freshState(card);
    renderCard();
  });

  $('[data-copy]').addEventListener('click', async () => {
    const text = summaryText();
    const status = $('[data-copy-status]');
    const fallback = $('[data-copy-fallback]');
    try {
      await navigator.clipboard.writeText(text);
      fallback.hidden = true;
      status.textContent = 'Copied. Paste it into your assignment.';
    } catch {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = 'Press Ctrl+C (or ⌘C) to copy the selected text.';
    }
  });

  function renderCard() {
    const st = states[card.id];
    [...$('[data-cards]').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === card.id)));
    $('[data-card-title]').textContent = `Card ${card.id}: ${card.name}, ${card.town}`;
    $('[data-blurb]').textContent = card.blurb;

    const housing = $('[data-housing]');
    housing.hidden = !card.housingOption;
    if (card.housingOption) {
      $('[data-housing-text]').textContent = card.housingOption.text + ' You may use this option, but you must explain your choice.';
      $('[data-housing-toggle]').checked = st.housing;
    }
    root.querySelectorAll('[data-trade]').forEach((ta) => { ta.value = st.trade[+ta.dataset.trade]; });
    $('[data-copy-status]').textContent = '';
    $('[data-copy-fallback]').hidden = true;
    renderLines();
    renderSummary();
  }

  function renderLines() {
    const st = states[card.id];
    const tbody = $('[data-lines]');
    tbody.replaceChildren();
    st.lines.forEach((line, i) => {
      const tr = document.createElement('tr');
      const id = `bb-${card.id}-${i}`;
      tr.className = ROW;
      tr.innerHTML = `
        <td class="${TD} max-[640px]:[grid-area:name] max-[640px]:font-semibold"><label for="${id}">${line.name}</label></td>
        <td class="${TD} ${NUM} max-[640px]:[grid-area:planned] group-data-changed:line-through group-data-changed:text-muted">${fmt(line.planned)}</td>
        <td class="${TD} max-[640px]:[grid-area:cat]"><div class="${SEG}" role="group" aria-label="Category for ${line.name}">
          ${CATS.map((c) => `<button type="button" class="${SEG_BTN} ${c.on}" data-cat="${c.key}" aria-pressed="${line.cat === c.key}">${c.label}</button>`).join('')}
        </div></td>
        <td class="${TD} ${NUM} max-[640px]:[grid-area:new]"><input class="${NEW}" id="${id}" type="number" min="0" step="5" value="${line.value}" aria-label="New amount for ${line.name}" /></td>`;
      tr.querySelectorAll('[data-cat]').forEach((b) => {
        b.addEventListener('click', () => {
          line.cat = line.cat === b.dataset.cat ? null : b.dataset.cat;
          tr.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cat === line.cat)));
          paintRow(tr, line);
          renderSummary();
        });
      });
      tr.querySelector('input').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        line.value = Number.isNaN(v) || v < 0 ? 0 : v;
        paintRow(tr, line);
        renderSummary();
      });
      paintRow(tr, line);
      tbody.appendChild(tr);
    });
  }

  function paintRow(tr, line) {
    tr.toggleAttribute('data-missing', !line.cat);
    tr.toggleAttribute('data-changed', line.value !== line.planned);
  }

  function totals() {
    const lines = states[card.id].lines;
    const by = { N: 0, W: 0, S: 0 };
    let total = 0;
    let unlabeled = 0;
    lines.forEach((l) => {
      total += l.value;
      if (l.cat) by[l.cat] += l.value;
      else unlabeled += 1;
    });
    return { by, total, unlabeled };
  }

  function renderSummary() {
    const { by, total, unlabeled } = totals();
    const diff = total - pay;
    const gap = $('[data-gap]');
    if (Math.abs(diff) < 0.005) {
      setTone(gap, 'good');
      $('[data-gap-k]').textContent = 'Balanced';
      $('[data-gap-v]').textContent = fmt(0) + ' left';
    } else if (diff > 0) {
      setTone(gap, '');
      $('[data-gap-k]').textContent = 'Over by';
      $('[data-gap-v]').textContent = fmt(diff);
    } else {
      setTone(gap, 'warn');
      $('[data-gap-k]').textContent = 'Not yet assigned';
      $('[data-gap-v]').textContent = fmt(-diff);
    }
    $('[data-total]').textContent = fmt(total);
    $('[data-pay-label]').textContent = fmt(pay);
    $('[data-unlabeled]').textContent = unlabeled ? `${unlabeled} line${unlabeled > 1 ? 's' : ''} still need a label` : '';

    const bars = $('[data-bars]');
    bars.replaceChildren();
    CATS.forEach((c) => {
      const amt = by[c.key];
      const pct = pay > 0 ? amt / pay : 0;
      const el = document.createElement('div');
      el.className = 'grid gap-1';
      el.innerHTML = `
        <div class="flex justify-between gap-2 text-[14px]"><span class="text-[14px] font-bold" style="color:${c.color}">${c.name}</span><span class="text-muted text-[12.5px]"><b class="font-mono font-medium tabular-nums">${fmt(amt)}</b> · ${Math.round(pct * 100)}% (target ${c.target * 100}% = ${fmt(pay * c.target)})</span></div>
        <div class="relative h-3 bg-bg border border-line rounded-md overflow-hidden" role="img" aria-label="${c.name}: ${Math.round(pct * 100)} percent of take-home pay, target ${c.target * 100} percent">
          <div class="h-full rounded-l-md transition-[width] duration-250" style="width:${Math.min(100, pct * 100)}%;background:${c.color}"></div>
          <div class="absolute -top-0.5 -bottom-0.5 w-0.5 bg-ink" style="left:calc(${c.target * 100}% - 1px)"></div>
        </div>`;
      bars.appendChild(el);
    });
  }

  function summaryText() {
    const st = states[card.id];
    const { by, total, unlabeled } = totals();
    const diff = total - pay;
    const pct = (n) => (pay > 0 ? Math.round((n / pay) * 100) : 0);
    const label = { N: 'Need', W: 'Want', S: 'Savings' };
    const out = [];
    out.push(`Card ${card.id}: ${card.name}, ${card.town} (take-home pay ${fmt(pay)}/month)`);
    if (card.housingOption) out.push(`Housing option used: ${st.housing ? 'Yes' : 'No'}`);
    out.push('');
    st.lines.forEach((l) => {
      const change = l.value !== l.planned ? `${fmt(l.planned)} -> ${fmt(l.value)}` : fmt(l.value);
      out.push(`${l.name} | ${l.cat ? label[l.cat] : 'Not labeled'} | ${change}`);
    });
    out.push('');
    out.push(`Needs ${fmt(by.N)} (${pct(by.N)}%) | Wants ${fmt(by.W)} (${pct(by.W)}%) | Savings ${fmt(by.S)} (${pct(by.S)}%)`);
    out.push(`Total ${fmt(total)}: ${Math.abs(diff) < 0.005 ? 'Balanced' : diff > 0 ? `over by ${fmt(diff)}` : `${fmt(-diff)} not assigned`}${unlabeled ? ` (${unlabeled} not labeled)` : ''}`);
    out.push('');
    out.push(`Trade-off 1: ${st.trade[0] || '(blank)'}`);
    out.push(`Trade-off 2: ${st.trade[1] || '(blank)'}`);
    return out.join('\n');
  }

  renderCard();
}
