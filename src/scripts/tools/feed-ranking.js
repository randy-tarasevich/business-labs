// Feed Ranking Sandbox
// Each post gets a score from 0 to 100 on each signal (compared with the other posts), then
// Score = sum of (signal × its weight). The feed shows posts from highest score to lowest.
// Signals: how new it is, likes, comments, shares, average watch time, and whether it's from a friend.
// A made-up model for class: real apps use many more signals and don't publish their formulas.

import { num, linkRange, presetButtons, wireReveals, setTone } from '../lib/util.js';

export const POSTS = [
  { id: 'you', who: 'Your bakery', title: 'New pumpkin muffins, today only', hours: 3, likes: 120, comments: 8, shares: 4, watch: 4, friend: false },
  { id: 'beach', who: 'A friend', title: 'Beach photo dump', hours: 1, likes: 40, comments: 6, shares: 0, watch: 3, friend: true },
  { id: 'recipe', who: 'Cooking creator', title: '30-second pasta recipe video', hours: 10, likes: 2400, comments: 180, shares: 600, watch: 22, friend: false },
  { id: 'fight', who: 'Local news page', title: 'Shouting match at the town meeting', hours: 6, likes: 900, comments: 1500, shares: 400, watch: 35, friend: false },
  { id: 'ad', who: 'Sneaker brand', title: 'New colors just dropped', hours: 2, likes: 300, comments: 20, shares: 15, watch: 6, friend: false },
  { id: 'goal', who: 'A classmate', title: 'Game-winning goal clip', hours: 20, likes: 650, comments: 90, shares: 60, watch: 15, friend: true },
  { id: 'meme', who: 'Meme account', title: 'Cat vs. cucumber', hours: 30, likes: 5000, comments: 200, shares: 1200, watch: 5, friend: false },
  { id: 'library', who: 'Town library', title: 'Free study space this weekend', hours: 4, likes: 35, comments: 2, shares: 3, watch: 2, friend: false },
];
export const SIGNALS = [
  ['recency', 'How new it is'],
  ['likes', 'Likes'],
  ['comments', 'Comments'],
  ['shares', 'Shares'],
  ['watch', 'Watch time'],
  ['friend', 'From a friend'],
];
const MAX_HOURS = 48;

const PRESETS = [
  { name: 'Newest first', w: { recency: 10, likes: 0, comments: 0, shares: 0, watch: 0, friend: 0 } },
  { name: 'Most liked', w: { recency: 0, likes: 10, comments: 0, shares: 0, watch: 0, friend: 0 } },
  { name: 'Keep them watching', w: { recency: 2, likes: 1, comments: 6, shares: 4, watch: 10, friend: 0 } },
  { name: 'Friends first', w: { recency: 4, likes: 2, comments: 2, shares: 1, watch: 1, friend: 10 } },
];
const YOUR_KEYS = ['likes', 'comments', 'shares', 'watch', 'hours'];

/** 0 to 100 on each signal for one post, compared with the busiest post in the feed. */
export function signals(post, posts) {
  const max = (k) => Math.max(...posts.map((p) => p[k]), 1);
  return {
    recency: Math.max(0, 1 - post.hours / MAX_HOURS) * 100,
    likes: (post.likes / max('likes')) * 100,
    comments: (post.comments / max('comments')) * 100,
    shares: (post.shares / max('shares')) * 100,
    watch: (post.watch / max('watch')) * 100,
    friend: post.friend ? 100 : 0,
  };
}

/** Posts sorted into feed order, each with its score (0 to 100) and signal values. */
export function rank(posts, w) {
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return posts
    .map((p) => {
      const s = signals(p, posts);
      const score = total > 0 ? SIGNALS.reduce((acc, [k]) => acc + s[k] * w[k], 0) / total : 0;
      return { ...p, s, score };
    })
    .sort((a, b) => b.score - a.score || a.hours - b.hours);
}

export function initFeedRanking(root) {
  const $ = (sel) => root.querySelector(sel);
  const r = (name) => root.querySelector(`[data-r="${name}"]`);
  const posts = POSTS.map((p) => ({ ...p }));
  const you = posts[0];
  const w = { ...PRESETS[2].w };

  const weightSyncs = SIGNALS.map(([k]) =>
    linkRange(root, `fr-w-${k}`, {
      get: () => w[k],
      set: (v) => {
        w[k] = v;
        setActive(-1);
        render();
      },
      fit: false,
      max: 10,
    })
  );
  const yourSyncs = YOUR_KEYS.map((k) =>
    linkRange(root, `fr-you-${k}`, {
      get: () => you[k],
      set: (v) => {
        you[k] = Math.round(v);
        render();
      },
      max: k === 'hours' ? MAX_HOURS : undefined,
    })
  );
  const setActive = presetButtons($('[data-presets]'), PRESETS, (p) => {
    Object.assign(w, p.w);
    weightSyncs.forEach((s) => s());
    render();
  });
  $('[data-reset-post]').addEventListener('click', () => {
    Object.assign(you, POSTS[0]);
    yourSyncs.forEach((s) => s());
    render();
  });

  // Feed cards are built once; render() reorders them and updates their numbers.
  const list = $('[data-feed]');
  const cards = new Map();
  posts.forEach((p) => {
    const li = document.createElement('li');
    li.className = p.id === 'you'
      ? 'grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3 items-start rounded-lg border-2 border-accent bg-accent/6 p-3'
      : 'grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3 items-start rounded-lg border border-line p-3';
    li.innerHTML =
      `<span class="font-mono font-semibold text-[18px] leading-none pt-0.5 text-muted" data-k="rank"></span>` +
      `<div class="grid gap-1 min-w-0">` +
      `<div class="flex flex-wrap items-baseline justify-between gap-x-3"><span class="text-[12.5px] text-muted">${p.who}${p.friend && !/friend/i.test(p.who) ? ' · friend' : ''}</span><span class="font-mono text-[12.5px] text-muted" data-k="score"></span></div>` +
      `<span class="font-semibold text-[14.5px] leading-snug">${p.title}</span>` +
      `<span class="text-[12.5px] text-muted font-mono" data-k="stats"></span>` +
      `<span class="block h-1.5 rounded-full bg-line overflow-hidden"><span class="block h-full rounded-full ${p.id === 'you' ? 'bg-accent' : 'bg-muted'}" data-k="bar"></span></span>` +
      `</div>`;
    cards.set(p.id, li);
    list.appendChild(li);
  });

  function render() {
    const feed = rank(posts, w);
    const top = feed[0];
    const place = feed.findIndex((p) => p.id === 'you') + 1;

    feed.forEach((p, i) => {
      const li = cards.get(p.id);
      li.querySelector('[data-k="rank"]').textContent = `#${i + 1}`;
      li.querySelector('[data-k="score"]').textContent = `score ${Math.round(p.score)}`;
      li.querySelector('[data-k="stats"]').textContent = `${p.hours}h old · ${num(p.likes)} likes · ${num(p.comments)} comments · ${num(p.shares)} shares · ${p.watch}s watched`;
      li.querySelector('[data-k="bar"]').style.width = `${Math.max(p.score, 1)}%`;
      list.appendChild(li);
    });

    r('place').textContent = `#${place} of ${posts.length}`;
    setTone(r('place-box'), place <= 3 ? 'good' : place <= 5 ? 'warn' : 'bad');
    r('top').textContent = top.who;
    r('your-score').textContent = Math.round(feed[place - 1].score);

    // Which signal adds the most to the top post's score?
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    const driver = total ? SIGNALS.map(([k, label]) => [label, top.s[k] * w[k]]).sort((a, b) => b[1] - a[1])[0][0] : '';

    const v = r('verdict');
    if (!total) {
      setTone(v, 'warn');
      v.textContent = 'Every weight is 0, so the feed can\'t tell posts apart. Turn up at least one signal.';
    } else {
      setTone(v, place <= 3 ? 'good' : 'warn');
      let t = `Your bakery post is #${place}. The top post is "${top.title}" from ${top.who.toLowerCase()}, mostly because of ${driver.toLowerCase()}.`;
      if (top.id === 'fight') t += ' A post that starts an argument gets lots of comments and watch time, so a feed built to keep people watching can push it to the top.';
      v.textContent = t;
    }

    const yours = feed[place - 1];
    r('formula').innerHTML =
      `Your post's signals (0 to 100): new ${Math.round(yours.s.recency)}, likes ${Math.round(yours.s.likes)}, comments ${Math.round(yours.s.comments)}, shares ${Math.round(yours.s.shares)}, watch ${Math.round(yours.s.watch)}, friend ${Math.round(yours.s.friend)}` +
      `<span>Score = each signal × its weight, added up, ÷ ${num(total, 1)} (total weight)</span>` +
      `<span>Your score = ${Math.round(yours.score)}. Top score = ${Math.round(top.score)} (${top.who}).</span>`;
  }

  wireReveals(root);
  setActive(2);
  weightSyncs.forEach((s) => s());
  yourSyncs.forEach((s) => s());
  render();
}
