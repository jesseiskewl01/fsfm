import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage } from '../src/core/page-validator.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

export function buildPageRecord({ root = projectRoot, template, name, slug, order, published = false, showInNavigation = true }) {
  if (!['vista-window', 'editorial'].includes(template)) {
    throw new Error('Template must be either "vista-window" or "editorial".');
  }
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('A page name is required.');
  const cleanSlug = slugify(slug || cleanName);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) throw new Error('Slug must contain lowercase letters, numbers and single hyphens.');

  const starterPath = path.join(root, 'content', 'v13', 'page-starters', `${template}.json`);
  const page = readJson(starterPath);
  const site = readJson(path.join(root, 'content', 'v13', 'site.json'));
  const canonicalBase = new URL(site.baseUrl || 'https://fsfm.port82.net/');
  const route = `/pages/${cleanSlug}/`;

  const currentOrders = [];
  for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
    const folder = path.join(root, 'content', 'v13', dir);
    if (!fs.existsSync(folder)) continue;
    for (const filename of fs.readdirSync(folder).filter((item) => item.endsWith('.json'))) {
      try {
        const existing = readJson(path.join(folder, filename));
        if (Number.isFinite(existing.identity?.order)) currentOrders.push(existing.identity.order);
      } catch { /* malformed existing entries are reported by the regular site validator */ }
    }
  }

  page.identity = {
    name: cleanName,
    slug: cleanSlug,
    route,
    order: Number.isFinite(order) ? order : (currentOrders.length ? Math.max(...currentOrders) + 10 : 10)
  };
  page.publishing = {
    published: Boolean(published),
    showInNavigation: Boolean(showInNavigation),
    navigationLabel: cleanName
  };
  page.seo = {
    title: `${cleanName} | ${site.siteName}`,
    description: '',
    canonical: new URL(route, canonicalBase).href,
    socialImage: site.seoDefaults?.socialImage || site.favicon || '',
    allowIndexing: true
  };

  const errors = validatePage(page, { root });
  if (errors.length) throw new Error(`Generated page failed validation:\n${errors.map((item) => `- ${item}`).join('\n')}`);
  return page;
}

export function createNewPage(options = {}) {
  const root = options.root || projectRoot;
  const page = buildPageRecord({ ...options, root });
  const targetFolder = path.join(root, 'content', 'v13', page.template === 'vista-window' ? 'vista-pages' : 'editorial-pages');
  fs.mkdirSync(targetFolder, { recursive: true });
  const targetPath = path.join(targetFolder, `${page.identity.slug}.json`);
  if (fs.existsSync(targetPath)) throw new Error(`A page with slug "${page.identity.slug}" already exists.`);
  const duplicateRoute = [];
  for (const dir of ['albums', 'vista-pages', 'editorial-pages']) {
    const folder = path.join(root, 'content', 'v13', dir);
    if (!fs.existsSync(folder)) continue;
    for (const filename of fs.readdirSync(folder).filter((item) => item.endsWith('.json'))) {
      const existing = readJson(path.join(folder, filename));
      if (existing.identity?.route === page.identity.route) duplicateRoute.push(filename);
    }
  }
  if (duplicateRoute.length) throw new Error(`Route "${page.identity.route}" is already in use.`);
  fs.writeFileSync(targetPath, `${JSON.stringify(page, null, 2)}\n`, { flag: 'wx' });
  return { page, path: targetPath };
}

function parseArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    if (['published', 'hide-from-navigation'].includes(key)) values[key] = true;
    else values[key] = argv[i + 1];
    if (!['published', 'hide-from-navigation'].includes(key)) i += 1;
  }
  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = createNewPage({
      template: args.template,
      name: args.name,
      slug: args.slug,
      published: Boolean(args.published),
      showInNavigation: !args['hide-from-navigation']
    });
    console.log(`Created ${result.page.template} page: ${result.page.identity.name}`);
    console.log(`File: ${path.relative(projectRoot, result.path)}`);
    console.log(`Route: ${result.page.identity.route}`);
    console.log(`Published: ${result.page.publishing.published ? 'yes' : 'no (draft)'}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
