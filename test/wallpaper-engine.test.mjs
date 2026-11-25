import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/client/wallpaper-engine.js'), 'utf8');

function runWallpaperEngine(config) {
  const layer = {
    dataset: { activePreset: config.preset || '' },
    style: { values: {}, setProperty(key, value) { this.values[key] = value; } },
    getAttribute() { return JSON.stringify(config); },
    querySelectorAll: () => [],
  };
  const document = {
    baseURI: 'http://localhost/albums/the-early-bird/',
    querySelector: (selector) => selector === '[data-wallpaper-layer]' ? layer : null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const window = {
    matchMedia: () => ({ matches: false }),
    setInterval: () => 1,
    clearInterval() {},
  };
  const context = {
    document,
    window,
    location: { origin: 'http://localhost' },
    URL,
    JSON,
    Math,
    Number,
    Object,
    Array,
    Boolean,
    String,
  };
  vm.runInNewContext(source, context);
  return layer;
}

test('a template-preset wallpaper with no image does not request a null URL', () => {
  const layer = runWallpaperEngine({
    mode: 'preset',
    preset: 'album-amber',
    presets: [],
    catalog: [{ id: 'album-amber', imageUrl: null, kind: 'template-preset', palette: {}, background: '' }],
    fit: 'cover',
    position: 'center',
  });
  assert.equal(layer.style.backgroundImage, '');
  assert.equal(layer.dataset.wallpaperKind, 'template-preset');
});

test('a valid HTTPS wallpaper is still applied', () => {
  const layer = runWallpaperEngine({
    mode: 'preset',
    preset: 'vista-aqua-glass',
    presets: [],
    catalog: [{ id: 'vista-aqua-glass', imageUrl: 'https://example.test/desktop.png', kind: 'image', palette: {}, background: '' }],
    fit: 'cover',
    position: 'center',
  });
  assert.equal(layer.style.backgroundImage, 'url("https://example.test/desktop.png")');
});
