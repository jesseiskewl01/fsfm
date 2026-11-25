import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const studio=fs.readFileSync(path.join(root,'studio/index.html'),'utf8');
test('Studio exposes valid dropdown choices for common design settings',()=>{
 for(const item of ['function fieldOptions(path)',"['vista-window','Vista Window']","['grid','Grid']","['template-default','Use template default']","['sequential','In order']","['cover','Fill the background']","['primary','Primary button']"])assert.ok(studio.includes(item),item);
 assert.match(studio,/<select data-path=/);
 assert.match(studio,/S\.wallpaperPresets/);
 assert.match(studio,/ROOT\\\.presets\\\.\\d\+\\\.family/);
 assert.match(studio,/ROOT\\\.presets\\\.\\d\+\\\.colour/);
});
test('page creation uses a guided form instead of browser prompts',()=>{
 assert.match(studio,/id="createPageForm"/);
 assert.match(studio,/id="createPageTemplate"/);
 assert.match(studio,/value="vista-window">Vista/);
 assert.match(studio,/function submitCreatePage/);
 assert.doesNotMatch(studio,/prompt\('Create which page type/);
});
test('errors explain connection, validation and stale-save problems',()=>{
 assert.match(studio,/function apiError\(response,data,action\)/);
 assert.match(studio,/function friendlyError\(error\)/);
 assert.match(studio,/Studio could not reach the local FSFM server/);
 assert.match(studio,/one or more settings are invalid/);
 assert.match(studio,/changed on disk after you opened it/);
});
