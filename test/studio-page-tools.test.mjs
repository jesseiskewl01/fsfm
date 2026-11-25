import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalContentAdapter } from '../scripts/tina-local-adapter.mjs';
import { createStudioPublisher } from '../scripts/studio-publisher.mjs';
import {
  buildDuplicatePage,
  buildRenamedPage,
  buildRetiredPage,
  findReusableCarcass,
} from '../src/core/page-tools.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');
const sourceVistaPath = path.join(root, 'content/v13/vista-pages/vistatest.json');
const sourceVista = JSON.parse(fs.readFileSync(sourceVistaPath, 'utf8'));
if (sourceVista.publishing) delete sourceVista.publishing.retired;

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-page-tools-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const contentRoot = path.join(dir, 'content', 'v13');
  fs.cpSync(path.join(root, 'content', 'v13'), contentRoot, { recursive: true });
  const vistaPath = path.join(contentRoot, 'vista-pages', 'vistatest.json');
  const vistaFixture = JSON.parse(fs.readFileSync(vistaPath, 'utf8'));
  if (vistaFixture.publishing) delete vistaFixture.publishing.retired;
  fs.writeFileSync(vistaPath, JSON.stringify(vistaFixture, null, 2) + '\n');
  const saved = [];
  const forgotten = [];
  const rebuilt = [];
  const adapter = createLocalContentAdapter({
    projectRoot: dir,
    contentRoot,
    albumsRoot: path.join(contentRoot, 'albums'),
    publisher: {
      recordSavedFile(relativePath, raw) { saved.push({ relativePath, raw: String(raw) }); },
      forgetSavedFile(relativePath) { forgotten.push(relativePath); },
    },
    scheduleRebuild: () => rebuilt.push(true),
  });
  return { dir, contentRoot, adapter, saved, forgotten, rebuilt };
}

function vistaResource(contentRoot) {
  return { key: 'vista-pages/vistatest', filePath: path.join(contentRoot, 'vista-pages', 'vistatest.json') };
}

test('retired tombstones preserve the full page and only change publication flags', () => {
  const retired = buildRetiredPage(sourceVista);
  assert.equal(retired.publishing.retired, true);
  assert.equal(retired.publishing.published, false);
  assert.equal(retired.publishing.showInNavigation, false);
  assert.deepEqual(retired.identity, sourceVista.identity);
  assert.deepEqual(retired.appearance, sourceVista.appearance);
  assert.deepEqual(retired.seo, sourceVista.seo);
  assert.deepEqual(retired.sections, sourceVista.sections);
  assert.deepEqual(retired.templateData, sourceVista.templateData);
  assert.equal(sourceVista.publishing.retired, undefined);
  assert.equal(findReusableCarcass([sourceVista, retired], 'vista-window'), retired);
});

test('rename and duplicate helpers update routes without mutating the source', () => {
  const renamed = buildRenamedPage(sourceVista, { name: 'Renamed Test', slug: 'renamed-test' }, { siteName: 'FSFM' });
  assert.equal(renamed.identity.name, 'Renamed Test');
  assert.equal(renamed.identity.slug, 'renamed-test');
  assert.equal(renamed.identity.route, '/pages/renamed-test/');
  assert.match(renamed.seo.title, /Renamed Test/);
  assert.equal(sourceVista.identity.name, 'vistatest');

  const duplicated = buildDuplicatePage(sourceVista, { name: 'Copied Test', slug: 'copied-test' }, { siteName: 'FSFM' });
  assert.equal(duplicated.publishing.published, false);
  assert.equal(duplicated.publishing.retired, undefined);
  assert.equal(duplicated.identity.route, '/pages/copied-test/');
  assert.deepEqual(duplicated.sections, sourceVista.sections);
});

test('Studio exposes the violet-haze terminal, friendly wallpaper labels, and page lifecycle tools', () => {
  assert.match(studio, /--crt-black:#000000/);
  assert.match(studio, /--crt-green:#c9a2ff/);
  assert.match(studio, /--crt-violet:#e3d0ff/);
  assert.match(studio, /--accent:#b873ff/);
  assert.match(studio, /--green:#c9a2ff/);
  assert.match(studio, /True-black violet-phosphor terminal/);
  assert.match(studio, /'vista-violet-haze':'purple \(violet haze\)'/);
  assert.match(studio, /'vista-rose-bloom':'pink \(rose bloom\)'/);
  assert.ok(studio.includes('id="discardButton"'));
  assert.ok(studio.includes('function discardLocalEdits(){'));
  assert.ok(studio.includes('data-duplicate-section'));
  assert.ok(studio.includes('function duplicateSection(index){'));
  assert.ok(studio.includes('class="page-dirty"'));
  assert.ok(studio.includes('id="retireWarningDialog"'));
  assert.ok(studio.includes('id="retireConfirmDialog"'));
  assert.ok(studio.includes("Type “'+item.name+'” exactly"));
  assert.ok(studio.includes('data-page-tool="rename"'));
  assert.ok(studio.includes('data-page-tool="duplicate"'));
  assert.ok(studio.includes('data-page-tool="retire"'));
  assert.ok(studio.includes("api+'/content/retire'"));
  assert.ok(studio.includes("'/content/rename':'/content/duplicate'"));
  assert.ok(studio.includes("const endpoint=tool==='rename'"));
  assert.ok(studio.includes('item.retired===true'));
  assert.ok(studio.includes('All pages are retired'));
});

test('local API exposes retired state and routes every page lifecycle change through the adapter', () => {
  assert.match(server, /retired: page\.publishing\?\.retired === true/);
  assert.match(server, /contentAdapter\.retirePage\(/);
  assert.match(server, /contentAdapter\.renamePage\(/);
  assert.match(server, /contentAdapter\.duplicatePage\(/);
  assert.match(server, /buildRetiredPage\(current\)/);
  assert.match(server, /buildRenamedPage\(current/);
  assert.match(server, /buildDuplicatePage\(current/);
  assert.ok(server.includes("ignoreKeys: carcass ? [pageKeyForRecord(carcass)] : []"));
  assert.ok(server.includes('Page changes must come from this local FSFM Studio origin.'));
  assert.ok(server.includes('Authentication requests must come from this local FSFM Studio origin.'));
  assert.ok(server.includes('The homepage cannot be deactivated.'));
});

test('retiring keeps the JSON file and marks it reusable', async (t) => {
  const { contentRoot, adapter, saved, rebuilt } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  const retired = buildRetiredPage(current.record);
  const result = await adapter.retirePage({
    key: resource.key,
    record: retired,
    revision: current.revision,
    name: current.record.identity.name,
  });
  assert.equal(result.reusedCarcass, false);
  assert.equal(fs.existsSync(resource.filePath), true);
  const stored = JSON.parse(fs.readFileSync(resource.filePath, 'utf8'));
  assert.equal(stored.publishing.retired, true);
  assert.equal(stored.publishing.published, false);
  assert.deepEqual(stored.sections, current.record.sections);
  assert.equal(saved.length, 1);
  assert.equal(rebuilt.length, 1);
});

test('renaming moves the JSON file to the new slug and drops the old publish queue path', async (t) => {
  const { contentRoot, adapter, saved, forgotten } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  const renamed = buildRenamedPage(current.record, { name: 'Renamed Test', slug: 'renamed-test' }, { siteName: 'FSFM' });
  const result = await adapter.renamePage({ key: resource.key, record: renamed, revision: current.revision });
  const nextPath = path.join(contentRoot, 'vista-pages', 'renamed-test.json');
  assert.equal(result.key, 'vista-pages/renamed-test');
  assert.equal(fs.existsSync(resource.filePath), false);
  assert.equal(fs.existsSync(nextPath), true);
  const stored = JSON.parse(fs.readFileSync(nextPath, 'utf8'));
  assert.equal(stored.identity.name, 'Renamed Test');
  assert.equal(stored.identity.route, '/pages/renamed-test/');
  assert.ok(forgotten.includes('content/v13/vista-pages/vistatest.json'));
  assert.ok(saved.some((entry) => entry.relativePath === 'content/v13/vista-pages/renamed-test.json'));
});

test('creating another page of the same type renames and reuses the retired carcass', async (t) => {
  const { contentRoot, adapter, saved, forgotten } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  await adapter.retirePage({
    key: resource.key,
    record: buildRetiredPage(current.record),
    revision: current.revision,
    name: current.record.identity.name,
  });

  const created = await adapter.createPage({
    template: 'vista-window',
    name: 'Fresh Page',
    slug: 'fresh-page',
    published: false,
    showInNavigation: true,
  });
  const nextPath = path.join(contentRoot, 'vista-pages', 'fresh-page.json');
  assert.equal(created.reusedCarcass, true);
  assert.equal(created.key, 'vista-pages/fresh-page');
  assert.equal(fs.existsSync(resource.filePath), false);
  assert.equal(fs.existsSync(nextPath), true);
  const stored = JSON.parse(fs.readFileSync(nextPath, 'utf8'));
  assert.equal(stored.identity.name, 'Fresh Page');
  assert.equal(stored.publishing.retired, undefined);
  assert.ok(forgotten.includes('content/v13/vista-pages/vistatest.json'));
  assert.ok(saved.some((entry) => entry.relativePath === 'content/v13/vista-pages/fresh-page.json'));
});

test('creating with the same slug reuses the retired carcass without replacing an active file', async (t) => {
  const { contentRoot, adapter, saved } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  await adapter.retirePage({
    key: resource.key,
    record: buildRetiredPage(current.record),
    revision: current.revision,
    name: current.record.identity.name,
  });

  const created = await adapter.createPage({
    template: 'vista-window',
    name: 'Fresh Page',
    slug: 'vistatest',
    published: false,
    showInNavigation: true,
  });
  assert.equal(created.reusedCarcass, true);
  assert.equal(created.key, 'vista-pages/vistatest');
  assert.equal(fs.existsSync(resource.filePath), true);
  const stored = JSON.parse(fs.readFileSync(resource.filePath, 'utf8'));
  assert.equal(stored.identity.name, 'Fresh Page');
  assert.equal(stored.publishing.retired, undefined);
  assert.ok(saved.some((entry) => entry.relativePath === 'content/v13/vista-pages/vistatest.json'));
});

test('duplicating reuses a carcass and keeps the source page untouched', async (t) => {
  const { contentRoot, adapter } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  const originalRaw = fs.readFileSync(resource.filePath, 'utf8');
  const carcass = buildRetiredPage(current.record);
  carcass.identity = { ...carcass.identity, name: 'Old Carcass', slug: 'old-carcass', route: '/pages/old-carcass/' };
  fs.writeFileSync(
    path.join(contentRoot, 'vista-pages', 'old-carcass.json'),
    JSON.stringify(carcass, null, 2) + '\n',
  );
  const duplicate = buildDuplicatePage(
    JSON.parse(originalRaw),
    { name: 'Copied Test', slug: 'copied-test' },
    { siteName: 'FSFM' },
  );
  const result = await adapter.duplicatePage({ key: resource.key, record: duplicate });
  const nextPath = path.join(contentRoot, 'vista-pages', 'copied-test.json');
  assert.equal(result.reusedCarcass, true);
  assert.equal(result.key, 'vista-pages/copied-test');
  assert.equal(fs.existsSync(path.join(contentRoot, 'vista-pages', 'old-carcass.json')), false);
  assert.equal(fs.existsSync(resource.filePath), true);
  assert.equal(fs.readFileSync(resource.filePath, 'utf8'), originalRaw);
  assert.equal(fs.existsSync(nextPath), true);
  const stored = JSON.parse(fs.readFileSync(nextPath, 'utf8'));
  assert.equal(stored.identity.name, 'Copied Test');
  assert.equal(stored.publishing.published, false);
  assert.equal(stored.publishing.retired, undefined);
  assert.deepEqual(stored.sections, JSON.parse(originalRaw).sections);
});

test('a stale revision cannot rename a page', async (t) => {
  const { contentRoot, adapter } = fixture(t);
  const resource = vistaResource(contentRoot);
  const current = await adapter.read(resource);
  const renamed = buildRenamedPage(current.record, { name: 'Stale Test', slug: 'stale-test' }, { siteName: 'FSFM' });
  await assert.rejects(
    adapter.renamePage({ key: resource.key, record: renamed, revision: 'a'.repeat(64) }),
    /changed on disk after you opened it/,
  );
  assert.equal(fs.existsSync(resource.filePath), true);
  assert.equal(fs.existsSync(path.join(contentRoot, 'vista-pages', 'stale-test.json')), false);
});

test('the publisher can forget a queued path without deleting its local file', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-forget-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dataDir = path.join(dir, 'studio-data');
  const relativePath = 'content/v13/demo.json';
  const filePath = path.join(dir, ...relativePath.split('/'));
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '{"ok":true}\n');
  const publisher = createStudioPublisher({ projectRoot: dir, dataDir });
  publisher.recordSavedFile(relativePath, '{"ok":true}\n');
  const manifestPath = path.join(dataDir, 'pending-deploy.json');
  assert.ok(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files[relativePath]);
  publisher.forgetSavedFile(relativePath);
  assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files, {});
  assert.equal(fs.readFileSync(filePath, 'utf8'), '{"ok":true}\n');
});
