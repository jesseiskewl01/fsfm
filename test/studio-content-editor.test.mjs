import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPONENTS } from '../src/components/registry.mjs';
import { TEMPLATES } from '../src/templates/registry.mjs';
import { RENDERED_COMPONENT_TYPES } from '../src/render/components.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');

test('every registered building block has a renderer and Studio editing surface', () => {
  assert.deepEqual(new Set(RENDERED_COMPONENT_TYPES), new Set(Object.keys(COMPONENTS)));
  for (const type of Object.keys(COMPONENTS)) {
    assert.ok(studio.includes(type), `Studio should expose ${type}`);
  }
  assert.match(studio, /function renderSections\(/);
  assert.match(studio, /function defaultComponent\(/);
  assert.match(studio, /data-add-array/);
});

test('each page template exposes only blocks registered for that template', () => {
  assert.deepEqual(Object.keys(TEMPLATES).sort(), ['album', 'editorial', 'homepage', 'vista-window']);
  for (const [templateName, template] of Object.entries(TEMPLATES)) {
    for (const type of template.allowedComponentTypes) {
      assert.ok(COMPONENTS[type], `${templateName} references registered ${type}`);
      assert.ok(COMPONENTS[type].templates.includes(templateName), `${type} must allow ${templateName}`);
      assert.ok(RENDERED_COMPONENT_TYPES.includes(type), `${type} must have a renderer`);
    }
  }
});

test('Studio exposes homepage, global settings, wallpaper, and all page template workflows', () => {
  for (const phrase of ['Homepage desktop &amp; gadgets', 'Site settings', 'Wallpaper catalogue', 'Create a page', 'Album &amp; player settings', 'Vista pages', 'Editorial pages']) {
    assert.ok(studio.includes(phrase), `Missing Studio workflow: ${phrase}`);
  }
  assert.match(server, /__fsfm\/api\/content\/create/);
  assert.match(server, /createNewPage\(/);
  assert.match(server, /validateSite\(/);
});

test('local media uploads are exposed in Studio and restricted to approved media folders', () => {
  assert.match(studio, /async function uploadAsset/);
  assert.match(studio, /data-asset-kind/);
  assert.match(server, /__fsfm\/api\/assets/);
  assert.match(server, /media\/images/);
  assert.match(server, /media\/audio/);
  assert.match(server, /contentBase64/);
  assert.match(server, /maximum file size|30 \* 1024 \* 1024/i);
});

test('synced lyrics have a separate protected local editing route', () => {
  assert.match(studio, /Edit synced lyrics/);
  assert.match(studio, /async function openLyricsEditor/);
  assert.match(server, /const lyricsMatch = pathname\.match/);
  assert.match(server, /publisher\.recordSavedFile\('lyrics\//);
});

test('all global and page content resources are exposed by the authenticated API', () => {
  for (const phrase of ["'/__fsfm/api/content/homepage'", "'/__fsfm/api/content/site'", "'/__fsfm/api/content/wallpapers'", '/__fsfm/api/catalog']) {
    assert.ok(server.includes(phrase), `Missing content resource: ${phrase}`);
  }
  assert.match(server, /normalizePageRecord\(/);
  assert.match(server, /validateWallpaperCatalogue\(/);
  assert.match(server, /validateSiteSettings\(/);
});
