import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage, validateSite } from '../src/core/page-validator.mjs';
import { normalizePageRecord, routeForPage } from '../src/core/page-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const home = read('content/v13/homepage.json');
const album = read('content/v13/albums/the-early-bird.json');

test('canonical Homepage record validates', () => assert.deepEqual(validatePage(home, { root }), []));
test('canonical Album record validates and keeps all seven tracks', () => {
  assert.deepEqual(validatePage(album, { root }), []);
  assert.equal(album.templateData.player.tracks.length, 7);
});
test('Album requires exactly one album header', () => {
  const invalid = structuredClone(album);
  invalid.sections = invalid.sections.filter(section => section.type !== 'album-header');
  assert.ok(validatePage(invalid, { root }).some(message => message.includes('requires exactly 1 album-header')));
});
test('Album requires exactly one dedicated player', () => {
  const invalid = structuredClone(album);
  invalid.sections = invalid.sections.filter(section => section.type !== 'album-player');
  assert.ok(validatePage(invalid, { root }).some(message => message.includes('requires exactly 1 album-player')));
});
test('Album player cannot be disabled', () => {
  const invalid = structuredClone(album);
  invalid.sections.find(section => section.type === 'album-player').enabled = false;
  assert.ok(validatePage(invalid, { root }).some(message => message.includes('requires album-player to remain enabled')));
});
test('Album rejects a duplicate dedicated player', () => {
  const invalid = structuredClone(album);
  invalid.sections.push(structuredClone(invalid.sections.find(section => section.type === 'album-player')));
  assert.ok(validatePage(invalid, { root }).some(message => message.includes('allows at most 1 album-player')));
});
test('Wallpaper cycle supports both configured modes', () => {
  const sequential = structuredClone(home);
  sequential.appearance.wallpaper.cycle.mode = 'sequential';
  assert.deepEqual(validatePage(sequential, { root }), []);
  const random = structuredClone(home);
  random.appearance.wallpaper.cycle.mode = 'random';
  assert.deepEqual(validatePage(random, { root }), []);
});
test('Site requires one Homepage and unique routes', () => {
  assert.deepEqual(validateSite([home, album], { root }), []);
  const duplicateRoute = structuredClone(album);
  duplicateRoute.identity.slug = album.identity.slug;
  assert.ok(validateSite([home, album, duplicateRoute], { root }).some(message => message.includes('route /albums/the-early-bird/ is shared')));
});

test('Album supports an uploaded audio file instead of an external URL', () => {
  const uploaded = structuredClone(album);
  uploaded.templateData.player.tracks[0].audioUrl = '';
  uploaded.templateData.player.tracks[0].audioFile = '/media/audio/first-track.ogg';
  assert.deepEqual(validatePage(uploaded, { root }), []);
});
test('Album rejects missing or conflicting audio sources', () => {
  const missing = structuredClone(album);
  missing.templateData.player.tracks[0].audioUrl = '';
  missing.templateData.player.tracks[0].audioFile = '';
  assert.ok(validatePage(missing, { root }).some(message => message.includes('provide exactly one audio source')));
  const conflicting = structuredClone(album);
  conflicting.templateData.player.tracks[0].audioFile = '/media/audio/first-track.ogg';
  assert.ok(validatePage(conflicting, { root }).some(message => message.includes('provide exactly one audio source')));
});


test('Public routes are derived from page type and slug, not editable route strings', () => {
  assert.equal(routeForPage(home), '/');
  assert.equal(routeForPage(album), '/albums/the-early-bird/');
  const vista = { template: 'vista-window', identity: { name: 'A page', slug: 'a-page' } };
  const editorial = { template: 'editorial', identity: { name: 'An essay', slug: 'an-essay' } };
  assert.equal(routeForPage(vista), '/pages/a-page/');
  assert.equal(routeForPage(editorial), '/pages/an-essay/');
  const legacy = structuredClone(album);
  legacy.identity.route = '/the-early-bird.html';
  legacy.seo.canonical = '';
  const normalized = normalizePageRecord(legacy, { baseUrl: 'https://fsfm.port82.net/' });
  assert.equal(normalized.identity.route, '/albums/the-early-bird/');
  assert.equal(normalized.seo.canonical, 'https://fsfm.port82.net/albums/the-early-bird/');
});

test('A draft album can be created before its tracklist is filled in', () => {
  const draft = { ...structuredClone(album), publishing: { ...album.publishing, published: false }, templateData: { ...structuredClone(album.templateData), player: { ...structuredClone(album.templateData.player), tracks: [] } } };
  assert.deepEqual(validatePage(draft, { root }), []);
  draft.publishing.published = true;
  assert.ok(validatePage(draft, { root }).some(message => message.includes('Published Album template requires at least one player track')));
});

test('Normalizer generates stable internal IDs for blocks when omitted', () => {
  const source = { template:'vista-window', identity:{name:'Test',slug:'test'}, sections:[{type:'hero',enabled:true,content:{title:'Hi'}},{type:'hero',enabled:true,content:{title:'Again'}}] };
  const normalized = normalizePageRecord(source, { baseUrl:'https://fsfm.port82.net/' });
  assert.deepEqual(normalized.sections.map(section=>section.id), ['test-hero-1','test-hero-2']);
  assert.equal(source.sections[0].id, undefined);
});


test('Layout group names become stable internal IDs without exposing implementation details', () => {
  const source = { template:'vista-window', identity:{name:'Test',slug:'test'}, sections:[
    {type:'hero',enabled:true,content:{title:'One'},group:{name:'Listening area',layout:'grid',columns:2}},
    {type:'image',enabled:true,content:{src:'/media/images/cover.png'},group:{name:'Listening area',layout:'grid',columns:2}}
  ] };
  const normalized = normalizePageRecord(source, {baseUrl:'https://fsfm.port82.net/'});
  assert.equal(normalized.sections[0].group.id, 'listening-area');
  assert.equal(normalized.sections[1].group.id, 'listening-area');
  assert.equal(source.sections[0].group.id, undefined);
});


test('Incomplete Pages CMS Vista records normalize to safe, buildable page records', () => {
  const cmsRecord = read('content/v13/vista-pages/vistatest.json');
  const site = read('content/v13/site.json');
  const normalized = normalizePageRecord(cmsRecord, site);
  assert.equal(normalized.identity.route, '/pages/vistatest/');
  assert.equal(normalized.seo.socialImage, site.seoDefaults.socialImage);
  assert.deepEqual(normalized.sections.find(section => section.type === 'marquee').content.messages, []);
  assert.deepEqual(validatePage(normalized, { root }), []);
});


test('Simple wallpaper choices preserve legacy styles and resolve to renderer settings', () => {
  const homeNormalized = normalizePageRecord(home, { baseUrl: 'https://fsfm.port82.net/' });
  assert.equal(homeNormalized.appearance.wallpaper.choice, 'cycle');
  assert.equal(homeNormalized.appearance.wallpaper.mode, 'cycle');
  assert.equal(homeNormalized.appearance.wallpaper.cycle.enabled, true);
  assert.deepEqual(homeNormalized.appearance.wallpaper.presets, ['vista-violet-haze', 'vista-aqua-glass', 'vista-solar-flare', 'vista-rose-bloom']);

  const albumNormalized = normalizePageRecord(album, { baseUrl: 'https://fsfm.port82.net/' });
  assert.equal(albumNormalized.appearance.wallpaper.choice, 'album-amber');
  assert.equal(albumNormalized.appearance.wallpaper.mode, 'preset');
  assert.equal(albumNormalized.appearance.wallpaper.preset, 'album-amber');

  const custom = structuredClone(album);
  custom.appearance.wallpaper.choice = 'custom';
  custom.appearance.wallpaper.customImage = '/media/images/cover.png';
  const customNormalized = normalizePageRecord(custom, { baseUrl: 'https://fsfm.port82.net/' });
  assert.equal(customNormalized.appearance.wallpaper.mode, 'custom');
  assert.equal(customNormalized.appearance.wallpaper.customImage, '/media/images/cover.png');

  const editorial = { template: 'editorial', identity: { name: 'Essay', slug: 'essay' }, appearance: { wallpaper: { choice: 'template-default' } } };
  assert.equal(normalizePageRecord(editorial).appearance.wallpaper.preset, 'aurora');
});
