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

/** Re-run a callback when the OS switches light/dark, so canvas/SVG colors update. */
export function onThemeChange(fn) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', fn);
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
