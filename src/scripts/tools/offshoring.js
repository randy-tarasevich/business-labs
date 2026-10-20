// Offshoring Decision Lab
// Labor per unit = Wage per hour × Hours per unit
// Factory cost = (Labor + Materials), and overseas costs grow when the factory country's money gets stronger
// Tariff = Factory cost × Tariff rate (overseas only)
// Landed cost = Factory cost + Shipping + Tariff
// Cost per good unit = Landed cost ÷ (1 − Defect rate), because bad units have to be made again

import { money, num, svgEl, linkRange, presetButtons, wireReveals, fitWidth, onWidthChange, setTone } from '../lib/util.js';

export const SITES = ['Make at home', 'Make overseas'];

const PRESETS = [
  {
    name: 'T-shirts',
    tariff: 15, currency: 0, units: 100000,
    sites: [
      { wage: 18, hours: 0.5, mat: 3, ship: 0.3, defect: 2 },
      { wage: 2.5, hours: 0.8, mat: 2.5, ship: 0.6, defect: 5 },
    ],
  },
  {
    name: 'Furniture',
    tariff: 25, currency: 0, units: 5000,
    sites: [
      { wage: 24, hours: 3, mat: 80, ship: 15, defect: 2 },
      { wage: 5, hours: 4, mat: 70, ship: 60, defect: 6 },
    ],
  },
  {
    name: 'Headphones',
    tariff: 25, currency: 10, units: 50000,
    sites: [
      { wage: 30, hours: 0.4, mat: 40, ship: 1, defect: 1 },
      { wage: 6, hours: 1.2, mat: 36, ship: 2, defect: 3 },
    ],
  },
];
const WORLD_KEYS = ['tariff', 'currency', 'units'];
const SITE_KEYS = ['wage', 'hours', 'mat', 'ship', 'defect'];

const copy = (p) => ({ ...p, sites: p.sites.map((s) => ({ ...s })) });

/** Cost breakdown for one site. overseas: apply the currency change and the tariff. */
export function unitCost(site, w, overseas) {
  const fx = overseas ? 1 + w.currency / 100 : 1;
  const labor = site.wage * site.hours * fx;
  const mat = site.mat * fx;
  const factory = labor + mat;
  const tariff = overseas ? factory * (w.tariff / 100) : 0;
  const landed = factory + site.ship + tariff;
  const keep = 1 - Math.min(site.defect, 99) / 100;
  const good = landed / keep;
  return { labor, mat, factory, ship: site.ship, tariff, landed, defects: good - landed, good };
}

/** Tariff rate (%) at which the overseas cost per good unit equals the home cost. */
export function breakEvenTariff(s) {
  const home = unitCost(s.sites[0], s, false).good;
  const o = unitCost(s.sites[1], { ...s, tariff: 0 }, true);
  const keep = 1 - Math.min(s.sites[1].defect, 99) / 100;
  return o.factory > 0 ? ((home * keep - o.factory - o.ship) / o.factory) * 100 : NaN;
}

const PARTS = [
  ['labor', 'Labor', 'fill:var(--accent)'],
  ['mat', 'Materials', 'fill:var(--accent);opacity:0.5'],
  ['ship', 'Shipping', 'fill:var(--muted)'],
  ['tariff', 'Tariff', 'fill:var(--warn)'],
  ['defects', 'Redoing bad units', 'fill:var(--bad)'],
];

export function initOffshoring(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const state = copy(PRESETS[0]);
  let sel = 1;

  const edited = (fn) => (v) => {
    fn(v);
    setActive(-1);
    render();
  };
  const worldSyncs = WORLD_KEYS.map((k) =>
    linkRange(root, `off-${k}`, {
      get: () => state[k],
      set: edited((v) => (state[k] = k === 'units' ? Math.round(v) : v)),
      allowNegative: k === 'currency',
      fit: k === 'units',
    })
  );
  const siteSyncs = SITE_KEYS.map((k) =>
    linkRange(root, `off-${k}`, {
      get: () => state.sites[sel][k],
      set: edited((v) => (state.sites[sel][k] = v)),
      max: k === 'defect' ? 99 : undefined,
    })
  );

  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(state, copy(p));
    worldSyncs.forEach((s) => s());
    siteSyncs.forEach((s) => s());
    render();
  });
  const setPick = presetButtons($('[data-pick]'), SITES.map((name) => ({ name })), (_, i) => {
    sel = i;
    siteSyncs.forEach((s) => s());
    render();
  });

  function render() {
    const home = unitCost(state.sites[0], state, false);
    const off = unitCost(state.sites[1], state, true);
    const save = home.good - off.good;
    const yearly = save * state.units;
    const be = breakEvenTariff(state);

    r('editing').textContent = SITES[sel];
    r('home').textContent = money(home.good, 2);
    r('off').textContent = money(off.good, 2);
    r('save').textContent = money(Math.abs(save), 2);
    r('year').textContent = money(Math.abs(yearly), 0);
    r('save-k').textContent = save >= 0 ? 'Overseas saves per unit' : 'Overseas costs extra per unit';
    r('year-k').textContent = save >= 0 ? 'Saved per year' : 'Extra cost per year';
    setTone(r('save-box'), save >= 0 ? 'good' : 'bad');
    setTone(r('year-box'), save >= 0 ? 'good' : 'bad');

    const v = r('verdict');
    const wageGap = state.sites[1].wage > 0 ? state.sites[0].wage / state.sites[1].wage : NaN;
    if (Math.abs(save) < 0.005) {
      setTone(v, 'info');
      v.textContent = 'It\'s a tie. The two factories cost the same per good unit.';
    } else if (save > 0) {
      setTone(v, 'good');
      v.textContent = `Making it overseas is cheaper by ${money(save, 2)} a unit, or ${money(yearly, 0)} a year.` +
        (Number.isFinite(be) && be > state.tariff ? ` A tariff of about ${Math.round(be)}% would wipe out the savings.` : '');
    } else {
      setTone(v, 'warn');
      v.textContent = `Making it at home is cheaper by ${money(-save, 2)} a unit, or ${money(-yearly, 0)} a year` +
        (Number.isFinite(wageGap) && wageGap > 1 ? `, even though overseas wages are ${num(wageGap, 1)} times lower.` : '.') +
        (Number.isFinite(be) && be >= 0 && be < state.tariff ? ` With a tariff under about ${Math.round(be)}%, overseas would win.` : '');
    }

    const c = sel === 0 ? home : off;
    const s = state.sites[sel];
    const ovs = sel === 1;
    const fxNote = ovs && state.currency ? ` × ${num(1 + state.currency / 100, 2)}` : '';
    r('formula').innerHTML =
      `${SITES[sel]}: labor = ${money(s.wage, 2)} × ${s.hours} hours${fxNote} = ${money(c.labor, 2)}` +
      `<span>Factory cost = ${money(c.labor, 2)} + ${money(c.mat, 2)} materials = ${money(c.factory, 2)}</span>` +
      (ovs ? `<span>Tariff = ${money(c.factory, 2)} × ${state.tariff}% = ${money(c.tariff, 2)}</span>` : '') +
      `<span>Landed cost = ${money(c.factory, 2)} + ${money(c.ship, 2)} shipping${ovs ? ` + ${money(c.tariff, 2)} tariff` : ''} = ${money(c.landed, 2)}</span>` +
      `<span>Cost per good unit = ${money(c.landed, 2)} ÷ (100% − ${s.defect}%) = ${money(c.good, 2)}</span>`;

    draw(home, off);
  }

  function draw(home, off) {
    const svg = $('[data-chart]');
    svg.replaceChildren();
    const W = fitWidth(svg.parentElement, 300, 760);
    const narrow = W < 520;
    const L = narrow ? 70 : 108;
    const span = W - L - 70;
    const barH = 40;
    const gap = 26;
    const H = 2 * barH + gap + 8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (t, a, x) => svg.appendChild(svgEl(t, a, x));
    const maxV = Math.max(home.good, off.good, 0.01);

    [home, off].forEach((c, i) => {
      const y = 4 + i * (barH + gap);
      add('text', { x: L - 8, y: y + barH / 2 + 5, 'text-anchor': 'end', style: 'fill:var(--ink);font-weight:600;font-size:13px;font-family:var(--font-sans)' }, i === 0 ? 'Home' : 'Overseas');
      let x = L;
      PARTS.forEach(([key, , style]) => {
        const w = (c[key] / maxV) * span;
        if (w <= 0) return;
        add('rect', { x, y, width: w, height: barH, style: `${style};stroke:var(--panel);stroke-width:1` });
        x += w;
      });
      add('text', { x: x + 6, y: y + barH / 2 + 5, style: 'fill:var(--ink);font-weight:600;font-size:13px' }, money(c.good, 2));
    });
    const desc = (name, c) => `${name}: ${PARTS.filter(([k]) => c[k] > 0).map(([k, label]) => `${label.toLowerCase()} ${money(c[k], 2)}`).join(', ')}, total ${money(c.good, 2)} per good unit.`;
    svg.setAttribute('aria-label', `${desc('Home', home)} ${desc('Overseas', off)}`);
  }

  onWidthChange($('[data-chart]').parentElement, () => render());
  wireReveals(root);
  setActive(0);
  setPick(1);
  worldSyncs.forEach((s) => s());
  siteSyncs.forEach((s) => s());
  render();
}
