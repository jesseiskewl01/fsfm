import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playerSource = fs.readFileSync(path.join(rootDir, 'src/client/album-player.js'), 'utf8');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.textContent = '';
    this.value = '0';
    this.title = '';
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.duration = 60;
    this.src = '';
    this.children = [];
    this.attributes = {};
    this.handlers = {};
    this.style = { values: {}, setProperty: (key, value) => { this.style.values[key] = value; } };
    this.classList = {
      values: new Set(),
      add: (name) => this.classList.values.add(name),
      remove: (name) => this.classList.values.delete(name),
      toggle: (name, force) => {
        const enabled = force === undefined ? !this.classList.values.has(name) : Boolean(force);
        if (enabled) this.classList.values.add(name); else this.classList.values.delete(name);
        return enabled;
      }
    };
  }
  addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); }
  dispatch(type) { for (const callback of this.handlers[type] || []) callback({ target: this }); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  load() { this.currentTime = 0; this.ended = false; }
  pause() { const wasPlaying = !this.paused; this.paused = true; if (wasPlaying) this.dispatch('pause'); }
  play() { this.paused = false; this.dispatch('play'); return Promise.resolve(); }
}

function makePlayer({ tracks, lrcText = '[00:00.00]FIRST LINE\n[00:05.00]SECOND LINE' }) {
  const root = new FakeElement('root');
  const ids = ['albumAudio','trackList','playPause','seekBar','currentTrackTitle','playerTrackCount','currentTime','trackDuration','playerStatus','lyricPrevious','lyricCurrent','lyricNext','lyricStatus','previousTrack','nextTrack','albumPlayerData'];
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]));
  elements.albumPlayerData.textContent = JSON.stringify({ tracks, autoAdvance: true, lineWideLyricHighlight: true });
  root.querySelector = (selector) => elements[selector.replace(/^#/, '')] || null;
  elements.albumAudio.paused = true;
  const document = {
    querySelector: (selector) => selector === '[data-album-player]' ? root : null,
    createElement: (tag) => new FakeElement(tag)
  };
  let rafId = 0;
  const window = {
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: () => ++rafId,
    cancelAnimationFrame: () => {}
  };
  const fetchCalls = [];
  const fetch = async (url) => {
    fetchCalls.push(url);
    return { ok: true, text: async () => lrcText };
  };
  vm.runInNewContext(playerSource, { document, window, fetch, Promise, Number, String, Math, JSON });
  return { root, elements, fetchCalls };
}

const tracks = [
  { id: 'one', title: 'FIRST TRACK', src: 'https://audio.example/one.ogg', lyrics: 'lyrics/one.lrc', instrumental: false },
  { id: 'two', title: 'SECOND TRACK', src: 'https://audio.example/two.ogg', lyrics: 'lyrics/two.lrc', instrumental: false },
  { id: 'three', title: 'INSTRUMENTAL', src: 'https://audio.example/three.ogg', lyrics: '', instrumental: true }
];
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('player initialises the first track and builds accessible track buttons', async () => {
  const { elements, fetchCalls } = makePlayer({ tracks });
  await tick();
  assert.equal(elements.albumAudio.src, tracks[0].src);
  assert.equal(elements.currentTrackTitle.textContent, 'FIRST TRACK');
  assert.equal(elements.playerTrackCount.textContent, 'TRACK 01 / 03');
  assert.equal(elements.trackList.children.length, 3);
  assert.equal(elements.trackList.children[0].attributes['aria-pressed'], 'true');
  assert.deepEqual(fetchCalls, ['lyrics/one.lrc']);
  assert.equal(elements.lyricCurrent.textContent, 'FIRST LINE');
});

test('seeking time updates the active synchronised lyric line', async () => {
  const { elements } = makePlayer({ tracks });
  await tick();
  elements.albumAudio.currentTime = 5.1;
  elements.albumAudio.dispatch('timeupdate');
  assert.equal(elements.lyricCurrent.textContent, 'SECOND LINE');
  assert.equal(elements.lyricPrevious.textContent, 'FIRST LINE');
});

test('track selection changes the audio and associated lyric file', async () => {
  const { elements, fetchCalls } = makePlayer({ tracks });
  await tick();
  elements.trackList.children[1].dispatch('click');
  await tick();
  assert.equal(elements.albumAudio.src, tracks[1].src);
  assert.equal(elements.currentTrackTitle.textContent, 'SECOND TRACK');
  assert.equal(elements.trackList.children[1].attributes['aria-pressed'], 'true');
  assert.deepEqual(fetchCalls, ['lyrics/one.lrc','lyrics/two.lrc']);
});

test('instrumental tracks skip LRC fetch and show instrumental status', async () => {
  const { elements, fetchCalls } = makePlayer({ tracks });
  await tick();
  elements.trackList.children[2].dispatch('click');
  await tick();
  assert.equal(elements.albumAudio.src, tracks[2].src);
  assert.equal(elements.lyricCurrent.textContent, '♪');
  assert.equal(elements.lyricStatus.textContent, 'INSTRUMENTAL TRACK');
  assert.deepEqual(fetchCalls, ['lyrics/one.lrc']);
});

test('play, next and automatic progression update player state', async () => {
  const { elements } = makePlayer({ tracks });
  await tick();
  elements.playPause.dispatch('click');
  await tick();
  assert.equal(elements.albumAudio.paused, false);
  assert.equal(elements.playPause.attributes['aria-label'], 'Pause');
  elements.nextTrack.dispatch('click');
  await tick();
  assert.equal(elements.currentTrackTitle.textContent, 'SECOND TRACK');
  assert.equal(elements.albumAudio.paused, false);
  elements.albumAudio.dispatch('ended');
  await tick();
  assert.equal(elements.currentTrackTitle.textContent, 'INSTRUMENTAL');
});
