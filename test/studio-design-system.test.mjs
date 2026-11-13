import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');

test('Studio uses a shared visual design system for its surfaces and typography', () => {
  for (const token of ['--surface-raised:', '--surface-hover:', '--line-strong:', '--accent-strong:', '--shadow-soft:', '--shadow-deep:']) {
    assert.ok(studio.includes(token), `Missing design token ${token}`);
  }
  assert.match(studio, /backdrop-filter:blur\(20px\)/);
  assert.match(studio, /linear-gradient\(145deg,#e6d5ff/);
  assert.match(studio, /\.panel:hover/);
  assert.match(studio, /\.section-card\[open\]>summary/);
});

test('keyboard focus and reduced-motion preferences are respected', () => {
  assert.match(studio, /:focus-visible/);
  assert.match(studio, /prefers-reduced-motion:reduce/);
  assert.match(studio, /outline:2px solid/);
});

test('nested settings use progressive disclosure while root editor groups stay open', () => {
  assert.match(studio, /const openAttr=depth===0\?' open':''/);
  assert.match(studio, /class="json-object depth-/);
  assert.match(studio, /<summary>/);
});
