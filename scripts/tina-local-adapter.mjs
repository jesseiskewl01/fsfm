import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPageRecord, createNewPage } from './create-page-v13.mjs';
import { routeForPage } from '../src/core/page-routes.mjs';
import { findReusableCarcass, pageFolderForTemplate, pageKeyForRecord, validatePageIdentityChange } from '../src/core/page-tools.mjs';

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const STORE_COLLECTIONS = [
  { name: 'homepage', label: 'Homepage', path: 'content/v13', format: 'json', match: { include: 'homepage' }, fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'site', label: 'Site settings', path: 'content/v13', format: 'json', match: { include: 'site' }, fields: [{ type: 'string', name: 'siteName', label: 'Site name' }] },
  { name: 'wallpapers', label: 'Wallpapers', path: 'content/v13', format: 'json', match: { include: 'wallpapers' }, fields: [{ type: 'object', name: 'customImage', label: 'Custom image', fields: [] }] },
  { name: 'albums', label: 'Albums', path: 'content/v13/albums', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'vistaPages', label: 'Vista pages', path: 'content/v13/vista-pages', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'editorialPages', label: 'Editorial pages', path: 'content/v13/editorial-pages', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
];

async function loadTinaSchemaTools() { try { return await import('@tinacms/schema-tools'); } catch { return null; } }
async function loadTinaGraphql() { try { return await import('@tinacms/graphql'); } catch { return null; } }
async function loadMemoryLevel() { try { return await import('memory-level'); } catch { return null; } }

function relativeFromProject(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function pageRelativePath(record) {
  const folder = pageFolderForTemplate(record.template);
  return path.join(folder, `${record.identity.slug}.json`);
}

function pageAbsolutePath(contentRoot, record) {
  return path.join(contentRoot, pageRelativePath(record));
}

function buildLookup() {
  const collections = {};
  for (const c of STORE_COLLECTIONS) {
    collections[c.name] = { name: c.name, path: c.path, format: c.format, match: c.match };
  }
  return { collections };
}

const TINA_SYSTEM_KEYS = new Set(['_collection', '_keepTemplateKey', '_template', '_relativePath', '_id', '_sys']);
function stripTinaSystemKeys(value) {
  if (Array.isArray(value)) return value.map(stripTinaSystemKeys);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (TINA_SYSTEM_KEYS.has(k)) continue;
    out[k] = stripTinaSystemKeys(v);
  }
  return out;
}

export function createLocalContentAdapter({
  projectRoot,
  contentRoot,
  albumsRoot,
  publisher,
  scheduleRebuild,
}) {
  let initPromise;
  let tinaSchema = null;
  let database = null;
  let dbReady = false;

  async function init() {
    if (!initPromise) {
      initPromise = (async () => {
        const tools = await loadTinaSchemaTools();
        const gql = await loadTinaGraphql();
        const mem = await loadMemoryLevel();
        if (!tools?.TinaSchema) return;
        try {
          tinaSchema = new tools.TinaSchema({
            version: { fullVersion: '0.0.0', major: '0', minor: '0', patch: '0' },
            meta: { flags: ['experimentalData'] },
            collections: STORE_COLLECTIONS,
          });
        } catch {
          tinaSchema = null;
          return;
        }
        if (!gql?.Database || !gql?.FilesystemBridge || !mem?.MemoryLevel) return;
        try {
          const level = new mem.MemoryLevel({ valueEncoding: 'json' });
          await level.open();
          const bridge = new gql.FilesystemBridge(projectRoot);
          database = new gql.Database({ bridge, level, tinaDirectory: 'tina' });
          if (typeof database.initLevel === 'function') await database.initLevel();
          // Seed schema/lookup/graphql in memory to avoid reading/writing generated files on disk.
          const schemaPath = path.posix.join('tina', '__generated__', '_schema.json');
          const lookupPath = path.posix.join('tina', '__generated__', '_lookup.json');
          const graphqlPath = path.posix.join('tina', '__generated__', '_graphql.json');
          const contentLevel = database.contentLevel;
          if (contentLevel) {
            const root = contentLevel.sublevel('__root__', { valueEncoding: 'json' });
            await root.put(schemaPath, tinaSchema.schema).catch(() => {});
            await root.put(lookupPath, buildLookup()).catch(() => {});
            await root.put(graphqlPath, { kind: 'Document', definitions: [] }).catch(() => {});
          }
          database.tinaSchema = tinaSchema;
          // Best-effort index of existing content files.
          if (typeof database.indexContent === 'function') {
            try {
              await database.indexContent({ graphQLSchema: { kind: 'Document', definitions: [] }, tinaSchema, lookup: buildLookup() });
              dbReady = true;
            } catch {
              dbReady = false;
            }
          }
        } catch {
          database = null;
          dbReady = false;
        }
      })();
    }
    return initPromise;
  }

  function readRaw(resource) {
    if (!resource || !fs.existsSync(resource.filePath) || !fs.statSync(resource.filePath).isFile()) return null;
    return fs.readFileSync(resource.filePath, 'utf8');
  }

  async function read(resource) {
    await init();
    const raw = readRaw(resource);
    if (raw === null) return null;
    if (dbReady && database?.get) {
      try {
        const rel = relativeFromProject(projectRoot, resource.filePath);
        const dbRecord = stripTinaSystemKeys(await database.get(rel));
        return { key: resource.key, revision: hashContent(raw), record: dbRecord };
      } catch {
        // Fall back to file-backed record when DB read is unavailable.
      }
    }
    return { key: resource.key, revision: hashContent(raw), record: JSON.parse(raw) };
  }

  /** Windows watchers can hold the destination open, so rename is best-effort.
   *  The temp file keeps the write all-or-nothing until the handoff step.
   *  [OpenCode, 2026-11-24]
   */
  function replaceFile(filePath, content, prefix = 'studio') {
    const tempPath = filePath + '.' + prefix + '-' + process.pid + '-' + Date.now() + '.tmp';
    fs.writeFileSync(tempPath, content, { flag: 'wx' });
    try {
      try {
        fs.renameSync(tempPath, filePath);
      } catch (error) {
        if (process.platform !== 'win32' || !['EPERM', 'EBUSY', 'EEXIST'].includes(error.code)) throw error;
        fs.copyFileSync(tempPath, filePath);
        fs.rmSync(tempPath, { force: true });
      }
    } catch (error) {
      fs.rmSync(tempPath, { force: true });
      throw error;
    }
  }

  async function write(resource, currentRaw, record) {
    await init();
    const nextRaw = JSON.stringify(record, null, 2) + '\n';
    replaceFile(resource.filePath, nextRaw);
    const rel = relativeFromProject(projectRoot, resource.filePath);
    try {
      publisher.recordSavedFile(rel, nextRaw);
    } catch (error) {
      replaceFile(resource.filePath, currentRaw, 'studio-rollback');
      throw error;
    }
    await refreshDatabaseIndex(rel, record);
    scheduleRebuild();
    return { ok: true, revision: hashContent(nextRaw), savedAt: new Date().toISOString() };
  }

  async function refreshDatabaseIndex(relativePath, record, removedPath = '') {
    if (!database) return;
    try {
      if (dbReady && typeof database.indexContentByPaths === 'function') {
        await database.indexContentByPaths([relativePath]);
      } else if (dbReady && typeof database.put === 'function') {
        await database.put(relativePath, record);
      }
      if (removedPath && removedPath !== relativePath && typeof database.delete === 'function') {
        await database.delete(removedPath);
      }
    } catch {
      // Index update failure should not block a valid saved file.
    }
  }

  function forgetQueuedPath(relativePath) {
    if (typeof publisher.forgetSavedFile !== 'function') return;
    publisher.forgetSavedFile(relativePath);
  }

  function restoreQueuedPath(relativePath, raw) {
    if (typeof publisher.recordSavedFile !== 'function') return;
    publisher.recordSavedFile(relativePath, raw);
  }

  /**
   * Write one page change without ever deleting a content file. A rename moves
   * the existing file with fs.renameSync; a retired carcass reuse moves that
   * file the same way. Queue/index cleanup happens only after the file is final.
   * [Jesse + OpenCode, 2026-11-24]
   */
  async function commitPage({ resource, record, expectedRaw = null, moveSource = null }) {
    await init();
    const nextRaw = JSON.stringify(record, null, 2) + '\n';
    const targetPath = resource.filePath;
    const moving = !!moveSource && path.resolve(moveSource.filePath) !== path.resolve(targetPath);
    if (moving && fs.existsSync(targetPath)) {
      throw new Error(`A page file already exists at ${relativeFromProject(projectRoot, targetPath)}.`);
    }
    let didMove = false;
    if (moving) {
      fs.renameSync(moveSource.filePath, targetPath);
      didMove = true;
    }
    try {
      replaceFile(targetPath, nextRaw, 'studio-page');
      const relativePath = relativeFromProject(projectRoot, targetPath);
      const removedPath = moving ? relativeFromProject(projectRoot, moveSource.filePath) : '';
      if (removedPath && removedPath !== relativePath) forgetQueuedPath(removedPath);
      publisher.recordSavedFile(relativePath, nextRaw);
      await refreshDatabaseIndex(relativePath, record, removedPath);
      scheduleRebuild();
      return {
        ok: true,
        key: resource.key,
        page: record,
        revision: hashContent(nextRaw),
        savedAt: new Date().toISOString(),
        reusedCarcass: moveSource?.reusedCarcass === true,
      };
    } catch (error) {
      if (didMove) {
        try {
          replaceFile(targetPath, moveSource.raw, 'studio-rollback');
          fs.renameSync(targetPath, moveSource.filePath);
          const relativePath = relativeFromProject(projectRoot, targetPath);
          const removedPath = relativeFromProject(projectRoot, moveSource.filePath);
          forgetQueuedPath(relativePath);
          restoreQueuedPath(removedPath, moveSource.raw);
        } catch {
          // Preserve the original failure; the rollback paths are best-effort.
        }
      } else if (expectedRaw !== null) {
        try { replaceFile(targetPath, expectedRaw, 'studio-rollback'); } catch {}
      }
      throw error;
    }
  }

  async function readStoredPages() {
    await init();
    const records = [];
    const homepagePath = path.join(contentRoot, 'homepage.json');
    const home = await read({ key: 'homepage', filePath: homepagePath });
    if (home?.record) records.push(home.record);
    for (const directory of ['albums', 'vista-pages', 'editorial-pages']) {
      const folder = path.join(contentRoot, directory);
      if (!fs.existsSync(folder)) continue;
      for (const filename of fs.readdirSync(folder).filter((name) => name.endsWith('.json')).sort()) {
        const slug = filename.replace(/\.json$/, '');
        const key = directory + '/' + slug;
        const filePath = path.join(folder, filename);
        const page = await read({ key, filePath });
        if (page?.record) records.push(page.record);
      }
    }
    return records;
  }

  function resourceForPageKey(key) {
    const match = /^(albums|vista-pages|editorial-pages)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(String(key || ''));
    if (!match) throw new Error('This Studio page key is not valid.');
    const filePath = path.join(contentRoot, match[1], match[2] + '.json');
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw new Error('Studio could not find that page file.');
    return { kind: 'page', key, filePath };
  }

  function requireRaw(resource, revision) {
    const raw = readRaw(resource);
    if (raw === null) throw new Error('Studio could not find that page file.');
    if (revision && hashContent(raw) !== revision) {
      throw new Error('This content changed on disk after you opened it. Reload before trying again.');
    }
    return raw;
  }

  async function assertTargetAvailable(record, sourceKey = '', reuseKey = '') {
    const pages = await readStoredPages();
    const conflict = validatePageIdentityChange(record, { pages, sourceKey });
    if (conflict) throw new Error(conflict);
    const targetKey = pageKeyForRecord(record);
    const targetPath = pageAbsolutePath(contentRoot, record);
    if (fs.existsSync(targetPath) && targetKey !== sourceKey && targetKey !== reuseKey) {
      throw new Error(`A page with slug "${record.identity.slug}" already exists.`);
    }
    return pages;
  }

  async function findReuseSource(template) {
    const pages = await readStoredPages();
    const carcass = findReusableCarcass(pages, template);
    if (!carcass) return null;
    const key = pageKeyForRecord(carcass);
    const filePath = pageAbsolutePath(contentRoot, carcass);
    if (!fs.existsSync(filePath)) return null;
    return { key, filePath, raw: fs.readFileSync(filePath, 'utf8'), record: carcass, reusedCarcass: true };
  }

  async function createPage(options) {
    await init();
    const reuse = await findReuseSource(options?.template);
    if (!reuse) {
      const created = createNewPage({
        root: projectRoot,
        template: options?.template,
        name: options?.name,
        slug: options?.slug,
        published: options?.published === true,
        showInNavigation: options?.showInNavigation !== false,
      });
      return { ok: true, key: pageKeyForRecord(created.page), page: created.page, revision: hashContent(fs.readFileSync(created.path)), reusedCarcass: false };
    }
    const page = buildPageRecord({
      root: projectRoot,
      template: options?.template,
      name: options?.name,
      slug: options?.slug,
      published: options?.published === true,
      showInNavigation: options?.showInNavigation !== false,
    });
    await assertTargetAvailable(page, '', reuse.key);
    const targetResource = { kind: 'page', key: pageKeyForRecord(page), filePath: pageAbsolutePath(contentRoot, page) };
    return commitPage({ resource: targetResource, record: page, moveSource: reuse });
  }

  async function retirePage({ key, record, revision, name }) {
    await init();
    const resource = resourceForPageKey(key);
    const currentRaw = requireRaw(resource, revision);
    const current = JSON.parse(currentRaw);
    if (current.publishing?.retired) throw new Error('This page is already retired.');
    if (String(name || '').trim() !== current.identity?.name) {
      throw new Error('The page name did not match. Nothing was retired.');
    }
    if (pageKeyForRecord(record) !== key) throw new Error('A retired page cannot change its slug.');
    return commitPage({ resource, record, expectedRaw: currentRaw });
  }

  async function renamePage({ key, record, revision }) {
    await init();
    const resource = resourceForPageKey(key);
    const currentRaw = requireRaw(resource, revision);
    const current = JSON.parse(currentRaw);
    if (current.publishing?.retired) throw new Error('Retired pages are reused by creating a new page.');
    if (record.template !== current.template) throw new Error('A page template cannot be changed after creation.');
    await assertTargetAvailable(record, key);
    const targetResource = { kind: 'page', key: pageKeyForRecord(record), filePath: pageAbsolutePath(contentRoot, record) };
    const moveSource = targetResource.key === key
      ? null
      : { key, filePath: resource.filePath, raw: currentRaw };
    return commitPage({ resource: targetResource, record, expectedRaw: currentRaw, moveSource });
  }

  async function duplicatePage({ key, record }) {
    await init();
    const resource = resourceForPageKey(key);
    const currentRaw = requireRaw(resource);
    const current = JSON.parse(currentRaw);
    if (current.publishing?.retired) throw new Error('Retired pages are reused by creating a new page.');
    const reuse = await findReuseSource(current.template);
    await assertTargetAvailable(record, '', reuse?.key || '');
    const targetResource = { kind: 'page', key: pageKeyForRecord(record), filePath: pageAbsolutePath(contentRoot, record) };
    return commitPage({ resource: targetResource, record, moveSource: reuse });
  }

  async function getTinaSchema() { await init(); return tinaSchema; }
  async function getDatabase() { await init(); return database; }
  async function getStatus() { await init(); return { dbReady, hasSchema: !!tinaSchema, hasDatabase: !!database, collections: STORE_COLLECTIONS.map((c) => c.name) }; }

  return {
    init,
    hashContent,
    read,
    readRaw,
    write,
    readStoredPages,
    getTinaSchema,
    getDatabase,
    getStatus,
    collections: STORE_COLLECTIONS,
    createPage,
    retirePage,
    renamePage,
    duplicatePage,
  };
}
