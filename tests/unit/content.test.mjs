import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { readingTime, getSlug, formatDate, formatShortDate, tagPath, tagSlug } from '../../src/utils/reading-time.ts';

test('reading time keeps a one-minute minimum and estimates longer essays', () => {
  assert.equal(readingTime(''), 1);
  assert.equal(readingTime(' \n\t '), 1);
  assert.equal(readingTime('word '.repeat(600)), 3);
});

test('content IDs preserve nested paths and remove only markdown extensions', () => {
  assert.equal(getSlug('notes/first.mdx'), 'notes/first');
  assert.equal(getSlug('first.md'), 'first');
  assert.equal(getSlug('already-a-slug'), 'already-a-slug');
  assert.equal(getSlug('notes.md/example'), 'notes.md/example');
});

test('tag labels produce usable single-segment routes', () => {
  const examples = [['writing', 'writing'], ['C#', 'c-sharp'], ['C++', 'c-plus-plus'],
    ['machine learning', 'machine-learning'], ['数学', '数学'], ['a/b', 'a-b'], ['100%', '100'], ['%', '25']];
  for (const [tag, slug] of examples) {
    const pathname = tagPath(tag);
    assert.equal(tagSlug(tag), slug);
    assert.equal(pathname.split('/').length, 3);
    assert.equal(decodeURIComponent(pathname.slice('/tags/'.length)), slug);
    assert.equal(new URL(pathname, 'https://example.com').hash, '');
  }
});

test('publication dates stay the same across build-machine time zones', () => {
  const date = new Date('2026-01-01T00:00:00Z');
  assert.equal(formatDate(date), 'January 1, 2026');
  assert.equal(formatShortDate(date), 'Jan 1, 2026');
  const moduleURL = new URL('../../src/utils/reading-time.ts', import.meta.url).href;
  for (const TZ of ['America/Los_Angeles', 'Asia/Shanghai', 'UTC']) {
    const output = execFileSync(process.execPath, [
      '--experimental-strip-types', '--input-type=module', '-e',
      `import { formatDate, formatShortDate } from ${JSON.stringify(moduleURL)}; const date = new Date('2026-01-01T00:00:00Z'); console.log(JSON.stringify([formatDate(date), formatShortDate(date)]));`,
    ], { encoding: 'utf8', env: { ...process.env, TZ }, stdio: ['ignore', 'pipe', 'pipe'] });
    assert.deepEqual(JSON.parse(output), ['January 1, 2026', 'Jan 1, 2026'], TZ);
  }
});
