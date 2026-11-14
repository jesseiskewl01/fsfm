import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {renderComponent} from '../src/render/components.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const renderer=fs.readFileSync(path.join(root,'src/render/page.mjs'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles/v13.css'),'utf8');
const client=fs.readFileSync(path.join(root,'src/client/vista-windows.js'),'utf8');
test('Vista window variants render Aero titlebars and controls',()=>{
 const result=renderComponent({id:'welcome',type:'hero',enabled:true,content:{title:'Vista test'},presentation:{variant:'vista-window',windowTitle:'Welcome'}},{page:{template:'vista-window'},site:{siteName:'FSFM'}});
 for(const token of ['vista-window-frame','data-vista-window','data-vista-drag-handle','data-vista-window-action="minimize"','data-vista-window-action="close"','Welcome'])assert.ok(result.html.includes(token),token);
});
test('Vista-specific chrome is isolated from the homepage and editorial templates',()=>{
 for(const template of ['homepage','editorial']){
  const result=renderComponent({id:'ordinary',type:'hero',enabled:true,content:{title:'Hello'},presentation:{variant:'vista-window'}},{page:{template},site:{siteName:'FSFM'}});
  assert.doesNotMatch(result.html,/data-vista-window-action/);
 }
});
test('Vista pages load their client script and layer the navigation above windows',()=>{
 assert.match(renderer,/page\.template === 'vista-window'\) scriptsToLoad\.add\('vista-windows\.js'\)/);
 assert.match(css,/template-vista-window \.global-header\{position:relative;z-index:1000/);
 assert.match(css,/template-vista-window \.site-menu-panel\{z-index:1003/);
});
test('Vista script parses and supports dragging, keyboard movement and dock restoration',()=>{
 assert.doesNotThrow(()=>new vm.Script(client,{filename:'vista-windows.js'}));
 for(const item of ['pointermove','ArrowLeft','data-vista-window-action','Reopen · ','Restore · '])assert.ok(client.includes(item),item);
});
