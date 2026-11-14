import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createStudioPublisher } from '../scripts/studio-publisher.mjs';

const marker = {
  version: 1,
  repository: 'jesseiskewl01/fsfm',
  targetBranch: 'main',
  publishRoots: ['content/v13', 'media', 'audio', 'lyrics'],
};

const workflow = `name: Build and deploy FSFM to GitHub Pages
on:
  push:
    branches:
      - main
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    steps:
      - run: npm run check:all
      - run: npm run predeploy-check
      - uses: actions/deploy-pages@v4
`;

function command(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function writeFile(root, relative, content) {
  const target = path.join(root, ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function setupRepositories({ includeMarker = true } = {}) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-publisher-test-'));
  const bare = path.join(folder, 'origin.git');
  const seed = path.join(folder, 'seed');
  const project = path.join(folder, 'project');
  const dataDir = path.join(folder, 'studio-data');

  fs.mkdirSync(seed);
  command(seed, ['init', '--initial-branch=main']);
  command(seed, ['config', 'user.name', 'FSFM Test']);
  command(seed, ['config', 'user.email', 'fsfm-test@example.invalid']);
  if (includeMarker) writeFile(seed, '.fsfm-studio-deploy.json', JSON.stringify(marker, null, 2));
  writeFile(seed, '.github/workflows/deploy-pages.yml', workflow);
  writeFile(seed, 'content/v13/albums/test-album.json', '{"title":"Original"}\n');
  command(seed, ['add', '.']);
  command(seed, ['commit', '-m', 'Initial production site']);
  command(folder, ['clone', '--bare', seed, bare]);
  command(folder, ['clone', bare, project]);
  command(project, ['config', 'user.name', 'FSFM Test']);
  command(project, ['config', 'user.email', 'fsfm-test@example.invalid']);
  command(project, ['checkout', '-b', 'v16-tinacms-prototype']);
  return { folder, bare, project, dataDir };
}

test('publishing stays locked until the V16 deployment protocol exists on main', async (t) => {
  const fixture = setupRepositories({ includeMarker: false });
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async () => {},
  });
  const status = await publisher.getStatus();
  assert.equal(status.mainReady, false);
  assert.equal(status.canDeploy, false);
  assert.match(status.reason, /merged into main/);
});

test('publication pushes only queued Studio files and preserves the development workspace', async (t) => {
  const fixture = setupRepositories();
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async (worktree) => {
      const productionCopy = fs.readFileSync(path.join(worktree, 'content/v13/albums/test-album.json'), 'utf8');
      assert.match(productionCopy, /Updated from Studio/);
    },
  });

  const relativePath = 'content/v13/albums/test-album.json';
  const saved = '{"title":"Updated from Studio"}\n';
  writeFile(fixture.project, relativePath, saved);
  writeFile(fixture.project, 'tina/tina-lock.json', '{"local":"keep"}\n');
  publisher.recordSavedFile(relativePath, saved);

  const status = await publisher.getStatus();
  assert.equal(status.mainReady, true);
  assert.equal(status.canDeploy, true);
  assert.deepEqual(status.pendingFiles, [relativePath]);

  const result = await publisher.deploy({ confirmation: 'PUBLISH FSFM LIVE' });
  assert.equal(result.ok, true);
  assert.equal(result.noChanges, false);
  assert.match(result.commitSha, /^[a-f0-9]{40}$/);
  assert.deepEqual(result.files, [relativePath]);

  const deployed = command(fixture.bare, ['show', 'main:' + relativePath]);
  assert.equal(deployed, saved.trim());
  assert.equal(fs.readFileSync(path.join(fixture.project, 'tina/tina-lock.json'), 'utf8'), '{"local":"keep"}\n');
  assert.equal(command(fixture.project, ['branch', '--show-current']), 'v16-tinacms-prototype');
  assert.equal(fs.existsSync(path.join(fixture.project, 'tina/tina-lock.json')), true);

  const after = await publisher.getStatus();
  assert.equal(after.pendingCount, 0);
  assert.equal(after.canDeploy, false);
});

test('publication rejects files changed after their local save', async (t) => {
  const fixture = setupRepositories();
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async () => {},
  });
  const relativePath = 'content/v13/albums/test-album.json';
  const saved = '{"title":"Saved version"}\n';
  writeFile(fixture.project, relativePath, saved);
  publisher.recordSavedFile(relativePath, saved);
  writeFile(fixture.project, relativePath, '{"title":"Changed outside Studio"}\n');

  const status = await publisher.getStatus();
  assert.equal(status.canDeploy, false);
  assert.deepEqual(status.conflicts, [relativePath]);
  await assert.rejects(
    publisher.deploy({ confirmation: 'PUBLISH FSFM LIVE' }),
    /changed after they were saved/,
  );
});

test('production checks must pass before any live commit is pushed', async (t) => {
  const fixture = setupRepositories();
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async () => { throw new Error('intentional production-check failure'); },
  });
  const relativePath = 'content/v13/albums/test-album.json';
  const saved = '{"title":"Keep this local"}\n';
  writeFile(fixture.project, relativePath, saved);
  publisher.recordSavedFile(relativePath, saved);
  const mainBefore = command(fixture.bare, ['rev-parse', 'main']);

  await assert.rejects(
    publisher.deploy({ confirmation: 'PUBLISH FSFM LIVE' }),
    /intentional production-check failure/,
  );

  const mainAfter = command(fixture.bare, ['rev-parse', 'main']);
  assert.equal(mainAfter, mainBefore);
  assert.equal((await publisher.getStatus()).pendingCount, 1);
});

test('publishing rejects paths outside the Studio content and media roots', (t) => {
  const fixture = setupRepositories();
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async () => {},
  });
  assert.throws(
    () => publisher.recordSavedFile('tina/config.js', 'not publishable'),
    /only publish website content and media files/,
  );
});

test('publishing requires the explicit confirmation phrase', async (t) => {
  const fixture = setupRepositories();
  t.after(() => fs.rmSync(fixture.folder, { recursive: true, force: true }));
  const publisher = createStudioPublisher({
    projectRoot: fixture.project,
    dataDir: fixture.dataDir,
    allowLocalRemotes: true,
    runChecks: async () => {},
  });
  await assert.rejects(publisher.deploy({ confirmation: 'yes' }), /explicit confirmation phrase/);
});
