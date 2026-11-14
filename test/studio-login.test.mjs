import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const login = fs.readFileSync(path.join(root, 'studio/login.html'), 'utf8');

test('the sign-in and first-run setup screens share the V16.8 Night Workshop identity', () => {
  assert.match(login, /name="theme-color" content="#09070f"/);
  assert.match(login, /background:#09070f/);
  assert.match(login, /#4a365e/);
  assert.match(login, /linear-gradient\(145deg,#e8d7ff 0%,#c49aff 54%,#7951a6 100%\)/);
  assert.match(login, /@media\(max-width:480px\)/);
});

test('the authentication form, password rules and session behaviour remain intact', () => {
  assert.match(login, /id="authForm"/);
  assert.match(login, /id="confirmPassword"/);
  assert.match(login, /Use at least 12 characters/);
  assert.match(login, /__fsfm\/api\/auth\/status/);
  assert.match(login, /__fsfm\/api\/auth\/\x27\+\(setup\?'setup':'login'\)/);
  assert.match(login, /window\.location\.replace\('\/studio\/'\)/);
  assert.match(login, /autocomplete="current-password"/);
  assert.match(login, /autocomplete="new-password"/);
});
