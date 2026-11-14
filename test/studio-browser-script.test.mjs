import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const login = fs.readFileSync(path.join(root, 'studio/login.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');

function inlineScript(source, expression) {
  const match = source.match(expression);
  assert.ok(match, 'Expected an inline browser script');
  return match[1].replace(/^import\s+.+?;\s*/m, '');
}

test('the Studio ES module script parses before it reaches a browser', () => {
  const source = inlineScript(studio, /<script type="module">([\s\S]*?)<\/script>/);
  assert.doesNotThrow(() => new vm.Script(source, { filename: 'studio/index.inline.js' }));
});

test('the shared page-state module is served with a JavaScript MIME type', () => {
  assert.match(studio, /from '\.\/page-state\.mjs'/);
  assert.match(server, /'\.mjs': 'text\/javascript; charset=utf-8'/);
});

test('the sign-in script parses and remains a standalone browser script', () => {
  const source = inlineScript(login, /<script>([\s\S]*?)<\/script>/);
  assert.doesNotThrow(() => new vm.Script(source, { filename: 'studio/login.inline.js' }));
});
