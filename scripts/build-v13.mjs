import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHomepage } from '../src/render/homepage.mjs';
import { renderPage } from '../src/render/page.mjs';
import { validateSite } from '../src/core/page-validator.mjs';
import { normalizePages } from '../src/core/page-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'v13');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const home = readJson(path.join(contentRoot, 'homepage.json'));
const site = readJson(path.join(contentRoot, 'site.json'));
const wallpapers = readJson(path.join(contentRoot, 'wallpapers.json'));
const rawPageRecords = [home];
for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
  const folder = path.join(contentRoot, dir);
  if (!fs.existsSync(folder)) continue;
  for (const filename of fs.readdirSync(folder).filter((name) => name.endsWith('.json')).sort()) {
    rawPageRecords.push(readJson(path.join(folder, filename)));
  }
}

const pageRecords = normalizePages(rawPageRecords, site);
const validationErrors = validateSite(pageRecords, { root });
if (validationErrors.length) {
  console.error(`V14 build stopped: ${validationErrors.length} validation error(s).`);
  for (const error of validationErrors) console.error(`- ${error}`);
  process.exit(1);
}

const published = pageRecords.filter((page) => page.publishing?.published !== false);
const isPreview = process.argv.includes('--preview');
const includeDrafts = isPreview && process.argv.includes('--include-drafts');
const buildRecords = includeDrafts ? pageRecords : published;
const outputRoot = path.join(root, isPreview ? 'preview-v13' : 'dist');
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

function outputPath(route) {
  if (route === '/') return path.join(outputRoot, 'index.html');
  return path.join(outputRoot, route.replace(/^\//, ''), 'index.html');
}

for (const page of buildRecords) {
  if (page.template === 'homepage') {
    const html = renderHomepage(page, { site, pages: published, wallpapers, assets: '/assets', preview: isPreview });
    fs.writeFileSync(outputPath('/'), html);
    console.log('Built Homepage through V14 shared rendering system.');
  } else {
    const html = renderPage(page, { site, pages: published, wallpapers, assets: '/assets', preview: isPreview, previewEmbeds: isPreview });
    const target = outputPath(page.identity.route);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
    console.log(`Built ${page.identity.route} (${page.template}${page.publishing?.published === false ? ', draft preview' : ''}).`);
  }
}

/* Keep the original album address working as a redirect, while the album itself
   has one canonical JSON record and one public /albums/<slug>/ route. */
if (published.some((page) => page.template === 'album' && page.identity.slug === 'the-early-bird')) {
  const legacyRedirect = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The Early Bird.... has moved | Fake Space Fog Machine</title>
  <meta name="description" content="The Early Bird.... by Fake Space Fog Machine has moved to its album page.">
  <meta name="robots" content="noindex, follow">
  <meta property="og:title" content="The Early Bird.... has moved | Fake Space Fog Machine">
  <link rel="canonical" href="https://fsfm.port82.net/albums/the-early-bird/">
  <meta http-equiv="refresh" content="0; url=/albums/the-early-bird/">
</head>
<body><p>The Early Bird.... has moved. <a href="/albums/the-early-bird/">Continue to the album page</a>.</p></body>
</html>`;
  fs.writeFileSync(path.join(outputRoot, 'the-early-bird.html'), legacyRedirect);
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

for (const file of ['CNAME', 'google47366a80744746e8.html']) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outputRoot, file));
}

const base = new URL(site.baseUrl || 'https://fsfm.port82.net/');
const sitemapUrls = published
  .filter((page) => page.seo?.allowIndexing !== false)
  .sort((a, b) => (Number(a.identity.order) || 0) - (Number(b.identity.order) || 0))
  .map((page) => {
    const loc = new URL(page.identity.route, base).href;
    const priority = page.template === 'homepage' ? '1.0' : page.template === 'album' ? '0.9' : '0.7';
    return `  <url><loc>${loc.replace(/&/g, '&amp;')}</loc><priority>${priority}</priority></url>`;
  });
fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(outputRoot, 'robots.txt'), isPreview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
console.log(`V14 ${isPreview ? `private preview${includeDrafts ? ' (including drafts)' : ''}` : 'production'} build complete: ${buildRecords.length} page(s) written; ${published.length} published page(s).`);
