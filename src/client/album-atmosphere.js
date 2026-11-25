'use strict';
(function() {

// Golden Glitter Sky: one oversized canvas painted once. The drift and twinkle
// are compositor-only CSS transforms, so no frame creates geometry or gradient.
// [Jesse + OpenCode, 2026-11-25]
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    var mode = canvas.getAttribute('data-atmosphere-mode') || 'full';
    var lite = mode === 'lite';
    var seed = 20261125;
    var GOLD = ['#fef5de', '#fff3cf', '#ffe6b8', '#ffd9a0', '#ffffff', '#bd8b4e'];

    function random(min, max) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return min + (seed / 4294967296) * (max - min);
    }

    function paintSky(g, width, height) {
      var sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#050308');
      sky.addColorStop(0.42, '#120b0e');
      sky.addColorStop(1, '#070408');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);

      g.save();
      g.globalCompositeOperation = 'screen';
      var glows = [
        [0.50, 0.46, 0.58, 'rgba(254,245,222,0.20)'],
        [0.26, 0.30, 0.42, 'rgba(189,139,78,0.16)'],
        [0.76, 0.64, 0.44, 'rgba(255,220,165,0.15)'],
        [0.52, 0.88, 0.30, 'rgba(255,214,130,0.08)']
      ];
      for (var i = 0; i < glows.length; i += 1) {
        var glow = glows[i];
        var x = glow[0] * width;
        var y = glow[1] * height;
        var radius = glow[2] * Math.max(width, height);
        var wash = g.createRadialGradient(x, y, 0, x, y, radius);
        wash.addColorStop(0, glow[3]);
        wash.addColorStop(1, 'rgba(189,139,78,0)');
        g.fillStyle = wash;
        g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      g.restore();

      var count = lite ? 420 : 900;
      for (var s = 0; s < count; s += 1) {
        var sx = random(0, width);
        var sy = random(0, height);
        var big = random(0, 1) > 0.94;
        var radius = big ? random(1.2, 2.6) : random(0.35, 1.15);
        var tint = GOLD[s % GOLD.length];

        if (big) {
          var haloRadius = radius * random(7, 14);
          var halo = g.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
          halo.addColorStop(0, 'rgba(255,236,194,0.34)');
          halo.addColorStop(1, 'rgba(255,220,165,0)');
          g.save();
          g.globalCompositeOperation = 'screen';
          g.fillStyle = halo;
          g.fillRect(sx - haloRadius, sy - haloRadius, haloRadius * 2, haloRadius * 2);
          g.restore();
        }

        g.globalAlpha = big ? random(0.72, 1) : random(0.25, 0.78);
        g.fillStyle = tint;
        g.beginPath();
        g.arc(sx, sy, radius, 0, Math.PI * 2);
        g.fill();

        if (big) {
          g.globalAlpha *= 0.45;
          g.strokeStyle = tint;
          g.lineWidth = 0.75;
          g.beginPath();
          g.moveTo(sx - radius * 4, sy);
          g.lineTo(sx + radius * 4, sy);
          g.moveTo(sx, sy - radius * 4);
          g.lineTo(sx, sy + radius * 4);
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }

    function paint() {
      var width = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
      var height = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
      var dpr = Math.min(window.devicePixelRatio || 1, lite ? 0.75 : 1);
      seed = 20261125;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSky(ctx, width, height);
    }

    function addStreaks() {
      var existing = document.querySelectorAll('.glitter-streak');
      if (existing.length) return;
      seed = 20261125;
      var angles = [-28, 24, -18, 32, -35, 20];
      var total = lite ? 3 : 6;
      for (var i = 0; i < total; i += 1) {
        var streak = document.createElement('div');
        streak.className = 'glitter-streak';
        streak.setAttribute('aria-hidden', 'true');
        streak.style.left = random(4, 72) + '%';
        streak.style.top = random(8, 78) + '%';
        streak.style.setProperty('--angle', angles[i % angles.length] + 'deg');
        streak.style.setProperty('--duration', (6 + i * 1.3).toFixed(1) + 's');
        streak.style.setProperty('--delay', (-i * 1.7).toFixed(1) + 's');
        (document.body || document.documentElement).appendChild(streak);
      }
    }

    paint();
    addStreaks();
    window.addEventListener('resize', paint, { passive: true });
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
