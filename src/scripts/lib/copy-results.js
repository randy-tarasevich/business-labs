// Copy my results: a plain-text summary of what's on screen, for pasting into a Google Form or Doc
// as an exit ticket. Nothing is sent anywhere; it only goes to the student's clipboard.
//
// The summary, with no per-tool code:
//   - the tool name, and the example (preset) and view (tab) picked, if any
//   - Your numbers: every input share links save (share-state.js), with its label and unit
//   - Results: every Stat (label + value) and the verdict line
//   - a share link that reopens the tool with these numbers
// A tool can mark extra results for tools whose key numbers aren't in Stat boxes:
//   data-copy="Label" on any element adds "Label: its text" under Results
//   data-copy-table on a results table adds one line per row ("FIFO: COGS $4,750, Gross profit ...")

import { describeFields } from './share-state.js';
import { STAT, STAT_KEY, VERDICT } from './ui.js';

const clean = (s) => s.replace(/\s+/g, ' ').trim();
const visible = (el) => el.offsetParent !== null || el.getClientRects().length > 0;

function results(root) {
  const out = [];
  root.querySelectorAll('div, p, span, td, strong').forEach((el) => {
    if (!visible(el)) return;
    if (el.className === STAT || el.className === STAT_KEY) {
      const [k, v] = el.children;
      if (k && v && clean(v.textContent) && clean(v.textContent) !== '–') out.push(`${clean(k.textContent)}: ${clean(v.textContent)}`);
    } else if (el.dataset.copy !== undefined) {
      const text = clean(el.textContent);
      if (text) out.push(el.dataset.copy ? `${el.dataset.copy}: ${text}` : text);
    }
  });
  root.querySelectorAll('table[data-copy-table]').forEach((t) => {
    if (!visible(t)) return;
    const heads = [...t.querySelectorAll('thead th')].map((th) => clean(th.textContent));
    t.querySelectorAll('tbody tr').forEach((tr) => {
      const [first, ...rest] = [...tr.children];
      const name = clean(first?.textContent || '');
      if (!name) return;
      // Pair each cell with its column heading, unless the cell spans several columns.
      let col = first.colSpan || 1;
      const parts = rest
        .map((c) => {
          const text = clean(c.textContent);
          const head = (c.colSpan || 1) === 1 ? heads[col] : '';
          col += c.colSpan || 1;
          return head ? `${head} ${text}` : text;
        })
        .filter((t) => t.trim());
      out.push(`${name}: ${parts.join(', ')}`);
    });
  });
  return out;
}

function verdicts(root) {
  return [...root.querySelectorAll('div, p')]
    .filter((el) => el.className === VERDICT && visible(el) && clean(el.textContent))
    .map((el) => clean(el.textContent));
}

function pressed(root, sel) {
  const b = root.querySelector(`${sel} > [aria-pressed="true"]`);
  return b ? clean(b.textContent) : '';
}

/** The summary text for one tool. */
export function summary(root, { title, url }) {
  const lines = [`${title} (Business Labs)`];
  const example = pressed(root, '[data-presets]');
  const view = pressed(root, '[data-tabs]');
  if (example) lines.push(`Example: ${example}`);
  if (view) lines.push(`View: ${view}`);

  const nums = describeFields(root);
  if (nums.length) {
    lines.push('', 'My numbers:');
    nums.forEach((n) => lines.push(`- ${n.label}: ${n.value}`));
  }
  const res = results(root);
  const ver = verdicts(root);
  if (res.length || ver.length) {
    lines.push('', 'Results:');
    res.forEach((r) => lines.push(`- ${r}`));
    ver.forEach((v) => lines.push(v));
  }
  lines.push('', `Link: ${url}`);
  return lines.join('\n');
}
