import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalContentAdapter } from '../scripts/tina-local-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');

test('Studio server uses a local content adapter seam', () => {
  assert.match(server, /createLocalContentAdapter/);
  assert.match(server, /contentAdapter/);
  assert.match(server, /function readContentFile\(resource\)\s*\{\s*return contentAdapter\.read\(resource\);\s*\}/);
  assert.match(server, /function writeContentFile\(resource, currentRaw, record\)\s*\{\s*return contentAdapter\.write\(resource, currentRaw, record\);\s*\}/);
  assert.match(server, /function readStoredPages\(\)\s*\{\s*return contentAdapter\.readStoredPages\(\);\s*\}/);
});

test('local content adapter preserves revision, write and rollback contract', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-adapter-'));
  try {
    const contentRoot = path.join(dir, 'content', 'v13');
    const albumsRoot = path.join(contentRoot, 'albums');
    fs.mkdirSync(albumsRoot, { recursive: true });
    const filePath = path.join(contentRoot, 'homepage.json');
    const record = { schemaVersion: 1, template: 'homepage', identity: { slug: 'home', name: 'Home' } };
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n');

    const saved = [];
    const rebuilt = [];
    const adapter = createLocalContentAdapter({
      projectRoot: dir,
      contentRoot,
      albumsRoot,
      publisher: { recordSavedFile: (relativePath, raw) => saved.push({ relativePath, raw: String(raw) }) },
      scheduleRebuild: () => rebuilt.push(true),
    });

    const resource = { key: 'homepage', filePath };
    const read = adapter.read(resource);
    assert.equal(read.key, 'homepage');
    assert.equal(read.record.identity.name, 'Home');
    assert.match(read.revision, /^[a-f0-9]{64}$/);

    const next = { ...record, identity: { ...record.identity, name: 'Home Updated' } };
    const write = adapter.write(resource, fs.readFileSync(filePath, 'utf8'), next);
    assert.equal(write.ok, true);
    assert.match(write.revision, /^[a-f0-9]{64}$/);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].relativePath.replace(/\\/g, '/'), 'content/v13/homepage.json');
    assert.equal(rebuilt.length, 1);
    assert.equal(adapter.read(resource).record.identity.name, 'Home Updated');

    // write does not validate; server-side validation remains the guard.
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('local content adapter rolls back file when publisher recording fails', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-adapter-'));
  try {
    const contentRoot = path.join(dir, 'content', 'v13');
    fs.mkdirSync(contentRoot, { recursive: true });
    const filePath = path.join(contentRoot, 'homepage.json');
    const original = JSON.stringify({ schemaVersion: 1, name: 'Original' }, null, 2) + '\n';
    fs.writeFileSync(filePath, original);
    const adapter = createLocalContentAdapter({
      projectRoot: dir,
      contentRoot,
      albumsRoot: path.join(contentRoot, 'albums'),
      publisher: { recordSavedFile() { throw new Error('queue failed'); } },
      scheduleRebuild: () => {},
    });
    const resource = { key: 'homepage', filePath };
    assert.throws(() => adapter.write(resource, original, { schemaVersion: 1, name: 'Changed' }), /queue failed/);
    assert.equal(fs.readFileSync(filePath, 'utf8'), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Studio autosave is local-only, debounced, and never deploys', () => {
  assert.match(studio, /autosaveTimer/);
  assert.match(studio, /autosaveMs/);
  assert.match(studio, /function scheduleAutosave\(/);
  assert.match(studio, /function clearAutosave\(/);
  assert.match(studio, /saveLocal\(\{quiet:true,autosave:true\}\)/);
  assert.match(studio, /Auto-saved locally/);
  assert.match(studio, /function scheduleAutosave\(\)\{[^}]*saveLocal\(\{quiet:true,autosave:true\}\)[^}]*\}/);
  assert.doesNotMatch(studio, /function scheduleAutosave\(\)\{[^}]*deployLive/);
  assert.match(studio, /autosaveConflict/);
});

test('autosave preserves explicit Save and stale-revision protection', () => {
  assert.match(studio, /function saveLocal\(options=\{\}\)/);
  assert.match(studio, /clearAutosave\(\);[\s\S]*S\.saving=true/);
  assert.match(studio, /if\(response\.status===409\)throw Error\(apiError\(response,data,'save this page'\)\);/);
  assert.match(studio, /Reload required before saving/);
  assert.match(studio, /Save local/);
  assert.match(studio, /Save &amp; deploy live/);
});
