import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHomepage } from '../src/render/homepage.mjs';
import { renderPage } from '../src/render/page.mjs';
import { validateSite } from '../src/core/page-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'v13');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const home = readJson(path.join(contentRoot, 'homepage.json'));
const site = readJson(path.join(contentRoot, 'site.json'));
const wallpapers = readJson(path.join(contentRoot, 'wallpapers.json'));
const pageRecords = [home];
for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
  const folder = path.join(contentRoot, dir);
  if (!fs.existsSync(folder)) continue;
  for (const filename of fs.readdirSync(folder).filter((name) => name.endsWith('.json')).sort()) {
    pageRecords.push(readJson(path.join(folder, filename)));
  }
}

const validationErrors = validateSite(pageRecords, { root });
if (validationErrors.length) {
  console.error(`V13 build stopped: ${validationErrors.length} validation error(s).`);
  for (const error of validationErrors) console.error(`- ${error}`);
  process.exit(1);
}

const published = pageRecords.filter((page) => page.publishing?.published !== false);
const isPreview = process.argv.includes('--preview');
const outputRoot = path.join(root, isPreview ? 'preview-v13-stage5' : 'dist-stage5');
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

function outputPath(route) {
  if (route === '/') return path.join(outputRoot, 'index.html');
  if (route.endsWith('.html')) return path.join(outputRoot, route.replace(/^\//, ''));
  return path.join(outputRoot, route.replace(/^\//, ''), 'index.html');
}

for (const page of published) {
  if (page.template === 'homepage') {
    const html = renderHomepage(page, { site, pages: published, wallpapers, assets: '/assets', preview: isPreview });
    fs.writeFileSync(outputPath('/'), html);
    console.log('Built Homepage through V13 shared rendering system.');
  } else {
    const html = renderPage(page, { site, pages: published, wallpapers, assets: '/assets', preview: isPreview });
    const target = outputPath(page.identity.route);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
    console.log(`Built ${page.identity.route} through V13 template renderer.`);
  }
}

const assetsRoot = path.join(outputRoot, 'assets');
fs.mkdirSync(assetsRoot, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'src', 'styles'))) {
  if (file.endsWith('.css')) fs.copyFileSync(path.join(root, 'src', 'styles', file), path.join(assetsRoot, file));
}
for (const file of fs.readdirSync(path.join(root, 'src', 'client'))) {
  if (file.endsWith('.js')) fs.copyFileSync(path.join(root, 'src', 'client', file), path.join(assetsRoot, file));
}
for (const dir of ['lyrics', 'media']) {
  const source = path.join(root, dir);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(outputRoot, dir), { recursive: true });
}

const base = new URL(site.baseUrl || 'https://fsfm.port82.net/');
const sitemapUrls = published
  .filter((page) => page.seo?.allowIndexing !== false)
  .sort((a, b) => (Number(a.identity.order) || 0) - (Number(b.identity.order) || 0))
  .map((page) => {
    const loc = new URL(page.identity.route, base).href;
    return `  <url><loc>${loc.replace(/&/g, '&amp;')}</loc><priority>${page.template === 'homepage' ? '1.0' : page.template === 'album' ? '0.9' : '0.7'}</priority></url>`;
  });
fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(outputRoot, 'robots.txt'), isPreview ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\nSitemap: https://fsfm.port82.net/sitemap.xml\n');
console.log(`V13 Stage 5 ${isPreview ? 'preview' : 'production'} build complete: ${published.length} published page(s) in ${path.relative(root, outputRoot)}.`);
