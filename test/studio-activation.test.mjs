import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPagePublicationState, setPagePublished } from '../studio/page-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'scripts/dev-tina-preview.mjs'), 'utf8');

test('an inactive Vista page explicitly offers activation, then offers deactivation after activation', () => {
  const vistatest = {
    template: 'vista-window',
    publishing: { published: false },
  };

  assert.deepEqual(getPagePublicationState(vistatest), {
    active: false,
    action: 'activate',
    buttonLabel: 'Activate page',
    statusLabel: 'INACTIVE',
  });

  assert.equal(setPagePublished(vistatest, true), true);
  assert.deepEqual(getPagePublicationState(vistatest), {
    active: true,
    action: 'deactivate',
    buttonLabel: 'Deactivate page',
    statusLabel: 'ACTIVE',
  });

  assert.equal(setPagePublished(vistatest, false), true);
  assert.equal(getPagePublicationState(vistatest).action, 'activate');
});

test('missing published state keeps the existing default-active behaviour', () => {
  assert.equal(getPagePublicationState({ template: 'editorial' }).active, true);
  assert.equal(getPagePublicationState({ template: 'editorial', publishing: {} }).action, 'deactivate');
});

test('the Studio UI derives labels and explicit actions from the shared page-state module', () => {
  assert.match(studio, /import \{ getPagePublicationState, setPagePublished \} from '\.\/page-state\.mjs'/);
  assert.match(studio, /data-page-action=/);
  assert.match(studio, /togglePageActivation\(activation\.dataset\.pageAction\)/);
  assert.match(studio, /if\(action!==state\.action\)/);
  assert.match(studio, /getPagePublicationState\(S\.record\)/);
  assert.match(studio, /delete publishingSettings\.published/);
  assert.match(studio, /valueEditor\(publishingSettings,'publishing','Publishing'\)/);
});

test('the homepage is protected from activation changes in both the UI and local API', () => {
  const homepage = { template: 'homepage', publishing: { published: true } };
  assert.equal(setPagePublished(homepage, false), false);
  assert.equal(getPagePublicationState(homepage).active, true);
  assert.match(studio, /if\(r\.template==='homepage'\)return ''/);
  assert.match(studio, /if\(!S\.record\|\|S\.record\.template==='homepage'\)return/);
  assert.match(server, /existing\.template === 'homepage' && record\?\.publishing\?\.published === false/);
  assert.match(server, /The homepage cannot be deactivated/);
});

test('activation changes remain ordinary local content saves', () => {
  assert.match(studio, /Changes are local until you choose/);
  assert.match(studio, /Save local/);
  assert.match(studio, /Save &amp; deploy live/);
  assert.match(server, /validatePageForSave\(resource, record\)/);
  assert.match(server, /publisher\.recordSavedFile\(/);
});
