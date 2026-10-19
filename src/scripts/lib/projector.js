// Projector view (?embed=1): the explanation panel ("The math" and similar) and the "Try it"
// questions start collapsed behind a button, so the teacher decides when the class sees them.
// Outside projector view, nothing changes.
//
// What collapses: both panels in a tool's LOWER section, plus any panel marked
// data-projector-collapse (TryIt adds it, so a Try it panel collapses wherever it sits).

import { LOWER, PROJ_TOGGLE, PROJ_WRAP } from './ui.js';

export function initProjector(root) {
  if (!document.documentElement.classList.contains('embed')) return;

  const lower = [...root.children].filter((el) => el.className === LOWER).flatMap((s) => [...s.children]);
  const marked = [...root.querySelectorAll('[data-projector-collapse]')];
  const panels = [...new Set([...lower, ...marked])];

  panels.forEach((panel, i) => {
    const name = panel.querySelector('h2')?.textContent.trim() || 'this section';
    panel.id ||= `proj-panel-${i}`;

    const wrap = document.createElement('div');
    wrap.className = PROJ_WRAP;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = PROJ_TOGGLE;
    btn.setAttribute('aria-controls', panel.id);

    const set = (open) => {
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = `${open ? 'Hide' : 'Show'}: ${name}`;
    };
    btn.addEventListener('click', () => set(panel.hidden));

    panel.replaceWith(wrap);
    wrap.append(btn, panel);
    set(false);
  });
}
