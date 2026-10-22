// Accessibility helpers shared by every tool page (and the teacher notes pages).
//
// sliderText(root): a screen reader reads a slider's raw value ("2.5"). This gives each slider the
//   same text its number box shows, with the box's unit ("$2.50", "8 years", "5%"). Units are read
//   from the unit labels next to the box, so tools that switch currency stay right. Sliders with no
//   number box are left alone.
// scrollRegions(scope): tables and charts that scroll sideways on a phone can't be scrolled with
//   the keyboard unless the scroll box can take focus. This makes a scroll box focusable (and names
//   it) only while it actually overflows, so it adds no extra tab stops on wide screens.

export function sliderText(root) {
  const describe = (range) => {
    const box = root.querySelector(`#${CSS.escape(range.id)}-n`);
    if (!box) return;
    const unit = (el) => (el && el.tagName === 'SPAN' ? el.textContent.trim() : '');
    const before = unit(box.previousElementSibling);
    const after = unit(box.nextElementSibling);
    const raw = box.value !== '' ? box.value : range.value;
    const n = Number(raw);
    const shown = Number.isFinite(n) && raw !== '' ? (box.dataset.money !== undefined ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n.toLocaleString('en-US', { maximumFractionDigits: 4 })) : raw;
    const space = after && !after.startsWith('%') && !/^\s/.test(after) ? ' ' : '';
    range.setAttribute('aria-valuetext', `${before}${shown}${space}${after}`);
  };
  const ranges = [...root.querySelectorAll('input[type="range"][id]')];
  ranges.forEach(describe);
  // Number boxes are updated after the slider's own input handler, so describe on the next frame.
  const later = (e) => {
    if (e.target.matches?.('input[type="range"][id]')) requestAnimationFrame(() => describe(e.target));
  };
  root.addEventListener('input', later);
  root.addEventListener('focusin', later);
  root.addEventListener('change', () => requestAnimationFrame(() => ranges.forEach(describe)));
}

export function scrollRegions(scope, selector = '.overflow-x-auto') {
  const boxes = [...scope.querySelectorAll(selector)];
  if (!boxes.length) return;
  const check = (box) => {
    const scrolls = box.scrollWidth - box.clientWidth > 1;
    const isTable = box.tagName === 'TABLE';
    if (scrolls) {
      box.tabIndex = 0;
      // A <table> keeps its table role; a wrapper becomes a named region.
      if (!isTable) {
        box.setAttribute('role', 'region');
        box.setAttribute('aria-label', box.querySelector('svg[role="img"]') ? 'Chart, scrolls sideways' : 'Table, scrolls sideways');
      }
    } else if (box.hasAttribute('tabindex')) {
      box.removeAttribute('tabindex');
      if (!isTable) {
        box.removeAttribute('role');
        box.removeAttribute('aria-label');
      }
    }
  };
  const ro = new ResizeObserver((entries) => entries.forEach((e) => check(e.target)));
  boxes.forEach((b) => ro.observe(b));
}
