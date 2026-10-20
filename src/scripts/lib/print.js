// Print (worksheet) support for tool pages.
// Adds blank answer lines under every "Try it" question. They only show on paper (hidden print:block),
// so the screen never changes. Sliders, buttons, and hints are hidden for print in global.css.

import { QS } from './ui.js';

const LINE = 'hidden print:block h-7 border-b border-muted';

export function initPrint(root) {
  root.querySelectorAll('ol').forEach((ol) => {
    if (ol.className !== QS) return;
    ol.querySelectorAll(':scope > li').forEach((li) => {
      for (let i = 0; i < 2; i++) {
        const line = document.createElement('span');
        line.className = LINE;
        line.setAttribute('aria-hidden', 'true');
        li.append(line);
      }
    });
  });
}
