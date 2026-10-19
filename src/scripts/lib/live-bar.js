// Phone results bar.
// On a phone the chart and results sit below every input, so a student drags a slider and sees
// nothing change. This bar pins a copy of the key results to the bottom of the screen while the
// inputs are on screen and the real results are not. Tap it to jump to the chart.
//
// Opt in per tool by adding data-live to one or two elements in the results area:
//   - a stat (STAT / STAT_KEY wrapper, or <Stat live />): shows its label and value, keeps its tone
//   - anything else (e.g. the VERDICT line): shows its text, keeps its tone
// The bar copies text only. The originals keep role="status", so screen readers hear each update once.

import { LIVE_BAR, LIVE_ITEMS, LIVE_STAT, LIVE_K, LIVE_V, LIVE_TEXT, LIVE_JUMP } from './ui.js';

const PHONE = '(max-width: 860px)'; // matches the max-[860px] breakpoint where tool layouts stack

export function initLiveBar(root) {
  const sources = [...root.querySelectorAll('[data-live]')];
  // The inputs panel is the first panel of the tool's first row.
  const inputs = root.firstElementChild?.firstElementChild;
  if (!sources.length || !inputs) return;

  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = LIVE_BAR;
  bar.hidden = true;
  bar.setAttribute('aria-label', 'Jump to the results');
  const items = document.createElement('span');
  items.className = LIVE_ITEMS;
  items.setAttribute('aria-hidden', 'true');
  const jump = document.createElement('span');
  jump.className = LIVE_JUMP;
  jump.setAttribute('aria-hidden', 'true');
  jump.textContent = 'See chart ↓';
  bar.append(items, jump);
  document.body.appendChild(bar);

  // One mirror per source.
  const mirrors = sources.map((src) => {
    const isStat = src.children.length >= 2;
    const box = document.createElement('span');
    let key, val;
    if (isStat) {
      box.className = LIVE_STAT;
      key = document.createElement('span');
      key.className = LIVE_K;
      val = document.createElement('span');
      val.className = LIVE_V;
      box.append(key, val);
    } else {
      box.className = LIVE_TEXT;
    }
    items.appendChild(box);
    return () => {
      const tone = src.dataset.tone || '';
      if (isStat) {
        key.textContent = src.firstElementChild.textContent.trim();
        val.textContent = src.lastElementChild.textContent.trim();
        tone ? (val.dataset.tone = tone) : delete val.dataset.tone;
      } else {
        box.textContent = src.textContent.trim();
        tone ? (box.dataset.tone = tone) : delete box.dataset.tone;
        box.hidden = !box.textContent;
      }
    };
  });
  const copy = () => mirrors.forEach((m) => m());
  const mo = new MutationObserver(copy);
  sources.forEach((s) => mo.observe(s, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-tone'] }));
  copy();

  // Show only on phones, while the inputs are on screen and none of the real results are.
  const phone = window.matchMedia(PHONE);
  const seen = new Map();
  const update = () => {
    const inputsOn = seen.get(inputs);
    const resultsOn = sources.some((s) => seen.get(s));
    bar.hidden = !(phone.matches && inputsOn && !resultsOn);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => seen.set(e.target, e.isIntersecting));
    update();
  });
  [inputs, ...sources].forEach((el) => io.observe(el));
  phone.addEventListener?.('change', update);

  bar.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Scroll to the panel that holds the results, so the chart above them shows too.
    const target = sources[0].closest('[class*="bg-panel"]') ?? sources[0];
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
}
