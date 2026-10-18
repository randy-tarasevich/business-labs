// Business Plan Builder
// Students fill in seven sections. The money section reuses Startup Runway's month-by-month math,
// so break-even, runway, and cash needed always match that tool.
//
// Saving: the plan is kept in this browser (localStorage) and never sent to any server.
// Where the browser supports it (Chrome and Chromebooks), students can also link a file in their
// own Google Drive: the tool keeps writing the plan to that file, and "Open from my Drive" loads it
// on any other Chromebook. Elsewhere, they download a backup file and load it instead.

import { money, num, svgEl, setTone, fitWidth, onWidthChange } from '../lib/util.js';
import { SECTIONS, FIELDS, blankPlan, examplePlan } from './business-plan-sections.js';
import { simulateRunway } from './startup-runway.js';
import {
  H2, H3, HINT, PROSE, TEXT_INPUT, TEXTAREA, NUM_INPUT_SM, NUM_UNIT, BTN, BTN_GHOST, VERDICT, RESULTS, STAT, STAT_KEY, STAT_K, STAT_V, SVG, TABLE, TABLE_BOX,
} from '../lib/ui.js';

const KEY = 'business-labs:business-plan';
const PLAN_VIEW = 'plan';
const APP = 'business-labs-business-plan';

// ---------- small helpers ----------
const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const filled = (f, v) => {
  if (f.type === 'costs') return v.some((r) => n(r[1]) > 0);
  if (f.type === 'competitors') return v.some((c) => c.name.trim());
  if (['money', 'number', 'percent'].includes(f.type)) return n(v) > 0;
  return String(v ?? '').trim().length >= 2;
};
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/** Make any loaded object into a complete, valid plan. */
export function normalize(raw) {
  const plan = blankPlan();
  if (!raw || typeof raw !== 'object') return plan;
  for (const [id, f] of Object.entries(FIELDS)) {
    const v = raw[id];
    if (f.type === 'costs') {
      if (Array.isArray(v)) plan[id] = v.filter(Array.isArray).map((r) => [String(r[0] ?? ''), r[1] === '' || r[1] == null ? '' : String(r[1])]);
      if (!plan[id].length) plan[id] = [['', '']];
    } else if (f.type === 'competitors') {
      if (Array.isArray(v)) plan[id] = [0, 1, 2].map((i) => ({ name: String(v[i]?.name ?? ''), strong: String(v[i]?.strong ?? ''), weak: String(v[i]?.weak ?? '') }));
    } else if (v != null) plan[id] = String(v);
  }
  return plan;
}

/** All the numbers the plan implies. */
export function calc(p) {
  const price = n(p.price);
  const unitCost = n(p.unitCost);
  const units = n(p.units);
  const growth = n(p.growth);
  const rows = (list) => list.filter((r) => n(r[1]) > 0).map((r) => [r[0].trim() || 'Unnamed cost', n(r[1])]);
  const startup = rows(p.startup);
  const fixed = rows(p.fixed);
  const startupTotal = startup.reduce((t, r) => t + r[1], 0);
  const fixedTotal = fixed.reduce((t, r) => t + r[1], 0);
  const cm = price - unitCost;
  const beUnits = cm > 0 ? Math.ceil(fixedTotal / cm) : Infinity;
  const hasMoney = price > 0 && units > 0;
  const base = { startup, fixed, sales: units * price, growth, vc: price > 0 ? (unitCost / price) * 100 : 0 };
  // Cash needed = startup costs + enough to cover the worst month before profits arrive.
  const dry = simulateRunway({ ...base, cash: startupTotal });
  const need = startupTotal + Math.max(0, -dry.low.cash);
  const raised = n(p.savings) + n(p.family) + n(p.loan) + n(p.investor);
  const run = simulateRunway({ ...base, cash: raised > 0 ? raised : need });
  const yearUnits = price > 0 ? run.months.slice(1, 13).reduce((t, m) => t + m.sales / price, 0) : 0;
  const potential = n(p.marketPeople) * (n(p.marketPct) / 100) * n(p.marketFreq);
  const investor = n(p.investor);
  const investorPct = n(p.investorPct);
  return {
    price, unitCost, units, growth, startup, fixed, startupTotal, fixedTotal, cm, beUnits, hasMoney,
    month1Profit: units * cm - fixedTotal, firstProfit: dry.firstProfit, need, raised, run, yearUnits, potential,
    investor, investorPct, valuation: investor > 0 && investorPct > 0 && investorPct < 100 ? investor / (investorPct / 100) : null,
  };
}

/** Problems a banker or teacher would spot. Each points to the section that fixes it. */
export function checks(p, c) {
  const out = [];
  const add = (tone, section, text) => out.push({ tone, section, text });
  if (c.hasMoney && c.cm <= 0) add('bad', 'money', `Your price (${money(c.price, 2)}) is not more than your cost per item (${money(c.unitCost, 2)}). You lose money on every sale.`);
  else if (c.hasMoney && c.beUnits > c.units) {
    if (c.firstProfit) add('warn', 'money', `You need ${num(c.beUnits)} sales a month to break even but start at ${num(c.units)}. At ${num(c.growth)}% growth you get there in month ${c.firstProfit}.`);
    else add('bad', 'money', `You need ${num(c.beUnits)} sales a month to break even but start at ${num(c.units)} and never get there in two years. Raise the price, cut costs, or plan for faster growth.`);
  }
  if (c.hasMoney && !c.fixed.length) add('warn', 'money', 'You have no monthly fixed costs. Most businesses pay something every month, like booth fees, a website, insurance, or gas.');
  if (c.hasMoney && !c.startup.length) add('warn', 'money', 'You have no startup costs. What do you need to buy before your first sale?');
  if (c.growth > 25) add('warn', 'money', `${num(c.growth)}% growth every month is very fast. Can you explain how you would get there?`);
  if (c.hasMoney && c.raised < c.need) add('bad', 'funding', c.raised > 0 ? `You need about ${money(c.need, 0)} but have raised ${money(c.raised, 0)}. You are ${money(c.need - c.raised, 0)} short.` : `You need about ${money(c.need, 0)} to open and keep going. Where will that money come from?`);
  if ((c.investor > 0) !== (c.investorPct > 0)) add('warn', 'funding', 'An investor deal needs both an amount and the share of the business the investor gets.');
  if (n(p.marketPct) > 25) add('warn', 'market', `Expecting ${num(n(p.marketPct))}% of your market to buy is very high for a new business.`);
  if (c.potential > 0 && c.hasMoney && c.yearUnits > c.potential) add('warn', 'market', `Your first-year forecast (${num(Math.round(c.yearUnits))} sales) is more than your whole market buys in a year (${num(Math.round(c.potential))}). Lower the forecast or widen your market.`);
  const marketStarted = ['target', 'marketPeople', 'marketPct', 'marketFreq', 'edge'].some((id) => String(p[id] ?? '').trim());
  if (marketStarted && !p.competitors.some((x) => x.name.trim())) add('warn', 'market', 'List at least one competitor. Every business has one, even if it\'s customers doing it themselves.');
  return out;
}

/** Share of required fields filled in, per section. */
export function progress(p) {
  return Object.fromEntries(
    SECTIONS.map((s) => {
      const req = s.fields.filter((f) => !f.optional);
      const done = req.filter((f) => filled(f, p[f.id])).length;
      return [s.id, { done, total: req.length }];
    })
  );
}

export function initBusinessPlan(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);

  // ---------- state + storage ----------
  let plan = blankPlan();
  let view = SECTIONS[0].id;
  let canSave = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.plan) plan = normalize(saved.plan);
    if (saved?.view && (saved.view === PLAN_VIEW || SECTIONS.some((s) => s.id === saved.view))) view = saved.view;
  } catch {
    canSave = false;
  }

  // ---------- linked Drive file (File System Access API) ----------
  const canLink = typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function';
  let fileHandle = null;
  let fileState = 'none'; // none | ok | needs-ok | error
  let fileSavedAt = 0;
  let localSavedAt = 0;
  let writing = Promise.resolve();
  try {
    localSavedAt = JSON.parse(localStorage.getItem(KEY) || 'null')?.saved || 0;
  } catch {}

  const clock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fileJson = () => JSON.stringify({ app: APP, v: 1, saved: Date.now(), plan }, null, 2);

  function status() {
    const line = r('saved');
    const btn = r('reconnect');
    btn.hidden = fileState !== 'needs-ok';
    if (fileState === 'ok') {
      line.textContent = `Saving to ${fileHandle.name} in your Drive${fileSavedAt ? `. Last saved at ${clock(fileSavedAt)}` : ''}.`;
      setTone(line, 'good');
    } else if (fileState === 'needs-ok') {
      line.textContent = `Your plan is linked to ${fileHandle.name}. Click Keep saving to my Drive so changes go there too.`;
      setTone(line, 'warn');
    } else if (fileState === 'error') {
      line.textContent = `Couldn't save to ${fileHandle?.name || 'your Drive file'}. Click Save to my Drive and pick the file again.`;
      setTone(line, 'bad');
    } else if (!canSave) {
      line.textContent = canLink ? "This browser won't keep your work. Click Save to my Drive before you leave." : "This browser won't keep your work. Download a backup before you leave.";
      setTone(line, 'bad');
    } else {
      line.textContent = localSavedAt ? `Saved on this device at ${clock(localSavedAt)}.` : 'Your plan saves on this device as you type.';
      if (canLink) line.textContent += ' Save to my Drive to open it anywhere.';
      setTone(line, '');
    }
  }

  function writeFile() {
    if (!fileHandle || fileState !== 'ok') return;
    const text = fileJson();
    writing = writing.then(async () => {
      try {
        const w = await fileHandle.createWritable();
        await w.write(text);
        await w.close();
        fileSavedAt = Date.now();
      } catch {
        fileState = 'error';
      }
      status();
    });
  }

  // The link survives a reload: the handle is kept in IndexedDB (it never leaves this browser).
  const DB = 'business-labs';
  function idb(mode, fn) {
    return new Promise((resolve) => {
      try {
        const open = indexedDB.open(DB, 1);
        open.onupgradeneeded = () => open.result.createObjectStore('handles');
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const tx = open.result.transaction('handles', mode);
          const req = fn(tx.objectStore('handles'));
          tx.oncomplete = () => resolve(req?.result ?? null);
          tx.onerror = () => resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }
  const rememberHandle = (h) => idb('readwrite', (st) => (h ? st.put(h, KEY) : st.delete(KEY)));

  function link(h) {
    fileHandle = h;
    fileState = h ? 'ok' : 'none';
    fileSavedAt = 0;
    rememberHandle(h);
    status();
  }

  async function readPlanFile(h) {
    const data = JSON.parse(await (await h.getFile()).text());
    if (data?.app !== APP || !data.plan) throw new Error('not a plan');
    return data;
  }

  // Before writing to a reconnected file, load it if it was saved more recently somewhere else
  // (say, at home), so an older copy on this Chromebook never overwrites newer work.
  async function syncFromFile() {
    try {
      const data = await readPlanFile(fileHandle);
      if ((data.saved || 0) > localSavedAt + 1000) {
        plan = normalize(data.plan);
        render();
        notice(`Loaded the newer version of your plan from ${fileHandle.name}.`, 'good');
      }
    } catch {}
    fileState = 'ok';
    save(true);
  }

  async function reconnect(ask) {
    if (!fileHandle) return;
    try {
      const opts = { mode: 'readwrite' };
      let perm = await fileHandle.queryPermission(opts);
      if (perm !== 'granted' && ask) perm = await fileHandle.requestPermission(opts);
      if (perm === 'granted') return syncFromFile();
      fileState = 'needs-ok';
    } catch {
      fileState = 'error';
    }
    status();
  }

  if (canLink) {
    idb('readonly', (st) => st.get(KEY)).then((h) => {
      if (h && typeof h.queryPermission === 'function') {
        fileHandle = h;
        reconnect(false);
      }
    });
  }

  let saveTimer = 0;
  function save(now = false) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localSavedAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify({ plan, view, saved: localSavedAt }));
      } catch {
        canSave = false;
      }
      writeFile();
      status();
    }, now ? 0 : 400);
  }
  status();

  // ---------- inline confirm (no pop-up dialogs) ----------
  function confirmThen(message, yesLabel, action) {
    const box = r('confirm');
    box.replaceChildren();
    box.hidden = false;
    const msg = el('span', 'mr-1', message);
    const yes = el('button', BTN, yesLabel);
    const no = el('button', BTN_GHOST, 'Cancel');
    yes.type = no.type = 'button';
    yes.addEventListener('click', () => {
      box.hidden = true;
      action();
    });
    no.addEventListener('click', () => (box.hidden = true));
    box.append(msg, yes, no);
    yes.focus();
  }
  function notice(message, tone = '') {
    const box = r('confirm');
    box.replaceChildren(el('span', '', message));
    setTone(box, tone);
    box.hidden = false;
    setTimeout(() => {
      box.hidden = true;
      setTone(box, '');
    }, 5000);
  }
  function replacePlan(next) {
    plan = normalize(next);
    view = SECTIONS[0].id;
    save();
    render();
  }

  // Example and Start over unlink the Drive file first, so they can never overwrite a student's work.
  const unlinkNote = () => (fileHandle ? ` Your Drive file (${fileHandle.name}) won't change.` : '');
  $('[data-act="example"]').addEventListener('click', () =>
    confirmThen(`Replace your plan on this screen with the example (Pawsome Treats)?${unlinkNote() || ' Save yours to your Drive first if you want to keep it.'}`, 'Show the example', () => {
      link(null);
      replacePlan(examplePlan());
    })
  );
  $('[data-act="new"]').addEventListener('click', () =>
    confirmThen(`Erase this plan from this device and start over?${unlinkNote() || " This can't be undone."}`, 'Erase and start over', () => {
      link(null);
      replacePlan(blankPlan());
    })
  );

  const fileName = () => (plan.name.trim() || 'my-business-plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'my-business-plan';
  const PICK = { types: [{ description: 'Business plan', accept: { 'application/json': ['.json'] } }], id: 'business-plan' };

  $('[data-act="drive-save"]').addEventListener('click', async () => {
    let h;
    try {
      h = await window.showSaveFilePicker({ ...PICK, suggestedName: `${fileName()}-business-plan.json` });
    } catch (e) {
      if (e?.name !== 'AbortError') notice("This Chromebook won't let the tool save files. Ask your teacher, and use Download a backup for now.", 'bad'), showFallback();
      return;
    }
    link(h);
    save(true);
  });

  $('[data-act="drive-open"]').addEventListener('click', async () => {
    let h;
    try {
      [h] = await window.showOpenFilePicker({ ...PICK, multiple: false });
    } catch (e) {
      if (e?.name !== 'AbortError') notice("This Chromebook won't let the tool save files. Ask your teacher, and use Download a backup for now.", 'bad'), showFallback();
      return;
    }
    try {
      const data = await readPlanFile(h);
      const open = () => {
        replacePlan(data.plan);
        if (typeof h.requestPermission === 'function') {
          fileHandle = h;
          rememberHandle(h);
          reconnect(true);
        }
      };
      const empty = !SECTIONS.some((s) => s.fields.some((f) => filled(f, plan[f.id])));
      if (empty) open();
      else confirmThen(`Open "${data.plan.name || h.name}"? It replaces the plan on this screen.`, 'Open this plan', open);
    } catch {
      notice("That file isn't a Business Plan Builder plan.", 'bad');
    }
  });

  r('reconnect').addEventListener('click', () => reconnect(true));

  $('[data-act="download"]').addEventListener('click', () => {
    const blob = new Blob([fileJson()], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  const fileIn = $('[data-file]');
  $('[data-act="load"]').addEventListener('click', () => fileIn.click());
  fileIn.addEventListener('change', async () => {
    const file = fileIn.files[0];
    fileIn.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== APP || !data.plan) throw new Error('not a plan');
      confirmThen(`Replace your current plan with "${data.plan.name || file.name}"?`, 'Load this plan', () => {
        link(null);
        replacePlan(data.plan);
      });
    } catch {
      notice("That file isn't a Business Plan Builder backup.", 'bad');
    }
  });

  // Chromebooks and Chrome get the Drive buttons; other browsers keep download and load.
  root.querySelectorAll('[data-drive]').forEach((x) => (x.hidden = !canLink));
  root.querySelectorAll('[data-nodrive]').forEach((x) => (x.hidden = canLink));
  // If a school blocks file access, bring back download and load so students still have a backup.
  function showFallback() {
    root.querySelectorAll('[data-nodrive]').forEach((x) => (x.hidden = false));
  }

  // ---------- navigation ----------
  const nav = r('nav');
  [...SECTIONS.map((s, i) => ({ id: s.id, label: `${i + 1}. ${s.title}` })), { id: PLAN_VIEW, label: 'Your finished plan' }].forEach((item) => {
    const b = el('button');
    b.type = 'button';
    b.dataset.view = item.id;
    b.className =
      'group w-full flex items-center gap-2.5 text-left font-sans text-[14px] leading-[normal] text-ink bg-transparent border border-transparent rounded-lg py-2 px-2.5 cursor-pointer hover:bg-bg aria-[current=step]:bg-bg aria-[current=step]:border-line aria-[current=step]:font-semibold';
    const dot = el('span', 'w-3 h-3 rounded-full shrink-0 border-2 border-line tone-warn:border-warn tone-warn:bg-warn-soft tone-good:border-good tone-good:bg-good');
    dot.setAttribute('aria-hidden', 'true');
    dot.dataset.dot = item.id;
    const label = el('span', 'flex-1', item.label);
    const count = el('span', 'text-[12px] text-muted font-mono');
    count.dataset.count = item.id;
    b.append(dot, label, count);
    b.addEventListener('click', () => go(item.id));
    nav.appendChild(b);
  });

  function go(id) {
    view = id;
    save();
    render();
    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  // ---------- rendering ----------
  function render() {
    [...nav.children].forEach((b) => (b.dataset.view === view ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    const isPlan = view === PLAN_VIEW;
    r('section').hidden = isPlan;
    r('plan-wrap').hidden = !isPlan;
    if (isPlan) renderPlan();
    else renderSection(SECTIONS.find((s) => s.id === view));
    refresh();
  }

  /** Everything that changes as students type: progress, checks, computed panels. */
  function refresh() {
    const c = calc(plan);
    const prog = progress(plan);
    let allDone = true;
    for (const s of SECTIONS) {
      const { done, total } = prog[s.id];
      if (done < total) allDone = false;
      setTone(root.querySelector(`[data-dot="${s.id}"]`), done === total ? 'good' : done > 0 ? 'warn' : '');
      root.querySelector(`[data-count="${s.id}"]`).textContent = `${done}/${total}`;
    }
    setTone(root.querySelector(`[data-dot="${PLAN_VIEW}"]`), allDone ? 'good' : '');
    const totalDone = SECTIONS.reduce((t, s) => t + prog[s.id].done, 0);
    const totalAll = SECTIONS.reduce((t, s) => t + prog[s.id].total, 0);
    r('progress-bar').style.width = `${(totalDone / totalAll) * 100}%`;
    r('progress-text').textContent = `${totalDone} of ${totalAll} answers done`;

    const list = checks(plan, c);
    const box = r('checks');
    box.replaceChildren();
    if (!list.length) {
      const li = el('li', 'text-[13.5px] text-good font-semibold', allDone ? 'No problems found. Read your finished plan out loud once before you turn it in.' : 'No problems so far.');
      box.appendChild(li);
    }
    list.forEach((x) => {
      const li = el('li', 'grid gap-1 border-l-[3px] pl-2.5 py-0.5 text-[13.5px] tone-bad:border-bad tone-warn:border-warn');
      setTone(li, x.tone);
      li.append(el('span', '', x.text));
      const link = el('button', 'justify-self-start font-sans font-medium text-[12.5px] leading-[normal] text-accent bg-transparent border-0 p-0 cursor-pointer underline underline-offset-2', `Go to ${SECTIONS.find((s) => s.id === x.section).title}`);
      link.type = 'button';
      link.addEventListener('click', () => go(x.section));
      li.appendChild(link);
      box.appendChild(li);
    });
    r('checks-count').textContent = list.length ? `${list.length} to look at` : '';

    if (view === 'market') renderMarketCalc(c);
    if (view === 'marketing') r('price-note').textContent = c.price > 0 ? `Your price: ${money(c.price, 2)} (change it in The money)` : 'Set your price in The money.';
    if (view === 'money') renderMoneyCalc(c);
    if (view === 'funding') renderFundingCalc(c);
    if (view === 'summary') renderSummaryCheck(c);
  }

  function renderSection(s) {
    const i = SECTIONS.indexOf(s);
    const wrap = r('section');
    wrap.replaceChildren();
    const head = el('div', 'grid gap-1');
    head.append(el('span', 'text-[12.5px] text-muted font-semibold uppercase tracking-[.04em]', `Step ${i + 1} of ${SECTIONS.length}`), el('h2', 'font-display font-semibold text-[22px]', s.title), el('p', `text-muted ${PROSE}`, s.intro));
    wrap.appendChild(head);

    for (const f of s.fields) {
      wrap.appendChild(fieldBlock(f));
      if (f.id === 'marketFreq') wrap.appendChild(calcBox('market-calc'));
      if (f.id === 'priceWhy') {
        const note = el('p', 'text-[13.5px] font-semibold text-accent -mt-2');
        note.dataset.r = 'price-note';
        wrap.insertBefore(note, wrap.lastChild);
      }
    }
    if (s.id === 'money') wrap.appendChild(calcBox('money-calc'));
    if (s.id === 'funding') wrap.appendChild(calcBox('funding-calc'));
    if (s.id === 'summary') wrap.insertBefore(calcBox('summary-check'), wrap.children[1]);

    const foot = el('div', 'flex flex-wrap justify-between gap-2 border-t border-line pt-4');
    const back = el('button', BTN_GHOST, '← Back');
    back.type = 'button';
    back.disabled = i === 0;
    back.classList.toggle('invisible', i === 0);
    back.addEventListener('click', () => go(SECTIONS[i - 1].id));
    const nextId = i === SECTIONS.length - 1 ? PLAN_VIEW : SECTIONS[i + 1].id;
    const next = el('button', BTN, i === SECTIONS.length - 1 ? 'See your finished plan →' : `Next: ${SECTIONS[i + 1].title} →`);
    next.type = 'button';
    next.addEventListener('click', () => go(nextId));
    foot.append(back, next);
    wrap.appendChild(foot);
  }

  function calcBox(name) {
    const d = el('div', 'grid gap-3 bg-bg rounded-lg p-3.5');
    d.dataset.r = name;
    return d;
  }

  function fieldBlock(f) {
    const block = el('div', 'grid gap-1.5');
    const id = `bp-${f.id}`;
    const top = el('div', 'flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1');
    const label = el(f.type === 'costs' || f.type === 'competitors' ? 'span' : 'label', 'font-semibold text-[15px]', f.label);
    if (label.tagName === 'LABEL') label.htmlFor = id;
    if (f.optional) label.append(el('span', 'font-normal text-muted text-[13px] ml-1.5', '(optional)'));
    top.appendChild(label);
    let exBox = null;
    if (f.example !== undefined && f.example !== '' && f.example !== 0) {
      const ex = el('button', 'font-sans font-medium text-[12.5px] leading-[normal] text-accent bg-transparent border-0 p-0 cursor-pointer underline underline-offset-2', 'See an example');
      ex.type = 'button';
      exBox = el('div', 'text-[13.5px] text-muted bg-bg border-l-[3px] border-line rounded-r-md py-2 px-3');
      exBox.hidden = true;
      exBox.innerHTML = `<span class="font-semibold text-ink">Pawsome Treats:</span> ${exampleHtml(f)}`;
      ex.addEventListener('click', () => {
        exBox.hidden = !exBox.hidden;
        ex.textContent = exBox.hidden ? 'See an example' : 'Hide example';
      });
      top.appendChild(ex);
    }
    block.appendChild(top);
    if (f.hint) block.appendChild(el('span', HINT, f.hint));

    if (f.type === 'text' || f.type === 'long') {
      const input = el(f.type === 'text' ? 'input' : 'textarea', f.type === 'text' ? TEXT_INPUT : TEXTAREA);
      input.id = id;
      if (f.type === 'long') input.rows = f.rows ?? 3;
      input.placeholder = f.starter ?? '';
      input.value = plan[f.id];
      input.addEventListener('input', () => {
        plan[f.id] = input.value;
        save();
        refresh();
      });
      block.appendChild(input);
    } else if (['money', 'number', 'percent'].includes(f.type)) {
      const row = el('div', 'flex items-center gap-1');
      if (f.type === 'money') row.appendChild(el('span', NUM_UNIT, '$'));
      const input = el('input', `${NUM_INPUT_SM} w-[120px]`);
      Object.assign(input, { id, type: 'number', min: 0, step: f.type === 'money' ? 0.01 : 1, value: plan[f.id] });
      input.inputMode = 'decimal';
      input.placeholder = f.starter ?? '';
      input.addEventListener('input', () => {
        plan[f.id] = input.value;
        save();
        refresh();
      });
      row.appendChild(input);
      if (f.type === 'percent') row.appendChild(el('span', NUM_UNIT, '%'));
      block.appendChild(row);
    } else if (f.type === 'costs') {
      block.appendChild(costsEditor(f));
    } else if (f.type === 'competitors') {
      block.appendChild(competitorsEditor(f));
    }
    if (exBox) block.appendChild(exBox);
    return block;
  }

  function exampleHtml(f) {
    if (f.type === 'costs') return f.example.map(([l, a]) => `${esc(l)} ${money(a, 0)}`).join(' · ');
    if (f.type === 'competitors') return f.example.map((c) => `<b class="text-ink">${esc(c.name)}</b>: does well: ${esc(c.strong)}; falls short: ${esc(c.weak)}`).join('<br>');
    if (f.type === 'money') return money(f.example, 2);
    if (f.type === 'percent') return `${f.example}%`;
    return esc(f.example);
  }

  function costsEditor(f) {
    const box = el('div', 'grid gap-1.5');
    const total = el('div', 'flex justify-between text-[14px] font-semibold border-t border-line pt-1.5 mt-0.5');
    const draw = () => {
      box.replaceChildren();
      plan[f.id].forEach((row, i) => {
        const line = el('div', 'grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5 items-center');
        const name = el('input', `${TEXT_INPUT} py-1.5`);
        Object.assign(name, { type: 'text', value: row[0], placeholder: 'What is it?' });
        name.setAttribute('aria-label', `${f.label}, line ${i + 1} name`);
        name.addEventListener('input', () => {
          row[0] = name.value;
          save();
          refresh();
        });
        const amt = el('div', 'flex items-center gap-1');
        const a = el('input', `${NUM_INPUT_SM} w-[96px] max-[620px]:w-[72px]`);
        Object.assign(a, { type: 'number', min: 0, step: 1, value: row[1], placeholder: '0' });
        a.inputMode = 'decimal';
        a.setAttribute('aria-label', `${f.label}, line ${i + 1} amount in dollars`);
        a.addEventListener('input', () => {
          row[1] = a.value;
          save();
          refresh();
          sum();
        });
        amt.append(el('span', NUM_UNIT, '$'), a);
        const del = el('button', 'w-8 h-8 grid place-items-center text-muted bg-transparent border border-line rounded-md cursor-pointer hover:border-bad hover:text-bad', '×');
        del.type = 'button';
        del.setAttribute('aria-label', `Remove line ${i + 1}`);
        del.addEventListener('click', () => {
          plan[f.id].splice(i, 1);
          if (!plan[f.id].length) plan[f.id].push(['', '']);
          save();
          draw();
          refresh();
        });
        line.append(name, amt, del);
        box.appendChild(line);
      });
      const add = el('button', `${BTN_GHOST} justify-self-start py-1.5 text-[13px]`, '+ Add a line');
      add.type = 'button';
      add.addEventListener('click', () => {
        plan[f.id].push(['', '']);
        save();
        draw();
        box.querySelectorAll('input[type="text"]')[plan[f.id].length - 1].focus();
      });
      box.append(add, total);
      sum();
    };
    const sum = () => {
      const t = plan[f.id].reduce((s, r0) => s + n(r0[1]), 0);
      total.replaceChildren(el('span', '', 'Total'), el('span', 'font-mono tabular-nums', money(t, 0)));
    };
    draw();
    return box;
  }

  function competitorsEditor(f) {
    const box = el('div', 'grid gap-2.5');
    plan[f.id].forEach((c, i) => {
      const card = el('fieldset', 'border border-line rounded-lg pt-2 px-3 pb-3 m-0 grid gap-2 min-w-0');
      card.appendChild(el('legend', 'font-semibold text-[13px] text-muted px-1', `Competitor ${i + 1}`));
      [['name', 'Name', 'Who are they?'], ['strong', 'What they do well', ''], ['weak', 'Where they fall short', '']].forEach(([k, lab, ph]) => {
        const wrap = el('label', 'grid gap-1 text-[13px] font-semibold');
        wrap.append(el('span', '', lab));
        const input = el('input', `${TEXT_INPUT} py-1.5 font-normal`);
        Object.assign(input, { type: 'text', value: c[k], placeholder: ph });
        input.addEventListener('input', () => {
          c[k] = input.value;
          save();
          refresh();
        });
        wrap.appendChild(input);
        card.appendChild(wrap);
      });
      box.appendChild(card);
    });
    return box;
  }

  // ---------- computed panels ----------
  function stat(label, value, tone = '', keyed = false) {
    const d = el('div', keyed ? STAT_KEY : STAT);
    setTone(d, tone);
    d.append(el('span', STAT_K, label), el('span', STAT_V, value));
    return d;
  }

  function renderMarketCalc(c) {
    const box = r('market-calc');
    if (!box) return;
    box.replaceChildren();
    if (!(c.potential > 0)) {
      box.append(el('p', 'text-[14px] text-muted', 'Fill in the three numbers above to estimate how many sales your market could support.'));
      return;
    }
    box.append(el('p', 'text-[14px]', `${num(n(plan.marketPeople))} people × ${num(n(plan.marketPct), 1)}% × ${num(n(plan.marketFreq))} times a year = about ${num(Math.round(c.potential))} sales a year your market could support.`));
    if (c.hasMoney) box.append(el('p', 'text-[14px] text-muted', `Your forecast in The money adds up to about ${num(Math.round(c.yearUnits))} sales in the first year.`));
  }

  function renderMoneyCalc(c) {
    const box = r('money-calc');
    if (!box) return;
    box.replaceChildren();
    box.appendChild(el('h3', H3, 'What your numbers say'));
    if (!c.hasMoney) {
      box.appendChild(el('p', 'text-[14px] text-muted', 'Enter a price and how many items you expect to sell to see your break-even point and how much cash you need.'));
      return;
    }
    const stats = el('div', RESULTS);
    stats.append(
      stat('Profit on each item', money(c.cm, 2), c.cm > 0 ? '' : 'bad', true),
      stat('Break-even per month', Number.isFinite(c.beUnits) ? `${num(c.beUnits)} items` : 'Never', Number.isFinite(c.beUnits) && c.beUnits <= c.units ? 'good' : 'bad'),
      stat('Profit in month 1', money(c.month1Profit, 0), c.month1Profit >= 0 ? 'good' : 'bad'),
      stat('Cash needed to start', money(c.need, 0))
    );
    box.appendChild(stats);
    const start = c.raised > 0 ? c.raised : c.need;
    box.appendChild(el('p', 'text-[13.5px] text-muted', `Cash in the bank each month if you start with ${money(start, 0)}${c.raised > 0 ? ' (the money you raised in Funding)' : ' (the cash you need)'}:`));
    const chartBox = el('div', 'w-full');
    const svg = svgEl('svg', { class: SVG, role: 'img' });
    chartBox.appendChild(svg);
    box.appendChild(chartBox);
    drawCash(svg, chartBox, c.run);
    const v = el('div', VERDICT);
    const firstProfit = c.firstProfit;
    setTone(v, c.cm <= 0 || !firstProfit ? 'bad' : c.run.runOut !== null ? 'warn' : 'good');
    v.textContent =
      c.cm <= 0
        ? 'Each sale costs you money. Raise the price or lower the cost per item.'
        : !firstProfit
          ? 'At these numbers the business never makes a monthly profit in two years.'
          : `You make a profit starting in month ${firstProfit}. You need about ${money(c.need, 0)} to open and get there.${c.run.runOut !== null && c.raised > 0 ? ` With ${money(c.raised, 0)} raised, you run out of cash in month ${c.run.runOut}.` : ''}`;
    box.appendChild(v);
  }

  function drawCash(svg, box, run) {
    const W = fitWidth(box, 280, 760);
    const H = 190, L = 58, R = 6, T = 10, B = 26;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const vals = run.months.map((m) => m.cash);
    const hi = Math.max(0, ...vals), lo = Math.min(0, ...vals);
    const span = hi - lo || 1;
    const y = (v) => T + ((hi - v) / span) * (H - T - B);
    const band = (W - L - R) / run.months.length;
    [hi, 0, lo].filter((v, i, a) => a.indexOf(v) === i).forEach((v) => {
      add('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), style: `stroke:var(${v === 0 ? '--muted' : '--grid'})` });
      add('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, money(v, 0));
    });
    run.months.forEach(({ month, cash }) => {
      const y1 = y(Math.max(cash, 0)), y2 = y(Math.min(cash, 0));
      add('rect', { x: L + band * month + band * 0.15, width: band * 0.7, y: y1, height: Math.max(y2 - y1, 1), rx: 1.5, style: `fill:var(${cash >= 0 ? '--good' : '--bad'})` });
      if (month % 6 === 0) add('text', { x: month === run.months.length - 1 ? W - R : month === 0 ? L : L + band * (month + 0.5), y: H - 8, 'text-anchor': month === run.months.length - 1 ? 'end' : month === 0 ? 'start' : 'middle' }, month === 0 ? 'Open' : `Mo ${month}`);
    });
    svg.setAttribute('aria-label', `Cash over 24 months, from ${money(vals[0], 0)} on opening day to ${money(vals[vals.length - 1], 0)} in month 24.`);
  }

  function renderFundingCalc(c) {
    const box = r('funding-calc');
    if (!box) return;
    box.replaceChildren();
    box.appendChild(el('h3', H3, 'Do you have enough?'));
    if (!c.hasMoney) {
      box.appendChild(el('p', 'text-[14px] text-muted', 'Finish The money first, so the builder can figure out how much cash you need.'));
      return;
    }
    const stats = el('div', RESULTS);
    stats.append(stat('Cash needed', money(c.need, 0), '', true), stat('Money raised', money(c.raised, 0), c.raised >= c.need ? 'good' : 'bad'), stat(c.raised >= c.need ? 'Extra cushion' : 'Still short', money(Math.abs(c.raised - c.need), 0), c.raised >= c.need ? 'good' : 'bad'));
    if (c.valuation) stats.append(stat('Investor values you at', money(c.valuation, 0)));
    box.appendChild(stats);
    box.appendChild(el('p', 'text-[13.5px] text-muted', `Cash needed = startup costs (${money(c.startupTotal, 0)}) + enough to cover your slowest months before you make a profit (${money(c.need - c.startupTotal, 0)}).`));
  }

  function renderSummaryCheck(c) {
    const box = r('summary-check');
    if (!box) return;
    box.replaceChildren();
    box.appendChild(el('h3', H3, 'Make sure your summary mentions'));
    const text = plan.summary.toLowerCase();
    const items = [
      ['Your business name', plan.name.trim(), plan.name.trim() && text.includes(plan.name.trim().toLowerCase())],
      ['What you sell', '', null],
      ['The problem you solve', '', null],
      ['Your customer', '', null],
      ['What makes you different', '', null],
      ['Your price', c.price > 0 ? money(c.price, 2) : '', c.price > 0 && text.includes(String(c.price))],
      ['Your break-even point', c.hasMoney && Number.isFinite(c.beUnits) ? `${num(c.beUnits)} a month` : '', c.hasMoney && Number.isFinite(c.beUnits) && text.includes(String(c.beUnits))],
      ['The cash you need', c.hasMoney ? money(c.need, 0) : '', c.hasMoney && text.replace(/,/g, '').includes(String(Math.round(c.need)))],
    ];
    const ul = el('ul', 'list-none m-0 p-0 grid gap-1 text-[14px]');
    items.forEach(([label, value, found]) => {
      const li = el('li', 'flex gap-2 items-baseline');
      li.append(el('span', found ? 'text-good font-bold' : 'text-muted', found ? '✓' : '○'), el('span', '', value ? `${label}: ` : label));
      if (value) li.append(el('b', 'font-mono font-medium', value));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    box.appendChild(el('p', HINT, 'A check means the builder found that number or name in your summary. It can\'t check the ideas, so reread those yourself.'));
  }

  // ---------- finished plan ----------
  function planHtml() {
    const c = calc(plan);
    const blank = '<em class="text-muted">(not written yet)</em>';
    const para = (v) => (String(v).trim() ? esc(v).replace(/\n+/g, '<br>') : blank);
    const H = (t) => `<h2 class="font-display font-semibold text-[19px] mt-5 mb-1 border-b border-line pb-1">${t}</h2>`;
    const Q = (label, v) => `<p class="mb-2"><b>${label}</b><br>${para(v)}</p>`;
    const T = 'w-full border-collapse text-[14px] my-2 [&_th]:text-left [&_th]:font-semibold [&_th]:py-1 [&_th]:px-2 [&_td]:py-1 [&_td]:px-2 [&_th]:border [&_td]:border [&_th]:border-line [&_td]:border-line [&_th]:bg-bg';
    const costTable = (rows, total, label) =>
      rows.length
        ? `<table class="${T}"><thead><tr><th>${label}</th><th class="text-right!">Amount</th></tr></thead><tbody>${rows.map(([l, a]) => `<tr><td>${esc(l)}</td><td class="text-right font-mono">${money(a, 0)}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="text-right font-mono"><b>${money(total, 0)}</b></td></tr></tbody></table>`
        : `<p>${blank}</p>`;
    const comps = plan.competitors.filter((x) => x.name.trim());
    const out = [];
    out.push(`<h1 class="font-display font-extrabold text-[30px] leading-tight">${plan.name.trim() ? esc(plan.name) : 'My business'}</h1>`);
    out.push(`<p class="text-muted mb-2">Business plan${plan.oneLiner.trim() ? ` · ${esc(plan.oneLiner)}` : ''}</p>`);
    out.push(H('Executive summary') + `<p class="mb-2">${para(plan.summary)}</p>`);
    out.push(H('The idea') + Q('The problem', plan.problem) + Q('Our customer', plan.customer) + Q('Why us', plan.why));
    out.push(
      H('The market') +
        Q('Target customer', plan.target) +
        `<p class="mb-2"><b>Market size</b><br>${c.potential > 0 ? `${num(n(plan.marketPeople))} target customers × ${num(n(plan.marketPct), 1)}% who buy × ${num(n(plan.marketFreq))} purchases a year = about ${num(Math.round(c.potential))} sales a year.` : blank}</p>` +
        `<p class="mb-1"><b>Competitors</b></p>` +
        (comps.length ? `<table class="${T}"><thead><tr><th>Competitor</th><th>What they do well</th><th>Where they fall short</th></tr></thead><tbody>${comps.map((x) => `<tr><td>${esc(x.name)}</td><td>${esc(x.strong)}</td><td>${esc(x.weak)}</td></tr>`).join('')}</tbody></table>` : `<p>${blank}</p>`) +
        Q('What makes us different', plan.edge)
    );
    out.push(H('Marketing') + Q('Product', plan.product) + Q(`Price${c.price > 0 ? `: ${money(c.price, 2)}` : ''}`, plan.priceWhy) + Q('Place', plan.place) + Q('Promotion', plan.promotion));
    out.push(H('Operations') + Q('Location', plan.location) + Q('Suppliers', plan.suppliers) + Q('Team', plan.team) + Q('Hours', plan.hours));
    const keyRows = c.hasMoney
      ? [
          ['Price per item', money(c.price, 2)],
          ['Cost to make one item', money(c.unitCost, 2)],
          ['Profit on each item', money(c.cm, 2)],
          ['Monthly fixed costs', money(c.fixedTotal, 0)],
          ['Break-even point', Number.isFinite(c.beUnits) ? `${num(c.beUnits)} items a month` : 'Never (price is not above cost)'],
          ['Sales forecast, month 1', `${num(c.units)} items, growing ${num(c.growth)}% a month`],
          ['First month with a profit', c.firstProfit ? `Month ${c.firstProfit}` : 'Not within two years'],
          ['Cash needed to start', money(c.need, 0)],
        ]
      : [];
    out.push(
      H('Financial plan') +
        (keyRows.length ? `<table class="${T}"><tbody>${keyRows.map(([k, v]) => `<tr><th class="w-1/2">${k}</th><td class="font-mono">${v}</td></tr>`).join('')}</tbody></table>` : `<p>${blank}</p>`) +
        `<p class="mt-3 mb-1"><b>Startup costs</b></p>` +
        costTable(c.startup, c.startupTotal, 'Startup cost') +
        `<p class="mt-3 mb-1"><b>Monthly fixed costs</b></p>` +
        costTable(c.fixed, c.fixedTotal, 'Monthly cost')
    );
    const sources = [['Our savings', n(plan.savings)], ['Family', n(plan.family)], ['Loan', n(plan.loan)], [`Investor${c.investorPct > 0 ? ` (for ${num(c.investorPct, 1)}% of the business)` : ''}`, c.investor]].filter((x) => x[1] > 0);
    out.push(
      H('Funding') +
        (sources.length ? costTable(sources, c.raised, 'Source') : `<p>${blank}</p>`) +
        (c.hasMoney ? `<p class="mb-2">We need about <b>${money(c.need, 0)}</b> and have raised <b>${money(c.raised, 0)}</b>${c.raised >= c.need ? '.' : `, leaving us <b>${money(c.need - c.raised, 0)} short</b>.`}</p>` : '') +
        Q('Paying people back', plan.fundingPlan)
    );
    return out.join('\n');
  }

  function planText() {
    const tmp = el('div');
    tmp.innerHTML = planHtml().replace(/<\/(h1|h2|p|tr)>/g, '</$1>\n').replace(/<br>/g, '\n').replace(/<\/t[dh]>/g, ' | ');
    return tmp.textContent.replace(/ \| \n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function renderPlan() {
    r('plan').innerHTML = planHtml();
    const prog = progress(plan);
    const missing = SECTIONS.filter((s) => prog[s.id].done < prog[s.id].total).map((s) => s.title);
    const v = r('plan-status');
    setTone(v, missing.length ? 'warn' : 'good');
    v.textContent = missing.length ? `Still to finish: ${missing.join(', ')}. Gaps show as "(not written yet)" in your plan.` : 'Every section is filled in. Check the problems list, then print or copy your plan to turn it in.';
  }

  $('[data-act="print"]').addEventListener('click', () => window.print());
  $('[data-act="copy"]').addEventListener('click', async () => {
    const status = r('copy-status');
    const html = `<div>${planHtml()}</div>`;
    try {
      if (window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([planText()], { type: 'text/plain' }) })]);
      } else {
        await navigator.clipboard.writeText(planText());
      }
      status.textContent = 'Copied. Paste it into a Google Doc, and the headings and tables come with it.';
      setTone(status, 'good');
    } catch {
      status.textContent = 'Your browser blocked copying. Select the plan below and copy it with Ctrl+C (⌘C on a Mac).';
      setTone(status, 'bad');
    }
  });

  onWidthChange(root, () => {
    if (view === 'money') refresh();
  });
  render();
}
