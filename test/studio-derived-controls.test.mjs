import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHROME_PART_NAMES, COMPONENTS, PAGE_PARTS, SHELL_PART_NAMES, allowedComponentsFor } from '../src/core/parts.mjs';
import { partCatalogue } from '../src/core/studio-controls.mjs';
import { toTinaField, unionContentFields } from '../tina/fields.mjs';
import tinaConfig from '../tina/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const albumCollection = tinaConfig.schema.collections.find((collection) => collection.name === 'album');
const field = (fields, name) => fields.find((item) => item.name === name);
const appearance = field(albumCollection.fields, 'appearance');

test('the Studio catalogue is a complete plain-JSON projection of every part', () => {
  const catalogue = partCatalogue();
  assert.equal(catalogue.total, 35);
  assert.equal(catalogue.parts.length, 35);
  assert.deepEqual(catalogue.categories, ['component', 'effect', 'chrome', 'shell']);
  assert.deepEqual(Object.keys(catalogue.chromeParts), [...CHROME_PART_NAMES]);
  assert.deepEqual(Object.keys(catalogue.shellParts), [...SHELL_PART_NAMES]);
  assert.equal(Object.keys(catalogue.pageParts).length, 13);
  assert.deepEqual(Object.keys(catalogue.effects), ['backgroundEffects', 'pageTransition', 'respectReducedMotion', 'albumAtmosphere']);
  assert.equal(catalogue.effects.albumAtmosphere.modes.join(','), 'full,lite,off');
  for (const name of ['backgroundEffects', 'pageTransition', 'respectReducedMotion']) {
    assert.equal(catalogue.effects[name].valueType, 'boolean');
    assert.equal(catalogue.effects[name].default, true);
  }
  assert.deepEqual(catalogue.vocabularies.groupLayouts, ['grid', 'stack', 'columns']);
  assert.deepEqual(catalogue.templates.album.allowedComponentTypes, allowedComponentsFor('album'));
  assert.doesNotMatch(JSON.stringify(catalogue), /function\s*\(/, 'catalogue must be serialisable to a browser');
});

test('Tina block types and content fields come from the album part allowances', () => {
  const sections = field(albumCollection.fields, 'sections');
  const types = field(sections.fields, 'type');
  assert.deepEqual(types.options, allowedComponentsFor('album'));
  assert.equal(types.label, 'Part type');
  const contentNames = field(sections.fields, 'content').fields.map((item) => item.name);
  const expected = new Set();
  for (const type of allowedComponentsFor('album')) {
    for (const partField of COMPONENTS[type].fields) expected.add(partField.name);
  }
  for (const name of expected) assert.ok(contentNames.includes(name), `Tina is missing the ${name} field`);
  assert.deepEqual(unionContentFields('album').map((item) => item.name), contentNames);
});

test('Tina presentation and layout choices come from the shared vocabularies', () => {
  const sections = field(albumCollection.fields, 'sections');
  const presentation = field(sections.fields, 'presentation');
  assert.deepEqual(field(presentation.fields, 'variant').options, partCatalogue().vocabularies.presentationVariants.filter(Boolean));
  const group = field(sections.fields, 'group');
  assert.deepEqual(field(group.fields, 'layout').options, ['grid', 'stack', 'columns']);
});

test('Tina exposes the atmosphere mode and every switchable part as editable fields', () => {
  const effects = field(appearance.fields, 'effects');
  for (const [name, label] of [
    ['backgroundEffects', 'Background effects'],
    ['pageTransition', 'Page transition'],
    ['respectReducedMotion', 'Respect reduced motion']
  ]) {
    const toggle = field(effects.fields, name);
    assert.equal(toggle.type, 'boolean', `${name} should be a flat boolean Tina field`);
    assert.equal(toggle.label, label);
  }
  const atmosphere = field(effects.fields, 'albumAtmosphere');
  assert.equal(atmosphere.label, 'Album atmosphere');
  assert.deepEqual(field(atmosphere.fields, 'mode').options, ['full', 'lite', 'off']);
  const parts = field(appearance.fields, 'parts');
  assert.deepEqual(parts.fields.map((item) => item.name), Object.keys(PAGE_PARTS).filter((name) => PAGE_PARTS[name].templates.includes('album')));
  assert.equal(field(parts.fields, 'siteHeader').label, PAGE_PARTS.siteHeader.label);
  assert.equal(field(field(parts.fields, 'siteHeader').fields, 'enabled').type, 'boolean');
});

test('field type conversion handles the metadata used by the 18 parts', () => {
  assert.equal(toTinaField({ name: 'body', label: 'Body', type: 'textarea' }).ui.component, 'textarea');
  assert.deepEqual(toTinaField({ name: 'style', label: 'Style', type: 'select', options: ['primary', 'secondary'] }).options, ['primary', 'secondary']);
  const links = toTinaField({ name: 'links', label: 'Links', type: 'array', itemType: 'object', itemFields: [{ name: 'url', label: 'URL', type: 'url' }] });
  assert.equal(links.list, true);
  assert.equal(links.fields[0].type, 'string');
  assert.equal(toTinaField({ name: 'images', label: 'Images', type: 'array', itemType: 'image' }).type, 'image');
});

test('Studio reads the catalogue instead of keeping its own part labels', () => {
  const studio = read('studio/index.html');
  const server = read('scripts/dev-tina-preview.mjs');
  assert.match(studio, /function componentLabel\(type\)\{return S\.catalog\?\.components\?\.\[type\]\?\.label/);
  assert.match(studio, /S\.catalog\?\.pageParts/);
  assert.match(studio, /effectMeta\(name\)\.modes/);
  assert.doesNotMatch(studio, /const COMPONENT_LABELS=/);
  assert.match(server, /partCatalogue\(\)/);
  assert.match(server, /\/__fsfm\/api\/catalog/);
});
