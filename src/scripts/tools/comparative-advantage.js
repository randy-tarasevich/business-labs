// Comparative Advantage Sim
// Each country can make Max of good 1, Max of good 2, or any mix on the straight line between.
// Opportunity cost of 1 unit of good 1 = Max good 2 ÷ Max good 1.
// The country with the lower opportunity cost has the comparative advantage in good 1.

import { num, svgEl, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

export const PRESETS = [
  {
    name: 'Two islands', goods: ['fish', 'coconuts'],
    c: [{ name: 'Palm Island', max: [10, 40], base: 50 }, { name: 'Reef Island', max: [20, 20], base: 50 }],
  },
  {
    name: 'Portugal and England (Ricardo)', goods: ['wine', 'cloth'],
    c: [{ name: 'Portugal', max: [90, 80], base: 60 }, { name: 'England', max: [60, 72], base: 50 }],
  },
  {
    name: 'Same costs, no gain', goods: ['corn', 'tractors'],
    c: [{ name: 'Northland', max: [100, 50], base: 50 }, { name: 'Southland', max: [60, 30], base: 50 }],
  },
];

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const fmt = (n) => num(n, Math.abs(n - Math.round(n)) < 0.05 ? 0 : 1);

/** Production at a share of workers on good 1. */
export function produce(max, share) {
  return [max[0] * (share / 100), max[1] * (1 - share / 100)];
}
export function oppCost(max) {
  return max[0] > 0 ? max[1] / max[0] : Infinity;
}

export function initComparativeAdvantage(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  let P;
  // share: % of workers on good 1 now. base: the before-trade split. Trade: A sends `send` of good `sendGood`, gets `get` of the other.
  let st;

  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => load(p));

  function load(p) {
    P = structuredClone(p);
    st = { share: P.c.map((c) => c.base), base: P.c.map((c) => c.base), sendGood: 0, send: 0, get: 0 };
    buildInputs();
    render();
  }

  function buildInputs() {
    const [g1, g2] = P.goods;
    P.c.forEach((c, i) => {
      r(`name-${i}`).textContent = c.name;
      r(`name-${i}b`).textContent = c.name;
      r(`max-${i}`).innerHTML = `<label>Max ${g1} <input type="number" min="0" step="1" inputmode="numeric" value="${c.max[0]}" data-max="${i}-0" /></label><label>or max ${g2} <input type="number" min="0" step="1" inputmode="numeric" value="${c.max[1]}" data-max="${i}-1" /></label>`;
      const sl = $(`#ca-share-${i}`);
      sl.value = st.share[i];
      sl.setAttribute('aria-label', `${c.name}: percent of workers making ${g1}`);
      r(`sl-${i}`).textContent = `Workers making ${g1}`;
    });
    const sel = $('[data-send-good]');
    sel.innerHTML = `<option value="0">${g1}</option><option value="1">${g2}</option>`;
    sel.value = String(st.sendGood);
    syncTrade();
  }

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.max) {
      const [i, g] = t.dataset.max.split('-').map(Number);
      const v = parseFloat(t.value);
      if (Number.isNaN(v) || v < 0) return;
      P.c[i].max[g] = v;
      setActive(-1);
      render();
    } else if (t.id?.startsWith('ca-share-')) {
      st.share[+t.id.slice(-1)] = parseFloat(t.value);
      render();
    } else if (t.dataset.trade) {
      const v = parseFloat(t.value);
      if (Number.isNaN(v) || v < 0) return;
      st[t.dataset.trade] = v;
      syncTrade(t);
      render();
    }
  });
  $('[data-send-good]').addEventListener('change', (e) => {
    st.sendGood = Number(e.target.value);
    render();
  });

  function syncTrade(skip) {
    root.querySelectorAll('[data-trade]').forEach((el) => {
      if (el !== skip) el.value = st[el.dataset.trade];
    });
  }

  $('[data-specialize]').addEventListener('click', () => {
    const [oa, ob] = P.c.map((c) => oppCost(c.max));
    if (oa === ob) {
      setTone(r('verdict'), 'warn');
      r('verdict').textContent = 'Both countries give up the same amount to make each good, so neither has a comparative advantage. There is nothing to specialize in.';
      return;
    }
    st.share = oa < ob ? [100, 0] : [0, 100];
    P.c.forEach((c, i) => ($(`#ca-share-${i}`).value = st.share[i]));
    render();
  });
  $('[data-save-base]').addEventListener('click', () => {
    st.base = [...st.share];
    st.send = 0;
    st.get = 0;
    syncTrade();
    render();
  });
  $('[data-reset]').addEventListener('click', () => {
    st.share = [...st.base];
    st.send = 0;
    st.get = 0;
    P.c.forEach((c, i) => ($(`#ca-share-${i}`).value = st.share[i]));
    syncTrade();
    render();
  });

  function render() {
    const [g1, g2] = P.goods;
    const prod = P.c.map((c, i) => produce(c.max, st.share[i]));
    const base = P.c.map((c, i) => produce(c.max, st.base[i]));
    // Country A (index 0) sends `send` of sendGood and gets `get` of the other good from B.
    const sg = st.sendGood, og = 1 - sg;
    const cons = [[...prod[0]], [...prod[1]]];
    cons[0][sg] -= st.send;
    cons[0][og] += st.get;
    cons[1][sg] += st.send;
    cons[1][og] -= st.get;

    const oc = P.c.map((c) => oppCost(c.max));
    P.c.forEach((c, i) => {
      r(`split-${i}`).textContent = `${Math.round(st.share[i])}% of workers make ${g1}: ${fmt(prod[i][0])} ${g1}, ${fmt(prod[i][1])} ${g2}`;
    });

    // Who has which advantage
    const abs1 = P.c[0].max[0] === P.c[1].max[0] ? null : P.c[0].max[0] > P.c[1].max[0] ? 0 : 1;
    const abs2 = P.c[0].max[1] === P.c[1].max[1] ? null : P.c[0].max[1] > P.c[1].max[1] ? 0 : 1;
    const ca1 = oc[0] === oc[1] ? null : oc[0] < oc[1] ? 0 : 1;
    const nm = (i) => P.c[i].name;
    r('adv').innerHTML =
      `<tr><th scope="row">Opportunity cost of 1 ${g1.replace(/s$/, '')}</th><td>${oc[0].toFixed(2)} ${g2}</td><td>${oc[1].toFixed(2)} ${g2}</td></tr>` +
      `<tr><th scope="row">Opportunity cost of 1 ${g2.replace(/s$/, '')}</th><td>${(1 / oc[0]).toFixed(2)} ${g1}</td><td>${(1 / oc[1]).toFixed(2)} ${g1}</td></tr>` +
      `<tr><th scope="row">Absolute advantage</th><td colspan="2">${abs1 === null && abs2 === null ? 'Neither' : [abs1 !== null ? `${nm(abs1)} in ${g1}` : null, abs2 !== null ? `${nm(abs2)} in ${g2}` : null].filter(Boolean).join(', ')}</td></tr>` +
      `<tr><th scope="row" class="font-semibold! text-ink">Comparative advantage</th><td colspan="2" class="font-semibold! text-ink">${ca1 === null ? 'Neither: same opportunity costs' : `${nm(ca1)} in ${g1}, ${nm(1 - ca1)} in ${g2}`}</td></tr>`;

    // Results table: before vs after for each country
    const row = (i) => {
      const d = [cons[i][0] - base[i][0], cons[i][1] - base[i][1]];
      const cell = (v, dv) => `${fmt(v)} <span class="text-[12px] ml-1 ${dv > 0.05 ? 'text-good' : dv < -0.05 ? 'text-bad' : 'text-muted'}">${dv > 0.05 ? `+${fmt(dv)}` : dv < -0.05 ? `−${fmt(-dv)}` : '±0'}</span>`;
      return `<tr><th scope="row">${nm(i)}</th><td>${fmt(base[i][0])} / ${fmt(base[i][1])}</td><td>${cell(cons[i][0], d[0])}</td><td>${cell(cons[i][1], d[1])}</td></tr>`;
    };
    r('res-h').innerHTML = `<tr><th scope="col">Country</th><th scope="col">Before: ${g1} / ${g2}</th><th scope="col">Now: ${g1}</th><th scope="col">Now: ${g2}</th></tr>`;
    r('res').innerHTML = row(0) + row(1);
    const worldBefore = [base[0][0] + base[1][0], base[0][1] + base[1][1]];
    const worldNow = [prod[0][0] + prod[1][0], prod[0][1] + prod[1][1]];
    r('world').textContent = `World total made: ${fmt(worldNow[0])} ${g1} and ${fmt(worldNow[1])} ${g2} (before trade: ${fmt(worldBefore[0])} and ${fmt(worldBefore[1])}).`;

    r('trade-txt').textContent = `${nm(0)} sends ${nm(1)}`;
    r('trade-get').textContent = `${P.goods[og]} back`;
    r('price').textContent = st.send > 0 ? `Price: 1 ${P.goods[sg].replace(/s$/, '')} = ${(st.get / st.send).toFixed(2)} ${P.goods[og]}` : '';

    // Verdict
    const v = r('verdict');
    const neg = cons.some((c) => c.some((x) => x < -0.001));
    const gain = (i) => {
      const d0 = cons[i][0] - base[i][0], d1 = cons[i][1] - base[i][1];
      return d0 >= -0.001 && d1 >= -0.001 && (d0 > 0.05 || d1 > 0.05) ? 'win' : d0 <= 0.001 && d1 <= 0.001 && (d0 < -0.05 || d1 < -0.05) ? 'lose' : Math.abs(d0) < 0.05 && Math.abs(d1) < 0.05 ? 'same' : 'mixed';
    };
    const ga = gain(0), gb = gain(1);
    if (neg) {
      setTone(v, 'bad');
      v.textContent = "That trade isn't possible: a country can't send more than it has.";
    } else if (ga === 'win' && gb === 'win') {
      setTone(v, 'good');
      v.textContent = `Both countries win! Each one ends up with at least as much of both goods as before, and more of at least one. Specializing made the world produce more.`;
    } else if (ga === 'same' && gb === 'same') {
      setTone(v, 'info');
      v.textContent = 'Nothing has changed yet. Try "Specialize," then set up a trade.';
    } else {
      const say = { win: 'is better off', lose: 'is worse off', same: 'is no better off', mixed: 'gained one good but lost some of the other' };
      setTone(v, 'warn');
      v.textContent = `${nm(0)} ${say[ga]}, and ${nm(1)} ${say[gb]}. Adjust the trade so neither country gives up anything.`;
    }

    draw(prod, base, cons);
  }

  function draw(prod, base, cons) {
    const box = $('[data-chart-box]');
    const W = fitWidth(box, 300, 760);
    const two = W >= 560;
    const panelW = two ? (W - 16) / 2 : W;
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const ph = Math.min(panelW * 0.82, 280);
    const H = two ? ph : ph * 2 + 16;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const top = Math.max(...P.c.flatMap((c) => c.max), ...cons.flat(), 1) * 1.08;
    const [g1, g2] = P.goods;
    P.c.forEach((c, i) => {
      const ox = two ? i * (panelW + 16) : 0;
      const oy = two ? 0 : i * (ph + 16);
      const L = ox + 40, R = ox + panelW - 8, T = oy + 42, B = oy + ph - 40;
      const x = (v) => L + (v / top) * (R - L);
      const y = (v) => B - (v / top) * (B - T);
      add('text', { x: ox, y: oy + 14, style: 'fill:var(--ink);font-weight:600;font-size:13px;font-family:var(--font-sans)' }, c.name);
      add('line', { x1: L, x2: R, y1: B, y2: B, style: 'stroke:var(--muted)' });
      add('line', { x1: L, x2: L, y1: T, y2: B, style: 'stroke:var(--muted)' });
      add('text', { x: R, y: B + 34, 'text-anchor': 'end' }, `${cap(g1)} →`);
      add('text', { x: L - 6, y: T - 10, 'text-anchor': 'start' }, `↑ ${cap(g2)}`);
      add('polygon', { points: `${x(0)},${y(0)} ${x(c.max[0])},${y(0)} ${x(0)},${y(c.max[1])}`, style: 'fill:var(--grid)' });
      add('line', { x1: x(c.max[0]), y1: y(0), x2: x(0), y2: y(c.max[1]), style: 'stroke:var(--accent)', 'stroke-width': 2.5 });
      add('text', { x: x(c.max[0]), y: B + 16, 'text-anchor': 'middle', style: 'fill:var(--ink)' }, fmt(c.max[0]));
      add('text', { x: L - 6, y: y(c.max[1]) + 4, 'text-anchor': 'end', style: 'fill:var(--ink)' }, fmt(c.max[1]));
      // before-trade point
      add('circle', { cx: x(base[i][0]), cy: y(base[i][1]), r: 6, style: 'fill:none;stroke:var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '3 2' });
      // production
      add('circle', { cx: x(prod[i][0]), cy: y(prod[i][1]), r: 6, style: 'fill:var(--accent);stroke:var(--panel)', 'stroke-width': 2 });
      // consumption after trade
      const moved = Math.abs(cons[i][0] - prod[i][0]) + Math.abs(cons[i][1] - prod[i][1]) > 0.01;
      if (moved) {
        add('line', { x1: x(prod[i][0]), y1: y(prod[i][1]), x2: x(Math.max(cons[i][0], 0)), y2: y(Math.max(cons[i][1], 0)), style: 'stroke:var(--good)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' });
        const cx = x(Math.max(cons[i][0], 0)), cy = y(Math.max(cons[i][1], 0));
        add('polygon', { points: star(cx, cy, 9, 4), style: 'fill:var(--good);stroke:var(--panel)', 'stroke-width': 1.5 });
      }
    });
    svg.setAttribute('aria-label', P.c.map((c, i) => `${c.name} makes ${fmt(prod[i][0])} ${g1} and ${fmt(prod[i][1])} ${g2}, and after trade has ${fmt(cons[i][0])} ${g1} and ${fmt(cons[i][1])} ${g2}`).join('. '));
  }

  function star(cx, cy, ro, ri) {
    return Array.from({ length: 10 }, (_, k) => {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? ri : ro;
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
    }).join(' ');
  }

  onWidthChange($('[data-chart-box]'), () => render());
  wireReveals(root);
  setActive(0);
  load(PRESETS[0]);
}
