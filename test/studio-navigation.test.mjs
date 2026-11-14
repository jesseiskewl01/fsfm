import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');

test('page navigation can search page names and routes without replacing the search field', () => {
  assert.match(studio, /id="pageSearch"/);
  assert.match(studio, /S\.pageSearch\.trim\(\)\.toLowerCase\(\)/);
  assert.match(studio, /String\(item\.name\|\|''\)\+' '\+String\(item\.route\|\|''\)/);
  assert.match(studio, /No pages match/);
  assert.match(studio, /\$\('#pageSearch'\)\.addEventListener\('input'/);
});

test('the selected page is visibly and accessibly marked in the navigation list', () => {
  assert.match(studio, /aria-current=/);
  assert.match(studio, /S\.key===item\.key\?getPagePublicationState\(S\.record\)\.active:item\.published!==false/);
  assert.match(studio, /class="page-state '\+\(active\?'active':'inactive'\)/);
});

test('the live page list remains grouped by page template', () => {
  for (const group of ["['album','Albums']", "['vista-window','Vista pages']", "['editorial','Editorial pages']"]) {
    assert.ok(studio.includes(group), `Missing page group ${group}`);
  }
});
