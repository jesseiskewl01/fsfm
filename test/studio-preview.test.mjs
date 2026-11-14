import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const homepageStyles = fs.readFileSync(path.join(root, 'src/styles/homepage-vista.css'), 'utf8');

test('preview offers accessible desktop, tablet and mobile viewport controls', () => {
  for (const viewport of ['desktop', 'tablet', 'mobile']) {
    assert.match(studio, new RegExp('data-size="' + viewport + '"'));
    assert.match(studio, new RegExp('aria-label="' + (viewport === 'tablet' ? 'Tablet viewport' : viewport === 'mobile' ? 'Mobile viewport' : 'Desktop viewport')));
  }
  assert.match(studio, /function setPreviewSize\(size\)/);
  assert.match(studio, /aria-pressed/);
});

test('desktop preview uses a true desktop-sized CSS viewport that crosses the homepage gadget breakpoint', () => {
  assert.match(studio, /desktop:\{width:'1442px',height:'902px',label:'Desktop · 1440 × 900 px'/);
  assert.match(studio, /frame\.style\.maxWidth='none'/);
  assert.match(studio, /device-desktop/);
  assert.match(homepageStyles, /@media \(min-width: 1320px\) and \(min-height: 700px\)/);
  assert.match(studio, /preview-frame-wrap\{[^}]*overflow:auto/);
});

test('tablet and mobile previews retain their intended content viewport dimensions', () => {
  assert.match(studio, /width:'784px',height:'1040px',label:'Tablet · 768 × 1024 px'/);
  assert.match(studio, /width:'406px',height:'860px',label:'Mobile · 390 × 844 px'/);
  assert.match(studio, /device-tablet/);
  assert.match(studio, /device-mobile/);
});

test('preview controls and external preview actions have accessible labels', () => {
  assert.match(studio, /aria-label="Preview viewport size"/);
  assert.match(studio, /aria-label="Open preview in a new tab"/);
  assert.match(studio, /title="Refresh the local preview"/);
});
