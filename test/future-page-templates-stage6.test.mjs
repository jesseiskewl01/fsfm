import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render/page.mjs';
import { validatePage } from '../src/core/page-validator.mjs';
import { buildPageRecord, createNewPage, slugify } from '../scripts/create-page-v13.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const site = read('content/v13/site.json');
const wallpapers = read('content/v13/wallpapers.json');
const vistaStarter = read('content/v13/page-starters/vista-window.json');
const editorialStarter = read('content/v13/page-starters/editorial.json');
const albumStarter = read('content/v13/page-starters/album.json');

function pageFrom(starter, template, name, slug) {
  const page = structuredClone(starter);
  page.identity = { name, slug, route: `/pages/${slug}/`, order: 20 };
  page.publishing = { published: true, showInNavigation: true, navigationLabel: name };
  page.seo = { title: `${name} | FSFM`, description: 'A test page', canonical: `https://fsfm.port82.net/pages/${slug}/`, socialImage: '/media/images/cover.png', allowIndexing: true };
  page.template = template;
  return page;
}

test('Vista page renders with Vista glass defaults and no Homepage desktop gadgets', () => {
  const page = pageFrom(vistaStarter, 'vista-window', 'Listening Room', 'listening-room');
  page.sections = [
    { id: 'hero', type: 'hero', enabled: true, presentation: {}, content: { eyebrow: 'FSFM RADIO', title: 'Listening Room', subtitle: 'A little place to listen.' } },
    { id: 'bio', type: 'artist-statement', enabled: true, presentation: { windowTitle: 'ABOUT THIS PAGE' }, content: { body: 'A short introduction.' } },
    { id: 'embed', type: 'embed-window', enabled: true, group: { id: 'listen-grid', layout: 'grid', columns: 2 }, presentation: { windowTitle: 'LISTEN' }, content: { url: 'https://open.spotify.com/embed/artist/example', title: 'FSFM on Spotify', height: 352 } },
    { id: 'social', type: 'social-links', enabled: true, group: { id: 'listen-grid', layout: 'grid', columns: 2 }, presentation: { windowTitle: 'FOLLOW' }, content: { links: [{ label: 'Bandcamp', url: 'https://fakespacefogmachine.bandcamp.com' }] } }
  ];
  assert.deepEqual(validatePage(page), []);
  const html = renderPage(page, { site, pages: [page], wallpapers });
  assert.match(html, /body class="template-vista-window"/);
  assert.match(html, /variant-vista-window/);
  assert.match(html, /data-layout-group="listen-grid"/);
  assert.match(html, /Listening Room/);
  assert.doesNotMatch(html, /homepage-gadgets|desktop-gadget-layer|barrel-roll-button/);
  assert.match(html, /aria-current="page"/);
});

test('Editorial page uses the editorial visual treatment and page-level footer override', () => {
  const page = pageFrom(editorialStarter, 'editorial', 'About the Project', 'about-the-project');
  page.templateData.footerText = 'A little corner of the internet.';
  page.sections = [
    { id: 'hero', type: 'hero', enabled: true, presentation: {}, content: { eyebrow: 'FAKE SPACE FOG MACHINE', title: 'About the Project', subtitle: 'A small introduction.' } },
    { id: 'statement', type: 'artist-statement', enabled: true, presentation: {}, content: { body: 'Independent music, unusual pages and strange little ideas.' } },
    { id: 'quote', type: 'quote', enabled: true, presentation: {}, content: { text: 'Make something worth finding.', attribution: 'FSFM' } }
  ];
  assert.deepEqual(validatePage(page), []);
  const html = renderPage(page, { site, pages: [page], wallpapers });
  assert.match(html, /body class="template-editorial"/);
  assert.match(html, /variant-editorial/);
  assert.match(html, /A little corner of the internet\./);
  assert.match(html, /Make something worth finding\./);
  assert.match(html, /class="site-wallpaper"/);
});

test('Vista and Editorial pages use crawlable server-rendered content and page-specific SEO', () => {
  const page = pageFrom(vistaStarter, 'vista-window', 'A Useful Page', 'a-useful-page');
  page.sections = [{ id: 'body', type: 'rich-text', enabled: true, content: { heading: 'The heading', body: 'Searchable page text.' } }];
  const html = renderPage(page, { site, pages: [page], wallpapers });
  assert.match(html, /<title>A Useful Page \| FSFM<\/title>/);
  assert.match(html, /name="description" content="A test page"/);
  assert.match(html, /Searchable page text\./);
  assert.match(html, /<link rel="canonical" href="https:\/\/fsfm\.port82\.net\/pages\/a-useful-page\/"/);
  assert.match(html, /application\/ld\+json/);
});

test('Unpublished pages are omitted from navigation when rendering a published page', () => {
  const current = pageFrom(vistaStarter, 'vista-window', 'Current Page', 'current-page');
  current.sections = [];
  const draft = pageFrom(editorialStarter, 'editorial', 'Hidden Draft', 'hidden-draft');
  draft.publishing.published = false;
  const html = renderPage(current, { site, pages: [current, draft], wallpapers });
  assert.match(html, /Current Page/);
  assert.doesNotMatch(html, /Hidden Draft/);
});

test('Invalid layout group IDs, layouts, columns and presentation variants are rejected', () => {
  const page = pageFrom(vistaStarter, 'vista-window', 'Validation Page', 'validation-page');
  page.sections = [{ id: 'statement', type: 'artist-statement', enabled: true, group: { id: 'not allowed!', layout: 'mosaic', columns: 8 }, presentation: { variant: 'made-up-style' }, content: { body: 'Hello.' } }];
  const errors = validatePage(page);
  assert.ok(errors.some((item) => item.includes('layout group id')));
  assert.ok(errors.some((item) => item.includes('layout group layout')));
  assert.ok(errors.some((item) => item.includes('columns')));
  assert.ok(errors.some((item) => item.includes('presentation variant')));
});

test('Page scaffolder creates safe unpublished Vista and Editorial records using slugs', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fsfm-stage6-'));
  try {
    fs.mkdirSync(path.join(temp, 'content/v13/page-starters'), { recursive: true });
    fs.mkdirSync(path.join(temp, 'content/v13/vista-pages'), { recursive: true });
    fs.mkdirSync(path.join(temp, 'content/v13/editorial-pages'), { recursive: true });
    fs.mkdirSync(path.join(temp, 'content/v13/albums'), { recursive: true });
    fs.writeFileSync(path.join(temp, 'content/v13/page-starters/vista-window.json'), JSON.stringify(vistaStarter));
    fs.writeFileSync(path.join(temp, 'content/v13/page-starters/editorial.json'), JSON.stringify(editorialStarter));
    fs.writeFileSync(path.join(temp, 'content/v13/page-starters/album.json'), JSON.stringify(albumStarter));
    fs.writeFileSync(path.join(temp, 'content/v13/site.json'), JSON.stringify(site));
    const result = createNewPage({ root: temp, template: 'vista-window', name: 'The Listening Room', showInNavigation: true });
    assert.equal(result.page.identity.slug, 'the-listening-room');
    assert.equal(result.page.identity.route, '/pages/the-listening-room/');
    assert.equal(result.page.publishing.published, false);
    assert.equal(result.page.publishing.showInNavigation, true);
    assert.ok(fs.existsSync(result.path));
    assert.deepEqual(validatePage(JSON.parse(fs.readFileSync(result.path, 'utf8'))), []);
    assert.throws(() => createNewPage({ root: temp, template: 'vista-window', name: 'The Listening Room' }), /already exists|already in use/);
    const editorial = buildPageRecord({ root: temp, template: 'editorial', name: 'Notes & Fragments', slug: 'notes-fragments' });
    assert.equal(editorial.template, 'editorial');
    assert.equal(editorial.seo.canonical, 'https://fsfm.port82.net/pages/notes-fragments/');
    const album = buildPageRecord({ root: temp, template: 'album', name: 'The Next Record' });
    assert.equal(album.template, 'album');
    assert.equal(album.identity.route, '/albums/the-next-record/');
    assert.equal(album.publishing.published, false);
    assert.deepEqual(album.templateData.player.tracks, []);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('Slugification creates URL-safe lowercase slugs', () => {
  assert.equal(slugify('The Kinda Deals That Make Ü Wanna Boogie!'), 'the-kinda-deals-that-make-u-wanna-boogie');
  assert.equal(slugify('  A   Little Page  '), 'a-little-page');
});


test('Page navigation is presented as one menu containing all published pages', () => {
  const current = pageFrom(vistaStarter, 'vista-window', 'Listening Room', 'listening-room');
  const album = structuredClone(read('content/v13/albums/the-early-bird.json'));
  const draft = pageFrom(editorialStarter, 'editorial', 'Private Draft', 'private-draft');
  draft.publishing.published = false;
  const html = renderPage(current, { site, pages: [current, album, draft], wallpapers });
  assert.match(html, /<details class="site-menu">/);
  assert.match(html, /aria-label="Site pages"/);
  assert.match(html, /<span>Album<\/span>/);
  assert.doesNotMatch(html, /Private Draft/);
});
