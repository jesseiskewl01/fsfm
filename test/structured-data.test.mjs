import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSiteShell } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const site = read('content/v13/site.json');
const home = read('content/v13/homepage.json');
const album = read('content/v13/albums/the-early-bird.json');

function readStructuredData(page) {
  const html = renderSiteShell({
    page,
    site,
    pages: [home, album],
    bodyHtml: '<main>Test page</main>',
    pageTitle: page.seo?.title || page.identity.name,
    description: page.seo?.description || site.description
  });
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'generated page should include JSON-LD structured data');
  return JSON.parse(match[1]);
}

test('Homepage structured data connects WebSite, MusicGroup and WebPage', () => {
  const data = readStructuredData(home);
  assert.equal(data['@context'], 'https://schema.org');
  const website = data['@graph'].find(node => node['@type'] === 'WebSite');
  const artist = data['@graph'].find(node => node['@type'] === 'MusicGroup');
  const page = data['@graph'].find(node => node['@type'] === 'WebPage');
  assert.equal(website.name, site.siteName);
  assert.equal(website.publisher['@id'], artist['@id']);
  assert.equal(artist.url, site.baseUrl);
  assert.ok(artist.sameAs.includes('https://open.spotify.com/artist/2PcGMMcKTObTrK7XVw9GSX'));
  assert.equal(page.mainEntity['@id'], artist['@id']);
});

test('Album structured data identifies the release, artist, artwork and tracks', () => {
  const data = readStructuredData(album);
  const artist = data['@graph'].find(node => node['@type'] === 'MusicGroup');
  const website = data['@graph'].find(node => node['@type'] === 'WebSite');
  const page = data['@graph'].find(node => node['@type'] === 'WebPage');
  const release = data['@graph'].find(node => node['@type'] === 'MusicAlbum');
  assert.ok(release, 'album pages should describe the release as MusicAlbum');
  assert.equal(release.byArtist['@id'], artist['@id']);
  assert.equal(release.isPartOf['@id'], website['@id']);
  assert.equal(page.mainEntity['@id'], release['@id']);
  assert.ok(release.image.startsWith('https://fsfm.port82.net/'));
  assert.equal(release.track.length, album.templateData.player.tracks.length);
  assert.ok(release.track.every(track => track['@type'] === 'MusicRecording' && track.name));
});

test('Every page gets a breadcrumb list with canonical absolute URLs', () => {
  const data = readStructuredData(album);
  const breadcrumbs = data['@graph'].find(node => node['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumbs.itemListElement.map(item => item.position), [1, 2]);
  assert.equal(breadcrumbs.itemListElement[0].item, site.baseUrl);
  assert.equal(breadcrumbs.itemListElement[1].item, album.seo.canonical);
});

test('Untrusted or non-HTTPS social profile URLs are omitted from MusicGroup sameAs', () => {
  const original = site.socialProfiles;
  site.socialProfiles = [
    ...original,
    { label: 'Unsafe', url: 'javascript:alert(1)' },
    { label: 'Insecure', url: 'http://example.com/profile' },
    { label: 'Relative', url: '/profile' }
  ];
  const data = readStructuredData(home);
  const artist = data['@graph'].find(node => node['@type'] === 'MusicGroup');
  assert.equal(artist.sameAs.length, original.length);
  site.socialProfiles = original;
});
