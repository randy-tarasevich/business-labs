// Budget Balancer: label each line N/W/S, change amounts until the budget balances.
import { money } from '../lib/util.js';
import { CARDS, TAKE_HOME } from './budget-cards.js';

const CATS = [
  { key: 'N', label: 'Need', name: 'Needs', target: 0.5, color: 'var(--need)' },
  { key: 'W', label: 'Want', name: 'Wants', target: 0.3, color: 'var(--want)' },
  { key: 'S', label: 'Savings', name: 'Savings', target: 0.2, color: 'var(--save)' },
];
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
      tr.innerHTML = `
        <td class="c-name"><label for="${id}">${line.name}</label></td>
        <td class="num planned c-planned">${fmt(line.planned)}</td>
        <td class="c-cat"><div class="bb-seg" role="group" aria-label="Category for ${line.name}">
          ${CATS.map((c) => `<button type="button" data-cat="${c.key}" aria-pressed="${line.cat === c.key}">${c.label}</button>`).join('')}
        </div></td>
        <td class="num c-new"><input class="bb-new" id="${id}" type="number" min="0" step="5" value="${line.value}" aria-label="New amount for ${line.name}" /></td>`;
      tr.querySelectorAll('.bb-seg button').forEach((b) => {
        b.addEventListener('click', () => {
          line.cat = line.cat === b.dataset.cat ? null : b.dataset.cat;
          tr.querySelectorAll('.bb-seg button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.cat === line.cat)));
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
    tr.classList.toggle('unlabeled', !line.cat);
    tr.classList.toggle('changed', line.value !== line.planned);
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
      gap.className = 'bb-gap ok';
      $('[data-gap-k]').textContent = 'Balanced';
      $('[data-gap-v]').textContent = fmt(0) + ' left';
    } else if (diff > 0) {
      gap.className = 'bb-gap';
      $('[data-gap-k]').textContent = 'Over by';
      $('[data-gap-v]').textContent = fmt(diff);
    } else {
      gap.className = 'bb-gap under';
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
      el.className = 'bb-bar';
      el.innerHTML = `
        <div class="bb-bar-top"><span class="bb-cat-name" style="color:${c.color}">${c.name}</span><span><b>${fmt(amt)}</b> · ${Math.round(pct * 100)}% (target ${c.target * 100}% = ${fmt(pay * c.target)})</span></div>
        <div class="bb-track" role="img" aria-label="${c.name}: ${Math.round(pct * 100)} percent of take-home pay, target ${c.target * 100} percent">
          <div class="bb-fill" style="width:${Math.min(100, pct * 100)}%;background:${c.color}"></div>
          <div class="bb-target" style="left:calc(${c.target * 100}% - 1px)"></div>
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
