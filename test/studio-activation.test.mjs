import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');

test('non-homepage page editors expose explicit activate and deactivate actions', () => {
  assert.match(studio, /function pageActivationPanel\(\)/);
  assert.match(studio, /function togglePageActivation\(\)/);
  assert.match(studio, /Deactivate page/);
  assert.match(studio, /Reactivate page/);
  assert.match(studio, /S\.record\.publishing\.published=next/);
  assert.match(studio, /Included in the next production build/);
  assert.match(studio, /Excluded from the next production build/);
});

test('homepage cannot be deactivated through the Studio UI or content API', () => {
  assert.match(studio, /if\(r\.template==='homepage'\)return ''/);
  assert.match(studio, /if\(!S\.record\|\|S\.record\.template==='homepage'\)return/);
  assert.match(server, /existing\.template === 'homepage' && record\?\.publishing\?\.published === false/);
  assert.match(server, /The homepage cannot be deactivated/);
});

test('activation changes remain ordinary local content saves', () => {
  assert.match(studio, /Save local, then deploy/);
  assert.match(studio, /Save &amp; deploy live/);
  assert.match(server, /validatePageForSave\(resource, record\)/);
  assert.match(server, /publisher\.recordSavedFile\(/);
});
