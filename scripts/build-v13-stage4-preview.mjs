import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'v13');
const output = path.join(root, 'preview-v13-stage4');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const site = read(path.join(contentRoot, 'site.json'));
const wallpapers = read(path.join(contentRoot, 'wallpapers.json'));
const homepage = read(path.join(contentRoot, 'homepage.json'));
const albumDir = path.join(contentRoot, 'albums');
const pages = [homepage, ...fs.readdirSync(albumDir).filter((name) => name.endsWith('.json')).sort().map((name) => read(path.join(albumDir, name)))];
const albums = pages.filter((page) => page.template === 'album' && page.publishing?.published !== false);
if (!albums.length) throw new Error('No published Album records are available to preview.');

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
fs.mkdirSync(path.join(output, 'lyrics'), { recursive: true });
for (const name of ['v13.css']) fs.copyFileSync(path.join(root, 'src', 'styles', name), path.join(output, 'assets', name));
for (const name of ['wallpaper-engine.js', 'runtime.js', 'album-player.js', 'album-atmosphere.js']) {
  fs.copyFileSync(path.join(root, 'src', 'client', name), path.join(output, 'assets', name));
}
fs.cpSync(path.join(root, 'lyrics'), path.join(output, 'lyrics'), { recursive: true });
fs.cpSync(path.join(root, 'media'), path.join(output, 'media'), { recursive: true });

for (const album of albums) {
  const filename = album.identity.route.endsWith('.html') ? album.identity.route.replace(/^\//, '') : path.join(album.identity.slug, 'index.html');
  const target = path.join(output, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const html = renderPage(album, { site, pages, wallpapers, assets: path.relative(path.dirname(target), path.join(output, 'assets')) || 'assets', preview: true, previewEmbeds: false });
  fs.writeFileSync(target, html);
}
const list = albums.map((album) => `<li><a href="${album.identity.route.replace(/^\//, '')}">${album.identity.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</a></li>`).join('');
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FSFM V13 Stage 4 previews</title><style>body{font:16px/1.6 Segoe UI,Arial,sans-serif;max-width:760px;margin:12vh auto;padding:24px;background:#0a0806;color:#fef5de}a{color:#bd8b4e}</style><h1>FSFM V13 · Stage 4</h1><p>Non-indexable preview of Album-template pages rendered by the V13 engine.</p><ul>${list}</ul></html>`);
console.log(`Stage 4 preview built: ${albums.length} album page(s) in ${path.relative(root, output)}`);
