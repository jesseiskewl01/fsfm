import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createStudioPublisher } from './studio-publisher.mjs';
import { createNewPage } from './create-page-v13.mjs';
import { validateSite } from '../src/core/page-validator.mjs';
import { normalizePageRecord, normalizePages, routeForPage } from '../src/core/page-routes.mjs';
import { COMPONENTS } from '../src/components/registry.mjs';
import { TEMPLATES } from '../src/templates/registry.mjs';

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
const publisher = createStudioPublisher({ projectRoot, dataDir: authDataDir });
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

function readStoredPages() {
  const records = [JSON.parse(fs.readFileSync(path.join(contentRoot, 'homepage.json'), 'utf8'))];
  for (const directory of ['albums', 'vista-pages', 'editorial-pages']) {
    const folder = path.join(contentRoot, directory);
    if (!fs.existsSync(folder)) continue;
    for (const filename of fs.readdirSync(folder).filter((name) => name.endsWith('.json')).sort()) {
      records.push(JSON.parse(fs.readFileSync(path.join(folder, filename), 'utf8')));
    }
  }
  return records;
}

function contentResource(pathname) {
  if (pathname === '/__fsfm/api/content/homepage') return { kind: 'page', key: 'homepage', filePath: path.join(contentRoot, 'homepage.json') };
  if (pathname === '/__fsfm/api/content/site') return { kind: 'site', key: 'site', filePath: path.join(contentRoot, 'site.json') };
  if (pathname === '/__fsfm/api/content/wallpapers') return { kind: 'wallpapers', key: 'wallpapers', filePath: path.join(contentRoot, 'wallpapers.json') };
  const match = pathname.match(/^\/__fsfm\/api\/content\/(albums|vista-pages|editorial-pages)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match) return null;
  return {
    kind: 'page',
    key: match[1] + '/' + match[2],
    template: match[1] === 'albums' ? 'album' : match[1] === 'vista-pages' ? 'vista-window' : 'editorial',
    filePath: path.join(contentRoot, match[1], match[2] + '.json'),
  };
}

function contentIndex() {
  const pages = readStoredPages();
  return pages.map((page) => {
    const directory = page.template === 'homepage' ? 'homepage' : page.template === 'album' ? 'albums' : page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages';
    const key = page.template === 'homepage' ? 'homepage' : directory + '/' + page.identity.slug;
    let route = '/';
    try { route = routeForPage(page); } catch { /* The validator reports malformed routes on save. */ }
    return {
      key,
      template: page.template,
      name: page.identity?.name || 'Untitled page',
      slug: page.identity?.slug || 'home',
      route,
      order: Number(page.identity?.order) || 0,
      published: page.publishing?.published !== false,
      showInNavigation: page.publishing?.showInNavigation === true,
      artwork: page.templateData?.album?.artwork || '',
      trackCount: Array.isArray(page.templateData?.player?.tracks) ? page.templateData.player.tracks.length : 0,
    };
  }).sort((a, b) => {
    if (a.template === 'homepage') return -1;
    if (b.template === 'homepage') return 1;
    return (Number(a.order) || 0) - (Number(b.order) || 0) || a.name.localeCompare(b.name);
  });
}

function validateSiteSettings(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Site settings must be a JSON object.';
  if (record.schemaVersion !== 1) return 'Site settings schemaVersion must be 1.';
  if (typeof record.siteName !== 'string' || !record.siteName.trim()) return 'Site name cannot be empty.';
  if (typeof record.baseUrl !== 'string' || !/^https:\/\/[^/]+\/?$/i.test(record.baseUrl)) return 'Base URL must be an HTTPS site origin.';
  for (const key of ['favicon', 'description', 'footerText']) {
    if (typeof record[key] !== 'string') return 'Site setting ' + key + ' must be text.';
  }
  if (!record.seoDefaults || typeof record.seoDefaults !== 'object' || Array.isArray(record.seoDefaults)) return 'Default SEO settings are required.';
  for (const key of ['title', 'description', 'socialImage']) {
    if (typeof record.seoDefaults[key] !== 'string') return 'Default SEO ' + key + ' must be text.';
  }
  if (!Array.isArray(record.socialProfiles)) return 'Social profiles must be a list.';
  for (const [index, profile] of record.socialProfiles.entries()) {
    if (!profile || typeof profile.label !== 'string' || !profile.label.trim()) return 'Social profile ' + (index + 1) + ' needs a label.';
    if (typeof profile.url !== 'string' || !/^https:\/\/\S+$/i.test(profile.url)) return 'Social profile ' + (index + 1) + ' needs an HTTPS URL.';
  }
  return null;
}

function validateWallpaperCatalogue(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Wallpaper settings must be a JSON object.';
  if (!Array.isArray(record.presets) || record.presets.length === 0) return 'At least one wallpaper preset is required.';
  const ids = new Set();
  for (const [index, preset] of record.presets.entries()) {
    if (!preset || typeof preset !== 'object' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(preset.id || '') || !preset.name?.trim()) {
      return 'Wallpaper preset ' + (index + 1) + ' needs a valid ID and name.';
    }
    if (ids.has(preset.id)) return 'Wallpaper preset IDs must be unique.';
    ids.add(preset.id);
    if (preset.imageUrl) {
      const remoteImage = /^https:\/\//i.test(preset.imageUrl);
      const localMatch = /^\/media\/images\/([a-z0-9][a-z0-9._-]{0,100})$/i.exec(preset.imageUrl);
      const localImage = localMatch && fs.existsSync(path.join(projectRoot, 'media', 'images', localMatch[1]));
      if (!remoteImage && !localImage) return 'Wallpaper images must use HTTPS or an existing file inside /media/images/.';
    }
    if (preset.palette && (typeof preset.palette !== 'object' || Array.isArray(preset.palette))) return 'Wallpaper palettes must be objects.';
  }
  if (!record.customImage || typeof record.customImage !== 'object') return 'Custom wallpaper settings are required.';
  return null;
}

function readContentFile(resource) {
  if (!resource || !fs.existsSync(resource.filePath) || !fs.statSync(resource.filePath).isFile()) return null;
  const raw = fs.readFileSync(resource.filePath, 'utf8');
  return { key: resource.key, revision: hashContent(raw), record: JSON.parse(raw) };
}

function writeContentFile(resource, currentRaw, record) {
  const nextRaw = JSON.stringify(record, null, 2) + '\n';
  const tempPath = resource.filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
  fs.writeFileSync(tempPath, nextRaw, { flag: 'wx' });
  fs.renameSync(tempPath, resource.filePath);
  try {
    publisher.recordSavedFile(
      path.relative(projectRoot, resource.filePath).split(path.sep).join('/'),
      nextRaw,
    );
  } catch (error) {
    const rollbackPath = resource.filePath + '.studio-rollback-' + process.pid + '-' + Date.now() + '.tmp';
    fs.writeFileSync(rollbackPath, currentRaw, { flag: 'wx' });
    fs.renameSync(rollbackPath, resource.filePath);
    throw error;
  }
  scheduleRebuild();
  return { ok: true, revision: hashContent(nextRaw), savedAt: new Date().toISOString() };
}

function validatePageForSave(resource, record) {
  const existing = JSON.parse(fs.readFileSync(resource.filePath, 'utf8'));
  if (record?.template !== existing.template) return 'A page template cannot be changed after creation.';
  if (existing.template === 'homepage' && record?.publishing?.published === false) {
    return 'The homepage cannot be deactivated.';
  }
  if (record?.identity?.slug !== existing.identity?.slug) return 'The URL slug is locked because it determines the page filename and route.';
  let normalized;
  try {
    const site = JSON.parse(fs.readFileSync(path.join(contentRoot, 'site.json'), 'utf8'));
    normalized = normalizePageRecord(record, site);
  } catch (error) {
    return error.message || 'The page identity or URL is invalid.';
  }
  const allPages = readStoredPages();
  const index = allPages.findIndex((page) =>
    page.template === existing.template && page.identity?.slug === existing.identity?.slug);
  if (index < 0) return 'The page could not be located in the site content index.';
  allPages[index] = normalized;
  let normalizedSite;
  try {
    normalizedSite = normalizePages(allPages, JSON.parse(fs.readFileSync(path.join(contentRoot, 'site.json'), 'utf8')));
  } catch (error) {
    return error.message || 'The site pages could not be normalized.';
  }
  const errors = validateSite(normalizedSite, { root: projectRoot });
  return errors.length ? errors.slice(0, 30).join('\n') : normalized;
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

  if (pathname === '/__fsfm/api/deploy/status') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    try {
      sendJson(response, 200, await publisher.getStatus(), request.method);
    } catch (error) {
      sendJson(response, error.statusCode || 500, { error: error.message || 'Could not inspect live publishing status.' });
    }
    return;
  }

  if (pathname === '/__fsfm/api/deploy') {
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' });
      response.end();
      return;
    }
    if (!hasExpectedOrigin(request)) {
      sendJson(response, 403, { error: 'Live publishing requests must come from this local FSFM Studio origin.' });
      return;
    }
    try {
      const body = await readRequestJson(request, 8192);
      const result = await publisher.deploy({ confirmation: body?.confirmation });
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : 'Live publishing failed. Your local files were kept.',
      });
    }
    return;
  }




  if (pathname === '/__fsfm/api/assets') {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const list = (folder, kind, prefix) => {
        const directory = path.join(projectRoot, folder);
        if (!fs.existsSync(directory)) return [];
        return fs.readdirSync(directory).filter((name) => {
          const full = path.join(directory, name);
          return fs.existsSync(full) && fs.statSync(full).isFile();
        }).sort().map((name) => ({
          name,
          kind,
          path: prefix + '/' + name,
          size: fs.statSync(path.join(directory, name)).size,
        }));
      };
      sendJson(response, 200, {
        images: list('media/images', 'image', '/media/images'),
        audio: list('media/audio', 'audio', '/media/audio'),
      }, request.method);
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'GET, HEAD, POST' });
      response.end();
      return;
    }
    if (!hasExpectedOrigin(request)) {
      sendJson(response, 403, { error: 'Asset uploads must come from this local FSFM Studio page.' });
      return;
    }
    try {
      const body = await readRequestJson(request, 42 * 1024 * 1024);
      const kind = body?.kind;
      const filename = body?.filename;
      const encoded = body?.contentBase64;
      if (!['image', 'audio'].includes(kind)) {
        sendJson(response, 422, { error: 'Choose an image or audio asset type.' });
        return;
      }
      if (typeof filename !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,100}$/.test(filename)) {
        sendJson(response, 422, { error: 'Filename must use lowercase letters, numbers, dots, hyphens or underscores.' });
        return;
      }
      const extension = path.extname(filename).toLowerCase();
      const allowed = kind === 'image' ? ['.png', '.jpg', '.jpeg', '.webp', '.gif'] : ['.mp3', '.ogg', '.wav'];
      if (!allowed.includes(extension)) {
        sendJson(response, 422, { error: 'That file type is not supported for this asset category.' });
        return;
      }
      if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > 42 * 1024 * 1024 ||
          !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        sendJson(response, 422, { error: 'The uploaded file data is invalid or too large.' });
        return;
      }
      const bytes = Buffer.from(encoded, 'base64');
      if (bytes.length === 0 || bytes.length > 30 * 1024 * 1024 || bytes.toString('base64') !== encoded) {
        sendJson(response, 422, { error: 'Asset uploads must be between 1 byte and 30 MB.' });
        return;
      }
      const signatures = {
        '.png': bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        '.jpg': bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
        '.jpeg': bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
        '.gif': bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii')),
        '.webp': bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
        '.mp3': bytes.length >= 3 && (bytes.subarray(0, 3).toString('ascii') === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224)),
        '.ogg': bytes.length >= 4 && bytes.subarray(0, 4).toString('ascii') === 'OggS',
        '.wav': bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WAVE',
      };
      if (!signatures[extension]) {
        sendJson(response, 422, { error: 'The file contents do not match the selected file extension.' });
        return;
      }
      const directory = path.join(projectRoot, 'media', kind === 'image' ? 'images' : 'audio');
      fs.mkdirSync(directory, { recursive: true });
      const filePath = path.join(directory, filename);
      if (fs.existsSync(filePath)) {
        sendJson(response, 409, { error: 'A file with that name already exists. Rename the upload rather than overwriting an existing asset.' });
        return;
      }
      const temporary = filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
      fs.writeFileSync(temporary, bytes, { flag: 'wx' });
      fs.renameSync(temporary, filePath);
      const relativePath = path.relative(projectRoot, filePath).split(path.sep).join('/');
      try {
        publisher.recordSavedFile(relativePath, bytes);
      } catch (error) {
        fs.rmSync(filePath, { force: true });
        throw error;
      }
      const publicPath = (kind === 'image' ? '/media/images/' : '/media/audio/') + filename;
      sendJson(response, 201, {
        ok: true,
        kind,
        filename,
        path: publicPath,
        size: bytes.length,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : 'Could not save this asset locally.',
      });
    }
    return;
  }

  const lyricsMatch = pathname.match(/^\/__fsfm\/api\/lyrics\/([a-z0-9]+(?:-[a-z0-9]+)*\.lrc)$/);
  if (lyricsMatch) {
    const filename = lyricsMatch[1];
    const filePath = path.join(projectRoot, 'lyrics', filename);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      sendJson(response, 404, { error: 'Synced lyrics file not found.' }, request.method);
      return;
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      const raw = fs.readFileSync(filePath, 'utf8');
      sendJson(response, 200, {
        file: 'lyrics/' + filename,
        revision: hashContent(raw),
        content: raw,
      }, request.method);
      return;
    }
    if (request.method !== 'PUT') {
      response.writeHead(405, { Allow: 'GET, HEAD, PUT' });
      response.end();
      return;
    }
    if (!hasExpectedOrigin(request)) {
      sendJson(response, 403, { error: 'Lyrics saves must come from this local FSFM Studio page.' });
      return;
    }
    try {
      const body = await readRequestJson(request, 2 * 1024 * 1024);
      const currentRaw = fs.readFileSync(filePath, 'utf8');
      if (typeof body?.content !== 'string' || typeof body?.revision !== 'string') {
        sendJson(response, 400, { error: 'A revision and lyrics text are required.' });
        return;
      }
      if (body.revision !== hashContent(currentRaw)) {
        sendJson(response, 409, { error: 'These lyrics changed on disk after you opened them. Reload before saving.' });
        return;
      }
      const nextRaw = body.content.replace(/\r\n/g, '\n');
      const temporary = filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
      fs.writeFileSync(temporary, nextRaw, { flag: 'wx' });
      fs.renameSync(temporary, filePath);
      try {
        publisher.recordSavedFile('lyrics/' + filename, nextRaw);
      } catch (error) {
        const rollback = filePath + '.studio-rollback-' + process.pid + '-' + Date.now() + '.tmp';
        fs.writeFileSync(rollback, currentRaw, { flag: 'wx' });
        fs.renameSync(rollback, filePath);
        throw error;
      }
      scheduleRebuild();
      sendJson(response, 200, {
        ok: true,
        file: 'lyrics/' + filename,
        revision: hashContent(nextRaw),
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : 'Could not save synced lyrics.',
      });
    }
    return;
  }

  if (pathname === '/__fsfm/api/catalog') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    sendJson(response, 200, { components: COMPONENTS, templates: TEMPLATES }, request.method);
    return;
  }

  if (pathname === '/__fsfm/api/content') {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    sendJson(response, 200, { items: contentIndex() }, request.method);
    return;
  }

  if (pathname === '/__fsfm/api/content/create') {
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' });
      response.end();
      return;
    }
    if (!hasExpectedOrigin(request)) {
      sendJson(response, 403, { error: 'Page creation must come from this local FSFM Studio origin.' });
      return;
    }
    try {
      const body = await readRequestJson(request, 16 * 1024);
      const created = createNewPage({
        root: projectRoot,
        template: body?.template,
        name: body?.name,
        slug: body?.slug,
        published: false,
        showInNavigation: body?.showInNavigation !== false,
      });
      const relativePath = path.relative(projectRoot, created.path).split(path.sep).join('/');
      try {
        publisher.recordSavedFile(relativePath, fs.readFileSync(created.path));
      } catch (error) {
        fs.rmSync(created.path, { force: true });
        throw error;
      }
      scheduleRebuild();
      sendJson(response, 201, {
        ok: true,
        key: (created.page.template === 'album' ? 'albums' : created.page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages') + '/' + created.page.identity.slug,
        page: created.page,
        revision: hashContent(fs.readFileSync(created.path)),
      });
    } catch (error) {
      sendJson(response, error.statusCode || 422, { error: error.message || 'Could not create the page.' });
    }
    return;
  }

  if (pathname.startsWith('/__fsfm/api/content/')) {
    const resource = contentResource(pathname);
    if (!resource) {
      sendJson(response, 404, { error: 'Studio content record not found.' }, request.method);
      return;
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      const result = readContentFile(resource);
      if (!result) {
        sendJson(response, 404, { error: 'Studio content record not found.' }, request.method);
        return;
      }
      sendJson(response, 200, result, request.method);
      return;
    }
    if (request.method !== 'PUT') {
      response.writeHead(405, { Allow: 'GET, HEAD, PUT' });
      response.end();
      return;
    }
    if (!hasExpectedOrigin(request)) {
      sendJson(response, 403, { error: 'Studio saves must come from this local FSFM Studio page.' });
      return;
    }
    try {
      const body = await readRequestJson(request);
      if (!body || typeof body.revision !== 'string' || !body.record) {
        sendJson(response, 400, { error: 'A revision and content record are required.' });
        return;
      }
      const currentRaw = fs.readFileSync(resource.filePath, 'utf8');
      if (body.revision !== hashContent(currentRaw)) {
        sendJson(response, 409, { error: 'This content changed on disk after you opened it. Reload before saving to avoid overwriting newer work.' });
        return;
      }
      let record = body.record;
      if (resource.kind === 'page') {
        if (resource.template && record?.template !== resource.template) {
          sendJson(response, 422, { error: 'This record does not match its page template.' });
          return;
        }
        const validation = validatePageForSave(resource, record);
        if (typeof validation === 'string') {
          sendJson(response, 422, { error: validation });
          return;
        }
        record = validation;
      } else if (resource.kind === 'site') {
        const error = validateSiteSettings(record);
        if (error) {
          sendJson(response, 422, { error });
          return;
        }
        try {
          const pages = normalizePages(readStoredPages(), record);
          const pageErrors = validateSite(pages, { root: projectRoot });
          if (pageErrors.length) {
            sendJson(response, 422, { error: pageErrors.slice(0, 30).join('\n') });
            return;
          }
        } catch (error) {
          sendJson(response, 422, { error: error.message || 'Site settings could not be applied.' });
          return;
        }
      } else if (resource.kind === 'wallpapers') {
        const error = validateWallpaperCatalogue(record);
        if (error) {
          sendJson(response, 422, { error });
          return;
        }
      }
      const saved = writeContentFile(resource, currentRaw, record);
      sendJson(response, 200, { ...saved, record });
    } catch (error) {
      sendJson(response, error.statusCode || 500, {
        error: error.statusCode ? error.message : 'Could not save this content record.',
      });
    }
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
    try {
      publisher.recordSavedFile(
        path.relative(projectRoot, filePath).split(path.sep).join('/'),
        nextRaw,
      );
    } catch (error) {
      // Keep the local save and publishing queue atomic: if queueing fails, restore the prior file.
      const rollbackPath = filePath + '.studio-rollback-' + process.pid + '-' + Date.now() + '.tmp';
      fs.writeFileSync(rollbackPath, currentRaw, { flag: 'wx' });
      fs.renameSync(rollbackPath, filePath);
      throw error;
    }

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
