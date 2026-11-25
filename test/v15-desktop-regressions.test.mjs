import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('V15 scrollbar styling avoids universal gutters and hard right rails', () => {
  for (const file of ['src/styles/homepage-vista.css', 'src/styles/v13.css']) {
    const css = read(file);
    assert.doesNotMatch(css, /scrollbar-gutter:\s*stable/);
    assert.doesNotMatch(css, /\*::-webkit-scrollbar-track\s*\{[^}]*border-left:/s);
  }
});

test('V15 album page entrance leaves fixed navigation viewport-relative', () => {
  const css = read('src/styles/v13.css');
  const entrance = css.match(/@keyframes fsfm-page-enter\s*\{\s*from\s*\{[^}]*\}\s*to\s*\{[^}]*\}\s*\}/s);
  assert.ok(entrance);
  assert.doesNotMatch(entrance[0], /transform:/);
});

test('V15 homepage ambient bubbles use cached sprites and a 30 FPS cap', () => {
  const js = read('src/client/homepage-desktop.js');
  assert.match(js, /function createBubbleSprite\(/);
  assert.match(js, /ctx\.drawImage\(bub\.sprite/);
  assert.match(js, /1000\s*\/\s*30/);
  const draw = js.slice(js.indexOf('function drawAeroScene'), js.indexOf('function startAmbientAnimation'));
  assert.doesNotMatch(draw, /createRadialGradient/);
});

test('V15 album atmosphere has a bounded canvas workload', () => {
  const js = read('src/client/album-atmosphere.js');
  assert.match(js, /var FRAME_MS = 1000 \/ 24/);
  assert.match(js, /var skyLayer = null, shaftLayer = null, starLayer = null, stillLayer = null/);
  assert.match(js, /function buildLayers\(\)/);
  const draw = js.slice(js.indexOf('function drawScene'), js.indexOf('function restartScene'));
  assert.match(draw, /ctx\.drawImage\(/);
  assert.doesNotMatch(draw, /create(Linear|Radial)Gradient|beginPath|filter\s*:/);
  assert.doesNotMatch(js, /Math\.min\(190,/);
  assert.doesNotMatch(js, /var steps = 22/);
});

test('V15 homepage widgets form the intended six-window frame with loose bonus positions', () => {
  const js = read('src/client/homepage-gadgets.js');
  for (const id of ['gadget-clock', 'gadget-now-playing', 'gadget-dates', 'gadget-calendar', 'gadget-photos', 'gadget-note']) {
    assert.match(js, new RegExp("'" + id + "':"));
  }
  assert.match(js, /var COLLISION_GAP = 12/);
  assert.match(js, /var COLUMN_GAP = 24/);
  assert.match(js, /var leftRegion = \{ start:edge, end:Math\.max\(edge \+ mainWidth, heroLeft - REGION_GAP\) \}/);
  assert.match(js, /var rightRegion = \{ start:Math\.min\(viewportWidth - edge - mainWidth, heroRight \+ REGION_GAP\), end:viewportWidth - edge \}/);
  // Three staggered rows: outer / inner / outer on both sides.
  assert.match(js, /'gadget-clock': \[leftOuter, rows\[0\]\]/);
  assert.match(js, /'gadget-now-playing': \[leftInner, rows\[1\]\]/);
  assert.match(js, /'gadget-dates': \[leftOuter, rows\[2\]\]/);
  assert.match(js, /'gadget-calendar': \[rightOuter, rows\[0\]\]/);
  assert.match(js, /'gadget-photos': \[rightInner, rows\[1\]\]/);
  assert.match(js, /'gadget-note': \[rightOuter, rows\[2\]\]/);
  assert.match(js, /var rowHeights = \[[\s\S]*?Math\.max\(clockHeight, calendarHeight\)/);
  assert.match(js, /var minGap = leftPaired && rightPaired \? -4 : COLLISION_GAP/);
  // Extra widgets are rendered below footer, not in the fixed desktop gadget layout. [OpenCode, 2026-11-22]
  assert.match(js, /Widgets live in the gutters between the website edges and the hero edges\./);
  assert.match(js, /fsfm_gadget_positions_v2/);
  assert.match(js, /isLegacyDefault/);
  assert.match(js, /function boxesOverlap/);
  assert.match(js, /function resolveWidgetCollisions/);
  assert.ok(js.indexOf('var widgetById = {}') < js.indexOf('resolveWidgetCollisions(defaultPositions)'), 'widget lookup must exist before initial collision resolution');
});
