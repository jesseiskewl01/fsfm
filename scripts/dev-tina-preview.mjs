import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = path.join(projectRoot, 'preview-v13');
const adminRoot = path.join(projectRoot, 'admin');
const contentRoot = path.join(projectRoot, 'content', 'v13');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.lrc': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function buildPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/build-v13.mjs', '--preview', '--include-drafts'],
      { cwd: projectRoot, stdio: 'inherit' },
    );

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error('FSFM preview build failed with exit code ' + code));
    });
  });
}

function safeFilePath(base, relativePath) {
  const resolvedBase = path.resolve(base);
  const resolvedFile = path.resolve(resolvedBase, relativePath);
  if (resolvedFile !== resolvedBase && !resolvedFile.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedFile;
}

function sendFile(response, filePath, method) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Not found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Content-Length': fs.statSync(filePath).size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  if (method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const base = isAdmin ? adminRoot : previewRoot;
  let relativePath = isAdmin ? pathname.replace(/^\/admin\/?/, '') : pathname.replace(/^\/+/, '');

  if (!relativePath) relativePath = 'index.html';

  let filePath = safeFilePath(base, relativePath);
  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (isAdmin && pathname === '/admin') {
    response.writeHead(302, { Location: '/admin/index.html', 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  sendFile(response, filePath, request.method);
});

let building = false;
let rebuildPending = false;
let buildTimer;

async function rebuild() {
  if (building) {
    rebuildPending = true;
    return;
  }

  building = true;
  do {
    rebuildPending = false;
    try {
      await buildPreview();
      console.log('[FSFM preview] Rebuilt from the latest content files.');
    } catch (error) {
      console.error('[FSFM preview] Keeping the last successful preview:', error.message);
    }
  } while (rebuildPending);
  building = false;
}

function scheduleRebuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    rebuildPending = true;
    void rebuild();
  }, 300);
}

async function start() {
  await buildPreview();

  const watchDirectories = [
    contentRoot,
    path.join(contentRoot, 'albums'),
    path.join(contentRoot, 'vista-pages'),
    path.join(contentRoot, 'editorial-pages'),
  ];

  for (const directory of watchDirectories) {
    if (!fs.existsSync(directory)) continue;
    try {
      fs.watch(directory, { persistent: true }, scheduleRebuild);
    } catch (error) {
      console.warn('[FSFM preview] Could not watch ' + directory + ': ' + error.message);
    }
  }

  server.listen(port, host, () => {
    console.log('');
    console.log('FSFM local preview: http://' + host + ':' + port + '/');
    console.log('TinaCMS editor:     http://' + host + ':' + port + '/admin/index.html');
    console.log('Preview rebuilds automatically when content/v13 files change.');
    console.log('');
  });
}

start().catch((error) => {
  console.error('[FSFM preview] Could not start:', error);
  process.exitCode = 1;
});

process.on('SIGINT', () => {
  clearTimeout(buildTimer);
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  clearTimeout(buildTimer);
  server.close(() => process.exit(0));
});
