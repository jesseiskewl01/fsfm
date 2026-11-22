import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createNewPage } from './create-page-v13.mjs';

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const STORE_COLLECTIONS = [
  { name: 'homepage', label: 'Homepage', path: 'content/v13', format: 'json', match: { include: 'homepage' }, fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'site', label: 'Site settings', path: 'content/v13', format: 'json', match: { include: 'site' }, fields: [{ type: 'string', name: 'siteName', label: 'Site name' }] },
  { name: 'wallpapers', label: 'Wallpapers', path: 'content/v13', format: 'json', match: { include: 'wallpapers' }, fields: [{ type: 'string', name: 'version', label: 'Version' }] },
  { name: 'albums', label: 'Albums', path: 'content/v13/albums', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'vistaPages', label: 'Vista pages', path: 'content/v13/vista-pages', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
  { name: 'editorialPages', label: 'Editorial pages', path: 'content/v13/editorial-pages', format: 'json', fields: [{ type: 'string', name: 'template', label: 'Template' }] },
];

async function loadTinaSchemaTools() {
  try {
    const mod = await import('@tinacms/schema-tools');
    return mod;
  } catch {
    return null;
  }
}

export function createLocalContentAdapter({
  projectRoot,
  contentRoot,
  albumsRoot,
  publisher,
  scheduleRebuild,
}) {
  let tinaSchemaPromise;

  async function getTinaSchema() {
    if (!tinaSchemaPromise) {
      tinaSchemaPromise = (async () => {
        const tools = await loadTinaSchemaTools();
        if (!tools?.TinaSchema) return null;
        try {
          return new tools.TinaSchema({
            version: { fullVersion: '0.0.0', major: '0', minor: '0', patch: '0' },
            meta: { flags: ['experimentalData'] },
            collections: STORE_COLLECTIONS,
          });
        } catch {
          return null;
        }
      })();
    }
    return tinaSchemaPromise;
  }

  function readRaw(resource) {
    if (!resource || !fs.existsSync(resource.filePath) || !fs.statSync(resource.filePath).isFile()) return null;
    return fs.readFileSync(resource.filePath, 'utf8');
  }

  function read(resource) {
    const raw = readRaw(resource);
    if (raw === null) return null;
    return {
      key: resource.key,
      revision: hashContent(raw),
      record: JSON.parse(raw),
    };
  }

  function write(resource, currentRaw, record) {
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

  function createPage(options) {
    const created = createNewPage({
      root: projectRoot,
      template: options?.template,
      name: options?.name,
      slug: options?.slug,
      published: options?.published === true,
      showInNavigation: options?.showInNavigation !== false,
    });
    const relativePath = path.relative(projectRoot, created.path).split(path.sep).join('/');
    try {
      publisher.recordSavedFile(relativePath, fs.readFileSync(created.path));
    } catch (error) {
      fs.rmSync(created.path, { force: true });
      throw error;
    }
    scheduleRebuild();
    return {
      ok: true,
      key: (created.page.template === 'album' ? 'albums' : created.page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages') + '/' + created.page.identity.slug,
      page: created.page,
      revision: hashContent(fs.readFileSync(created.path)),
    };
  }

  return {
    hashContent,
    read,
    readRaw,
    write,
    readStoredPages,
    getTinaSchema,
    collections: STORE_COLLECTIONS,
    createPage,
  };
}
