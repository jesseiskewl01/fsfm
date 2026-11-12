import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = fs.readFileSync(path.join(root, '.pages.yml'), 'utf8');

test('Pages CMS exposes the four approved page areas', () => {
  for (const entry of [
    'name: homepage\n    label: Homepage',
    'name: albums\n    label: Albums',
    'name: vista-pages\n    label: Vista Pages',
    'name: editorial-pages\n    label: Editorial Pages'
  ]) assert.ok(config.includes(entry), `missing CMS collection: ${entry}`);
});

test('Pages CMS edits canonical V13 records rather than legacy parallel files', () => {
  for (const file of [
    'content/v13/homepage.json', 'content/v13/albums',
    'content/v13/vista-pages', 'content/v13/editorial-pages',
    'content/v13/site.json', 'content/v13/wallpapers.json'
  ]) assert.ok(config.includes(file), `missing canonical path: ${file}`);
  assert.ok(!config.includes('data/site-content.json'));
  assert.ok(!config.includes('data/homepage-gadgets.json'));
  assert.ok(!config.includes('path: content/pages'));
});

test('Shared page settings are reusable CMS field components', () => {
  for (const component of ['identity', 'publishing', 'appearance', 'seo', 'sectionPresentation']) {
    assert.ok(config.includes(`  ${component}:`), `missing reusable field component ${component}`);
  }
});

test('Album editor includes track audio and synchronized LRC file fields', () => {
  assert.ok(config.includes('label: Uploaded audio file'));
  assert.ok(config.includes('label: Synchronized lyrics (.lrc)'));
  assert.match(config, /media: lyrics[\s\S]*?extensions:\n\s+- lrc/);
  assert.ok(config.includes('label: FSFM Media Player (required)'));
});

test('Every template gets an appropriate block editor', () => {
  for (const component of ['homepageSections', 'albumSections', 'vistaSections', 'editorialSections']) {
    assert.ok(config.includes(`  ${component}:`), `missing ${component}`);
  }
  for (const block of ['marquee', 'artist-statement', 'embed-window', 'rich-text', 'image', 'gallery', 'quote', 'link-button', 'divider', 'spacer']) {
    assert.ok(config.includes(`- name: ${block}`), `missing shared building block ${block}`);
  }
});


test('CMS hides computed public routes and puts page-wide settings before the block editor', () => {
  const identity = config.slice(config.indexOf('  identity:'), config.indexOf('  publishing:'));
  assert.match(identity, /name: slug/);
  assert.doesNotMatch(identity, /name: route/);
  const albumStart = config.indexOf('  - name: albums');
  const vistaStart = config.indexOf('  - name: vista-pages');
  const albums = config.slice(albumStart, vistaStart);
  assert.ok(albums.indexOf('component: identity') < albums.indexOf('component: appearance'));
  assert.ok(albums.indexOf('component: appearance') < albums.indexOf('component: publishing'));
  assert.ok(albums.indexOf('component: publishing') < albums.indexOf('component: seo'));
  assert.ok(albums.indexOf('component: seo') < albums.indexOf('component: albumSections'));
  assert.match(config, /PAGE LAYOUT · ALBUM BUILDING BLOCKS/);
  assert.match(config, /The name visitors see in the page menu/);
});

 
test('CMS hides implementation fields and gives the block editor usable help', () => {
  assert.match(config, /label: false\n\s+type: string\n\s+hidden: true/);
  assert.match(config, /label: Group name/);
  assert.match(config, /description: Give blocks the same group name/);
  assert.match(config, /description: The flexible text block/);
  assert.match(config, /description: Choose the page wallpaper/);
  assert.match(config, /list:\n\s+min: 0\n\s+default: \[\]/);
});


test('Wallpaper editor presents one clear choice and hides renderer implementation settings', () => {
  const wallpaper = config.slice(config.indexOf('    - name: wallpaper'), config.indexOf('    - name: effects'));
  assert.match(wallpaper, /- name: choice[\s\S]*?label: Wallpaper style[\s\S]*?type: select/);
  assert.match(wallpaper, /- name: mode[\s\S]*?hidden: true/);
  assert.match(wallpaper, /- name: preset[\s\S]*?hidden: true/);
  assert.match(wallpaper, /- name: customImage[\s\S]*?label: Optional custom image/);
  assert.match(wallpaper, /- name: cycle[\s\S]*?hidden: true/);
});

test('Page title and wallpaper settings appear before the page layout blocks', () => {
  const vistaStart = config.indexOf('    - name: vista-pages');
  const editorialStart = config.indexOf('    - name: editorial-pages');
  const siteSettingsStart = config.indexOf('  - name: site-settings');
  for (const section of [config.slice(vistaStart, editorialStart), config.slice(editorialStart, siteSettingsStart)]) {
    assert.ok(section.indexOf('component: identity') < section.indexOf('component: seo'));
    assert.ok(section.indexOf('component: seo') < section.indexOf('component: appearance'));
    assert.ok(section.indexOf('component: appearance') < section.indexOf('component: sections'));
  }
});
