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
  assert.match(js, /Math\.min\(190,/);
  assert.match(js, /var steps = 22/);
  assert.match(js, /1 : 1\.1/);
});

test('V15 homepage widgets form the intended six-window frame with loose bonus positions', () => {
  const js = read('src/client/homepage-gadgets.js');
  for (const id of ['gadget-clock', 'gadget-now-playing', 'gadget-dates', 'gadget-calendar', 'gadget-photos', 'gadget-note']) {
    assert.match(js, new RegExp("'" + id + "':"));
  }
  assert.match(js, /var leftOuter = 16/);
  assert.match(js, /var leftInner = 34/);
  assert.match(js, /var rightInner = viewportWidth - mainWidth - 34/);
  for (const id of ['gadget-barrel-roll', 'gadget-bubbles', 'gadget-radio', 'gadget-purble']) {
    assert.match(js, new RegExp("'" + id + "':"));
  }
  assert.match(js, /wrapLeft \+ 22/);
  assert.match(js, /wrapRight - compactWidth - 22/);
  assert.match(js, /fsfm_gadget_positions_v2/);
  assert.match(js, /isLegacyDefault/);
});
