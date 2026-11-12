import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSite } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'v13');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const pages = [readJson(path.join(contentRoot, 'homepage.json'))];
for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
  const folder = path.join(contentRoot, dir);
  if (!fs.existsSync(folder)) continue;
  for (const filename of fs.readdirSync(folder).filter((name) => name.endsWith('.json')).sort()) pages.push(readJson(path.join(folder, filename)));
}
const errors = validateSite(pages, { root });
if (errors.length) {
  console.error(`V13 validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const albums = pages.filter((page) => page.template === 'album');
  const tracks = albums.reduce((n, page) => n + (page.templateData?.player?.tracks?.length || 0), 0);
  console.log(`V13 content validation passed: ${pages.length} page records (${albums.length} album(s)), ${tracks} album tracks, all referenced LRC files found.`);
}
