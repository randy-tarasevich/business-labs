// Content checks: the house rules in CLAUDE.md that a computer can check. Run with: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { CHALLENGES } from '../../src/data/challenges.js';
import { PREDICTIONS } from '../../src/data/predictions.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const TEXT = /\.(astro|js|ts|md|css|json)$/;
const slugs = readdirSync(join(ROOT, 'src/content/tools')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));

test('no em-dashes anywhere in the site', () => {
  const hits = [];
  for (const file of walk(join(ROOT, 'src')).filter((f) => TEXT.test(f))) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes('—')) hits.push(`${relative(ROOT, file)}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, [], `Em-dashes found (use a comma, colon, or period instead):\n${hits.join('\n')}`);
});

test('challenges belong to real tools and are complete', () => {
  for (const [slug, list] of Object.entries(CHALLENGES)) {
    assert.ok(slugs.includes(slug), `challenges.js has "${slug}", but there's no src/content/tools/${slug}.md`);
    list.forEach((c, i) => {
      const where = `${slug} challenge ${i + 1}`;
      for (const k of ['title', 'goal']) assert.ok(typeof c[k] === 'string' && c[k].trim(), `${where}: missing ${k}`);
      assert.equal(typeof c.met, 'function', `${where}: missing met()`);
      assert.ok(c.start && typeof c.start === 'object', `${where}: missing start`);
      (c.rules ?? []).forEach((r, j) => {
        assert.ok(r.text?.trim() && typeof r.ok === 'function', `${where}, rule ${j + 1}: needs text and ok()`);
      });
    });
  }
});

test('predictions belong to real tools and are complete', () => {
  for (const [slug, list] of Object.entries(PREDICTIONS)) {
    assert.ok(slugs.includes(slug), `predictions.js has "${slug}", but there's no src/content/tools/${slug}.md`);
    list.forEach((p, i) => {
      const where = `${slug} prediction ${i + 1}`;
      assert.ok(p.question?.trim(), `${where}: missing question`);
      assert.ok(p.start && p.change, `${where}: needs start and change`);
      assert.ok(p.measure?.label && typeof p.measure.value === 'function' && typeof p.measure.fmt === 'function', `${where}: measure needs label, value(), fmt()`);
    });
  }
});

test('every tool with challenges or predictions has teacher notes for them', () => {
  for (const slug of Object.keys(CHALLENGES)) {
    const md = readFileSync(join(ROOT, `src/content/tools/${slug}.md`), 'utf8');
    assert.match(md, /^## Challenges/m, `${slug}.md needs a "## Challenges" section with sample solutions`);
  }
  for (const slug of Object.keys(PREDICTIONS)) {
    const md = readFileSync(join(ROOT, `src/content/tools/${slug}.md`), 'utf8');
    assert.match(md, /^## Predict first/m, `${slug}.md needs a "## Predict first" section with the why`);
  }
});
