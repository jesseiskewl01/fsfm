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

async function loadTinaSchemaTools() {
  try { return await import('@tinacms/schema-tools'); } catch { return null; }
}

async function loadTinaGraphql() {
  try { return await import('@tinacms/graphql'); } catch { return null; }
}

async function loadMemoryLevel() {
  try { return await import('memory-level'); } catch { return null; }
}

function relativeFromProject(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
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

  async function init() {
    if (!initPromise) {
      initPromise = (async () => {
        const tools = await loadTinaSchemaTools();
        if (tools?.TinaSchema) {
          try {
            tinaSchema = new tools.TinaSchema({
              version: { fullVersion: '0.0.0', major: '0', minor: '0', patch: '0' },
              meta: { flags: ['experimentalData'] },
              collections: STORE_COLLECTIONS,
            });
          } catch {
            tinaSchema = null;
          }
        }
        const gql = await loadTinaGraphql();
        const mem = await loadMemoryLevel();
        if (!gql?.Database || !gql?.FilesystemBridge || !mem?.MemoryLevel || !tinaSchema) return;
        try {
          const level = new mem.MemoryLevel({ valueEncoding: 'json' });
          await level.open();
          const bridge = new gql.FilesystemBridge(projectRoot);
          database = new gql.Database({
            bridge,
            level,
            tinaDirectory: 'tina',
          });
          // Seed schema in memory level so Database can resolve collections without generated files on disk.
          const schemaPath = path.posix.join('tina', '__generated__', '_schema.json');
          const lookupPath = path.posix.join('tina', '__generated__', '_lookup.json');
          const graphqlPath = path.posix.join('tina', '__generated__', '_graphql.json');
          const contentLevel = database.contentLevel;
          if (contentLevel) {
            const root = contentLevel.sublevel('__root__', { valueEncoding: 'json' });
            await root.put(schemaPath, tinaSchema.schema).catch(() => {});
            await root.put(lookupPath, { collections: Object.fromEntries(STORE_COLLECTIONS.map((c) => [c.name, { name: c.name, path: c.path }])) }).catch(() => {});
            await root.put(graphqlPath, { kind: 'Document', definitions: [] }).catch(() => {});
          }
          // Keep internal schema cache warm when possible.
          database.tinaSchema = tinaSchema;
        } catch {
          database = null;
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
    return {
      key: resource.key,
      revision: hashContent(raw),
      record: JSON.parse(raw),
    };
  }

  async function write(resource, currentRaw, record) {
    await init();
    const nextRaw = JSON.stringify(record, null, 2) + '\n';
    const tempPath = resource.filePath + '.studio-' + process.pid + '-' + Date.now() + '.tmp';
    fs.writeFileSync(tempPath, nextRaw, { flag: 'wx' });
    fs.renameSync(tempPath, resource.filePath);
    try {
      publisher.recordSavedFile(relativeFromProject(projectRoot, resource.filePath), nextRaw);
    } catch (error) {
      const rollbackPath = resource.filePath + '.studio-rollback-' + process.pid + '-' + Date.now() + '.tmp';
      fs.writeFileSync(rollbackPath, currentRaw, { flag: 'wx' });
      fs.renameSync(rollbackPath, resource.filePath);
      throw error;
    }
    // Best-effort: keep Tina Database warm for future indexed reads.
    if (database?.put) {
      try {
        const rel = relativeFromProject(projectRoot, resource.filePath);
        await database.put(rel, record);
      } catch {
        // File is already written and validated; index warmup failure should not block save.
      }
    }
    scheduleRebuild();
    return { ok: true, revision: hashContent(nextRaw), savedAt: new Date().toISOString() };
  }

  async function readStoredPages() {
    await init();
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
    if (database?.put) {
      try { await database.put(relativePath, created.page); } catch {}
    }
    scheduleRebuild();
    return {
      ok: true,
      key: (created.page.template === 'album' ? 'albums' : created.page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages') + '/' + created.page.identity.slug,
      page: created.page,
      revision: hashContent(fs.readFileSync(created.path)),
    };
  }

  async function getTinaSchema() {
    await init();
    return tinaSchema;
  }

  return {
    init,
    hashContent,
    read,
    readRaw,
    write,
    readStoredPages,
    getTinaSchema,
    getDatabase: async () => { await init(); return database; },
    collections: STORE_COLLECTIONS,
    createPage,
  };
}
