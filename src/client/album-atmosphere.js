'use strict';
(function() {

// Smokey Starry Nebula: a deep-space backdrop painted once into cached layers,
// then moved with bounded drawImage transforms at 24 FPS. No frame creates a
// gradient, path, star, or blur. [Jesse + OpenCode, 2026-11-25]
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    var mode = canvas.getAttribute('data-atmosphere-mode') || 'full';
    var lite = mode === 'lite';
    var FRAME_MS = 1000 / 24;
    var SCENE_SCALE = 1.28;
    var width = 0, height = 0, dpr = 1, layerW = 0, layerH = 0;
    var frameId = 0, lastFrame = -1000, pageVisible = !document.hidden;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionPreference.matches;
    var baseLayer = null, smokeLayer = null, coreLayer = null, starLayer = null, stillLayer = null;
    var seed = 20261125;

    // Stable enough to look designed, random enough to feel cosmic.
    function random(min, max) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return min + (seed / 4294967296) * (max - min);
    }

    function makeLayer(layerWidth, layerHeight) {
      var buffer = document.createElement('canvas');
      buffer.width = Math.max(1, Math.round(layerWidth));
      buffer.height = Math.max(1, Math.round(layerHeight));
      return buffer;
    }

    function paintBase(g) {
      var sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#03020a');
      sky.addColorStop(0.26, '#0b0718');
      sky.addColorStop(0.56, '#1b1030');
      sky.addColorStop(0.82, '#0a0616');
      sky.addColorStop(1, '#030208');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);

      g.save();
      g.globalCompositeOperation = 'screen';
      var warm = g.createRadialGradient(width * 0.54, height * 0.58, 0, width * 0.54, height * 0.58, Math.max(width, height) * 0.58);
      warm.addColorStop(0, 'rgba(189,139,78,0.20)');
      warm.addColorStop(0.42, 'rgba(106,43,217,0.16)');
      warm.addColorStop(1, 'rgba(43,26,122,0)');
      g.fillStyle = warm;
      g.fillRect(0, 0, width, height);

      var cool = g.createRadialGradient(width * 0.18, height * 0.24, 0, width * 0.18, height * 0.24, Math.max(width, height) * 0.52);
      cool.addColorStop(0, 'rgba(124,77,230,0.18)');
      cool.addColorStop(0.5, 'rgba(29,15,94,0.12)');
      cool.addColorStop(1, 'rgba(29,15,94,0)');
      g.fillStyle = cool;
      g.fillRect(0, 0, width, height);
      g.restore();
    }

    var CLOUDS = [
      ['rgba(124,77,230,0.24)', 'rgba(124,77,230,0.08)', 'rgba(124,77,230,0)'],
      ['rgba(189,139,78,0.20)', 'rgba(189,139,78,0.07)', 'rgba(189,139,78,0)'],
      ['rgba(218,183,255,0.18)', 'rgba(218,183,255,0.06)', 'rgba(218,183,255,0)'],
      ['rgba(255,220,165,0.15)', 'rgba(255,220,165,0.05)', 'rgba(255,220,165,0)'],
      ['rgba(43,26,122,0.30)', 'rgba(43,26,122,0.10)', 'rgba(43,26,122,0)']
    ];

    // Many soft overlapping clouds are the "smoke". They are built once on
    // resize, never during animation.
    function paintSmoke(g) {
      g.clearRect(0, 0, layerW, layerH);
      g.save();
      g.globalCompositeOperation = 'screen';
      var count = lite ? 26 : (layerW < 900 ? 34 : 48);
      var reach = Math.max(layerW, layerH);
      for (var i = 0; i < count; i += 1) {
        var x = random(-0.08, 1.08) * layerW;
        var y = random(-0.06, 1.04) * layerH;
        var radius = random(0.14, 0.42) * reach;
        var colour = CLOUDS[i % CLOUDS.length];
        var cloud = g.createRadialGradient(x, y, 0, x, y, radius);
        cloud.addColorStop(0, colour[0]);
        cloud.addColorStop(0.46, colour[1]);
        cloud.addColorStop(1, colour[2]);
        g.fillStyle = cloud;
        g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      g.restore();
    }

    // The bright nebula core and a handful of curved filaments sit on their
    // own layer so they can drift faster than the smoke.
    function paintCore(g) {
      g.clearRect(0, 0, layerW, layerH);
      g.save();
      g.globalCompositeOperation = 'screen';
      var radius = Math.max(layerW, layerH) * 0.46;
      g.save();
      g.translate(layerW * 0.53, layerH * 0.54);
      g.scale(1.24, 0.76);
      var core = g.createRadialGradient(0, 0, 0, 0, 0, radius);
      core.addColorStop(0, 'rgba(254,245,222,0.82)');
      core.addColorStop(0.11, 'rgba(255,220,165,0.56)');
      core.addColorStop(0.30, 'rgba(189,139,78,0.30)');
      core.addColorStop(0.58, 'rgba(106,43,217,0.24)');
      core.addColorStop(1, 'rgba(43,26,122,0)');
      g.fillStyle = core;
      g.fillRect(-radius, -radius, radius * 2, radius * 2);
      g.restore();

      var filaments = lite ? 8 : 15;
      for (var i = 0; i < filaments; i += 1) {
        var startX = random(-0.12, 1.12) * layerW;
        var startY = random(-0.12, 1.12) * layerH;
        var endX = startX + random(-0.5, 0.5) * layerW;
        var endY = startY + random(-0.42, 0.42) * layerH;
        var filament = g.createLinearGradient(startX, startY, endX, endY);
        var tint = i % 3 === 0 ? '218,183,255' : (i % 3 === 1 ? '255,220,165' : '124,77,230');
        filament.addColorStop(0, 'rgba(' + tint + ',0)');
        filament.addColorStop(0.46, 'rgba(' + tint + ',0.18)');
        filament.addColorStop(1, 'rgba(' + tint + ',0)');
        g.strokeStyle = filament;
        g.lineWidth = random(layerW * 0.008, layerW * 0.032);
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(startX, startY);
        g.bezierCurveTo(
          startX + random(-0.24, 0.24) * layerW,
          startY + random(-0.26, 0.26) * layerH,
          endX + random(-0.22, 0.22) * layerW,
          endY + random(-0.24, 0.24) * layerH,
          endX,
          endY
        );
        g.stroke();
      }
      g.restore();
    }

    var STAR_TINTS = ['#fef5de', '#ffe6b8', '#ffffff', '#dad9ff', '#ffd9a0'];

    function paintStars(g) {
      g.clearRect(0, 0, layerW, layerH);
      g.save();
      g.globalCompositeOperation = 'screen';
      var compact = layerW < 900;
      var count = lite ? (compact ? 70 : 110) : (compact ? 150 : 240);
      for (var i = 0; i < count; i += 1) {
        var giant = i < Math.max(5, Math.floor(count * 0.055));
        var x = random(0, layerW);
        var y = random(0, layerH * 0.92);
        var radius = giant ? random(1.0, 2.1) : random(0.35, 1.15);
        g.globalAlpha = giant ? random(0.58, 0.95) : random(0.24, 0.72);
        g.fillStyle = STAR_TINTS[i % STAR_TINTS.length];
        g.beginPath();
        g.arc(x, y, radius, 0, Math.PI * 2);
        g.fill();
        if (giant) {
          g.globalAlpha *= 0.42;
          g.strokeStyle = STAR_TINTS[i % STAR_TINTS.length];
          g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(x - radius * 4, y);
          g.lineTo(x + radius * 4, y);
          g.moveTo(x, y - radius * 4);
          g.lineTo(x, y + radius * 4);
          g.stroke();
        }
      }
      g.restore();
    }

    function buildLayers() {
      baseLayer = makeLayer(width, height);
      paintBase(baseLayer.getContext('2d'));

      smokeLayer = makeLayer(layerW, layerH);
      paintSmoke(smokeLayer.getContext('2d'));

      coreLayer = makeLayer(layerW, layerH);
      paintCore(coreLayer.getContext('2d'));

      starLayer = makeLayer(layerW, layerH);
      paintStars(starLayer.getContext('2d'));

      stillLayer = null;
      if (lite) {
        stillLayer = makeLayer(width, height);
        var still = stillLayer.getContext('2d');
        still.drawImage(baseLayer, 0, 0, width, height);
        still.save();
        still.globalCompositeOperation = 'screen';
        still.globalAlpha = 0.94;
        still.drawImage(smokeLayer, (width - layerW) / 2, (height - layerH) / 2, layerW, layerH);
        still.globalAlpha = 0.82;
        still.drawImage(coreLayer, (width - layerW) / 2, (height - layerH) / 2, layerW, layerH);
        still.globalAlpha = 0.74;
        still.drawImage(starLayer, (width - layerW) / 2, (height - layerH) / 2, layerW, layerH);
        still.restore();
      }
    }

    function resizeScene() {
      seed = 20261125;
      dpr = Math.min(window.devicePixelRatio || 1, lite ? 0.62 : 0.85);
      width = window.innerWidth;
      height = window.innerHeight;
      layerW = Math.round(width * SCENE_SCALE);
      layerH = Math.round(height * SCENE_SCALE);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastFrame = -1000;
      buildLayers();
    }

    // One cached image, one transform, one draw. All expensive work happened
    // during buildLayers().
    function drawLayer(layer, offsetX, offsetY, rotation, scale, alpha) {
      var drawWidth = layerW * scale;
      var drawHeight = layerH * scale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(width / 2 + offsetX, height / 2 + offsetY);
      ctx.rotate(rotation);
      ctx.drawImage(layer, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    }

    function drawScene(time) {
      if (!pageVisible || document.hidden) { frameId = 0; return; }
      if (time - lastFrame < FRAME_MS) { frameId = requestAnimationFrame(drawScene); return; }
      lastFrame = time;
      ctx.clearRect(0, 0, width, height);

      if (stillLayer) {
        var stillDrift = reduceMotion ? 0 : Math.sin(time * 0.00014) * 10;
        ctx.globalAlpha = reduceMotion ? 0.96 : 0.92 + Math.sin(time * 0.0003) * 0.05;
        ctx.drawImage(stillLayer, -width * 0.02 + stillDrift, -height * 0.02, width * 1.04, height * 1.04);
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(baseLayer, 0, 0, width, height);
        var t = reduceMotion ? 0 : time * 0.0001;
        var smokeX = reduceMotion ? 0 : Math.sin(t) * width * 0.045;
        var smokeY = reduceMotion ? 0 : Math.cos(t * 0.82) * height * 0.032;
        var smokeTurn = reduceMotion ? 0 : Math.sin(t * 0.55) * 0.016;
        var smokeScale = reduceMotion ? 1 : 1 + Math.sin(t * 0.7) * 0.018;
        drawLayer(smokeLayer, smokeX, smokeY, smokeTurn, smokeScale, 0.88);

        var coreX = reduceMotion ? 0 : Math.sin(t * 1.28 + 1) * width * 0.028;
        var coreY = reduceMotion ? 0 : Math.cos(t * 1.05) * height * 0.024;
        var coreTurn = reduceMotion ? 0 : Math.sin(t * 0.9) * -0.026;
        var coreScale = reduceMotion ? 1 : 1 + Math.sin(t * 1.1) * 0.02;
        var coreAlpha = reduceMotion ? 0.82 : 0.8 + Math.sin(t * 1.6) * 0.1;
        drawLayer(coreLayer, coreX, coreY, coreTurn, coreScale, coreAlpha);

        var starX = reduceMotion ? 0 : Math.sin(t * 0.62 + 2) * width * 0.014;
        var starY = reduceMotion ? 0 : Math.cos(t * 0.5) * height * 0.012;
        var starAlpha = reduceMotion ? 0.78 : 0.74 + Math.sin(t * 2.1) * 0.12;
        drawLayer(starLayer, starX, starY, 0, 1.01, starAlpha);
      }

      if (!reduceMotion && pageVisible && !document.hidden) frameId = requestAnimationFrame(drawScene);
    }

    function restartScene() {
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      if (!pageVisible || document.hidden) return;
      if (reduceMotion) drawScene(40);
      else frameId = requestAnimationFrame(drawScene);
    }

    resizeScene();
    restartScene();
    window.addEventListener('resize', function() {
      resizeScene();
      restartScene();
    }, { passive: true });
    document.addEventListener('visibilitychange', function() {
      pageVisible = !document.hidden;
      restartScene();
    });
    if (motionPreference.addEventListener) {
      motionPreference.addEventListener('change', function(event) {
        reduceMotion = event.matches;
        restartScene();
      });
    }
  }
} catch (err) {}

// Reveal content as it enters view; keep it visible when reduced motion is requested.
try {
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function(el) { io.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('in-view'); });
  }
} catch (err) {}
})();
