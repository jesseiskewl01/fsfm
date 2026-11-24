import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const css = read('src/styles/homepage-vista.css');
const albumCss = read('src/styles/v13.css');
const gadgets = read('src/client/homepage-gadgets.js');
const desktop = read('src/client/homepage-desktop.js');
const interactions = read('src/client/homepage-interactions.js');
const components = read('src/render/components.mjs');

test('the first wallpaper star click stops automatic cycling', () => {
  assert.match(desktop, /var cycleTimer = null;/);
  assert.match(desktop, /function stopAutomaticCycle\(\)/);
  assert.match(desktop, /cycleTimer = window\.setInterval/);
  assert.match(desktop, /star\.addEventListener\('click', function\(\)\{ stopAutomaticCycle\(\); cycleTheme\(\); \}\)/);
});

test('widgets have padded hitboxes and push along the drag axis', () => {
  assert.match(gadgets, /var HITBOX_PADDING = 8;/);
  assert.match(gadgets, /function boxAt\(widget, x, y\)/);
  assert.match(gadgets, /function liveBox\(widget\)/);
  assert.match(gadgets, /boxesOverlap\(heldBox, box, gap\)/);
  assert.match(gadgets, /var pushX = Math\.abs\(dx\) >= Math\.abs\(dy\) \? dx : 0;/);
});

test('the barrel roll gadget is no longer hidden by the saved flag', () => {
  assert.match(gadgets, /key === 'showBarrelRoll' \? false : cmsData\.funWidgets\[key\] === false/);
});

test('Purble Place uses a fixed Vista-style window and locks page scroll', () => {
  assert.match(interactions, /function lockPageForPurble\(\)/);
  assert.match(interactions, /document\.body\.classList\.add\('purble-open'\)/);
  assert.match(css, /body\.purble-open\{overflow:hidden/);
  assert.match(css, /\.purble-dialog\{width:min\(920px,100%\)/);
  assert.match(css, /\.purble-frame\{display:block;flex:1 1 auto/);
});

test('the Spotify embed is darkened and its corners are masked', () => {
  assert.match(css, /\.spotify-window-body iframe \{[\s\S]*?filter:brightness\(\.62\)/);
  assert.match(css, /\.spotify-window \.window-title \{ color:#f2f2f5 !important/);
  assert.match(css, /\.spotify-window-body::after \{ content:"";/);
});

test('the small header details are centered and compact', () => {
  assert.match(css, /\.start-orb \{[\s\S]*?width: 26px; height: 26px/);
  assert.match(css, /\.events-window \.bit-container \{[\s\S]*?display:flex; align-items:center; justify-content:center/);
  assert.match(albumCss, /\.template-album \.brand-mark::after \{ content: "✧";/);
});

test('the Early Bird hero uses the album cover as its window icon and has no dark corner seams', () => {
  assert.match(components, /album-window-symbol-art/);
  assert.match(albumCss, /\.album-window-symbol-art \{/);
  assert.match(albumCss, /\.album-hero-window::after \{/);
  assert.match(albumCss, /\.album-hero \{[\s\S]*?border-radius: 0 0 6px 6px/);
});
