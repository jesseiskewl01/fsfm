import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
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

if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
  throw new Error('FSFM Studio must bind to a loopback host. Do not expose the local editor on your network.');
}

// Credentials stay in the current OS user's profile, outside the repository.
const authDataDir = path.resolve(process.env.FSFM_STUDIO_DATA_DIR || path.join(os.homedir(), '.fsfm-studio'));
const authFilePath = path.join(authDataDir, 'auth.json');
const sessionCookieName = 'fsfm_studio_session';
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const sessions = new Map();
const loginAttempts = new Map();
const passwordHashOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

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


function expectedStudioOrigin() {
  return 'http://' + host + ':' + port;
}

function hasExpectedOrigin(request) {
  return request.headers.origin === expectedStudioOrigin();
}

function readSessionToken(request) {
  const cookieHeader = request.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === sessionCookieName) return part.slice(separator + 1).trim();
  }
  return '';
}

function hasStudioSession(request) {
  const token = readSessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function issueStudioSession(response) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + sessionLifetimeMs });
  response.setHeader('Set-Cookie', sessionCookieName + '=' + token +
    '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + Math.floor(sessionLifetimeMs / 1000));
}

function clearStudioSession(request, response) {
  const token = readSessionToken(request);
  if (token) sessions.delete(token);
  response.setHeader('Set-Cookie', sessionCookieName + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
}

function derivePasswordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64, passwordHashOptions).toString('base64');
}

function readAuthConfig() {
  if (!fs.existsSync(authFilePath)) return null;
  const config = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
  if (config?.version !== 1 || typeof config.salt !== 'string' || typeof config.passwordHash !== 'string') {
    throw new Error('Studio authentication configuration is invalid.');
  }
  return config;
}

function passwordMatches(password, config) {
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 1024) return false;
  const expected = Buffer.from(config.passwordHash, 'base64');
  const actual = Buffer.from(derivePasswordHash(password, Buffer.from(config.salt, 'base64')), 'base64');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function loginRateLimit(request) {
  const key = request.socket?.remoteAddress || 'local';
  const now = Date.now();
  let state = loginAttempts.get(key);
  // Honour an active lockout before considering the rolling failure window.
  if (state?.lockedUntil > now) {
    return { blocked: true, retryAfter: Math.ceil((state.lockedUntil - now) / 1000) };
  }
  if (!state || now - state.windowStarted > 15 * 60 * 1000) {
    state = { failures: 0, windowStarted: now, lockedUntil: 0 };
    loginAttempts.set(key, state);
  }
  return { blocked: false, key, state };
}

async function handleAuthApi(request, response, pathname) {
  if (pathname === '/__fsfm/api/auth/status') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return true;
    }
    sendJson(response, 200, { configured: fs.existsSync(authFilePath) }, request.method);
    return true;
  }

  const routes = ['/__fsfm/api/auth/setup', '/__fsfm/api/auth/login', '/__fsfm/api/auth/logout'];
  if (!routes.includes(pathname)) return false;
  if (request.method !== 'POST') {
    response.writeHead(405, { Allow: 'POST' });
    response.end();
    return true;
  }
  if (!hasExpectedOrigin(request)) {
    sendJson(response, 403, { error: 'Authentication requests must come from this local FSFM Studio origin.' });
    return true;
  }
  if (pathname === '/__fsfm/api/auth/logout') {
    clearStudioSession(request, response);
    sendJson(response, 200, { ok: true });
    return true;
  }

  try {
    const body = await readRequestJson(request, 8192);
    if (pathname === '/__fsfm/api/auth/setup') {
      if (fs.existsSync(authFilePath)) {
        sendJson(response, 409, { error: 'A Studio password has already been configured.' });
        return true;
      }
      const password = body?.password;
      if (typeof password !== 'string' || [...password].length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
        sendJson(response, 422, { error: 'Choose a password with at least 12 characters.' });
        return true;
      }
      const salt = crypto.randomBytes(16);
      const config = {
        version: 1,
        algorithm: 'scrypt',
        salt: salt.toString('base64'),
        passwordHash: derivePasswordHash(password, salt),
        createdAt: new Date().toISOString(),
      };
      fs.mkdirSync(authDataDir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(authFilePath, JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      try { fs.chmodSync(authFilePath, 0o600); } catch {
        // Windows permissions are inherited from the private user-profile directory.
      }
      issueStudioSession(response);
      sendJson(response, 201, { ok: true });
      return true;
    }

    const limit = loginRateLimit(request);
    if (limit.blocked) {
      response.setHeader('Retry-After', String(limit.retryAfter));
      sendJson(response, 429, { error: 'Too many login attempts. Try again after the lockout period.' });
      return true;
    }
    const config = readAuthConfig();
    if (!config) {
      sendJson(response, 409, { error: 'Set up your Studio password before logging in.' });
      return true;
    }
    if (!passwordMatches(body?.password, config)) {
      limit.state.failures += 1;
      if (limit.state.failures >= 5) limit.state.lockedUntil = Date.now() + 15 * 60 * 1000;
      sendJson(response, 401, { error: 'That password was not recognised.' });
      return true;
    }
    loginAttempts.delete(limit.key);
    issueStudioSession(response);
    sendJson(response, 200, { ok: true });
    return true;
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Studio authentication could not be completed.',
    });
    return true;
  }
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

  if (await handleAuthApi(request, response, pathname)) return;

  if (!hasStudioSession(request)) {
    sendJson(response, 401, { error: 'Your FSFM Studio session is missing or has expired. Please sign in again.' });
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

  // Only accept editor writes from this exact local Studio origin.
  // This blocks cross-site browser requests from unrelated websites.
  const expectedOrigin = 'http://' + host + ':' + port;
  if (request.headers.origin !== expectedOrigin) {
    sendJson(response, 403, { error: 'Studio saves must come from this local FSFM Studio page.' });
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
  if (isStudio && pathname === '/studio') {
    response.writeHead(302, { Location: '/studio/', 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  const isStudioLogin = isStudio && pathname === '/studio/login.html';
  if (isStudio && !isStudioLogin && !hasStudioSession(request)) {
    response.writeHead(302, { Location: '/studio/login.html', 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  const base = isAdmin ? adminRoot : isStudio ? studioRoot : previewRoot;
  let relativePath = isAdmin
    ? pathname.replace(/^\/admin\/?/, '')
    : isStudio
      ? pathname.replace(/^\/studio\/?/, '')
      : pathname.replace(/^\/+/, '');

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
