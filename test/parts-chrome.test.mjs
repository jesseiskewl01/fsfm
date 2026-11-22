import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROME_PARTS, CHROME_PART_NAMES, isChromePartEnabled } from '../src/core/parts.mjs';
import { renderHomepage } from '../src/render/homepage.mjs';
import { validatePage } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const site = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');
const homepage = readJson('content/v13/homepage.json');
const context = { site, wallpapers, pages: [homepage], assets: '/assets' };

const render = (page) => renderHomepage(page, context);
const withParts = (parts) => ({ ...homepage, appearance: { ...homepage.appearance, parts } });
const partProblems = (page) => validatePage(page).filter((problem) => problem.includes('appearance.parts'));

/** A unique, stable marker for each chrome part in the rendered HTML. */
const MARKERS = {
  bootOverlay: 'id="fsfmBootScreen"',
  bubbleCanvas: 'id="bgCanvas"',
  desktopGadgets: 'id="fsfmGadgets"',
  desktopTaskbar: '<nav class="taskbar"',
  desktopHero: 'aero-window hero-window',
  purbleOverlay: 'id="purbleOverlay"',
  shutdownOverlay: 'id="fsfmShutdown"',
  themeEngine: 'window.__FSFM_THEME_CONFIG__'
};

test('the eight desktop parts are declared in one place and default to on', () => {
  assert.deepEqual([...CHROME_PART_NAMES], Object.keys(MARKERS));
  for (const [name, definition] of Object.entries(CHROME_PARTS)) {
    assert.equal(definition.category, 'chrome');
    assert.deepEqual([...definition.templates], ['homepage']);
    assert.equal(definition.path, `appearance.parts.${name}.enabled`);
    assert.equal(definition.default, true);
    assert.equal(isChromePartEnabled({}, name), true, `${name} should default to enabled`);
  }
  assert.equal(isChromePartEnabled({}, 'notAPart'), false);
});

test('the explicit settings in homepage.json are a visual no-op', () => {
  const withoutConfig = { ...homepage, appearance: { ...homepage.appearance, parts: undefined } };
  assert.equal(render(withoutConfig), render(homepage));
  const html = render(homepage);
  for (const marker of Object.values(MARKERS)) assert.ok(html.includes(marker), `missing default marker ${marker}`);
});

test('each desktop part can be switched off on its own', () => {
  const baseline = render(homepage);
  for (const [name, marker] of Object.entries(MARKERS)) {
    const html = render(withParts({ [name]: false }));
    assert.ok(!html.includes(marker), `${name} is still in the output after being disabled`);
    for (const [otherName, otherMarker] of Object.entries(MARKERS)) {
      if (otherName === name) continue;
      assert.ok(html.includes(otherMarker), `disabling ${name} also removed ${otherName}`);
    }
  }
  // An unchanged record still produces the original byte-for-byte HTML.
  assert.equal(render(withParts({})), baseline);
});

test('both toggle forms work: false and { enabled: false }', () => {
  const booleanOff = render(withParts({ bootOverlay: false, bubbleCanvas: false }));
  const objectOff = render(withParts({ bootOverlay: { enabled: false }, bubbleCanvas: { enabled: false } }));
  assert.equal(booleanOff, objectOff);
  for (const marker of [MARKERS.bootOverlay, MARKERS.bubbleCanvas]) assert.ok(!booleanOff.includes(marker));
  assert.ok(render(withParts({ bootOverlay: { enabled: true } })).includes(MARKERS.bootOverlay));
});

test('turning off all desktop parts leaves the content and footer intact', () => {
  const allOff = Object.fromEntries(CHROME_PART_NAMES.map((name) => [name, false]));
  const html = render(withParts(allOff));
  for (const marker of Object.values(MARKERS)) assert.ok(!html.includes(marker), `${marker} survived all-off`);
  assert.match(html, /<main class="wrap" id="main-content">/);
  assert.match(html, /<footer class="site-footer" id="siteFooter">/);
  assert.match(html, /<script src="\/assets\/homepage-gadgets\.js" defer><\/script>/);
});

test('the client degrades cleanly when the theme-engine part is off', () => {
  const js = fs.readFileSync(path.join(root, 'src/client/homepage-desktop.js'), 'utf8');
  assert.match(js, /var themes = Array\.isArray\(window\.VISTA_THEMES\) \? window\.VISTA_THEMES : \[\]/);
  assert.match(js, /var setPalette = typeof window\.paintPalette === 'function'/);
  assert.match(js, /if \(!themes\.length\) return;/);
  assert.ok(!render(withParts({ themeEngine: false })).includes('window.paintPalette'));
});

test('chrome part settings validate from the shared definitions', () => {
  assert.deepEqual(partProblems(homepage), []);
  const withoutConfig = { ...homepage, appearance: { ...homepage.appearance, parts: undefined } };
  assert.deepEqual(partProblems(withoutConfig), []);
  assert.deepEqual(partProblems(withParts({ bootOverlay: true, bubbleCanvas: { enabled: false } })), []);
  assert.deepEqual(partProblems({ ...homepage, appearance: { ...homepage.appearance, parts: 'off' } }), [
    'Fake Space Fog Machine: appearance.parts must be an object'
  ]);
  for (const bad of ['no', 0, null, [], { enabled: 'no' }, { enabled: 0 }]) {
    const problems = partProblems(withParts({ bootOverlay: bad }));
    assert.equal(problems.length, 1, `expected one problem for ${JSON.stringify(bad)}`);
    assert.match(problems[0], /^.*: appearance\.parts\.bootOverlay\.enabled must be true, false, or an object with a boolean enabled field$/);
  }
});
