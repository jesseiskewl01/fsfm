import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPageRecord } from '../scripts/create-page-v13.mjs';

test('The Early Bird and future releases use the same ordinary Album page creator', () => {
  const page = buildPageRecord({ template: 'album', name: 'A Future Release', slug: 'a-future-release' });
  assert.equal(page.template, 'album');
  assert.equal(page.identity.slug, 'a-future-release');
  assert.equal(page.identity.route, '/albums/a-future-release/');
  assert.equal(page.publishing.published, false);
  assert.equal(page.templateData.player.tracks.length, 0);
  assert.ok(page.sections.some(section => section.type === 'album-header'));
  assert.ok(page.sections.some(section => section.type === 'album-player'));
});

test('Vista and Editorial pages share the same route-generating creator without album-specific exceptions', () => {
  const vista = buildPageRecord({ template: 'vista-window', name: 'Listening Room', slug: 'listening-room' });
  const editorial = buildPageRecord({ template: 'editorial', name: 'Notes', slug: 'notes' });
  assert.equal(vista.identity.route, '/pages/listening-room/');
  assert.equal(editorial.identity.route, '/pages/notes/');
  assert.equal(vista.publishing.published, false);
  assert.equal(editorial.publishing.published, false);
});
