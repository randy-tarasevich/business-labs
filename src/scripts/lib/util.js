// Shared helpers for all tools.

/** Format dollars. Negative values get a real minus sign. */
export function money(n, decimals) {
  const d = decimals ?? (Math.abs(n) < 100 && n % 1 !== 0 ? 2 : 0);
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (n < 0 ? '−$' : '$') + abs;
}

/** Round a chart axis max up to a friendly number (1, 2, 2.5, 5, 10 × 10^n). */
export function niceMax(v) {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const s of [1, 2, 2.5, 5, 10]) if (s * p >= v) return s * p;
  return 10 * p;
}

/** Create an SVG element with attributes and optional text. */
export function svgEl(tag, attrs = {}, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Read a design token (CSS variable) from :root. */
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Re-run a callback when the theme changes (header toggle or device setting), so canvas/SVG colors
    read with cssVar() update. Colors written as var(--token) update on their own. */
export function onThemeChange(fn) {
  document.addEventListener('themechange', () => fn());
}

/** Short beep using Web Audio. Must be called after a user gesture at least once. */
let audioCtx;
export function beep(times = 1) {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t = audioCtx.currentTime + i * 0.35;
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.32);
    }
  } catch {
    /* audio blocked; the timer still works silently */
  }
}

/** Format a plain number with commas. */
export function num(n, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Size a slider to the value it's showing, so a $2 price doesn't sit in the first 2% of a $50 track.
 * The new max is a friendly number about `factor` times the value, never above the slider's
 * original max (from the markup). A value of 0 keeps the original max. Call it when a preset or
 * the starting example loads, never while the student is dragging.
 */
export function fitRange(range, v, factor = 4) {
  range.dataset.baseMax ??= range.max;
  const base = parseFloat(range.dataset.baseMax);
  const step = parseFloat(range.step) || 1;
  let max = v > 0 ? Math.min(base, Math.max(niceMax(v * factor), step * 10)) : base;
  if (v > max) max = Math.ceil(v * 1.5);
  range.max = max;
}

/**
 * Link a range slider (#id) and its number box (#id-n) to one value.
 * set(v) runs on every edit. Returns sync(), which pushes the current value back into both inputs
 * and fits the slider to it (see fitRange). Call sync() when a preset loads. Pass fit: false for a
 * slider whose max the tool sets itself.
 */
export function linkRange(root, id, { get, set, max, allowNegative = false, fit = true }) {
  const range = root.querySelector(`#${id}`);
  const box = root.querySelector(`#${id}-n`);
  tidyOnBlur(box);
  range.addEventListener('input', () => {
    const v = parseFloat(range.value) || 0;
    setBox(box, v);
    set(v);
  });
  box.addEventListener('input', () => {
    let v = parseFloat(box.value);
    if (Number.isNaN(v) || (!allowNegative && v < 0)) return;
    if (max != null) v = Math.min(v, max);
    if (v > parseFloat(range.max)) range.max = Math.ceil(v * 1.5);
    if (v < parseFloat(range.min)) range.min = Math.floor(v * 1.5);
    range.value = v;
    set(v);
  });
  return () => {
    const v = get();
    if (fit) fitRange(range, v);
    if (v > parseFloat(range.max)) range.max = Math.ceil(v * 1.5);
    if (v < parseFloat(range.min)) range.min = Math.floor(v * 1.5);
    range.value = v;
    setBox(box, v);
  };
}

/**
 * Write a value into a number box. Boxes marked data-money (RangeField does this for $ fields
 * with cents) always show two decimals, so "0.5" reads as "0.50" like the results do.
 */
export function setBox(box, v) {
  box.value = box.dataset.money !== undefined && Number.isFinite(v) ? v.toFixed(2) : v;
}

/** Reformat a number box when the student leaves it, without fighting them while they type. */
export function tidyOnBlur(box) {
  box.addEventListener('change', () => {
    const v = parseFloat(box.value);
    if (!Number.isNaN(v)) setBox(box, v);
  });
}

/** Fill a [data-presets] group with buttons. Returns setActive(i); pass -1 to clear. */
export function presetButtons(wrap, presets, onPick) {
  const setActive = (i) => [...wrap.children].forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
  presets.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.name;
    b.addEventListener('click', () => {
      setActive(i);
      onPick(p, i);
    });
    wrap.appendChild(b);
  });
  return setActive;
}

/** Hint buttons: each toggles the answer element right after it. Defaults to buttons marked data-reveal. */
export function wireReveals(root, selector = '[data-reveal]') {
  root.querySelectorAll(selector).forEach((b) => {
    b.addEventListener('click', () => {
      const ans = b.nextElementSibling;
      ans.hidden = !ans.hidden;
      b.textContent = ans.hidden ? 'Hint' : 'Hide';
    });
  });
}

/** Set an element's state color. Markup styles it with tone-good:, tone-bad:, tone-warn:, tone-info: variants. Pass '' to clear. */
export function setTone(el, tone) {
  if (tone) el.dataset.tone = tone;
  else delete el.dataset.tone;
}

/** On-screen width of an element, clamped, so charts can draw at real size and stay readable on phones. */
export function fitWidth(el, min = 300, max = 760) {
  return Math.round(Math.min(Math.max(el.clientWidth || max, min), max));
}

/** Call fn when an element's width changes (not on every height change). */
export function onWidthChange(el, fn) {
  let last = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w && w !== last) {
      last = w;
      fn(w);
    }
  }).observe(el);
}
