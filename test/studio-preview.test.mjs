import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');

test('preview offers accessible desktop, tablet and mobile viewport controls', () => {
  for (const viewport of ['desktop', 'tablet', 'mobile']) {
    assert.match(studio, new RegExp('data-size="' + viewport + '"'));
    assert.match(studio, new RegExp('aria-label="' + (viewport === 'tablet' ? 'Tablet viewport' : viewport === 'mobile' ? 'Mobile viewport' : 'Desktop viewport')));
  }
  assert.match(studio, /function setPreviewSize\(size\)/);
  assert.match(studio, /aria-pressed/);
});

test('tablet and mobile previews use fixed CSS viewport dimensions inside device frames', () => {
  assert.match(studio, /width:'784px',height:'1040px',label:'Tablet · 768 × 1024 px'/);
  assert.match(studio, /width:'406px',height:'860px',label:'Mobile · 390 × 844 px'/);
  assert.match(studio, /device-tablet/);
  assert.match(studio, /device-mobile/);
  assert.match(studio, /preview-frame-wrap\{[^}]*overflow:auto/);
});

test('desktop preview remains fitted to the Studio workspace', () => {
  assert.match(studio, /desktop:\{width:'100%',height:'100%',label:'Desktop · Workspace width'/);
  assert.match(studio, /maxWidth:size==='desktop'\?'100%':'none'/);
  assert.match(studio, /LOCAL PREVIEW/);
});
