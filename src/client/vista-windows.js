(function(){
'use strict';
var windows=Array.prototype.slice.call(document.querySelectorAll('[data-vista-window]'));
if(!windows.length)return;
var pageKey='fsfm:vista-windows:'+location.pathname,saved={},positions={},highestZ=20;
try{var parsed=JSON.parse(localStorage.getItem(pageKey)||'{}');if(parsed&&typeof parsed==='object')saved=parsed;}catch(error){saved={};}
var dock=document.createElement('aside');dock.className='vista-window-dock';dock.setAttribute('aria-label','Minimised and closed windows');dock.hidden=true;document.body.appendChild(dock);
function savePositions(){try{localStorage.setItem(pageKey,JSON.stringify(positions));}catch(error){}}
function titleFor(win){return win.getAttribute('data-vista-window-title')||'FSFM window';}
function updateDock(){
 dock.textContent='';var hiddenWindows=windows.filter(function(win){return win.hidden;});dock.hidden=!hiddenWindows.length;if(!hiddenWindows.length)return;
 var label=document.createElement('span');label.className='vista-window-dock-label';label.textContent='WINDOWS';dock.appendChild(label);
 hiddenWindows.forEach(function(win){
  var button=document.createElement('button'),mode=win.getAttribute('data-vista-hidden-reason')||'closed';
  button.type='button';button.className='vista-dock-item';button.textContent=(mode==='minimized'?'Restore · ':'Reopen · ')+titleFor(win);
  button.setAttribute('aria-label',(mode==='minimized'?'Restore ':'Reopen ')+titleFor(win));
  button.addEventListener('click',function(){win.hidden=false;win.removeAttribute('data-vista-hidden-reason');win.style.zIndex=String(++highestZ);updateDock();var h=win.querySelector('[data-vista-drag-handle]');if(h)h.focus();});
  dock.appendChild(button);
 });
}
function hideWindow(win,reason){win.hidden=true;win.setAttribute('data-vista-hidden-reason',reason);updateDock();}
function boundedPosition(win,x,y){
 var old=positions[win.id]||{x:0,y:0},rect=win.getBoundingClientRect(),baseLeft=rect.left-old.x,baseTop=rect.top-old.y;
 var minX=8-baseLeft,minY=8-baseTop,maxX=window.innerWidth-8-(baseLeft+rect.width),maxY=window.innerHeight-8-(baseTop+rect.height);
 return {x:Math.max(minX,Math.min(x,Math.max(minX,maxX))),y:Math.max(minY,Math.min(y,Math.max(minY,maxY)))};
}
function applyPosition(win,x,y){var p=boundedPosition(win,x,y);positions[win.id]=p;win.style.transform='translate3d('+p.x+'px,'+p.y+'px,0)';}
windows.forEach(function(win,index){
 if(!win.id)win.id='vista-window-'+(index+1);
 var p=saved[win.id];if(p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))){positions[win.id]={x:Number(p.x),y:Number(p.y)};win.style.transform='translate3d('+p.x+'px,'+p.y+'px,0)';}else positions[win.id]={x:0,y:0};
 var handle=win.querySelector('[data-vista-drag-handle]');if(!handle)return;var drag=null;
 handle.addEventListener('pointerdown',function(event){
  if(event.button!==0||event.target.closest('button,a,input,select,textarea'))return;
  var current=positions[win.id]||{x:0,y:0};drag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:current.x,y:current.y};
  win.classList.add('is-dragging');win.style.zIndex=String(++highestZ);try{handle.setPointerCapture(event.pointerId);}catch(error){}event.preventDefault();
 });
 handle.addEventListener('pointermove',function(event){if(!drag||event.pointerId!==drag.pointerId)return;applyPosition(win,drag.x+event.clientX-drag.startX,drag.y+event.clientY-drag.startY);});
 function endDrag(event){if(!drag||(event&&event.pointerId!==drag.pointerId))return;drag=null;win.classList.remove('is-dragging');savePositions();}
 handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);handle.addEventListener('lostpointercapture',endDrag);
 handle.addEventListener('keydown',function(event){
  var step=event.shiftKey?24:8,current=positions[win.id]||{x:0,y:0},x=current.x,y=current.y;
  if(event.key==='ArrowLeft')x-=step;else if(event.key==='ArrowRight')x+=step;else if(event.key==='ArrowUp')y-=step;else if(event.key==='ArrowDown')y+=step;else return;
  event.preventDefault();win.style.zIndex=String(++highestZ);applyPosition(win,x,y);savePositions();
 });
});
document.addEventListener('click',function(event){
 var button=event.target.closest('[data-vista-window-action]');if(!button)return;
 var win=button.closest('[data-vista-window]');if(!win)return;
 if(button.getAttribute('data-vista-window-action')==='minimize')hideWindow(win,'minimized');
 else if(button.getAttribute('data-vista-window-action')==='close')hideWindow(win,'closed');
});
})();