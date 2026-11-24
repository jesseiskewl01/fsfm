import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const gadgets = read('src/client/homepage-gadgets.js');
const css = read('src/styles/homepage-vista.css');
const windows = read('src/client/vista-windows.js');
const server = read('scripts/dev-tina-preview.mjs');

test('a dragged top widget pushes widgets it collides with', () => {
  assert.match(gadgets, /function pushOverlappingWidgets\(held, dx, dy\)/);
  assert.match(gadgets, /var COLLISION_GAP = 12;/);
  assert.match(gadgets, /var gap = COLLISION_GAP;/);
  assert.match(gadgets, /function settleWidgets\(anchor\)/);
  assert.match(gadgets, /boxesOverlap\(heldBox, box, gap\)/);
  assert.match(gadgets, /pushOverlappingWidgets\(widget, dx, dy\)/);
  assert.match(gadgets, /pushOverlappingWidgets\(widget, x - beforeX, y - beforeY\)/);
  assert.match(gadgets, /var clearX = dx > 0 \? heldBox\.x \+ heldBox\.width \+ gap - box\.x/);
  assert.match(gadgets, /nx \+= dx > 0 \? clearX : -clearX/);
  assert.doesNotMatch(gadgets, /customPositions\[other\.id\] = true/);
  assert.match(css, /\.fsfm-gadget\.is-dragging/);
  assert.match(css, /\.fsfm-gadget\.gadget-pushed/);
});

test('bottom widgets are not shown as draggable and their slider is readable', () => {
  assert.match(css, /\.fsfm-gadgets-extras \.gadget-grip\{display:none;\}/);
  assert.match(css, /\.fsfm-gadgets-extras \.gadget-range-body input\[type="range"\]::-webkit-slider-thumb/);
  assert.match(css, /\.fsfm-gadgets-extras \.gadget-range-body input\[type="range"\]::-moz-range-thumb/);
  assert.match(css, /\.fsfm-gadgets-extras \.gadget-range-output\{color:#173f57/);
});

test('the Spotify window keeps normal chrome with clipped dark bottom padding', () => {
  assert.doesNotMatch(css, /\.spotify-window \{ background:#101012/);
  assert.match(css, /\.spotify-window\.content-window \{ box-shadow:0 7px 23px rgba\(0,0,0,\.42\),inset 0 0 0 1px #effbffc0,inset 0 -8px 0 #121212; \}/);
  assert.doesNotMatch(css, /\.spotify-window::after/);
  assert.doesNotMatch(css, /radial-gradient\(circle at 0 100%, rgba\(8,14,18,\.95\)/);
  assert.match(css, /clip-path:inset\(0 round 5px\)/);
});

test('the Vista close button closes a window; minimize still minimizes it', () => {
  assert.match(windows, /if\(action==='minimize'\)\{toggleMinimize\(win\);return;\}/);
  assert.match(windows, /if\(action==='close'\)\{win\.classList\.remove\('window-minimized'\);hideWindow\(win,'closed'\);\}/);
  assert.match(windows, /'Reopen · '/);
});

test('Studio accepts localhost and 127.0.0.1 while still blocking other origins', () => {
  assert.match(server, /http:\/\/127\.0\.0\.1:' \+ port, 'http:\/\/localhost:' \+ port/);
  assert.match(server, /studioOrigins\(\)\.includes\(request\.headers\.origin\)/);
  assert.ok(server.includes('Authentication requests must come from this local FSFM Studio origin.'));
});
