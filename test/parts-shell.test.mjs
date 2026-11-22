import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_PARTS, SHELL_PARTS, SHELL_PART_NAMES, isPagePartEnabled } from '../src/core/parts.mjs';
import { renderPage } from '../src/render/page.mjs';
import { validatePage } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const site = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');
const album = readJson('content/v13/albums/the-early-bird.json');
const vista = readJson('content/v13/vista-pages/vistatest.json');
const editorial = readJson('content/v13/editorial-pages/new-editorial-page.json');
const pages = [album, vista, editorial];

const render = (page) => renderPage(page, { site, wallpapers, pages, assets: '/assets' });
const withParts = (page, parts) => ({ ...page, appearance: { ...page.appearance, parts } });
const partProblems = (page) => validatePage(page).filter((problem) => problem.includes('appearance.parts'));

const MARKERS = {
  siteHeader: '<header class="global-header"',
  siteMenu: '<details class="site-menu"',
  pageFooter: '<footer class="global-footer"',
  wallpaperLayer: 'data-wallpaper-layer'
};

test('the inner-page shell parts are declared alongside the desktop parts', () => {
  assert.deepEqual([...SHELL_PART_NAMES], ['siteHeader', 'siteMenu', 'pageFooter', 'pageIntro', 'wallpaperLayer']);
  assert.equal(Object.keys(PAGE_PARTS).length, 13);
  for (const [name, definition] of Object.entries(SHELL_PARTS)) {
    assert.equal(definition.category, 'shell');
    assert.equal(definition.path, `appearance.parts.${name}.enabled`);
    assert.equal(definition.default, true);
    assert.deepEqual([...definition.templates], ['album', 'vista-window', 'editorial']);
    assert.equal(isPagePartEnabled({}, name), true);
  }
});

test('every published page declares its shell parts explicitly', () => {
  for (const page of pages) {
    assert.ok(page.appearance?.parts, `${page.identity.name} has a parts block`);
    for (const name of SHELL_PART_NAMES) {
      assert.equal(page.appearance.parts[name]?.enabled, true, `${page.identity.name}.${name}`);
    }
  }
});

test('explicit shell settings are a visual no-op on all three identities', () => {
  for (const page of pages) {
    const withoutConfig = { ...page, appearance: { ...page.appearance, parts: undefined } };
    assert.equal(render(withoutConfig), render(page), `${page.identity.name} changed`);
  }
  for (const marker of Object.values(MARKERS)) assert.ok(render(album).includes(marker), `album missing ${marker}`);
  for (const marker of Object.values(MARKERS)) assert.ok(render(vista).includes(marker), `vista missing ${marker}`);
  for (const marker of Object.values(MARKERS)) assert.ok(render(editorial).includes(marker), `editorial missing ${marker}`);
});

test('each shell part can be switched off without losing the page content', () => {
  for (const [name, marker] of Object.entries(MARKERS)) {
    const html = render(withParts(editorial, { [name]: false }));
    assert.ok(!html.includes(marker), `${name} is still in the output after being disabled`);
    for (const [otherName, otherMarker] of Object.entries(MARKERS)) {
      if (otherName === name) continue;
      assert.ok(html.includes(otherMarker), `disabling ${name} also removed ${otherName}`);
    }
    assert.match(html, /<main id="main-content" class="page-main template-main-editorial">/);
    assert.match(html, /class="page-content"/);
  }
  assert.ok(render(withParts(editorial, { wallpaperLayer: { enabled: false } })).includes(MARKERS.siteHeader));
});

test('the site menu survives a disabled header, and the page intro is its own part', () => {
  const noHeader = render(withParts(vista, { siteHeader: false }));
  assert.ok(!noHeader.includes(MARKERS.siteHeader));
  assert.ok(noHeader.includes(MARKERS.siteMenu));

  const noSections = { ...editorial, sections: editorial.sections.filter((section) => section.type !== 'hero') };
  assert.match(render(noSections), /<header class="page-intro"/);
  const noIntro = render(withParts(noSections, { pageIntro: false }));
  assert.doesNotMatch(noIntro, /class="page-intro"/);
  assert.match(noIntro, /class="page-content"/);
});

test('shell part settings validate from the shared definitions', () => {
  for (const page of pages) assert.deepEqual(partProblems(page), []);
  const withoutConfig = { ...editorial, appearance: { ...editorial.appearance, parts: undefined } };
  assert.deepEqual(partProblems(withoutConfig), []);
  assert.deepEqual(partProblems(withParts(editorial, { siteHeader: true, pageFooter: { enabled: false } })), []);
  for (const bad of ['no', null, { enabled: 1 }]) {
    const problems = partProblems(withParts(editorial, { siteMenu: bad }));
    assert.equal(problems.length, 1, `expected one problem for ${JSON.stringify(bad)}`);
    assert.match(problems[0], /: appearance\.parts\.siteMenu\.enabled must be true, false, or an object with a boolean enabled field$/);
  }
});
