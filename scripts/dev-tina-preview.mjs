import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = path.join(projectRoot, 'preview-v13');
const adminRoot = path.join(projectRoot, 'admin');
const studioRoot = path.join(projectRoot, 'studio');
const contentRoot = path.join(projectRoot, 'content', 'v13');
const albumsRoot = path.join(contentRoot, 'albums');
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

function sendJson(response, status, value, method = 'GET') {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function albumFilePath(id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
  return safeFilePath(albumsRoot, id + '.json');
}

function albumSummary(fileName, record) {
  const tracks = record?.templateData?.player?.tracks;
  return {
    id: path.basename(fileName, '.json'),
    name: record?.identity?.name || fileName,
    slug: record?.identity?.slug || '',
    route: record?.identity?.route || '',
    artwork: record?.templateData?.album?.artwork || '',
    published: record?.publishing?.published !== false,
    trackCount: Array.isArray(tracks) ? tracks.length : 0,
  };
}

async function readRequestJson(request, limit = 2 * 1024 * 1024) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must contain valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function validateAlbumRecord(id, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return 'The album record must be a JSON object.';
  }
  if (record.template !== 'album') return 'This editor only accepts album records.';
  if (!record.identity || typeof record.identity !== 'object') return 'Album identity is missing.';
  if (typeof record.identity.name !== 'string' || !record.identity.name.trim()) return 'Album name cannot be empty.';
  if (record.identity.slug !== id) return 'The URL slug cannot be changed in this editor because it determines the content filename.';
  if (!record.templateData?.album || !record.templateData?.player) return 'Album presentation or player data is missing.';
  if (!Array.isArray(record.templateData.player.tracks)) return 'The player track list must be an array.';
  if (!Array.isArray(record.sections)) return 'The page sections must remain an array.';
  return null;
}

async function handleApi(request, response, pathname) {
  if (pathname === '/__fsfm/api/health') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    sendJson(response, 200, { ok: true, app: 'FSFM Studio', mode: 'local' }, request.method);
    return;
  }

  if (pathname === '/__fsfm/api/albums') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    if (!fs.existsSync(albumsRoot)) {
      sendJson(response, 200, { albums: [] }, request.method);
      return;
    }

    const albums = fs.readdirSync(albumsRoot)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => {
        const filePath = path.join(albumsRoot, name);
        const record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return albumSummary(name, record);
      });

    sendJson(response, 200, { albums }, request.method);
    return;
  }

  const match = pathname.match(/^\/__fsfm\/api\/albums\/([a-z0-9-]+)$/);
  if (!match) {
    sendJson(response, 404, { error: 'Studio API route not found.' }, request.method);
    return;
  }

  const id = match[1];
  const filePath = albumFilePath(id);
  if (!filePath || !fs.existsSync(filePath)) {
    sendJson(response, 404, { error: 'Album not found.' }, request.method);
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const raw = fs.readFileSync(filePath, 'utf8');
    sendJson(response, 200, {
      id,
      revision: hashContent(raw),
      record: JSON.parse(raw),
    }, request.method);
    return;
  }

  if (request.method !== 'PUT') {
    response.writeHead(405, { Allow: 'GET, HEAD, PUT' });
    response.end();
    return;
  }

  try {
    const body = await readRequestJson(request);
    if (!body || typeof body.revision !== 'string' || !body.record) {
      sendJson(response, 400, { error: 'A revision and album record are required.' });
      return;
    }

    const currentRaw = fs.readFileSync(filePath, 'utf8');
    if (body.revision !== hashContent(currentRaw)) {
      sendJson(response, 409, {
        error: 'This album changed on disk after you opened it. Reload it before saving to avoid overwriting newer work.',
      });
      return;
    }

    const validationError = validateAlbumRecord(id, body.record);
    if (validationError) {
      sendJson(response, 422, { error: validationError });
      return;
    }

    const nextRaw = JSON.stringify(body.record, null, 2) + '\n';
    const tempPath = filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
    fs.writeFileSync(tempPath, nextRaw, { flag: 'wx' });
    fs.renameSync(tempPath, filePath);

    scheduleRebuild();
    sendJson(response, 200, {
      ok: true,
      revision: hashContent(nextRaw),
      savedAt: new Date().toISOString(),
      previewRoute: body.record.identity.route,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Could not save the album record.',
    });
  }
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (pathname.startsWith('/__fsfm/api/')) {
    void handleApi(request, response, pathname).catch((error) => {
      console.error('[FSFM Studio API]', error);
      if (!response.headersSent) sendJson(response, 500, { error: 'Studio API request failed.' });
      else response.destroy();
    });
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method || '')) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStudio = pathname === '/studio' || pathname.startsWith('/studio/');
  const base = isAdmin ? adminRoot : isStudio ? studioRoot : previewRoot;
  let relativePath = isAdmin
    ? pathname.replace(/^\/admin\/?/, '')
    : isStudio
      ? pathname.replace(/^\/studio\/?/, '')
      : pathname.replace(/^\/+/, '');

  if (!relativePath) relativePath = 'index.html';

  const filePath = safeFilePath(base, relativePath);
  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (isStudio && pathname === '/studio') {
    response.writeHead(302, { Location: '/studio/', 'Cache-Control': 'no-store' });
    response.end();
    return;
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

function startWatchingContent() {
  const watchDirectories = [
    contentRoot,
    albumsRoot,
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
}

async function start() {
  await buildPreview();
  startWatchingContent();

  server.listen(port, host, () => {
    console.log('');
    console.log('FSFM local preview: http://' + host + ':' + port + '/');
    console.log('FSFM Studio:        http://' + host + ':' + port + '/studio/');
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
