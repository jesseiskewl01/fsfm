import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Normalize checkout line endings; CI sees LF while Windows checkouts may be CRLF. [OpenCode, 2026-11-24]
const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8').replace(/\r\n/g, '\n');
const validation = fs.readFileSync(path.join(root, '.github/workflows/v15-validation.yml'), 'utf8').replace(/\r\n/g, '\n');

test('Production deployment builds and audits dist before publishing it to GitHub Pages', () => {
  assert.match(workflow, /push:\n\s+branches:\n\s+- main/);
  assert.match(workflow, /npm run check:all/);
  assert.match(workflow, /npm run predeploy-check/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /path: dist/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
});

test('Pull request validation does not create a second deployment run on main pushes', () => {
  assert.match(validation, /pull_request:/);
  assert.doesNotMatch(validation, /\n  push:/);
});
