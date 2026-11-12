import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const requireMedia = process.argv.includes('--require-media');
const expectedMedia = [
  'media/images/cover.png',
  'media/images/asadadasdges-removebg-preview.png',
  'media/images/earlybirdcd.jpg'
];
const errors = [];
const warnings = [];
const pageFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) pageFiles.push(file);
  }
}
function fail(message) { errors.push(message); }

if (!fs.existsSync(dist)) fail('dist/ does not exist. Run npm run build first.');
if (!fs.existsSync(path.join(dist, 'index.html'))) fail('Homepage dist/index.html is missing.');
if (!fs.existsSync(path.join(dist, 'the-early-bird.html'))) fail('Album dist/the-early-bird.html is missing.');
walk(dist);
if (fs.existsSync(path.join(dist, 'preview-v13')) || fs.existsSync(path.join(dist, 'templates'))) fail('Private preview files must not be present in the production dist.');

const missingMedia = expectedMedia.filter((relative) => !fs.existsSync(path.join(dist, relative)));
for (const item of missingMedia) {
  const message = `Required live media is missing: ${item}`;
  if (requireMedia) fail(message); else warnings.push(message);
}

for (const file of pageFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(dist, file).replace(/\\/g, '/');
  const route = rel === 'index.html' ? '/' : `/${rel}`;
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) fail(`${route}: html language attribute is missing.`);
  if (!/<meta\s+charset=/i.test(html)) fail(`${route}: charset metadata is missing.`);
  if (!/<meta\s+name=["']viewport["']/i.test(html)) fail(`${route}: viewport metadata is missing.`);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${route}: document title is missing.`);
  if (!/<link\s+rel=["']canonical["']/i.test(html)) fail(`${route}: canonical URL is missing.`);
  if (!/<meta\s+name=["']robots["']/i.test(html)) fail(`${route}: robots metadata is missing.`);
  if (!/<meta\s+property=["']og:title["']/i.test(html)) fail(`${route}: Open Graph title is missing.`);

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) fail(`${route}: duplicate id "${id}".`);
    seen.add(id);
  }
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt\s*=/.test(match[1])) fail(`${route}: image is missing an alt attribute.`);
  }
  for (const match of html.matchAll(/<iframe\b([^>]*)>/gi)) {
    if (!/\btitle\s*=/.test(match[1])) fail(`${route}: iframe is missing an accessible title.`);
  }
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = match[1];
    if (/\btarget=["']_blank["']/i.test(attrs) && !/\brel=["'][^"']*\bnoopener\b/i.test(attrs)) {
      fail(`${route}: target=_blank link is missing rel=noopener.`);
    }
  }

  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const ref of refs) {
    if (!ref || /^(?:https?:|mailto:|tel:|data:|javascript:|about:|#|\/\/)/i.test(ref)) continue;
    let pathname;
    try { pathname = decodeURIComponent(new URL(ref, `https://fsfm.local/${rel}`).pathname); }
    catch { fail(`${route}: malformed local reference "${ref}".`); continue; }
    if (pathname === '/') pathname = '/index.html';
    let target = path.join(dist, pathname.replace(/^\//, ''));
    if (pathname.endsWith('/')) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) {
      if (pathname.startsWith('/media/')) {
        if (!expectedMedia.some((item) => `/${item}` === pathname)) warnings.push(`${route}: unlisted media reference is missing: ${pathname}`);
      } else fail(`${route}: local reference does not resolve: ${ref}`);
    }
  }
}

const sitemapPath = path.join(dist, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) fail('sitemap.xml is missing.');
else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  if (!locs.includes('https://fsfm.port82.net/')) fail('Sitemap does not include the Homepage canonical URL.');
  if (!locs.includes('https://fsfm.port82.net/the-early-bird.html')) fail('Sitemap does not include the Album canonical URL.');
  if (locs.some((loc) => loc.includes('preview') || loc.includes('draft'))) fail('Sitemap contains a preview or draft URL.');
}
const robotsPath = path.join(dist, 'robots.txt');
if (!fs.existsSync(robotsPath)) fail('robots.txt is missing.');
else {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (!robots.includes('Sitemap: https://fsfm.port82.net/sitemap.xml')) fail('robots.txt does not advertise the production sitemap.');
  if (/Disallow:\s*\//.test(robots)) fail('Production robots.txt blocks the entire site.');
}

console.log(`V13 production audit: ${pageFiles.length} HTML page(s) checked.`);
if (missingMedia.length) console.log(`Live media pending: ${missingMedia.length} required file(s).`);
if (warnings.length) for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  console.error(`Release audit failed with ${errors.length} error(s).`);
  process.exitCode = 1;
} else {
  console.log('Release structure, metadata, local references, sitemap, robots and accessibility attribute checks passed.');
  if (missingMedia.length) {
    console.warn(requireMedia ? 'Pre-deployment media gate failed.' : 'This is a release candidate, not a deployable package until live media is restored.');
  } else console.log('All required live media is present.');
}
