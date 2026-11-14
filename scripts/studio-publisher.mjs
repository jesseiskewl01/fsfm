import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const REPOSITORY = 'jesseiskewl01/fsfm';
const TARGET_BRANCH = 'main';
const MANIFEST_VERSION = 1;
const PROTOCOL_VERSION = 1;
const PUBLISH_ROOTS = ['content/v13', 'media', 'audio', 'lyrics'];
const MAX_OUTPUT = 1024 * 1024;

function studioError(message, statusCode = 409) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function validateRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') ||
      value.startsWith('/') || /^[a-zA-Z]:/.test(value) || /[\r\n]/.test(value)) {
    throw studioError('The saved file path is not eligible for live publishing.', 422);
  }
  const parts = value.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw studioError('The saved file path is not eligible for live publishing.', 422);
  }
  if (!PUBLISH_ROOTS.some((root) => value.startsWith(root + '/'))) {
    throw studioError('Studio can only publish website content and media files.', 422);
  }
  return value;
}

function localPath(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...relativePath.split('/'));
  if (!resolved.startsWith(resolvedRoot + path.sep)) {
    throw studioError('The saved file path is outside the FSFM project.', 422);
  }
  let cursor = resolvedRoot;
  for (const part of relativePath.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) {
      throw studioError('Symbolic links cannot be included in a Studio publication.', 422);
    }
  }
  return resolved;
}

function run(program, args, cwd, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const append = (current, chunk) => {
      const next = current + chunk.toString('utf8');
      return next.length > MAX_OUTPUT ? next.slice(-MAX_OUTPUT) : next;
    };
    child.stdout.on('data', (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk); });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(studioError('Could not start the required command: ' + error.message, 503));
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(studioError('A publishing command timed out. No live changes were pushed.', 504));
      } else if (code !== 0) {
        const detail = (stderr || stdout).trim().split('\n').slice(-8).join('\n')
          .replace(/https?:\/\/[^@\s]+@/g, 'https://<redacted>@');
        const error = studioError(
          detail ? 'A publishing command failed: ' + detail : 'A publishing command failed with exit code ' + code + '.',
          422,
        );
        error.commandExitCode = code;
        reject(error);
      } else {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      }
    });
  });
}

function git(projectRoot, args, timeoutMs) {
  return run('git', ['-C', projectRoot, ...args], projectRoot, timeoutMs);
}

function parseManifest(filePath) {
  if (!fs.existsSync(filePath)) return { version: MANIFEST_VERSION, files: {} };
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    throw studioError('The Studio publishing queue is unreadable. Its file was left untouched.', 500);
  }
  if (data?.version !== MANIFEST_VERSION || !data.files || typeof data.files !== 'object' || Array.isArray(data.files)) {
    throw studioError('The Studio publishing queue has an unsupported format.', 500);
  }
  for (const [relativePath, entry] of Object.entries(data.files)) {
    validateRelativePath(relativePath);
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) {
      throw studioError('The Studio publishing queue contains an invalid file record.', 500);
    }
  }
  return data;
}

function writeManifest(filePath, manifest) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = filePath + '.' + process.pid + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\n', { flag: 'w', mode: 0o600 });
  fs.renameSync(temporary, filePath);
  try { fs.chmodSync(filePath, 0o600); } catch {
    // Windows inherits access permissions from the current user's profile directory.
  }
}

function expectedRepositoryRemote(remote, allowLocalRemotes) {
  if (allowLocalRemotes && (remote.startsWith('file://') || path.isAbsolute(remote))) return true;
  return /^(?:https?:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)jesseiskewl01\/fsfm(?:\.git)?$/.test(remote);
}

function npmCommand(script) {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return { program: process.execPath, args: [process.env.npm_execpath, 'run', script] };
  }
  if (process.platform === 'win32') {
    return { program: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'npm.cmd run ' + script] };
  }
  return { program: 'npm', args: ['run', script] };
}

async function runProductionChecks(worktreePath) {
  for (const script of ['check:all', 'predeploy-check']) {
    const command = npmCommand(script);
    await run(command.program, command.args, worktreePath, 10 * 60 * 1000);
  }
}

export function createStudioPublisher({
  projectRoot,
  dataDir,
  allowLocalRemotes = false,
  runChecks = runProductionChecks,
} = {}) {
  if (!projectRoot || !dataDir) throw new TypeError('projectRoot and dataDir are required.');
  const root = path.resolve(projectRoot);
  const manifestPath = path.join(path.resolve(dataDir), 'pending-deploy.json');
  let publishing = false;

  function readQueue() {
    return parseManifest(manifestPath);
  }

  function writeQueue(manifest) {
    writeManifest(manifestPath, manifest);
  }

  async function inspectMain() {
    const topLevel = (await git(root, ['rev-parse', '--show-toplevel'])).stdout;
    if (path.resolve(topLevel) !== root) {
      throw studioError('The Studio folder is not the root of its Git repository.', 409);
    }

    const currentBranch = (await git(root, ['branch', '--show-current'])).stdout;
    if (!currentBranch) throw studioError('Live publishing is unavailable from a detached Git checkout.', 409);

    const remote = (await git(root, ['remote', 'get-url', 'origin'])).stdout;
    if (!expectedRepositoryRemote(remote, allowLocalRemotes)) {
      throw studioError('The origin remote is not the FSFM GitHub repository. Nothing was pushed.', 409);
    }

    await git(root, ['fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main'], 180_000);
    const mainSha = (await git(root, ['rev-parse', 'refs/remotes/origin/main'])).stdout;
    let protocol;
    let workflow;
    try {
      protocol = JSON.parse((await git(root, ['show', mainSha + ':.fsfm-studio-deploy.json'])).stdout);
      workflow = (await git(root, ['show', mainSha + ':.github/workflows/deploy-pages.yml'])).stdout;
    } catch {
      return {
        currentBranch,
        mainSha,
        mainReady: false,
        reason: 'Live publishing unlocks after the V16 Studio release has been merged into main.',
      };
    }

    const rootsMatch = Array.isArray(protocol?.publishRoots) &&
      PUBLISH_ROOTS.every((rootPath) => protocol.publishRoots.includes(rootPath));
    const workflowReady =
      /push:\s*\n\s*branches:\s*\n\s*-\s*main/m.test(workflow) &&
      workflow.includes('npm run check:all') &&
      workflow.includes('npm run predeploy-check') &&
      workflow.includes('actions/deploy-pages@v4');

    if (protocol?.version !== PROTOCOL_VERSION || protocol?.repository !== REPOSITORY ||
        protocol?.targetBranch !== TARGET_BRANCH || !rootsMatch || !workflowReady) {
      return {
        currentBranch,
        mainSha,
        mainReady: false,
        reason: 'The live branch does not yet have the required FSFM Studio publishing safeguards.',
      };
    }

    return { currentBranch, mainSha, mainReady: true, reason: '' };
  }

  function inspectPendingFiles(manifest) {
    const conflicts = [];
    for (const [relativePath, entry] of Object.entries(manifest.files)) {
      try {
        const filePath = localPath(root, relativePath);
        if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
          conflicts.push(relativePath);
          continue;
        }
        if (hash(fs.readFileSync(filePath)) !== entry.sha256) conflicts.push(relativePath);
      } catch {
        conflicts.push(relativePath);
      }
    }
    return conflicts;
  }

  async function getStatus() {
    const manifest = readQueue();
    const pendingFiles = Object.keys(manifest.files).sort();
    const conflicts = inspectPendingFiles(manifest);
    let main;
    try {
      main = await inspectMain();
    } catch {
      return {
        targetBranch: TARGET_BRANCH,
        currentBranch: '',
        pendingCount: pendingFiles.length,
        pendingFiles,
        conflicts,
        mainReady: false,
        canDeploy: false,
        reason: 'Cannot verify GitHub main. Check your connection and Git installation, then refresh.',
      };
    }
    const reason = !main.mainReady
      ? main.reason
      : conflicts.length
        ? 'Some files changed after they were saved. Save them locally again before publishing.'
        : pendingFiles.length
          ? ''
          : 'Save a local change before publishing.';
    return {
      targetBranch: TARGET_BRANCH,
      currentBranch: main.currentBranch,
      mainCommit: main.mainSha.slice(0, 7),
      pendingCount: pendingFiles.length,
      pendingFiles,
      conflicts,
      mainReady: main.mainReady,
      canDeploy: main.mainReady && pendingFiles.length > 0 && conflicts.length === 0,
      reason,
    };
  }

  function assertCanSave() {
    if (publishing) throw studioError('A live publication is in progress. Save again when it has finished.', 409);
  }

  function recordSavedFile(relativePath, content) {
    assertCanSave();
    const safePath = validateRelativePath(relativePath);
    const filePath = localPath(root, safePath);
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
      throw studioError('The local file was not found after saving, so it was not added to the publishing queue.', 500);
    }
    const actual = fs.readFileSync(filePath);
    const expected = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
    if (!actual.equals(expected)) {
      throw studioError('The file changed while it was being saved. Reload it before trying again.', 409);
    }
    const manifest = readQueue();
    manifest.files[safePath] = { sha256: hash(actual), savedAt: new Date().toISOString() };
    writeQueue(manifest);
    return { pendingCount: Object.keys(manifest.files).length };
  }

  async function deploy({ confirmation } = {}) {
    if (publishing) throw studioError('A live publication is already in progress.', 409);
    if (confirmation !== 'PUBLISH FSFM LIVE') {
      throw studioError('Live publishing requires the explicit confirmation phrase.', 422);
    }

    publishing = true;
    let temporaryRoot = '';
    let worktreePath = '';
    let worktreeAdded = false;
    try {
      const manifest = readQueue();
      const snapshot = { ...manifest.files };
      const paths = Object.keys(snapshot).sort();
      if (!paths.length) throw studioError('There are no locally saved changes waiting to publish.', 409);

      const status = await getStatus();
      if (!status.mainReady) throw studioError(status.reason || 'Live publishing is not ready.', 409);
      if (status.conflicts.length) {
        throw studioError('Some files changed after they were saved. Save them locally again before publishing.', 409);
      }

      for (const relativePath of paths) {
        const filePath = localPath(root, relativePath);
        if (!fs.existsSync(filePath) || hash(fs.readFileSync(filePath)) !== snapshot[relativePath].sha256) {
          throw studioError(relativePath + ' changed after it was saved. Save it locally again before publishing.', 409);
        }
      }

      const mainSha = (await git(root, ['rev-parse', 'refs/remotes/origin/main'])).stdout;
      temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-studio-publish-'));
      worktreePath = path.join(temporaryRoot, 'main');
      await git(root, ['worktree', 'add', '--detach', worktreePath, mainSha], 180_000);
      worktreeAdded = true;

      for (const relativePath of paths) {
        const source = localPath(root, relativePath);
        const target = localPath(worktreePath, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }

      await runChecks(worktreePath);

      // Refuse to publish a stale snapshot if another local save occurred during validation.
      const latestManifest = readQueue();
      for (const relativePath of paths) {
        const currentEntry = latestManifest.files[relativePath];
        const currentFile = localPath(root, relativePath);
        if (!currentEntry || currentEntry.sha256 !== snapshot[relativePath].sha256 ||
            !fs.existsSync(currentFile) || hash(fs.readFileSync(currentFile)) !== snapshot[relativePath].sha256) {
          throw studioError(relativePath + ' changed during publishing checks. Nothing was pushed.', 409);
        }
      }

      await git(worktreePath, ['add', '--', ...paths]);
      const staged = (await git(worktreePath, ['status', '--porcelain'])).stdout;
      if (!staged) {
        const refreshed = readQueue();
        for (const relativePath of paths) {
          if (refreshed.files[relativePath]?.sha256 === snapshot[relativePath].sha256) {
            delete refreshed.files[relativePath];
          }
        }
        writeQueue(refreshed);
        return {
          ok: true,
          noChanges: true,
          files: paths,
          targetBranch: TARGET_BRANCH,
          message: 'Those files already match the live branch. Nothing needed to be pushed.',
        };
      }

      const userName = (await git(worktreePath, ['config', '--get', 'user.name'])).stdout;
      const userEmail = (await git(worktreePath, ['config', '--get', 'user.email'])).stdout;
      if (!userName || !userEmail) {
        throw studioError('Git needs your commit identity before it can publish. Set user.name and user.email, then retry.', 409);
      }

      await git(worktreePath, ['commit', '-m', 'Publish FSFM Studio content']);
      const commitSha = (await git(worktreePath, ['rev-parse', 'HEAD'])).stdout;
      await git(worktreePath, ['push', 'origin', 'HEAD:refs/heads/main'], 180_000);

      const remaining = readQueue();
      for (const relativePath of paths) {
        if (remaining.files[relativePath]?.sha256 === snapshot[relativePath].sha256) {
          delete remaining.files[relativePath];
        }
      }
      writeQueue(remaining);

      return {
        ok: true,
        noChanges: false,
        commitSha,
        files: paths,
        targetBranch: TARGET_BRANCH,
        actionsUrl: 'https://github.com/' + REPOSITORY + '/actions',
        message: 'The content commit was pushed to main. GitHub Actions is now validating and deploying it.',
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw studioError(error.message || 'Live publishing failed. Your local files were kept.', 502);
    } finally {
      if (worktreeAdded && worktreePath) {
        try { await git(root, ['worktree', 'remove', '--force', worktreePath], 60_000); } catch {
          // The worktree is generated in a unique temporary folder; pruning only removes stale metadata.
          try { await git(root, ['worktree', 'prune'], 60_000); } catch {}
        }
      }
      if (temporaryRoot) {
        try { fs.rmSync(temporaryRoot, { recursive: true, force: true }); } catch {}
      }
      publishing = false;
    }
  }

  return { getStatus, recordSavedFile, deploy, assertCanSave };
}
