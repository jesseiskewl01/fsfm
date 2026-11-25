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
const studio = read('studio/index.html');

test('the first wallpaper star click stops automatic cycling', () => {
  assert.match(desktop, /var cycleTimer = null;/);
  assert.match(desktop, /function stopAutomaticCycle\(\)/);
  assert.match(desktop, /cycleTimer = window\.setInterval/);
  assert.match(desktop, /star\.addEventListener\('click', function\(\)\{ stopAutomaticCycle\(\); cycleTheme\(\); \}\)/);
});

test('widgets live in hero gutters and settle without overlap after a drag', () => {
  assert.doesNotMatch(gadgets, /HITBOX_PADDING|function boxAt|function liveBox/);
  assert.match(gadgets, /var COLLISION_GAP = 12;/);
  assert.match(gadgets, /document\.querySelector\('\.hero-window'\) \|\| document\.querySelector\('\.wrap'\)/);
  assert.match(gadgets, /document\.documentElement\.clientWidth \|\| window\.innerWidth/);
  assert.match(gadgets, /columnsFor\(leftRegion\)/);
  assert.match(gadgets, /columnsFor\(rightRegion\)/);
  assert.match(gadgets, /outside \/ inside \/ outside on each side/);
  assert.match(gadgets, /function settleWidgets\(anchor\)/);
  assert.match(gadgets, /settleWidgets\(widget\);[\s\S]*?savePositions\(\);/);
  assert.match(gadgets, /var clearX = dx > 0 \? heldBox\.x \+ heldBox\.width \+ gap - box\.x/);
  assert.match(gadgets, /A pushed widget is not a user-placed widget/);
  assert.match(gadgets, /Reflow is layout repair, not a user move/);
});

test('the homepage windows keep their order while the lower pair spans both columns', () => {
  assert.match(css, /@media \(min-width: 761px\) \{[\s\S]*?body\.template-homepage \.home-window-grid > \.bio-window \{[\s\S]*?grid-column:1; grid-row:3; position:sticky; top:48px; align-self:start; z-index:20;/);
  assert.match(css, /body\.template-homepage \.home-window-grid \{ display:contents; \}/);
  assert.match(css, /body\.template-homepage \.wrap > \.events-window \{ grid-column:1 \/ -1; grid-row:4; \}/);
  assert.match(css, /body\.template-homepage \.wrap > \.social-window \{ grid-column:1 \/ -1; grid-row:5; \}/);
  assert.match(css, /body\.template-homepage \.wrap > \.site-footer \{ grid-row:6; \}/);
  assert.match(css, /body\.template-homepage:has\(\.home-window-grid > \.bio-window\[hidden\]\) \.wrap \{ grid-template-columns:minmax\(0,1fr\); \}/);
});

test('the first content windows keep a gap below the marquee', () => {
  assert.match(css, /@media \(min-width: 761px\) \{[\s\S]*?body\.template-homepage \.home-window-grid > \.bio-window,\s*body\.template-homepage \.home-window-grid > \.spotify-window \{ margin-top:20px; \}/);
});

test('the Studio topbar and left page menu stay pinned while content scrolls', () => {
  assert.match(studio, /@media\(max-width:1020px\)\{[\s\S]*?\.topbar\{position:sticky;top:0;z-index:30\}/);
  assert.match(studio, /@media\(max-width:1020px\)\{[\s\S]*?\.sidebar\{grid-column:1;grid-row:1\/3;position:sticky;top:70px;height:calc\(100vh - 70px\);min-height:520px;z-index:20\}/);
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

test('the Spotify window keeps its original vanilla chrome and body', () => {
  assert.match(css, /\.vista-window\.content-window, \.content-window \{[\s\S]*?padding:0 6px 6px/);
  assert.match(css, /\.spotify-window-body \{ padding:0; background:#121212; \}/);
  assert.match(css, /\.spotify-window-body iframe \{[^}]*border-radius:0; box-shadow:none; background:#121212; \}/);
  assert.doesNotMatch(css, /\.spotify-window\.content-window/);
  assert.doesNotMatch(css, /\.spotify-window-body::after/);
  assert.doesNotMatch(css, /\.spotify-window::after/);
  assert.doesNotMatch(css, /clip-path:inset\(0 round/);
  assert.doesNotMatch(css, /inset 0 -8px 0 #121212/);
  assert.doesNotMatch(css, /radial-gradient\(circle at 0 0, #121212 0 8px, transparent 9px\)/);
  assert.doesNotMatch(css, /radial-gradient\(circle at 0 100%, rgba\(8,14,18,\.95\)/);
  assert.doesNotMatch(css, /spotify-window-body iframe \{[^}]*filter:brightness/);
  assert.doesNotMatch(css, /\.spotify-window \{ background:#101012 !important/);
});

test('the Spotify embed uses the black color and runtime two-tone corner squares', () => {
  assert.match(gadgets, /var EMBED_URL = 'https:\/\/open\.spotify\.com\/embed\/artist\/2PcGMMcKTObTrK7XVw9GSX\?utm_source=generator&theme=0&si=5263054ac6d0459f'/);
  assert.match(gadgets, /theme=0/);
  assert.match(gadgets, /iframe\.setAttribute\('style', 'border-radius:12px'\)/);
  assert.match(gadgets, /body\.style\.background = 'linear-gradient\(#1F1F1F 0 50%, #121212 50% 100%\)'/);
  assert.match(gadgets, /width:15px;height:15px/);
  assert.match(gadgets, /pointer-events:none;z-index:2/);
  assert.match(gadgets, /fsfm-spotify-corner/);
  assert.match(gadgets, /#1F1F1F/);
  assert.match(gadgets, /#121212/);
  assert.doesNotMatch(gadgets, /#372828|#493A3A/);
});

test('the album header uses the same inset and control geometry as the homepage taskbar', () => {
  assert.match(albumCss, /padding: 3px max\(12px, calc\(\(100% - 920px\) \/ 2\)\)/);
  assert.doesNotMatch(albumCss, /100vw - 880px/);
  assert.match(albumCss, /\.template-album \.brand-mark \{ width: 26px; height: 26px/);
  assert.match(albumCss, /\.template-album \.brand-link \{[^}]*font-size: 12px; font-weight: 700; letter-spacing: normal/);
  assert.match(albumCss, /\.template-album \.site-menu > summary \{\s*min-height: 29px; padding: 3px 13px; letter-spacing: normal; text-transform: none/);
});

test('a Vista-style reset icon clears saved gadget positions on every screen size', () => {
  assert.match(gadgets, /var STORAGE_KEY = 'fsfm_gadget_positions_v2'/);
  assert.match(gadgets, /var LEGACY_STORAGE_KEY = 'fsfm_gadget_positions_v1'/);
  assert.match(gadgets, /document\.querySelector\('\.fsfm-gadgets-extras'\)/);
  assert.match(gadgets, /id="fsfmGadgetReset" class="gadget-reset-button"/);
  assert.match(gadgets, /localStorage\.removeItem\(STORAGE_KEY\)/);
  assert.match(gadgets, /localStorage\.removeItem\(LEGACY_STORAGE_KEY\)/);
  assert.match(gadgets, /new CustomEvent\('fsfm:reset-gadgets'\)/);
  assert.match(gadgets, /window\.addEventListener\('fsfm:reset-gadgets'/);
  assert.match(gadgets, /customPositions = \{\};[\s\S]*?reflowDesktopWidgets\(\);/);
  assert.match(css, /\.fsfm-gadget-reset\{display:flex/);
  assert.match(css, /\.gadget-reset-button\{width:27px;height:20px/);
});

test('gadget layout wakes up when desktop space appears after load', () => {
  assert.doesNotMatch(gadgets, /if \(!layer \|\| !window\.matchMedia\([^\n]*\)\.matches\) return;/);
  assert.match(gadgets, /var desktopQuery = window\.matchMedia\('\(min-width: 1180px\) and \(min-height: 600px\)'\)/);
  assert.match(gadgets, /if \(desktopQuery\.matches\) \{[\s\S]*?settleWidgets\(null\);/);
  assert.match(gadgets, /function scheduleDesktopReflow\(\) \{[\s\S]*?desktopQuery\.matches[\s\S]*?reflowDesktopWidgets/);
  assert.match(gadgets, /desktopQuery\.addEventListener\('change', scheduleDesktopReflow\)/);
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
