import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { test } from 'node:test';

const root = resolve('dist');
assert.ok(existsSync(resolve(root, 'index.html')), 'Run npm run build before npm run test:site.');
const files = readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
const pages = files.map(file => ({file, html: readFileSync(resolve(root, file), 'utf8')}));
const decode = value => value.replaceAll('&amp;', '&');
const canonical = html => html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];

function findOutput(pathname) {
  for (const path of [decodeURIComponent(pathname), pathname]) {
    const file = resolve(root, '.' + path);
    assert.ok(!relative(root, file).startsWith('..'), 'Links must stay in dist');
    for (const candidate of [file, resolve(file, 'index.html'), `${file}.html`]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
  }
}

test('every page has a title, one main heading, and a keyboard skip target', () => {
  for (const {file, html} of pages) {
    assert.match(html, /<title>[^<]+<\/title>/, file);
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, file);
    assert.match(html, /<main\b[^>]*id="main-content"[^>]*tabindex="-1"/, file);
    assert.match(html, /href="#main-content"/, file);
    assert.ok(canonical(html), `Canonical URL missing: ${file}`);
  }
});

test('all local links, assets, and fragment targets exist in the generated site', () => {
  for (const {file, html} of pages) {
    const pageURL = new URL(decode(canonical(html)));
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const href = decode(match[1]);
      assert.ok(!href.startsWith('//'), `Protocol-relative path: ${file}: ${href}`);
      const url = new URL(href, pageURL);
      if (url.origin !== pageURL.origin) continue;
      const target = findOutput(url.pathname);
      assert.ok(target, `Broken internal link: ${file}: ${href}`);
      if (url.hash && target.endsWith('.html')) {
        const id = decodeURIComponent(url.hash.slice(1));
        assert.ok(readFileSync(target, 'utf8').includes(`id="${id}"`), `Missing fragment: ${file}: ${href}`);
      }
    }
  }
});

test('RSS entries resolve to articles and agree with their canonical URLs', () => {
  const rss = readFileSync(resolve(root, 'rss.xml'), 'utf8');
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  const articles = pages.filter(({file}) => file.startsWith(`blog${sep}`));
  assert.equal(items.length, articles.length);
  for (const [, item] of items) {
    const link = decode(item.match(/<link>(.*?)<\/link>/)[1]);
    const target = findOutput(new URL(link).pathname);
    assert.ok(target, link);
    assert.equal(decode(canonical(readFileSync(target, 'utf8'))), link);
  }
});

test('RSS, article indexes, and adjacent-post links use a consistent publication order', () => {
  const rss = readFileSync(resolve(root, 'rss.xml'), 'utf8');
  const entries = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    pathname: decodeURIComponent(new URL(decode(item.match(/<link>(.*?)<\/link>/)[1])).pathname),
    date: Date.parse(item.match(/<pubDate>(.*?)<\/pubDate>/)[1]),
  }));
  const paths = entries.map(entry => entry.pathname);
  for (let index = 1; index < entries.length; index++) {
    const previous = entries[index - 1];
    const current = entries[index];
    assert.ok(previous.date >= current.date, `RSS dates out of order: ${current.pathname}`);
    if (previous.date === current.date) {
      assert.ok(previous.pathname < current.pathname, `RSS same-date IDs out of order: ${current.pathname}`);
    }
  }

  const linkPath = (href, html) => decodeURIComponent(new URL(decode(href), decode(canonical(html))).pathname);
  for (const {file, html} of pages) {
    const listed = [...html.matchAll(/<a\b[^>]*class="essays-title"[^>]*href="([^"]+)"/g)]
      .map(([, href]) => linkPath(href, html));
    if (!listed.length) continue;
    const expected = file.startsWith(`tags${sep}`) ? paths.filter(path => listed.includes(path)) : paths;
    assert.deepEqual(listed, expected, `Article index differs from RSS: ${file}`);
  }

  for (const [index, pathname] of paths.entries()) {
    const html = readFileSync(findOutput(pathname), 'utf8');
    const navigation = html.match(/<nav\b[^>]*aria-label="Post navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const links = [...navigation.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
      .map(([, href]) => linkPath(href, html));
    // Previous points to the older entry; Next points to the newer entry.
    assert.deepEqual(links, [paths[index + 1], paths[index - 1]].filter(Boolean), `Post navigation: ${pathname}`);
  }
});

test('email signup cannot submit to an unconfigured placeholder', () => {
  for (const {file, html} of pages.filter(({file}) => file.startsWith(`blog${sep}`))) {
    assert.doesNotMatch(html, /<form\b[^>]*action="#"/, file);
    assert.match(html, /<label[^>]*for="newsletter-email"/, file);
    assert.match(html, /href="[^"#]*\/rss\.xml"/, file);
    if (html.includes('Email subscriptions are coming soon.')) {
      assert.doesNotMatch(html, /<form\b/, file);
      assert.match(html, /<fieldset\b[^>]*disabled/, file);
    } else {
      assert.match(html, /<form\b[^>]*action="https:\/\/[^\"]+"[^>]*method="POST"/, file);
    }
  }
});

test('draft posts are excluded from output and public indexes', () => {
  const contentRoot = resolve('src/content/blog');
  for (const file of readdirSync(contentRoot, {recursive: true}).filter(file => /\.mdx?$/.test(file))) {
    const source = readFileSync(resolve(contentRoot, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (!/^draft:\s*true\s*$/m.test(frontmatter)) continue;
    const slug = file.replace(/\.mdx?$/, '').split(sep).join('/');
    assert.ok(!findOutput(`/blog/${slug}`), `Draft was published: ${file}`);
    for (const {html} of pages) assert.ok(!html.includes(`/blog/${slug}"`), `Draft was linked: ${file}`);
    assert.ok(!readFileSync(resolve(root, 'rss.xml'), 'utf8').includes(`/blog/${slug}</link>`), file);
  }
});
