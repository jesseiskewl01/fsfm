import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const homepage = readJson('content/v13/homepage.json');
const liveGadgets = readJson('data/homepage-gadgets.json');

test('Current live Homepage gadget data is merged into the V13 canonical record', () => {
  const migrated = homepage.appearance.parts.desktopGadgets.content;
  for (const key of ['photos', 'dates', 'stickyNote']) {
    assert.deepEqual(migrated[key], liveGadgets[key], `${key} should match the live repository record`);
  }
  // Canonical content intentionally enables radio and Purble after migration. [OpenCode, 2026-11-24]
  assert.deepEqual(migrated.funWidgets, {
    showBarrelRoll: false,
    showBubbleSlider: true,
    showMusicPlayer: true,
    showPurblePlace: true
  });
  assert.deepEqual(liveGadgets.photos, ['/media/images/earlybirdcd.jpg']);
  assert.equal(liveGadgets.dates[0].date, '2026-11-16');
  assert.equal(liveGadgets.stickyNote.text, 'typa shit that make you wanna grab a penguin');
});

test('The placeholder editorial page stays private', () => {
  const placeholder = readJson('content/v13/editorial-pages/new-editorial-page.json');
  assert.equal(placeholder.publishing.published, false);
  assert.equal(placeholder.publishing.showInNavigation, false);
});

test('The V14 default build emits a clean dist directory', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.build, 'node scripts/build-v13.mjs');
  assert.equal(pkg.scripts['check:all'], 'npm test && npm run validate:v14 && npm run check:v14');
  for (const name of Object.keys(pkg.scripts)) {
    assert.doesNotMatch(name, /stage[3-6]|legacy/i, `${name} should not be exposed as an npm script`);
  }
  const builder = fs.readFileSync(path.join(root, 'scripts/build-v13.mjs'), 'utf8');
  assert.match(builder, /isPreview \? 'preview-v13' : 'dist'/);
  assert.match(pkg.scripts['predeploy-check'], /--require-media/);
  assert.equal(pkg.version, '15.0.0');
  assert.match(builder, /\/albums\/the-early-bird\//);
  assert.match(builder, /legacyRedirect/);
  assert.match(builder, /'CNAME'/);
});

test('Release audit distinguishes missing restored media from structural release failures', () => {
  const audit = fs.readFileSync(path.join(root, 'scripts/audit-v13-release.mjs'), 'utf8');
  for (const file of ['media/images/cover.png', 'media/images/asadadasdges-removebg-preview.png', 'media/images/earlybirdcd.jpg']) {
    assert.ok(audit.includes(file), `The release audit should check ${file}`);
  }
  assert.match(audit, /if \(requireMedia\) fail\(message\)/);
  assert.match(audit, /local reference does not resolve/);
  assert.match(audit, /sitemap\.xml/);
  assert.match(audit, /robots\.txt/);
});

test('Pages CMS media sources preserve image, audio and LRC folders', () => {
  const config = fs.readFileSync(path.join(root, '.pages.yml'), 'utf8');
  assert.match(config, /name: images[\s\S]*?input: media\/images[\s\S]*?output: \/media\/images/);
  assert.match(config, /name: audio[\s\S]*?input: media\/audio[\s\S]*?output: \/media\/audio/);
  assert.match(config, /name: lyrics[\s\S]*?input: lyrics[\s\S]*?output: lyrics/);
});
