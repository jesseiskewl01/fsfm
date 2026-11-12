(function(){
  'use strict';

  // Minimize collapses a window to its title bar. Closing the hero exits FSFM
  // by replacing this tab's current history entry with the CMS-configured destination.
  // Browsers block scripts from closing tabs that were not opened by script.
  var shutdown = document.getElementById('fsfmShutdown');
  var homeRuntime = window.__FSFM_HOME_RUNTIME__ || {};
  var labels = homeRuntime.labels || {};
  var gadgetLabels = homeRuntime.gadgetLabels || {};
  var shutdownStarted = false;
  window.__fsfmShutdownRedirectUrl = (window.__FSFM_HOME_RUNTIME__ && window.__FSFM_HOME_RUNTIME__.shutdownRedirectUrl) || 'https://open.spotify.com/track/2CnrJj6Jz4vSe5E1hsWtpg';
  function shutdownDesktop(){
    if(shutdownStarted) return;
    shutdownStarted = true;
    if(shutdown) shutdown.hidden=false;
    var shutdownTitle = document.getElementById('shutdownTitle');
    var shutdownMessage = document.getElementById('shutdownMessage');
    if(shutdownTitle && labels.shutdownTitle) shutdownTitle.textContent = labels.shutdownTitle;
    if(shutdownMessage && labels.shutdownMessage) shutdownMessage.textContent = labels.shutdownMessage;
    document.body.classList.add('fsfm-shutdown-active');
    document.title='Goodnight | Fake Space Fog Machine';
    window.setTimeout(function(){
      var destination = window.__fsfmShutdownRedirectUrl || 'https://open.spotify.com/track/2CnrJj6Jz4vSe5E1hsWtpg';
      try {
        var url = new URL(destination, document.baseURI);
        if(url.protocol === 'https:' || url.protocol === 'http:') window.location.replace(url.href);
        else window.location.replace('https://open.spotify.com/track/2CnrJj6Jz4vSe5E1hsWtpg');
      } catch(e) { window.location.replace('https://open.spotify.com/track/2CnrJj6Jz4vSe5E1hsWtpg'); }
    }, 650);
  }
  function closeWindow(button){
    var win=button.closest('.aero-window, .content-window');
    if(!win) return;
    if(win.classList.contains('hero-window')) { shutdownDesktop(); return; }
    if(win.id==='funWidgetMusic') {
      var player=document.getElementById('homeMusicAudio');
      if(player){player.pause();player.currentTime=0;}
    }
    win.hidden=true;
  }
  document.querySelectorAll('[data-window-action="close"]').forEach(function(button){
    button.addEventListener('click',function(){closeWindow(button);});
  });
  document.querySelectorAll('[data-window-action="minimize"]').forEach(function(button){
    button.addEventListener('click',function(){
      var win=button.closest('.aero-window, .content-window');
      if(!win) return;
      var minimized=win.classList.toggle('window-minimized');
      button.textContent=minimized?'□':'−';
      button.setAttribute('aria-label',(minimized?'Restore ':'Minimize ')+(win.getAttribute('aria-label')||'window'));
      button.title=minimized?'Restore':'Minimize';
    });
  });
  // The roll is intentionally a one-click flourish, not an endless animation.
  var rollButton=document.getElementById('barrelRollButton');
  if(rollButton) rollButton.addEventListener('click',function(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var root=document.documentElement;
    if(root.classList.contains('fsfm-barrel-roll')) return;
    root.classList.add('fsfm-barrel-roll');
    root.addEventListener('animationend',function handler(){root.classList.remove('fsfm-barrel-roll');root.removeEventListener('animationend',handler);},{once:true});
  });

  // Slider midpoint (50) is the site's original bubble count; 0 turns bubbles off.
  var slider=document.getElementById('bubbleRateSlider');
  var output=document.getElementById('bubbleRateValue');
  function applyBubbleLevel(value){
    var level=Math.max(0,Math.min(100,Number(value)||0));
    if(typeof window.__fsfmSetBubbleFrequency==='function') window.__fsfmSetBubbleFrequency(level);
    if(output){
      if(level===0) output.textContent='OFF · 0';
      else if(level===50) output.textContent='DEFAULT · 1×';
      else output.textContent=(level/50).toFixed(1)+'×';
    }
  }
  if(slider){
    var savedLevel=null;
    try { savedLevel=localStorage.getItem('fsfm_bubble_frequency_v1'); } catch(e) {}
    if(savedLevel!==null && savedLevel!=='' && Number.isFinite(Number(savedLevel))) slider.value=String(Math.max(0,Math.min(100,Number(savedLevel))));
    applyBubbleLevel(slider.value);
    slider.addEventListener('input',function(){
      applyBubbleLevel(slider.value);
      try { localStorage.setItem('fsfm_bubble_frequency_v1',String(slider.value)); } catch(e) {}
    });
  }

  // Homepage-only play/pause switch. Audio begins only after the visitor presses it.
  var audio=document.getElementById('homeMusicAudio');
  var musicButton=document.getElementById('homeMusicToggle');
  var musicLabel=document.getElementById('homeMusicLabel');
  function escapeLabel(value){return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function setMusicState(playing){
    if(!musicButton) return;
    musicButton.setAttribute('aria-pressed',playing?'true':'false');
    var pauseText = gadgetLabels.radioPause || 'PAUSE MUSIC';
    var playText = gadgetLabels.radioPlay || 'PLAY MUSIC';
    musicButton.innerHTML=playing?'<span aria-hidden="true">Ⅱ</span> <span id="homeMusicLabel">'+escapeLabel(pauseText)+'</span>':'<span aria-hidden="true">▶</span> <span id="homeMusicLabel">'+escapeLabel(playText)+'</span>';
    musicLabel=document.getElementById('homeMusicLabel');
  }
  if(audio && musicButton){
    musicButton.addEventListener('click',function(){
      if(audio.paused){
        var promise=audio.play();
        if(promise && typeof promise.then==='function') promise.then(function(){setMusicState(true);}).catch(function(){setMusicState(false);});
        else setMusicState(true);
      } else {audio.pause();setMusicState(false);}
    });
    audio.addEventListener('pause',function(){setMusicState(false);});
    audio.addEventListener('play',function(){setMusicState(true);});
    audio.loop=true;
    audio.addEventListener('error',function(){setMusicState(false);if(musicButton) musicButton.title='The audio file could not be loaded.';});
  }

  // Purble Place opens in a dimmed, dismissible window over the homepage.
  var purbleOverlay=document.getElementById('purbleOverlay');
  var purbleOpen=document.getElementById('purbleOpenButton');
  var purbleClose=document.getElementById('purbleCloseButton');
  var purbleFrame=document.getElementById('purbleFrame');
  function closePurble(){if(purbleOverlay) purbleOverlay.hidden=true;if(purbleFrame) purbleFrame.src='about:blank';}
  if(purbleOpen && purbleOverlay) purbleOpen.addEventListener('click',function(){if(purbleFrame && purbleFrame.dataset.src) purbleFrame.src=purbleFrame.dataset.src;purbleOverlay.hidden=false;if(purbleClose) purbleClose.focus();});
  if(purbleClose) purbleClose.addEventListener('click',closePurble);
  if(purbleOverlay) purbleOverlay.addEventListener('click',function(event){if(event.target===purbleOverlay) closePurble();});
  document.addEventListener('keydown',function(event){if(event.key==='Escape' && purbleOverlay && !purbleOverlay.hidden) closePurble();});

})();
