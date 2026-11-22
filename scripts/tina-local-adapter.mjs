import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function createLocalContentAdapter({
  projectRoot,
  contentRoot,
  albumsRoot,
  publisher,
  scheduleRebuild,
}) {
  function contentResourceToKey(resource) {
    return resource.key;
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

  return {
    hashContent,
    read,
    readRaw,
    write,
    readStoredPages,
  };
}
