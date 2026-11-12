import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePage, validateSite } from '../src/core/page-validator.mjs';

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
  duplicateRoute.identity.route = '/';
  assert.ok(validateSite([home, duplicateRoute], { root }).some(message => message.includes('route / is shared')));
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
