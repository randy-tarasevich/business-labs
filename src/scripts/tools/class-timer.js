// Class Timer: a projector countdown with optional on-screen steps.
import { beep } from '../lib/util.js';
import { TIMER_PRESETS } from './timer-presets.js';

const CIRC = 2 * Math.PI * 88;

export function initClassTimer(root) {
  const $ = (sel) => root.querySelector(sel);
  const segments = TIMER_PRESETS[root.dataset.preset] ?? Object.values(TIMER_PRESETS)[0];

  const ring = $('[data-ring]');
  ring.setAttribute('stroke-dasharray', CIRC);

  let seg, total, remaining, running = false, endAt = 0, raf = 0, fired = {}, soundOn = true;

  segments.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.tab;
    b.dataset.id = s.id;
    b.addEventListener('click', () => choose(s));
    $('[data-tabs]').appendChild(b);
  });

  function choose(s) {
    seg = s;
    total = s.secs;
    remaining = total;
    running = false;
    fired = {};
    cancelAnimationFrame(raf);
    $('[data-go]').textContent = 'Start';
    [...$('[data-tabs]').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === s.id)));
    $('[data-title]').textContent = s.title;
    $('[data-half]').style.display = s.kind === 'steps' ? '' : 'none';

    const side = $('[data-side]');
    side.replaceChildren();
    const banner = document.createElement('div');
    banner.className = 'ct-banner';
    banner.dataset.banner = '';
    side.appendChild(banner);

    if (s.kind === 'steps') {
      const ol = document.createElement('ol');
      ol.className = 'ct-steps';
      ol.dataset.steps = '';
      s.steps.forEach(([title, detail]) => {
        const li = document.createElement('li');
        li.innerHTML = `<div><b>${title}</b><span>${detail}</span></div>`;
        ol.appendChild(li);
      });
      side.appendChild(ol);
    } else {
      const info = document.createElement('div');
      info.className = 'ct-info';
      info.innerHTML = s.html;
      side.appendChild(info);
    }
    draw();
  }

  const fmt = (sec) => {
    const s = Math.max(0, Math.ceil(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  function draw() {
    const elapsed = total - remaining;
    const started = running || elapsed > 0;
    const frac = Math.max(0, Math.min(1, remaining / total));
    const m = seg.messages;
    const banner = $('[data-banner]');

    ring.setAttribute('stroke-dashoffset', CIRC * (1 - frac));
    ring.style.stroke = remaining <= 0 ? 'var(--bad)' : remaining <= 60 ? 'var(--warn)' : 'var(--good)';
    $('[data-time]').textContent = fmt(remaining);

    let text, cls = 'ct-banner', sub = running ? 'remaining' : 'Paused';
    if (remaining <= 0) { text = m.end; cls += ' end'; sub = 'Time'; }
    else if (!started) { text = m.ready; sub = 'Ready'; }
    else if (remaining <= 60) { text = m.lastMinute; cls += ' warn'; }
    else if (seg.kind === 'steps' && elapsed >= total / 2 && m.half) { text = m.half; cls += ' warn'; }
    else { text = m.running; }
    banner.className = cls;
    banner.textContent = text;
    $('[data-sub]').textContent = sub;

    if (seg.kind === 'steps') {
      let cur = 0;
      seg.stepStarts.forEach((t, i) => { if (elapsed >= t) cur = i; });
      [...$('[data-steps]').children].forEach((li, i) => {
        li.className = started ? (i === cur ? 'now' : i < cur ? 'past' : '') : '';
      });
    }
  }

  function tick() {
    remaining = (endAt - Date.now()) / 1000;
    const elapsed = total - remaining;
    if (soundOn && seg.kind === 'steps' && elapsed >= total / 2 && !fired.half) { fired.half = true; beep(1); }
    if (soundOn && remaining <= 60 && total > 120 && !fired.min) { fired.min = true; beep(1); }
    if (remaining <= 0) {
      remaining = 0;
      running = false;
      $('[data-go]').textContent = 'Start';
      if (soundOn && !fired.end) beep(3);
      fired.end = true;
      draw();
      return;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }

  function toggle() {
    if (remaining <= 0) return;
    if (running) {
      running = false;
      cancelAnimationFrame(raf);
      $('[data-go]').textContent = 'Resume';
      draw();
    } else {
      running = true;
      endAt = Date.now() + remaining * 1000;
      $('[data-go]').textContent = 'Pause';
      tick();
    }
  }

  $('[data-go]').addEventListener('click', toggle);
  $('[data-reset]').addEventListener('click', () => choose(seg));
  $('[data-plus]').addEventListener('click', () => {
    remaining += 60;
    total += 60;
    if (running) endAt += 60000;
    if (remaining > 60) fired.min = false;
    fired.end = false;
    draw();
  });
  $('[data-sound]').addEventListener('click', (e) => {
    soundOn = !soundOn;
    e.currentTarget.textContent = soundOn ? 'Chime on' : 'Chime off';
    e.currentTarget.setAttribute('aria-pressed', String(soundOn));
  });
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'r' || e.key === 'R') choose(seg);
  });

  choose(segments.find((s) => s.default) ?? segments[0]);
}
