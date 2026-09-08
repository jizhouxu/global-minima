import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixtureRoot = new URL('../../.tmp/rendering/', import.meta.url);
const astroCLI = fileURLToPath(new URL('./bin/astro.mjs', import.meta.resolve('astro/package.json')));

test('shared site config renders Markdown and MDX', { timeout: 120_000 }, async (t) => {
  await mkdir(fixtureRoot, { recursive: true });
  try {
    await run(process.execPath, [astroCLI, 'build', '--root', fileURLToPath(fixtureRoot),
      '--config', '../../tests/fixtures/rendering/astro.config.mjs'], {
      cwd: repoRoot,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
      timeout: 90_000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
  } catch (error) {
    assert.fail(`Rendering fixture build failed: ${error.message}\n${error.stdout ?? ''}\n${error.stderr ?? ''}`);
  }

  for (const format of ['markdown', 'mdx']) {
    const html = await readFile(new URL(`dist/${format}/index.html`, fixtureRoot), 'utf8');

    await t.test(`${format}: inline and display math compile to KaTeX and MathML`, () => {
      assert.equal([...html.matchAll(/class="katex"/g)].length, 2);
      assert.match(html, /class="katex-display"/);
      assert.equal([...html.matchAll(/<math\b/g)].length, 2);
      assert.match(html, /<mfrac>/);
      assert.doesNotMatch(html, /katex-error|\$a\^2|\$\$/);
    });

    await t.test(`${format}: GitHub-flavored tables, strikethrough and tasks render`, () => {
      assert.match(html, /<table\b[\s\S]*<th\b[^>]*>Feature<\/th>[\s\S]*<td\b[^>]*>Working<\/td>/);
      assert.match(html, /<del>obsolete<\/del>/);
      const checkboxes = [...html.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g)].map(([input]) => input);
      assert.equal(checkboxes.length, 2);
      assert.ok(checkboxes.every(input => /\bdisabled(?=[\s/=>])/.test(input)));
      assert.match(checkboxes[0], /\bchecked(?=[\s/=>])/);
      assert.doesNotMatch(checkboxes[1], /\bchecked(?=[\s/=>])/);
    });

    await t.test(`${format}: Shiki emits highlighted tokens for both site themes`, () => {
      const code = html.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/)?.[0];
      assert.ok(code, 'A fenced code block should render as <pre>.');
      assert.match(code, /class="[^"]*astro-code[^"]*github-light[^"]*github-dark/);
      assert.match(code, /--shiki-dark-bg:/);
      assert.match(code, /<span\b[^>]*style="[^"]*color:[^;"\s]+;[^"]*--shiki-dark:/);
      assert.match(code, /answer/);
    });

    if (format === 'mdx') {
      await t.test('MDX renders the shared Astro Sidenote component', () => {
        assert.match(html, /<aside\b[^>]*class="sidenote"[^>]*role="note"[^>]*>\s*A rendered MDX sidenote\.\s*<\/aside>/);
        assert.doesNotMatch(html, /<astro-island\b/);
      });
    }
  }

  await t.test('Astro preserves spaces between inline elements', async () => {
    const html = await readFile(new URL('dist/spacing/index.html', fixtureRoot), 'utf8');
    assert.match(html, /<span>Inline<\/span>\s+<em>spacing<\/em>/);
  });
});
