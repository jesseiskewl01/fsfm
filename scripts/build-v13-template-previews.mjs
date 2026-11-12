import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const site = readJson(path.join(root, 'content/v13/site.json'));
const wallpapers = readJson(path.join(root, 'content/v13/wallpapers.json'));
const previewRoot = path.join(root, 'preview-v13', 'templates');
fs.mkdirSync(previewRoot, { recursive: true });

const vista = readJson(path.join(root, 'content/v13/page-starters/vista-window.json'));
vista.identity = { name: 'Vista Window Page Preview', slug: 'vista-window-preview', route: '/templates/vista-window-preview/', order: 900 };
vista.templateData.footerText = 'A sample Vista Window Page · preview only';
vista.publishing = { published: false, showInNavigation: false, navigationLabel: '' };
vista.seo = { title: 'Vista Window Page Preview', description: 'Private template preview.', canonical: 'https://fsfm.port82.net/templates/vista-window-preview/', socialImage: '/media/images/cover.png', allowIndexing: false };
vista.sections = [
  { id: 'preview-hero', type: 'hero', enabled: true, presentation: {}, content: { eyebrow: 'VISTA WINDOW TEMPLATE', title: 'A little corner of the internet', subtitle: 'A reusable page built from the FSFM component library.' } },
  { id: 'preview-marquee', type: 'marquee', enabled: true, presentation: {}, content: { messages: ['WELCOME TO THE VISTA PAGES', 'A STRANGE LITTLE PLACE', 'FAKE SPACE FOG MACHINE'] } },
  { id: 'preview-about', type: 'artist-statement', enabled: true, group: { id: 'preview-windows', layout: 'grid', columns: 2 }, presentation: { windowTitle: 'ABOUT THIS PAGE' }, content: { body: 'This is a sample artist statement. Replace it with any text you want, then style it as a glass window or another supported presentation.' } },
  { id: 'preview-embed', type: 'embed-window', enabled: true, group: { id: 'preview-windows', layout: 'grid', columns: 2 }, presentation: { windowTitle: 'LISTEN HERE' }, content: { provider: 'spotify', url: 'https://open.spotify.com/embed/artist/2PcGMMcKTObTrK7XVw9GSX', title: 'FSFM on Spotify', height: 352 } },
  { id: 'preview-links', type: 'social-links', enabled: true, presentation: { windowTitle: 'FIND FSFM' }, content: { links: [{ label: 'Bandcamp', url: 'https://fakespacefogmachine.bandcamp.com' }, { label: 'Instagram', url: 'https://instagram.com/mirrorlesssmoke' }] } }
];

const editorial = readJson(path.join(root, 'content/v13/page-starters/editorial.json'));
editorial.identity = { name: 'Editorial Page Preview', slug: 'editorial-preview', route: '/templates/editorial-preview/', order: 901 };
editorial.templateData.footerText = 'A sample editorial page · preview only';
editorial.publishing = { published: false, showInNavigation: false, navigationLabel: '' };
editorial.seo = { title: 'Editorial Page Preview', description: 'Private template preview.', canonical: 'https://fsfm.port82.net/templates/editorial-preview/', socialImage: '/media/images/cover.png', allowIndexing: false };
editorial.sections = [
  { id: 'editorial-hero', type: 'hero', enabled: true, presentation: {}, content: { eyebrow: 'EDITORIAL TEMPLATE', title: 'Notes from the fog machine', subtitle: 'A quieter, content-led layout for stories, statements and visual essays.' } },
  { id: 'editorial-intro', type: 'rich-text', enabled: true, presentation: { windowTitle: 'AN INTRODUCTION' }, content: { heading: 'Room to tell a story', body: 'The Editorial template gives longer pieces room to breathe. Add headings, formatted paragraphs, links and images, then arrange them into a natural reading order.' } },
  { id: 'editorial-quote', type: 'quote', enabled: true, presentation: {}, content: { text: 'A website can feel like a place, not just a list of links.', attribution: 'FSFM' } },
  { id: 'editorial-statement', type: 'artist-statement', enabled: true, presentation: { windowTitle: 'ABOUT FSFM' }, content: { body: 'Shared components work here too. The artist statement is the same component used on the Homepage, Vista pages and Album pages, but the Editorial template gives it a different visual treatment.' } },
  { id: 'editorial-button', type: 'link-button', enabled: true, presentation: {}, content: { label: 'Visit the Homepage', url: '/', style: 'secondary' } }
];

for (const page of [vista, editorial]) {
  const html = renderPage(page, { site, pages: [], wallpapers, assets: '/assets', preview: true, previewEmbeds: true });
  const folder = path.join(previewRoot, page.identity.slug);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'index.html'), html);
}
fs.writeFileSync(path.join(previewRoot, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>FSFM V13 template previews</title><link rel="stylesheet" href="/assets/v13.css"></head><body><main style="max-width:760px;margin:10vh auto;padding:28px;color:#fff;font:16px/1.6 Segoe UI,Arial"><p style="letter-spacing:.15em;font-size:12px">FSFM · V13 · PRIVATE PREVIEW</p><h1>Future page templates</h1><p>These previews demonstrate the two reusable page templates. They are sample content, not published pages.</p><ul><li><a href="/templates/vista-window-preview/">Vista Window Page preview</a></li><li><a href="/templates/editorial-preview/">Editorial Page preview</a></li></ul></main></body></html>\n`);
console.log('Generated private Vista Window and Editorial template previews.');
