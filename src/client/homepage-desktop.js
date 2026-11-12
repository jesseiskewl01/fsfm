'use strict';

/* ==========================================

   THEME ENGINE (palettes live in <head>)

========================================== */

(function() {
// HOME THEME ENGINE: configured wallpaper assets are warmed before the page is revealed.
var wallFront = document.getElementById('wallA');
var wallBack = document.getElementById('wallB');
var currentTheme = Number.isInteger(window.__themeIdx) ? window.__themeIdx : 0;
var themeImages = [];
var applyToken = 0;
var runtimeConfig = {};
try { runtimeConfig = JSON.parse((document.getElementById('fsfmHomeRuntimeConfig') || {}).textContent || '{}'); } catch (e) { runtimeConfig = {}; }
window.__FSFM_HOME_RUNTIME__ = runtimeConfig;

var bootStartedAt = Date.now();
var bootMinimumTime = 2400;
function updateBootProgress(done, total) {
  var status = document.getElementById('bootStatus');
  if (!status) return;
  status.textContent = done < total ? 'LOADING YOUR DESKTOP' : 'STARTING ARTIST DESKTOP';
}

function preloadAllThemes() {
  var completed = 0;
  updateBootProgress(0, VISTA_THEMES.length);
  return Promise.all(VISTA_THEMES.map(function(theme, index) {
    return new Promise(function(resolve) {
      var image = new Image();
      var settled = false;
      var failSafe = window.setTimeout(function() { finish(false); }, 12000);
      function finish(ok) {
        if (settled) return;
        settled = true;
        window.clearTimeout(failSafe);
        themeImages[index] = { image: ok ? image : null, ready: ok };
        completed += 1;
        updateBootProgress(completed, VISTA_THEMES.length);
        resolve({ ok: ok, index: index });
      }
      image.onload = function() { finish(true); };
      image.onerror = function() { finish(false); };
      if (theme.background || !theme.img) finish(true); else image.src = theme.img;
    });
  }));
}

function applyTheme(index) {
  var token = ++applyToken;
  currentTheme = (index + VISTA_THEMES.length) % VISTA_THEMES.length;
  var theme = VISTA_THEMES[currentTheme];
  paintPalette(theme);

  var url = theme.background || (theme.img ? "url('" + theme.img + "')" : 'none');
  var incoming = wallBack;
  var outgoing = wallFront;
  incoming.style.backgroundSize = (runtimeConfig.wallpaper && runtimeConfig.wallpaper.fit === 'contain') ? 'contain' : 'cover';
  incoming.style.backgroundRepeat = 'no-repeat';
  incoming.style.backgroundPosition = (runtimeConfig.wallpaper && runtimeConfig.wallpaper.position) || 'center';
  incoming.style.backgroundImage = url;
  requestAnimationFrame(function() { incoming.classList.add('show'); });
  window.setTimeout(function() { if (token === applyToken) outgoing.classList.remove('show'); }, 950);
  wallFront = incoming;
  wallBack = outgoing;

  var hero = document.getElementById('heroSection');
  if (hero) hero.style.backgroundImage = url;

  document.querySelectorAll('.star-icon').forEach(function(button) {
    button.setAttribute('aria-label', 'Change wallpaper. Current theme: ' + theme.name + '. Activate for the next theme.');
    button.title = 'Wallpaper: ' + theme.name + ' · click to change';
  });
}

function cycleTheme() {
  var settings = runtimeConfig.wallpaper || {}; var cycle = settings.cycle || {};
  if (cycle.mode === 'random' && VISTA_THEMES.length > 1) { var choices = VISTA_THEMES.map(function(_,i){return i;}).filter(function(i){return i !== currentTheme;}); applyTheme(choices[Math.floor(Math.random()*choices.length)]); }
  else applyTheme(currentTheme + 1);
}

// Marquee copy is rendered into the static HTML for crawlability. This script
// only enhances the server-rendered wallpaper stars with their click behaviour.
var marqueeTrack = document.getElementById('marqueeTrack');
function renderMarquee(messages) {
  if (!marqueeTrack) return;
  var items = Array.isArray(messages) ? messages.map(function(x){return String(x || '').trim();}).filter(Boolean) : [];
  if (marqueeTrack.parentElement) marqueeTrack.parentElement.hidden = !items.length;
  marqueeTrack.querySelectorAll('.star-icon').forEach(function(star) {
    star.setAttribute('aria-label', 'Change wallpaper theme');
    if (!runtimeConfig.wallpaper || !runtimeConfig.wallpaper.cycle || runtimeConfig.wallpaper.cycle.manualControl !== false) {
      star.addEventListener('click', cycleTheme);
    } else {
      star.disabled = true;
      star.setAttribute('aria-hidden', 'true');
    }
  });
}
window.__fsfmRenderMarquee = renderMarquee;
renderMarquee(runtimeConfig.marqueeMessages || []);
var cycleSettings = runtimeConfig.wallpaper && runtimeConfig.wallpaper.cycle || {};
if (cycleSettings.enabled && VISTA_THEMES.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  var cycleSeconds = Math.max(5, Math.min(3600, Number(cycleSettings.intervalSeconds) || 30));
  window.setInterval(function(){ if (!document.hidden) cycleTheme(); }, cycleSeconds * 1000);
}

// Keep the splash simple: the moving XP-era segment stays visible until the four
// homepage wallpapers have loaded (or timed out), with a short minimum display time.
preloadAllThemes().then(function(results) {
  applyTheme(currentTheme);
  var failures = results.filter(function(result) { return !result.ok; }).length;
  var elapsed = Date.now() - bootStartedAt;
  var remaining = Math.max(0, bootMinimumTime - elapsed);
  window.setTimeout(function() {
    var status = document.getElementById('bootStatus');
    if (status) status.textContent = failures ? (runtimeConfig.labels?.bootReady || 'DESKTOP READY') : (runtimeConfig.labels?.bootWelcome || 'WELCOME');
    window.setTimeout(function() {
      var overlay = document.getElementById('fsfmBootScreen');
      if (overlay) overlay.classList.add('loaded');
    }, 260);
  }, remaining);
});

// Ambient Glass Refraction Canvas

try {

var canvas = document.getElementById('bgCanvas');

if (canvas && runtimeConfig.effects?.backgroundEffects !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

var ctx = canvas.getContext('2d');

var W, H;

function resizeBg() { var dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = window.innerWidth; H = window.innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }

resizeBg();

window.addEventListener('resize', resizeBg);

var bubbles = [];
var bubbleFrequencyLevel = 50;
function makeBubble() {
  var baseSpeed = Math.random() * 0.7 + 0.3;
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 14 + 4,
    baseSpeed: baseSpeed,
    speed: baseSpeed * (bubbleFrequencyLevel / 50),
    opacity: Math.random() * 0.5 + 0.3
  };
}
function setBubbleFrequency(level) {
  bubbleFrequencyLevel = Math.max(0, Math.min(100, Number(level) || 0));
  var target = bubbleFrequencyLevel <= 0 ? 0 : Math.round(bubbleFrequencyLevel * 0.9);
  while (bubbles.length < target) bubbles.push(makeBubble());
  if (bubbles.length > target) bubbles.length = target;
  var multiplier = bubbleFrequencyLevel / 50;
  bubbles.forEach(function(bubble) { bubble.speed = bubble.baseSpeed * multiplier; });
}
window.__fsfmSetBubbleFrequency = setBubbleFrequency;
var configuredBubbleLevel = Number(runtimeConfig.bubbleDefault);
setBubbleFrequency(Number.isFinite(configuredBubbleLevel) ? Math.max(0, Math.min(100, configuredBubbleLevel)) : 50);

var ambientFrame = 0;
function drawAeroScene() {

if (document.hidden) { ambientFrame = 0; return; }
ctx.clearRect(0, 0, W, H);

bubbles.forEach(function(bub) {

bub.y -= bub.speed;

if (bub.y < -bub.r * 2) { bub.y = H + bub.r * 2; bub.x = Math.random() * W; }

ctx.beginPath();

ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);

ctx.strokeStyle = 'rgba(255, 255, 255, ' + (bub.opacity * 0.7) + ')';

ctx.lineWidth = 1.4;

ctx.stroke();

var bubGrad = ctx.createRadialGradient(bub.x - bub.r * 0.3, bub.y - bub.r * 0.3, 1, bub.x, bub.y, bub.r);

bubGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (bub.opacity * 0.8) + ')');

bubGrad.addColorStop(0.5, 'rgba(255, 255, 255, ' + (bub.opacity * 0.2) + ')');

bubGrad.addColorStop(1, 'transparent');

ctx.fillStyle = bubGrad;

ctx.fill();

});

ambientFrame = requestAnimationFrame(drawAeroScene);

}

function startAmbientAnimation() {
  if (!document.hidden && !ambientFrame) ambientFrame = requestAnimationFrame(drawAeroScene);
}
function stopAmbientAnimation() {
  if (ambientFrame) { cancelAnimationFrame(ambientFrame); ambientFrame = 0; }
}
document.addEventListener('visibilitychange', function() {
  if (document.hidden) stopAmbientAnimation(); else startAmbientAnimation();
});
startAmbientAnimation();

}

} catch (err) {}

// Intersection Observer Reveal

try {

var revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {

var io = new IntersectionObserver(function(entries) {

entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); } });

}, { threshold: 0.1 });

revealEls.forEach(function(el) { io.observe(el); });

} else {

revealEls.forEach(function(el) { el.classList.add('in-view'); });

}

} catch (err) {}

})();
