import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const site = readJson('data/site-content.json');
const gadgets = readJson('data/homepage-gadgets.json');
const home = readJson('content/v13/homepage.json');
const album = readJson('content/v13/albums/the-early-bird.json');
const siteV13 = readJson('content/v13/site.json');
const wallpapers = readJson('content/v13/wallpapers.json');

function legacyTracks() {
  const html = fs.readFileSync(path.join(root, 'the-early-bird.html'), 'utf8');
  const match = html.match(/var TRACKS = (\[[\s\S]*?\n\]);/);
  assert.ok(match, 'legacy Album TRACKS array must be present');
  return JSON.parse(match[1]);
}

test('Homepage visible copy is migrated without text changes', () => {
  assert.equal(home.identity.name, site.siteName);
  assert.deepEqual(home.templateData.hero, {
    windowTitle: site.home.heroWindowTitle,
    badge: site.home.heroBadge,
    title: site.home.heroTitle,
    subtitle: site.home.heroSubtitle,
    handle: site.home.heroHandle
  });
  assert.deepEqual(home.sections.find(section => section.type === 'marquee').content.messages, site.home.marqueeMessages);
  assert.equal(home.sections.find(section => section.type === 'artist-statement').content.body, site.home.bio);
  assert.equal(home.sections.find(section => section.id === 'home-about').presentation.windowTitle, site.home.bioWindowTitle);
  assert.equal(home.sections.find(section => section.id === 'home-spotify').presentation.windowTitle, site.home.spotifyWindowTitle);
  assert.equal(home.sections.find(section => section.id === 'home-events').presentation.windowTitle, site.home.eventsWindowTitle);
  assert.equal(home.sections.find(section => section.id === 'home-social-links').presentation.windowTitle, site.home.socialWindowTitle);
});

test('Homepage gadget defaults and featured release are preserved', () => {
  for (const key of ['photos','dates','stickyNote','funWidgets']) assert.deepEqual(home.templateData.gadgets[key], gadgets[key]);
  const featured = home.templateData.gadgets.featuredRelease;
  assert.equal(featured.title, site.home.featuredAlbumTitle);
  assert.equal(featured.description, site.home.featuredAlbumMeta);
  assert.equal(featured.artwork, site.home.featuredCoverImage);
  assert.equal(featured.linkText, site.home.featuredLinkText);
  assert.equal(featured.url, site.home.featuredLinkUrl);
  assert.equal(home.templateData.gadgets.shutdownRedirectUrl, site.home.shutdownRedirectUrl);
});

test('Site identity, favicon and footer are retained', () => {
  assert.equal(siteV13.siteName, site.siteName);
  assert.equal(siteV13.favicon, site.favicon);
  assert.equal(home.templateData.footerText, site.footerText);
  assert.equal(album.templateData.footerText, site.footerText);
});

test('Album text, palette and public URL are preserved', () => {
  assert.equal(album.identity.route, '/the-early-bird.html');
  assert.equal(album.templateData.album.title, site.album.title);
  assert.equal(album.templateData.album.windowTitle, site.album.windowTitle);
  assert.equal(album.templateData.album.artistLine, site.album.artistLine);
  assert.equal(album.templateData.album.eyebrow, site.album.eyebrow);
  assert.equal(album.sections.find(section => section.type === 'artist-statement').content.body, site.album.bio);
  assert.deepEqual(wallpapers.presets.find(preset => preset.id === 'album-amber').palette, {
    ink: '#0a0806', dark: '#22160d', earth: '#634123', caramel: '#bd8b4e', cream: '#fef5de'
  });
});

test('All seven Album audio URLs and LRC file links match the original player', () => {
  const original = legacyTracks();
  const migrated = album.templateData.player.tracks;
  assert.equal(migrated.length, original.length);
  for (let index = 0; index < original.length; index += 1) {
    assert.equal(migrated[index].title, original[index].title);
    assert.equal(migrated[index].audioUrl, original[index].src);
    assert.equal(migrated[index].lyricsFile, original[index].lrc);
    assert.equal(migrated[index].instrumental, original[index].instrumental);
    assert.equal(fs.existsSync(path.join(root, original[index].lrc)), true);
  }
});

test('Original Homepage wallpaper assets and names are retained', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const preset of wallpapers.presets.filter(item => item.family === 'vista')) {
    assert.ok(html.includes(`name: "${preset.name}"`), `legacy theme ${preset.name} should exist`);
    assert.ok(html.includes(preset.imageUrl), `legacy wallpaper asset for ${preset.name} should match`);
  }
});
