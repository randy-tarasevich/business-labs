// Challenge mode: live checks for the cards rendered by src/components/ui/Challenges.astro.
//
// Start loads the challenge's scenario as a share link (?g0=1&be-fc=7500&ch=2) and reloads the page,
// so share-state.js does the loading and the link itself can be posted for the class. ch marks the
// active card. After every change in the tool, each card is checked against src/data/challenges.js:
//   Not yet   goal not reached
//   Rule broken   goal reached but a rule isn't kept (shown in red under the goal)
//   Done      goal reached and every rule kept
// Rule marks show on the active card, and on any card whose goal is reached, so an idle card
// doesn't fill with red while a student explores.

import { CHALLENGES } from '../../data/challenges.js';
import { readState } from './share-state.js';
import { setTone } from './util.js';

export function initChallenges(root, panel) {
  const list = CHALLENGES[panel.dataset.challenges] ?? [];
  const cards = [...panel.querySelectorAll('[data-ch]')];
  const live = panel.querySelector('[data-ch-live]');
  const params = new URLSearchParams(location.search);
  const active = params.has('ch') ? parseInt(params.get('ch'), 10) : -1;
  const done = new Set();

  cards.forEach((card, i) => {
    const btn = card.querySelector('[data-start]');
    if (i === active) {
      card.dataset.active = '';
      btn.textContent = 'Start over';
    }
    btn.addEventListener('click', () => {
      const url = new URL(location.pathname, location.origin);
      for (const k of ['embed', 'theme']) if (params.has(k)) url.searchParams.set(k, params.get(k));
      for (const [k, v] of Object.entries(list[i].start)) url.searchParams.set(k, String(v));
      url.searchParams.set('ch', String(i));
      location.assign(url);
    });
  });

  const check = (announce) => {
    const s = readState(root);
    cards.forEach((card, i) => {
      const c = list[i];
      if (!c) return;
      const met = !!c.met(s);
      const kept = (c.rules ?? []).map((r) => !!r.ok(s));
      const allKept = kept.every(Boolean);
      const showRules = met || i === active;

      card.querySelectorAll('[data-rule]').forEach((li, j) => {
        const mark = li.querySelector('[data-mark]');
        delete li.dataset.broken;
        delete li.dataset.kept;
        if (showRules) li.dataset[kept[j] ? 'kept' : 'broken'] = '';
        mark.textContent = !showRules ? '•' : kept[j] ? '✓' : '✗';
      });

      const status = card.querySelector('[data-status]');
      if (met && allKept) {
        setTone(card, 'good');
        status.textContent = 'Done ✓';
        if (announce && !done.has(i)) live.textContent = `Challenge done: ${c.title}`;
        done.add(i);
      } else {
        setTone(card, met ? 'warn' : '');
        status.textContent = met ? 'Rule broken' : 'Not yet';
        done.delete(i);
      }
    });
  };

  let timer;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(() => check(true), 120);
  };
  root.addEventListener('input', later);
  root.addEventListener('change', later);
  root.addEventListener('click', later);
  check(false);
}
