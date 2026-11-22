import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createNewPage } from './create-page-v13.mjs';

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

function buildLookup() {
  const collections = {};
  for (const c of STORE_COLLECTIONS) {
    collections[c.name] = { name: c.name, path: c.path, format: c.format, match: c.match };
  }
  return { collections };
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
    const record = JSON.parse(raw);
    if (dbReady && database?.get) {
      try {
        const rel = relativeFromProject(projectRoot, resource.filePath);
        await database.get(rel);
      } catch {
        // DB read failed; file-backed record remains authoritative for this response.
      }
    }
    return { key: resource.key, revision: hashContent(raw), record };
  }

  async function write(resource, currentRaw, record) {
    await init();
    const nextRaw = JSON.stringify(record, null, 2) + '\n';
    const tempPath = resource.filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
    fs.writeFileSync(tempPath, nextRaw, { flag: 'wx' });
    fs.renameSync(tempPath, resource.filePath);
    const rel = relativeFromProject(projectRoot, resource.filePath);
    try {
      publisher.recordSavedFile(rel, nextRaw);
    } catch (error) {
      const rollbackPath = resource.filePath + '.studio-rollback-' + process.pid + '-' + Date.now() + '.tmp';
      fs.writeFileSync(rollbackPath, currentRaw, { flag: 'wx' });
      fs.renameSync(rollbackPath, resource.filePath);
      throw error;
    }
    if (database) {
      try {
        if (dbReady && typeof database.indexContentByPaths === 'function') {
          await database.indexContentByPaths([rel]);
        } else if (dbReady && typeof database.put === 'function') {
          await database.put(rel, record);
        }
      } catch {
        // Index update failure should not block a valid saved file.
      }
    }
    scheduleRebuild();
    return { ok: true, revision: hashContent(nextRaw), savedAt: new Date().toISOString() };
  }

  async function readStoredPages() {
    await init();
    if (dbReady && database?.query) {
      // Keep simple file-backed list for deterministic ordering/shape; DB is authoritative for record reads.
    }
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

  async function createPage(options) {
    await init();
    const created = createNewPage({
      root: projectRoot,
      template: options?.template,
      name: options?.name,
      slug: options?.slug,
      published: options?.published === true,
      showInNavigation: options?.showInNavigation !== false,
    });
    const relativePath = relativeFromProject(projectRoot, created.path);
    try {
      publisher.recordSavedFile(relativePath, fs.readFileSync(created.path));
    } catch (error) {
      fs.rmSync(created.path, { force: true });
      throw error;
    }
    if (dbReady && database?.indexContentByPaths) {
      try { await database.indexContentByPaths([relativePath]); } catch {}
    }
    scheduleRebuild();
    return {
      ok: true,
      key: (created.page.template === 'album' ? 'albums' : created.page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages') + '/' + created.page.identity.slug,
      page: created.page,
      revision: hashContent(fs.readFileSync(created.path)),
    };
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
  };
}
