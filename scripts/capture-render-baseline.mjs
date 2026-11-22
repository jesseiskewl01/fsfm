/** Capture (or compare) the exact rendered HTML of every published page.
 *  Used to prove a refactor changed the foundations, not the visible output.
 *  Output lives outside the repository by default. Nothing is published.
 *
 *  Usage:
 *    node scripts/capture-render-baseline.mjs
 *    node scripts/capture-render-baseline.mjs --compare
 *    FSFM_BASELINE_DIR=<dir> node scripts/capture-render-baseline.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHomepage } from '../src/render/homepage.mjs';
import { renderPage } from '../src/render/page.mjs';
import { normalizePages } from '../src/core/page-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'content', 'v13');
const outDir = process.env.FSFM_BASELINE_DIR || path.join(os.tmpdir(), 'opencode', 'fsfm-render-baseline');
const compare = process.argv.includes('--compare');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const site = readJson(path.join(contentRoot, 'site.json'));
const wallpapers = readJson(path.join(contentRoot, 'wallpapers.json'));
const raw = [readJson(path.join(contentRoot, 'homepage.json'))];
for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
  const folder = path.join(contentRoot, dir);
  if (!fs.existsSync(folder)) continue;
  for (const name of fs.readdirSync(folder).filter((file) => file.endsWith('.json')).sort()) {
    raw.push(readJson(path.join(folder, name)));
  }
}
const published = normalizePages(raw, site).filter((page) => page.publishing?.published !== false);

const rendered = new Map();
for (const page of published) {
  const html = page.template === 'homepage'
    ? renderHomepage(page, { site, pages: published, wallpapers, assets: '/assets' })
    : renderPage(page, { site, pages: published, wallpapers, assets: '/assets' });
  const key = page.identity?.route === '/' ? 'homepage.html' : `${page.identity.slug}.html`;
  rendered.set(key, html);
}

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);

if (!compare) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, html] of rendered) {
    fs.writeFileSync(path.join(outDir, name), html);
    console.log(`${hash(html)}  ${name}  (${html.length} chars)`);
  }
  console.log(`Baseline written to ${outDir}`);
} else {
  if (!fs.existsSync(outDir)) {
    console.error(`No baseline found at ${outDir}. Capture one first.`);
    process.exit(1);
  }
  let changed = 0;
  for (const [name, html] of rendered) {
    const previous = path.join(outDir, name);
    if (!fs.existsSync(previous)) {
      console.log(`NEW      ${name}`);
      changed += 1;
      continue;
    }
    const before = fs.readFileSync(previous, 'utf8');
    if (before === html) console.log(`SAME     ${name}  (${hash(html)})`);
    else {
      changed += 1;
      console.log(`CHANGED  ${name}  ${hash(before)} -> ${hash(html)}`);
      const beforeLines = before.split('');
      const common = beforeLines.findIndex((char, index) => char !== html[index]);
      console.log(`         first difference at character ${common}`);
    }
  }
  console.log(changed ? `${changed} page(s) changed.` : `All ${rendered.size} page(s) are byte-for-byte identical.`);
  process.exit(changed ? 1 : 0);
}
