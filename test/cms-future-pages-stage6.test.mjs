import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = fs.readFileSync(path.join(root, '.pages.yml'), 'utf8');

test('Vista and Editorial collections create files from the URL slug', () => {
  assert.equal((config.match(/template: '\{fields\.identity\.slug\}\.json'/g) || []).length, 3);
  assert.match(config, /path: content\/v13\/vista-pages/);
  assert.match(config, /path: content\/v13\/editorial-pages/);
});

test('Presentation styles are chosen from the supported renderer variants', () => {
  const presentation = config.slice(config.indexOf('  sectionPresentation:'), config.indexOf('  sectionGroup:'));
  assert.match(presentation, /type: select/);
  for (const variant of ['vista-window','vista-desktop','editorial','amber-editorial','amber-player','plain']) {
    assert.match(presentation, new RegExp(`- ${variant}`));
  }
});

test('Reusable page blocks expose optional grouping controls in the CMS', () => {
  for (const block of ['blockArtistStatement','blockEmbedWindow','blockBandsintownEvents','blockSocialLinks','blockFeaturedRelease','blockRichText','blockImage','blockGallery','blockQuote','blockLinkButton']) {
    const start = config.indexOf(`  ${block}:`);
    assert.ok(start >= 0, `${block} exists`);
    const next = config.indexOf('\n  block', start + 4);
    const part = config.slice(start, next < 0 ? undefined : next);
    assert.match(part, /component: sectionGroup/, `${block} includes the reusable layout group field`);
  }
});

test('Vista and Editorial collections use the shared page settings and correct block lists', () => {
  const vistaStart = config.indexOf('  - name: vista-pages');
  const editorialStart = config.indexOf('  - name: editorial-pages');
  const settingsStart = config.indexOf('- name: site-settings');
  const vista = config.slice(vistaStart, editorialStart);
  const editorial = config.slice(editorialStart, settingsStart);
  for (const part of [vista, editorial]) {
    for (const component of ['identity','publishing','appearance','seo']) assert.match(part, new RegExp(`component: ${component}`));
    assert.match(part, /Page building blocks/);
  }
  assert.match(vista, /component: vistaSections/);
  assert.match(editorial, /component: editorialSections/);
});
