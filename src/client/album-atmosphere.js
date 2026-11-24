'use strict';
(function() {

// A wide, slow-moving aurora over The Early Bird....
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    // Rendering intensity is a content setting, not a template hardcode.
    var mode = canvas.getAttribute('data-atmosphere-mode') || 'full';
    var lite = mode === 'lite';
    var width = 0, height = 0, dpr = 1, compact = false, frameId = 0, lastFrame = -1000, pageVisible = !document.hidden;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionPreference.matches;
    var stars = [], blooms = [], curtains = [];
    var glowSprites = {}, liteBackdrop = null;
    function random(min, max) { return min + Math.random() * (max - min); }

    // Soft light is painted once into offscreen canvases, then reused every frame.
    // The lite mode reuses a whole cached scene instead of rebuilding gradients.
    // [Jesse + OpenCode, 2026-11-24]
    function radialSprite(size, stops) {
      var sprite = document.createElement('canvas');
      sprite.width = size; sprite.height = size;
      var sc = sprite.getContext('2d');
      var gradient = sc.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(function(stop) { gradient.addColorStop(stop[0], stop[1]); });
      sc.fillStyle = gradient; sc.fillRect(0, 0, size, size);
      return sprite;
    }

    function drawSprite(sprite, x, y, width, height, alpha) {
      if (!sprite) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(sprite, x, y, width, height);
      ctx.restore();
    }

    function buildSprites() {
      glowSprites = {
        bloom: radialSprite(512, [
          [0, 'rgba(254,245,222,0.96)'],
          [0.18, 'rgba(255,220,165,0.78)'],
          [0.42, 'rgba(189,139,78,0.46)'],
          [0.74, 'rgba(99,65,35,0.14)'],
          [1, 'rgba(10,8,6,0)']
        ]),
        star: radialSprite(128, [
          [0, 'rgba(254,245,222,0.98)'],
          [0.16, 'rgba(254,245,222,0.72)'],
          [0.44, 'rgba(189,139,78,0.30)'],
          [1, 'rgba(189,139,78,0)']
        ]),
        horizon: radialSprite(512, [
          [0, 'rgba(189,139,78,0.34)'],
          [0.42, 'rgba(99,65,35,0.16)'],
          [1, 'rgba(10,8,6,0)']
        ]),
        bokeh: radialSprite(96, [
          [0, 'rgba(255,246,224,0.95)'],
          [0.35, 'rgba(254,211,150,0.42)'],
          [1, 'rgba(254,211,150,0)']
        ])
      };
      liteBackdrop = lite ? buildLiteBackdrop() : null;
    }

    function resizeAurora() {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1 : 1.1);
      if (lite) dpr = Math.min(window.devicePixelRatio || 1, 0.85);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastFrame = -1000;

      stars = [];
      blooms = [];
      curtains = [];
      var starCount = Math.min(190, Math.max(70, Math.floor((width * height) / 9000)));
      if (lite) starCount = Math.min(60, Math.max(24, Math.floor((width * height) / 18000)));
      compact = width < 640;
      for (var i = 0; i < starCount; i += 1) {
        var giant = i < Math.max(18, Math.floor(starCount * 0.075));
        stars.push({
          x: random(0, width), y: random(0, height),
          radius: giant ? random(compact ? 1.35 : 1.8, compact ? 2.7 : 3.8) : random(compact ? 0.35 : 0.45, compact ? 1.15 : 1.6),
          phase: random(0, Math.PI * 2), speed: random(0.24, 0.92),
          alpha: giant ? random(0.55, 0.95) : random(0.24, 0.68),
          drift: random(-0.035, 0.035), giant: giant
        });
      }
      for (var b = 0; b < (lite ? 2 : 4); b += 1) {
        blooms.push({
          x: random(width * 0.02, width * 0.98),
          y: random(height * 0.04, height * 0.98),
          radius: random(Math.min(width, height) * 0.20, Math.min(width, height) * 0.55),
          alpha: random(lite ? 0.09 : 0.11, lite ? 0.16 : 0.22), phase: random(0, Math.PI * 2), speed: random(0.11, 0.24)
        });
      }
      var curtainCount = lite ? Math.max(3, Math.min(4, Math.round(width / 520) + 1)) : Math.max(4, Math.min(7, Math.round(width / (compact ? 220 : 250)) + 2));
      for (var ci = 0; ci < curtainCount; ci += 1) {
        var fraction = -0.08 + (ci / Math.max(1, curtainCount - 1)) * 1.16;
        curtains.push({
          x: width * fraction,
          width: random(Math.max(66, width * (compact ? 0.20 : 0.11)), Math.max(122, width * (compact ? 0.43 : 0.25))),
          amplitude: random(Math.max(12, width * 0.018), Math.max(26, width * (compact ? 0.052 : 0.064))),
          depth: random(0.68, 1.12),
          phase: random(0, Math.PI * 2),
          speed: random(0.000065, 0.000145),
          rate: random(0.006, 0.013),
          detail: ci % 2 === 0 ? 1 : -1
        });
      }
      buildSprites();
    }

    function drawCurtain(curtain, time, target) {
      var g = target || ctx;
      var yTop = -height * (width < 640 ? 0.16 : 0.10);
      var yBottom = height * (compact ? Math.min(1.18, curtain.depth + 0.10) : Math.min(1.25, curtain.depth + 0.16));
      var steps = 22;
      if (lite) steps = 12;
      var left = [], right = [];
      var driftTime = reduceMotion ? 0 : time;
      for (var i = 0; i <= steps; i += 1) {
        var p = i / steps;
        var y = yTop + (yBottom - yTop) * p;
        var wave = Math.sin(p * Math.PI * 2.1 + curtain.phase + driftTime * curtain.speed) * curtain.amplitude;
        wave += Math.sin(p * Math.PI * 5.2 - curtain.phase * 0.7 + driftTime * curtain.speed * 0.62) * curtain.amplitude * 0.24;
        var center = curtain.x + wave;
        var envelope = 0.38 + Math.sin(Math.PI * Math.min(1, p)) * 0.62;
        var widthAtY = curtain.width * envelope;
        left.push({ x: center - widthAtY * 0.5, y: y });
        right.push({ x: center + widthAtY * 0.5, y: y });
      }
      var path = new Path2D();
      path.moveTo(left[0].x, left[0].y);
      for (var l = 1; l < left.length; l += 1) path.lineTo(left[l].x, left[l].y);
      for (var r = right.length - 1; r >= 0; r -= 1) path.lineTo(right[r].x, right[r].y);
      path.closePath();

      var vertical = g.createLinearGradient(0, yTop, 0, yBottom);
      vertical.addColorStop(0, 'rgba(189,139,78,0)');
      vertical.addColorStop(0.12, 'rgba(189,139,78,0.24)');
      vertical.addColorStop(0.29, 'rgba(255,245,214,0.46)');
      vertical.addColorStop(0.46, 'rgba(189,139,78,0.38)');
      vertical.addColorStop(0.57, 'rgba(254,245,222,0.32)');
      vertical.addColorStop(0.72, 'rgba(255,236,196,0.36)');
      vertical.addColorStop(0.90, 'rgba(99,65,35,0.20)');
      vertical.addColorStop(1, 'rgba(10,8,6,0)');

      g.save();
      g.globalCompositeOperation = 'screen';
      g.fillStyle = vertical;
      if (lite) {
        // Keep the soft gradient silhouette; drop the two per-frame blur passes.
        g.globalAlpha = 0.90;
        g.filter = 'none';
        g.fill(path);
        g.globalAlpha = 0.28;
      } else {
        g.globalAlpha = 0.86;
        g.filter = 'blur(13px)';
        g.fill(path);
        g.globalAlpha = 0.54;
        g.filter = 'blur(4px)';
        g.fill(path);
        g.globalAlpha = 0.28;
        g.filter = 'none';
      }
      g.strokeStyle = 'rgba(255,236,196,0.46)';
      g.lineWidth = 1.1;
      g.stroke(path);

      // Delicate vertical folds give the broad light curtains an aurora-like texture.
      g.globalAlpha = 0.24;
      g.lineWidth = 1;
      for (var fold = 0; fold < 2; fold += 1) {
        g.beginPath();
        for (var point = 0; point <= steps; point += 1) {
          var q = point / steps;
          var yy = yTop + (yBottom - yTop) * q;
          var wav = Math.sin(q * Math.PI * 2.1 + curtain.phase + driftTime * curtain.speed) * curtain.amplitude;
          wav += Math.sin(q * Math.PI * 5.2 - curtain.phase * 0.7 + driftTime * curtain.speed * 0.62) * curtain.amplitude * 0.24;
          var wAt = curtain.width * (0.38 + Math.sin(Math.PI * Math.min(1, q)) * 0.62);
          var xx = curtain.x + wav + (fold - 1.5) * wAt * 0.16 + Math.sin(q * 8 + fold) * 7;
          if (point === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
        }
        g.strokeStyle = fold % 2 ? 'rgba(255,236,196,0.34)' : 'rgba(254,245,222,0.36)';
        g.stroke();
      }
      g.restore();
    }

    function buildLiteBackdrop() {
      var buffer = document.createElement('canvas');
      buffer.width = Math.max(1, Math.round(width));
      buffer.height = Math.max(1, Math.round(height));
      var bc = buffer.getContext('2d');
      bc.save();
      bc.globalCompositeOperation = 'screen';
      blooms.forEach(function(bloom) {
        bc.globalAlpha = Math.min(1, bloom.alpha * 3.4);
        bc.drawImage(glowSprites.bloom, bloom.x - bloom.radius, bloom.y - bloom.radius, bloom.radius * 2, bloom.radius * 2);
      });
      curtains.forEach(function(curtain) { drawCurtain(curtain, 0, bc); });
      bc.restore();
      var horizonRadius = Math.max(width, height) * 0.78;
      bc.save();
      bc.globalAlpha = 0.86;
      bc.drawImage(glowSprites.horizon, width * 0.5 - horizonRadius, height * 0.92 - horizonRadius, horizonRadius * 2, horizonRadius * 2);
      bc.restore();
      return buffer;
    }

    function drawAurora(time) {
      if (!pageVisible || document.hidden) { frameId = 0; return; }
      if (time - lastFrame < 32) { frameId = requestAnimationFrame(drawAurora); return; }
      lastFrame = time;
      ctx.clearRect(0, 0, width, height);
      var clock = reduceMotion ? 0 : time;
      var cachedScene = lite && liteBackdrop;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      if (cachedScene) {
        // Lite mode paints one cached scene and only breathes it; no per-frame gradients.
        var breathe = reduceMotion ? 0.96 : 0.93 + Math.sin(clock * 0.00021) * 0.05;
        var drift = reduceMotion ? 0 : Math.sin(clock * 0.00009) * 18;
        ctx.globalAlpha = breathe;
        ctx.drawImage(liteBackdrop, drift, 0, width, height);
        ctx.globalAlpha = 1;
        blooms.forEach(function(bloom) {
          var bob = reduceMotion ? 0 : Math.sin(clock * 0.00012 + bloom.phase) * 14;
          var bokehRadius = bloom.radius * 0.32;
          drawSprite(glowSprites.bokeh, bloom.x - bokehRadius + bob, bloom.y - bokehRadius, bokehRadius * 2, bokehRadius * 2, bloom.alpha * 2.8);
        });
      } else {
        blooms.forEach(function(bloom) {
          var pulse = reduceMotion ? 0.7 : (Math.sin(clock * 0.00024 * bloom.speed + bloom.phase) + 1) / 2;
          drawSprite(glowSprites.bloom, bloom.x - bloom.radius, bloom.y - bloom.radius, bloom.radius * 2, bloom.radius * 2, bloom.alpha * (1.9 + pulse * 1.4));
        });
        curtains.forEach(function(curtain) { drawCurtain(curtain, clock, ctx); });
      }
      ctx.restore();

      if (!cachedScene) {
        var horizonRadius = Math.max(width, height) * 0.78;
        drawSprite(glowSprites.horizon, width * 0.5 - horizonRadius, height * 0.92 - horizonRadius, horizonRadius * 2, horizonRadius * 2, 0.95);
      }

      stars.forEach(function(star) {
        var shimmer = reduceMotion ? 0.78 : (Math.sin(clock * 0.001 * star.speed + star.phase) + 1) / 2;
        var alpha = star.alpha * (0.42 + shimmer * 0.86);
        if (star.giant) {
          var haloRadius = star.radius * (8 + shimmer * 6);
          drawSprite(glowSprites.star, star.x - haloRadius, star.y - haloRadius, haloRadius * 2, haloRadius * 2, Math.min(1, alpha * 1.2));
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * (0.78 + shimmer * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254,245,222,' + alpha + ')';
        ctx.fill();
        if (star.giant && shimmer > 0.36) {
          var flare = star.radius * (5.2 + shimmer * 3.1);
          ctx.strokeStyle = 'rgba(255,236,196,' + Math.min(1, alpha * 0.78) + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(star.x - flare, star.y); ctx.lineTo(star.x + flare, star.y);
          ctx.moveTo(star.x, star.y - flare * 1.25); ctx.lineTo(star.x, star.y + flare * 1.25);
          ctx.stroke();
        }
        if (!reduceMotion) {
          star.x += star.drift;
          if (star.x < -4) star.x = width + 4;
          if (star.x > width + 4) star.x = -4;
        }
      });

      if (!reduceMotion && pageVisible && !document.hidden) frameId = requestAnimationFrame(drawAurora);
    }

    resizeAurora();
    window.addEventListener('resize', function() {
      resizeAurora();
      if (reduceMotion && pageVisible && !document.hidden) drawAurora(40);
    }, { passive: true });
    drawAurora(40);
    document.addEventListener('visibilitychange', function() {
      pageVisible = !document.hidden;
      if (!pageVisible && frameId) { cancelAnimationFrame(frameId); frameId = 0; }
      else if (pageVisible && !reduceMotion && !frameId) frameId = requestAnimationFrame(drawAurora);
    });
    if (motionPreference.addEventListener) {
      motionPreference.addEventListener('change', function(event) {
        reduceMotion = event.matches;
        if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
        if (!reduceMotion && pageVisible && !document.hidden) frameId = requestAnimationFrame(drawAurora);
        else if (reduceMotion && pageVisible && !document.hidden) drawAurora(40);
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
