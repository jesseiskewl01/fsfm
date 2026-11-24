import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(root, 'studio/index.html'), 'utf8');

test('the simple/advanced toggle is wired and persisted', () => {
  assert.ok(studio.includes("$('#viewModeButton').addEventListener('click',()=>setViewMode(S.viewMode==='advanced'?'simple':'advanced'));"));
  assert.ok(studio.includes("try{localStorage.setItem('fsfm_studio_view_mode',S.viewMode);}catch(error){}"));
  assert.ok(studio.includes('if(S.record)renderEditor();'));
  assert.ok(studio.includes('applyViewMode();'));
});

test('every menu renders quick controls and a bottom advanced drawer', () => {
  assert.ok(studio.includes('body.innerHTML=pageQuickPanel()+pageFields()+'));
  assert.ok(studio.includes("renderSections()+advancedDrawer('page settings',pageAdvancedFields());"));
  assert.ok(studio.includes("body.innerHTML=siteQuickPanel()+advancedDrawer('site settings',"));
  assert.ok(studio.includes("body.innerHTML=wallpaperQuickPanel()+advancedDrawer('wallpaper catalogue',"));
});

test('quick wallpaper chips write the same fields as the full wallpaper editor', () => {
  assert.ok(studio.includes("event.target.closest('[data-quick-wallpaper]')"));
  assert.ok(studio.includes('applyQuickWallpaper(wallpaper.dataset.quickWallpaper);'));
  assert.ok(studio.includes("set(S.record,'appearance.wallpaper.mode','preset');"));
  assert.ok(studio.includes("set(S.record,'appearance.wallpaper.preset',id);"));
  assert.match(studio, /dirty\(\);\s*renderEditor\(\);/);
});

test('section grips reorder blocks through delegated drag events', () => {
  for (const token of [
    "body.addEventListener('dragstart',event=>{",
    "body.addEventListener('dragover',event=>{",
    "body.addEventListener('drop',event=>{",
    "body.addEventListener('dragend',clearSectionDrag);",
    'S.dragSection=Number(grip.dataset.sectionGrip);',
    "card.classList.add(event.clientY<rect.top+rect.height/2?'drop-before':'drop-after');",
    "moveDraggedSection(Number(card.dataset.sectionIndex),card.classList.contains('drop-after'));"
  ]) {
    assert.ok(studio.includes(token), `Missing Studio drag wiring: ${token}`);
  }
  assert.match(studio, /clearSectionDrag\(\);\s*dirty\(\);\s*renderEditor\(\);/);
});
