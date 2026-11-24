import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PARTS, COMPONENTS, COMPONENT_TYPES, PART_CATEGORIES, PRESENTATION_VARIANTS, GROUP_LAYOUTS, allowedComponentsFor, getPart, listParts } from '../src/core/parts.mjs';
import { TEMPLATES } from '../src/templates/registry.mjs';
import { RENDERED_COMPONENT_TYPES } from '../src/render/components.mjs';
import { COMPONENTS as PUBLIC_COMPONENTS } from '../src/components/registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// These are the rules as they stood before the single-source refactor.
const ORIGINAL_TEMPLATES = {
  'site-header': ['homepage', 'album', 'vista-window', 'editorial'],
  hero: ['homepage', 'vista-window', 'editorial'],
  marquee: ['homepage', 'album', 'vista-window', 'editorial'],
  'artist-statement': ['homepage', 'album', 'vista-window', 'editorial'],
  'embed-window': ['homepage', 'album', 'vista-window', 'editorial'],
  'bandsintown-events': ['homepage', 'vista-window', 'editorial'],
  'social-links': ['homepage', 'album', 'vista-window', 'editorial'],
  'featured-release': ['homepage', 'album', 'vista-window', 'editorial'],
  'rich-text': ['homepage', 'album', 'vista-window', 'editorial'],
  image: ['homepage', 'album', 'vista-window', 'editorial'],
  gallery: ['homepage', 'album', 'vista-window', 'editorial'],
  quote: ['homepage', 'album', 'vista-window', 'editorial'],
  'link-button': ['homepage', 'album', 'vista-window', 'editorial'],
  divider: ['homepage', 'album', 'vista-window', 'editorial'],
  spacer: ['homepage', 'album', 'vista-window', 'editorial'],
  'album-header': ['album'],
  'album-player': ['album'],
  'spotify-embed': ['album']
};
const ORIGINAL_REQUIRED = {
  'site-header': ['content.name'], hero: ['content.title'], marquee: ['content.messages'],
  'artist-statement': ['content.body'], 'embed-window': ['content.url'],
  'bandsintown-events': ['content.artistName', 'content.appId'],
  'social-links': ['content.links'], 'featured-release': ['content.title', 'content.url'],
  'rich-text': ['content.body'], image: ['content.src'], gallery: ['content.images'],
  quote: ['content.text'], 'link-button': ['content.label', 'content.url'],
  divider: [], spacer: [], 'album-header': [], 'album-player': ['content.source'],
  'spotify-embed': ['content.source']
};
const ORIGINAL_ALLOWANCES = {
  homepage: ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer'],
  album: ['site-header','marquee','artist-statement','embed-window','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer','album-header','album-player','spotify-embed'],
  'vista-window': ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer'],
  editorial: ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer']
};

test('there are exactly 18 parts and the legacy entry point is the same object', () => {
  assert.equal(COMPONENT_TYPES.length, 18);
  assert.strictEqual(PUBLIC_COMPONENTS, COMPONENTS);
  for (const type of COMPONENT_TYPES) assert.equal(COMPONENTS[type].type, type);
});

test('derived template lists and required fields match the pre-refactor rules exactly', () => {
  for (const [type, templates] of Object.entries(ORIGINAL_TEMPLATES)) {
    assert.deepEqual([...COMPONENTS[type].templates], templates, `${type} templates`);
    assert.deepEqual([...COMPONENTS[type].required], ORIGINAL_REQUIRED[type], `${type} required fields`);
  }
});

test('required fields are derived from field metadata, not written twice', () => {
  for (const part of Object.values(COMPONENTS)) {
    const expected = part.fields.filter((field) => field.required).map((field) => `content.${field.name}`);
    assert.deepEqual([...part.required], expected);
  }
});

test('template allowances derive from the parts and are unchanged', () => {
  for (const [name, expected] of Object.entries(ORIGINAL_ALLOWANCES)) {
    assert.deepEqual([...allowedComponentsFor(name)], expected, `${name} derived allowances`);
    assert.deepEqual([...TEMPLATES[name].allowedComponentTypes], expected, `${name} published allowances`);
  }
});

test('shared variant and layout vocabularies replace the old local copies', () => {
  assert.deepEqual([...PRESENTATION_VARIANTS], ['vista-window','vista-desktop','editorial','amber-editorial','amber-player','plain','']);
  assert.deepEqual([...GROUP_LAYOUTS], ['grid','stack','columns']);
});

test('every part has a real branch in the renderer switch', () => {
  const source = fs.readFileSync(path.join(root, 'src/render/components.mjs'), 'utf8');
  for (const type of COMPONENT_TYPES) {
    assert.match(source, new RegExp(`case '${type}':`), `${type} is missing from renderSectionInner`);
  }
  assert.strictEqual(RENDERED_COMPONENT_TYPES, COMPONENT_TYPES);
});

test('the whole visible site is one catalogue of 35 parts in four categories', () => {
  assert.deepEqual([...PART_CATEGORIES], ['component', 'effect', 'chrome', 'shell']);
  assert.equal(listParts().length, 35);
  assert.equal(listParts('component').length, 18);
  assert.equal(listParts('effect').length, 4);
  assert.equal(listParts('chrome').length, 8);
  assert.equal(listParts('shell').length, 5);
  assert.strictEqual(getPart('hero'), COMPONENTS.hero);
  assert.strictEqual(getPart('siteHeader', 'shell'), ALL_PARTS.siteHeader);
  assert.equal(getPart('missing'), null);
});
