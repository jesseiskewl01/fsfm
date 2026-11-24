import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATMOSPHERE_MODES, EFFECTS, resolveEffectMode } from '../src/core/parts.mjs';
import { renderAtmosphere, resolveAtmosphere } from '../src/render/effects.mjs';
import { renderPage } from '../src/render/page.mjs';
import { validatePage } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const site = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');
const album = readJson('content/v13/albums/the-early-bird.json');

const withMode = (page, mode, template = page.template) => ({
  ...page,
  template,
  appearance: { ...page.appearance, effects: { ...page.appearance.effects, albumAtmosphere: { mode } } }
});

test('atmosphere modes come from one shared definition', () => {
  assert.deepEqual(Object.keys(ATMOSPHERE_MODES), ['full', 'lite', 'off']);
  assert.deepEqual(EFFECTS.albumAtmosphere.modes, ['full', 'lite', 'off']);
  assert.equal(EFFECTS.albumAtmosphere.script, 'album-atmosphere.js');
});

test('historical behaviour is the default: albums on, every other template off', () => {
  assert.equal(resolveEffectMode('albumAtmosphere', { template: 'album' }), 'full');
  assert.equal(resolveEffectMode('albumAtmosphere', { template: 'editorial' }), 'off');
  assert.equal(resolveEffectMode('albumAtmosphere', { template: 'vista-window' }), 'off');
  assert.match(renderAtmosphere({ template: 'album' }).html, /id="nebulaCanvas"/);
  assert.equal(renderAtmosphere({ template: 'editorial' }).html, '');
});

test('the atmosphere is portable: any template can opt in or out', () => {
  for (const template of ['homepage', 'album', 'vista-window', 'editorial']) {
    assert.equal(resolveEffectMode('albumAtmosphere', withMode(album, 'lite', template)), 'lite');
    assert.match(renderAtmosphere(withMode(album, 'lite', template)).html, /data-atmosphere-mode="lite"/);
    assert.equal(resolveEffectMode('albumAtmosphere', withMode(album, 'off', template)), 'off');
    const off = renderAtmosphere(withMode(album, 'off', template));
    assert.doesNotMatch(off.html, /nebulaCanvas/);
    assert.match(off.html, /bloom-vignette/);
  }
});

test('lite and off stay truthful about their scripts', () => {
  const lite = renderAtmosphere(withMode(album, 'lite'));
  const off = renderAtmosphere(withMode(album, 'off'));
  assert.deepEqual(lite.scripts, ['album-atmosphere.js']);
  assert.deepEqual(off.scripts, []);
  assert.equal(resolveAtmosphere(withMode(album, 'full')).label, 'Full');
});

test('turning the canvas off leaves the amber vignette and grain intact', () => {
  const html = renderPage(withMode(album, 'off'), { site, wallpapers });
  assert.doesNotMatch(html, /id="nebulaCanvas"/);
  assert.doesNotMatch(html, /album-atmosphere\.js/);
  assert.match(html, /class="bloom-vignette"/);
  assert.match(html, /class="album-grain"/);
  assert.match(html, /template-album/);
});

test('the configured mode reaches the page shell', () => {
  const html = renderPage(withMode(album, 'lite'), { site, wallpapers });
  assert.match(html, /id="nebulaCanvas" class="album-atmosphere" data-atmosphere-mode="lite"/);
  assert.match(html, /album-atmosphere\.js/);
});

test('invalid modes fall back safely and fail validation from the same definition', () => {
  const broken = withMode(album, 'ultra');
  assert.equal(resolveAtmosphere(broken).mode, 'full');
  const problems = validatePage(broken);
  assert.ok(problems.some((problem) => problem.includes('albumAtmosphere.mode must be one of full, lite, off')));
});

test('the lite client path is a real reduction, not a cosmetic flag', () => {
  const js = fs.readFileSync(path.join(root, 'src/client/album-atmosphere.js'), 'utf8');
  assert.match(js, /getAttribute\('data-atmosphere-mode'\)/);
  assert.match(js, /if \(lite\) dpr/);
  assert.match(js, /if \(lite\) starCount/);
  assert.match(js, /if \(lite\) steps/);
  assert.match(js, /if \(lite\) \{[\s\S]*?drop the two per-frame blur passes/);
  // The full path must remain intact for byte-for-byte visual parity.
  assert.match(js, /Math\.min\(190,/);
  assert.match(js, /var steps = 22/);
  assert.match(js, /1 : 1\.1/);
});

test('the atmosphere client does not duplicate the canonical album player', () => {
  const js = fs.readFileSync(path.join(root, 'src/client/album-atmosphere.js'), 'utf8');
  assert.match(js, /getElementById\('nebulaCanvas'\)/);
  assert.doesNotMatch(js, /var TRACKS/);
  assert.doesNotMatch(js, /getElementById\('albumAudio'\)/);
  assert.doesNotMatch(js, /function selectTrack/);
});
