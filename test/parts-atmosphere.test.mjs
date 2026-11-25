import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATMOSPHERE_MODES, EFFECTS, resolveEffectMode } from '../src/core/parts.mjs';
import { renderAtmosphere, resolveAtmosphere } from '../src/render/effects.mjs';
import { renderPage, renderSiteShell } from '../src/render/page.mjs';
import { validatePage } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const site = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');
const album = readJson('content/v13/albums/the-early-bird.json');
const homepage = readJson('content/v13/homepage.json');

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
  assert.match(html, /data-template="album"[^>]*data-atmosphere-mode="lite"/);
  assert.match(html, /album-atmosphere\.js/);
});

test('the content-driven atmosphere mode never changes the homepage body', () => {
  const html = renderSiteShell({ page: homepage, site, wallpapers, bodyHtml: '', homepageMode: true });
  assert.match(html, /<body class="template-homepage" data-template="homepage"/);
  assert.doesNotMatch(html, /data-atmosphere-mode=/);
  assert.match(renderPage(withMode(album, 'off'), { site, wallpapers }), /data-atmosphere-mode="off"/);
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
  assert.match(js, /var FRAME_MS = 1000 \/ 24/);
  assert.match(js, /var SCENE_SCALE = 1\.28/);
  assert.match(js, /dpr = Math\.min\(window\.devicePixelRatio \|\| 1, lite \? 0\.62 : 0\.85\)/);
  assert.match(js, /var count = lite \? 26 : \(layerW < 900 \? 34 : 48\)/);
  assert.match(js, /var count = lite \? \(compact \? 70 : 110\) : \(compact \? 150 : 240\)/);
  assert.match(js, /function paintBase\(g\)/);
  assert.match(js, /function paintSmoke\(g\)/);
  assert.match(js, /function paintCore\(g\)/);
  assert.match(js, /function paintStars\(g\)/);
  assert.match(js, /function drawLayer\(layer, offsetX, offsetY, rotation, scale, alpha\)/);
  assert.match(js, /function buildLayers\(\)/);
  assert.match(js, /if \(lite\) \{[\s\S]*?stillLayer = makeLayer\(width, height\);/);
  assert.match(js, /ctx\.drawImage\(stillLayer/);
  assert.match(js, /ctx\.drawImage\(baseLayer/);
  assert.match(js, /drawLayer\(smokeLayer/);
  assert.match(js, /drawLayer\(coreLayer/);
  assert.match(js, /drawLayer\(starLayer/);
  assert.match(js, /document\.addEventListener\('visibilitychange'/);
  assert.match(js, /motionPreference\.addEventListener\('change'/);
  const paint = js.slice(js.indexOf('function paintBase'), js.indexOf('function resizeScene'));
  assert.match(paint, /createLinearGradient/);
  assert.match(paint, /createRadialGradient/);
  const draw = js.slice(js.indexOf('function drawScene'), js.indexOf('function restartScene'));
  assert.match(draw, /drawLayer\(/);
  assert.doesNotMatch(draw, /create(Linear|Radial)Gradient/);
  assert.doesNotMatch(draw, /beginPath|moveTo|lineTo|arc\(|bezierCurveTo/);
  assert.doesNotMatch(draw, /filter\s*:/);
  assert.doesNotMatch(js, /Math\.min\(190,/);
  assert.doesNotMatch(js, /var steps = 22/);
  assert.doesNotMatch(js, /cathedral/);
});

test('the album bloom is album-scoped, richer, and honest about modes', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles/v13.css'), 'utf8');
  assert.match(css, /\.template-album \.bloom-vignette::before/);
  assert.match(css, /\.template-album \.bloom-vignette::after/);
  assert.match(css, /@keyframes nebula-veil-breathe/);
  assert.match(css, /@keyframes nebula-smoke-drift/);
  assert.match(css, /@keyframes nebula-core-pulse/);
  assert.match(css, /\.template-album \.album-atmosphere \{[^}]*mix-blend-mode: normal/);
  const vignette = css.slice(css.indexOf('.template-album .bloom-vignette {'), css.indexOf('.template-album .album-grain'));
  assert.doesNotMatch(vignette, /filter:\s*blur/);
  assert.doesNotMatch(vignette, /mix-blend-mode:\s*screen/);
  assert.doesNotMatch(vignette, /cathedral/);
  assert.match(css, /body\.template-album\[data-atmosphere-mode="lite"\]/);
  assert.match(css, /body\.template-album\[data-atmosphere-mode="off"\] \.bloom-vignette \{ opacity: \.68; animation: none; \}/);
});

test('the atmosphere client does not duplicate the canonical album player', () => {
  const js = fs.readFileSync(path.join(root, 'src/client/album-atmosphere.js'), 'utf8');
  assert.match(js, /getElementById\('nebulaCanvas'\)/);
  assert.doesNotMatch(js, /var TRACKS/);
  assert.doesNotMatch(js, /getElementById\('albumAudio'\)/);
  assert.doesNotMatch(js, /function selectTrack/);
});

test('the three page-behaviour effects are declared as real boolean parts', () => {
  assert.deepEqual(['backgroundEffects', 'pageTransition', 'respectReducedMotion'].map((name) => EFFECTS[name].valueType), ['boolean', 'boolean', 'boolean']);
  for (const name of ['backgroundEffects', 'pageTransition', 'respectReducedMotion']) {
    assert.equal(EFFECTS[name].default, true);
    assert.equal(EFFECTS[name].category, 'effect');
    assert.equal(EFFECTS[name].path, `appearance.effects.${name}`);
    assert.deepEqual([...EFFECTS[name].templates], ['homepage', 'album', 'vista-window', 'editorial']);
  }
});

test('page effects validate as booleans and reach the rendered body', () => {
  const disabled = {
    ...album,
    appearance: {
      ...album.appearance,
      effects: { ...album.appearance.effects, backgroundEffects: false, pageTransition: false, respectReducedMotion: false }
    }
  };
  assert.deepEqual(validatePage(disabled), []);
  const html = renderPage(disabled, { site, wallpapers });
  assert.match(html, /data-background-effects="false"/);
  assert.match(html, /data-page-transition="false"/);
  assert.match(html, /data-respect-reduced-motion="false"/);

  const broken = {
    ...album,
    appearance: { ...album.appearance, effects: { ...album.appearance.effects, pageTransition: 'yes' } }
  };
  const problems = validatePage(broken);
  assert.ok(problems.some((problem) => problem.includes('appearance.effects.pageTransition must be true or false')));
});

test('reduced-motion CSS and the desktop canvas honour the declared effect', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles/v13.css'), 'utf8');
  const homepageCss = fs.readFileSync(path.join(root, 'src/styles/homepage-vista.css'), 'utf8');
  const desktopJs = fs.readFileSync(path.join(root, 'src/client/homepage-desktop.js'), 'utf8');
  assert.match(css, /body\[data-respect-reduced-motion="true"\]\[data-page-transition="true"\] \.site-shell \{ animation: none/);
  assert.match(homepageCss, /body\[data-respect-reduced-motion="true"\] \.reveal/);
  assert.match(desktopJs, /runtimeConfig\.effects\?\.respectReducedMotion === false \|\| !window\.matchMedia/);
});
