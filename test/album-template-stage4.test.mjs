import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const site = read('content/v13/site.json');
const wallpapers = read('content/v13/wallpapers.json');
const homepage = read('content/v13/homepage.json');
const album = read('content/v13/albums/the-early-bird.json');
const html = renderPage(album, { site, pages: [homepage, album], wallpapers, preview: true, previewEmbeds: false });

test('Album template renders the actual FSFM Media Player, not the Stage 3 placeholder', () => {
  assert.match(html, /data-album-player/);
  assert.match(html, /FSFM Media Player/);
  assert.doesNotMatch(html, /stage-placeholder/);
});

test('Album page preserves the seven track names in their original order', () => {
  const names = ['I MADE YOU CRY','CARPE DIEM','DO WHAT YOU WISH','BISCUIT','GOODNIGHT','SANDISK CRUZER BLADE','CLEVELAND Z'];
  assert.equal(album.templateData.player.tracks.length, names.length);
  assert.deepEqual(album.templateData.player.tracks.map((track) => track.title), names);
  for (const name of names) assert.ok(html.includes(name));
});

test('Album page embeds exact audio URLs and all seven existing LRC references', () => {
  for (const track of album.templateData.player.tracks) {
    assert.ok(html.includes(track.audioUrl), `Missing audio URL for ${track.title}`);
    assert.ok(fs.existsSync(path.join(root, track.lyricsFile)), `Missing lyric file for ${track.title}`);
  }
});

test('Goodnight and Cleveland Z retain their special lyric handling metadata', () => {
  const goodnight = album.templateData.player.tracks.find((track) => track.title === 'GOODNIGHT');
  const cleveland = album.templateData.player.tracks.find((track) => track.title === 'CLEVELAND Z');
  assert.equal(goodnight.instrumental, false);
  assert.equal(cleveland.instrumental, true);
  assert.match(html, /lineWideLyricHighlight/);
});

test('Player exposes accessible transport, track selection and lyric controls', () => {
  for (const id of ['previousTrack','playPause','nextTrack','seekBar','trackList','lyricCurrent','playerStatus']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /aria-label="Choose a track"/);
  assert.match(html, /aria-live="polite"/);
});

test('Player script includes synchronised LRC parsing, line fill and auto progression', () => {
  const script = fs.readFileSync(path.join(root, 'src/client/album-player.js'), 'utf8');
  assert.match(script, /parseLrc/);
  assert.match(script, /--fill/);
  assert.match(script, /autoAdvance/);
  assert.match(script, /requestAnimationFrame/);
});

test('Album page preserves the amber hero, quote, Spotify embed and canonical URL', () => {
  assert.match(html, /album-hero-window/);
  assert.match(html, /intro-quote/);
  assert.match(html, /open\.spotify\.com\/embed\/album/);
  assert.match(html, /https:\/\/fsfm\.port82\.net\/the-early-bird\.html/);
  assert.match(html, /\"image\":\"https:\/\/fsfm\.port82\.net\/media\/images\/cover\.png\"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});

test('Album navigation contains one page menu with Home and Album entries', () => {
  assert.match(html, /<details class="site-menu">/);
  assert.match(html, /<span>Home<\/span>/);
  assert.match(html, /<span>Album<\/span>/);
});
