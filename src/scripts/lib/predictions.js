// Predict first: behavior for the cards rendered by src/components/ui/Predictions.astro.
//
// When a student picks Goes up, Goes down, or Stays the same:
//   1. the choice locks in,
//   2. before and after are measured right away (load the scenario, read; apply the change, read),
//      so nothing that happens during the replay can change the answer,
//   3. the tool replays it on screen: the "before" scenario, then a beat later the change, so
//      students watch the sliders and chart move,
//   4. the card shows before → after next to their guess, and asks them to explain why.
// While one card is replaying, the other cards' buttons wait. The right answer is read from the
// tool's own math, so there's no answer key.

import { PREDICTIONS } from '../../data/predictions.js';
import { applyParams, readState } from './share-state.js';
import { setTone } from './util.js';

const LABEL = { up: 'Goes up', down: 'Goes down', same: 'Stays the same' };
const SAID = { up: 'It went up.', down: 'It went down.', same: 'It stayed the same.' };
const PAUSE = 900; // ms between the before scenario and the change

function direction(a, b) {
  if (a === b) return 'same'; // also covers Infinity → Infinity
  const tol = Math.max(0.005, Math.abs(a) * 1e-9);
  if (Math.abs(b - a) <= tol) return 'same';
  return b > a ? 'up' : 'down';
}

export function initPredictions(root, panel) {
  const list = PREDICTIONS[panel.dataset.predictions] ?? [];
  let busy = false; // a card is replaying; the others wait
  const answered = new Set();
  const allChoices = () => [...panel.querySelectorAll('[data-choice]')];
  const unlock = () => {
    busy = false;
    panel.querySelectorAll('[data-pr]').forEach((c, j) => {
      if (answered.has(j)) return;
      c.querySelectorAll('[data-choice]').forEach((b) => (b.disabled = false));
    });
  };

  panel.querySelectorAll('[data-pr]').forEach((card, i) => {
    const p = list[i];
    if (!p) return;
    const choices = [...card.querySelectorAll('[data-choice]')];
    const result = card.querySelector('[data-result]');
    const again = card.querySelector('[data-again]');
    const line = (text, strong = false) => {
      const el = document.createElement(strong ? 'strong' : 'span');
      el.textContent = text;
      result.appendChild(el);
      return el;
    };

    const reset = () => {
      answered.delete(i);
      choices.forEach((b) => {
        b.disabled = busy;
        b.setAttribute('aria-pressed', 'false');
      });
      result.replaceChildren();
      setTone(card, '');
      again.hidden = true;
    };
    again.addEventListener('click', () => {
      reset();
      choices[0].focus();
    });

    choices.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled || busy) return;
        busy = true;
        answered.add(i);
        const guess = btn.dataset.choice;
        allChoices().forEach((b) => (b.disabled = true));
        choices.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        result.replaceChildren();

        // Measure first, then replay on screen.
        applyParams(root, p.start, { force: true });
        const before = p.measure.value(readState(root));
        applyParams(root, p.change);
        const after = p.measure.value(readState(root));
        applyParams(root, p.start, { force: true });

        line(`You said: ${LABEL[guess]}.`, true);
        line(`${p.measure.label} before: ${p.measure.fmt(before)}. Making the change...`);

        setTimeout(() => {
          applyParams(root, p.change);
          const real = direction(before, after);
          const right = real === guess;
          result.replaceChildren();
          line(`You said: ${LABEL[guess]}. ${SAID[real]}`, true);
          line(`${p.measure.label}: ${p.measure.fmt(before)} → ${p.measure.fmt(after)}`);
          line(right ? 'Nice. Now explain why in one sentence.' : 'Not what you expected? Look at the chart and The math, then explain why it happened.');
          setTone(card, right ? 'good' : 'warn');
          again.hidden = false;
          unlock();
        }, PAUSE);
      });
    });
  });
}
