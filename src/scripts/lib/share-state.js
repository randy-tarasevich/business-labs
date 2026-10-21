// Share links: a tool's current numbers live in the page URL, so a link opens the tool exactly as
// the teacher (or student) left it. Post a scenario in Google Classroom and everyone starts from the
// same numbers; a student can turn in a link as evidence of their answer. Nothing is sent anywhere:
// the state is only in the address bar.
//
// What gets saved, with no per-tool code:
//   - number boxes, checkboxes, selects, and radio groups inside the tool
//     (a RangeField's slider is skipped; its number box "#id-n" is saved under "id")
//   - the last button clicked in each [data-presets] and [data-tabs] group. Presets also set things
//     that aren't inputs (product names, units, hidden costs), and editing a number clears the
//     preset highlight, so the helper remembers the last pick rather than reading aria-pressed.
// Inputs with an id are saved by id; inputs without one by their position. Anything inside
// [data-no-share] is skipped. Tools whose state isn't plain inputs (timer, Business Plan Builder,
// Budget Balancer, Accounting Equation quiz) don't load this; see SKIP_SHARE on the tool page.
//
// Loading: presets and tabs are clicked first (they can rebuild inputs), then each saved field that
// differs from what's showing is set and gets the same input/change events a student would fire.
// Saving: after the student changes something, the URL is rewritten in place (no new history
// entries). If everything is back to how the page loaded, the URL is cleared.

const RESERVED = new Set(['embed', 'theme']);
const GROUPS = '[data-presets], [data-tabs]';

function fields(root) {
  const all = [...root.querySelectorAll('input, select')].filter((el) => !el.closest('[data-no-share]'));
  const out = [];
  const radios = new Set();
  let unnamed = 0;
  for (const el of all) {
    const type = el.type;
    if (type === 'radio') {
      if (!el.name || radios.has(el.name)) continue;
      radios.add(el.name);
      out.push({ key: el.name, kind: 'radio', els: all.filter((r) => r.type === 'radio' && r.name === el.name) });
      continue;
    }
    if (type === 'range') {
      // Paired with a number box: the box is the one saved.
      if (el.id && root.querySelector(`#${CSS.escape(el.id)}-n`)) continue;
    } else if (!['number', 'checkbox', 'select-one'].includes(type)) {
      continue;
    }
    let key = el.id ? el.id.replace(/-n$/, '') : `f${unnamed++}`;
    if (RESERVED.has(key)) key = `_${key}`;
    out.push({ key, kind: type === 'checkbox' ? 'check' : 'value', el });
  }
  return out;
}

function read(f) {
  if (f.kind === 'radio') return f.els.find((r) => r.checked)?.value ?? null;
  if (f.kind === 'check') return f.el.checked ? '1' : '0';
  const v = f.el.value;
  if (f.el.tagName === 'SELECT') return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : null;
}

function fire(el, events) {
  events.forEach((type) => el.dispatchEvent(new Event(type, { bubbles: true })));
}

function write(f, v) {
  if (read(f) === v) return;
  if (f.kind === 'radio') {
    const r = f.els.find((x) => x.value === v);
    if (!r) return;
    r.checked = true;
    fire(r, ['input', 'change']);
  } else if (f.kind === 'check') {
    f.el.checked = v === '1';
    fire(f.el, ['input', 'change']);
  } else if (f.el.tagName === 'SELECT') {
    if (![...f.el.options].some((o) => o.value === v)) return;
    f.el.value = v;
    fire(f.el, ['input', 'change']);
  } else {
    if (!Number.isFinite(parseFloat(v))) return;
    f.el.value = v;
    fire(f.el, ['input', 'change']);
  }
}

const pressedIndex = (g) => [...g.children].findIndex((b) => b.getAttribute('aria-pressed') === 'true');

function snapshot(root, picks) {
  const p = new URLSearchParams();
  picks.forEach((i, n) => {
    if (i >= 0) p.set(`g${n}`, String(i));
  });
  for (const f of fields(root)) {
    const v = read(f);
    if (v !== null) p.set(f.key, v);
  }
  return p;
}

/** The current page URL with this tool's state in it and any extra params (e.g. embed) kept or removed. */
export function stateUrl(extra = {}) {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(extra)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  return url.toString();
}

export function initShareState(root, { onChange } = {}) {
  const saved = new URLSearchParams(location.search);
  const groups = [...root.querySelectorAll(GROUPS)];
  // Last pick per group. A group with nothing pressed at load (no default) stays -1 until clicked.
  const picks = groups.map(pressedIndex);

  // 1. Restore presets/tabs, then fields.
  if ([...saved.keys()].some((k) => !RESERVED.has(k))) {
    groups.forEach((g, n) => {
      const i = parseInt(saved.get(`g${n}`), 10);
      const b = g.children[i];
      if (!b) return;
      if (b.getAttribute('aria-pressed') !== 'true') b.click();
      picks[n] = i;
    });
    for (const f of fields(root)) {
      if (saved.has(f.key)) write(f, saved.get(f.key));
    }
  }

  // 2. Keep the URL in step with what the student does.
  groups.forEach((g, n) => {
    g.addEventListener('click', (e) => {
      const i = [...g.children].findIndex((b) => b.contains(e.target));
      if (i >= 0) picks[n] = i;
    });
  });
  const initial = snapshot(root, picks).toString();
  let timer;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const now = snapshot(root, picks);
      const url = new URL(location.href);
      for (const k of [...url.searchParams.keys()]) if (!RESERVED.has(k)) url.searchParams.delete(k);
      if (now.toString() !== initial || [...saved.keys()].some((k) => !RESERVED.has(k))) {
        now.forEach((v, k) => url.searchParams.set(k, v));
      }
      history.replaceState(history.state, '', url);
      onChange?.();
    }, 250);
  };
  root.addEventListener('input', save);
  root.addEventListener('change', save);
  root.addEventListener('click', (e) => {
    if (e.target.closest('button')) save();
  });
}
