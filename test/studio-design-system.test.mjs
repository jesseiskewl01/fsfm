import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');

test('Studio V16.8 uses the deeper Night Workshop palette and layered visual system', () => {
  for (const token of ['--bg:#09070f', '--surface:#14101d', '--surface-2:#1b1627', '--accent:#bd91ff', '--shadow-soft:', '--shadow-deep:']) {
    assert.ok(studio.includes(token), `Missing V16.8 design token ${token}`);
  }
  assert.match(studio, /linear-gradient\(145deg,#e8d7ff 0%,#c49aff 54%,#7951a6 100%\)/);
  assert.match(studio, /\.panel:hover/);
  assert.match(studio, /\.section-card\[open\]>summary/);
  assert.match(studio, /\.page-search:focus/);
});

test('responsive layouts cover desktop, tablet, mobile and narrow-phone widths', () => {
  for (const breakpoint of ['1370px', '1150px', '1020px', '760px', '480px']) {
    assert.ok(studio.includes(`@media(max-width:${breakpoint})`), `Missing responsive breakpoint ${breakpoint}`);
  }
  assert.match(studio, /\.workspace\{display:flex;flex-direction:column;gap:0\}/);
  assert.match(studio, /\.preview\{height:min\(76vh,760px\);min-height:540px;grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(studio, /\.page-list\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('keyboard focus, labelled search and reduced-motion preferences are respected', () => {
  assert.match(studio, /:focus-visible/);
  assert.match(studio, /prefers-reduced-motion:reduce/);
  assert.match(studio, /id="pageSearch"[^>]+aria-label="Search pages by name or URL"/);
  assert.match(studio, /aria-current=/);
});

test('block editors use progressive disclosure rather than expanding every block at once', () => {
  assert.match(studio, /class="section-card"\x27\+\(index===0\?\x27 open\x27:\x27\x27\)/);
  assert.match(studio, /const openAttr=depth===0\?' open':''/);
});
