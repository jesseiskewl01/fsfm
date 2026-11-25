'use strict';
(function() {

// Golden Glitter Sky: one oversized canvas painted once. Dark voids, clustered
// stars and warm bloom create contrast; CSS handles the drift and twinkle.
// [Jesse + OpenCode, 2026-11-25]
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    var mode = canvas.getAttribute('data-atmosphere-mode') || 'full';
    var lite = mode === 'lite';
    var seed = 20261125;
    var GOLD = ['#ffffff', '#fef5de', '#fff3cf', '#ffe6b8', '#ffd9a0', '#bd8b4e'];
    var CLUSTERS = [
      [0.22, 0.26, 0.18],
      [0.72, 0.34, 0.15],
      [0.48, 0.60, 0.20],
      [0.84, 0.76, 0.13],
      [0.14, 0.82, 0.12]
    ];

    function random(min, max) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return min + (seed / 4294967296) * (max - min);
    }

    // Four brightness tiers: faint dust, soft mid-tones, bright glitter, and
    // rare near-white hero stars. Big stars always stay in the upper tiers.
    function starAlpha(big) {
      var roll = random(0, 1);
      if (big) return roll < 0.72 ? random(0.76, 0.92) : random(0.93, 1);
      if (roll < 0.18) return random(0.08, 0.20);
      if (roll < 0.72) return random(0.22, 0.52);
      if (roll < 0.95) return random(0.56, 0.86);
      return random(0.90, 1);
    }

    function paintSky(g, width, height) {
      var reach = Math.max(width, height);
      var sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#020104');
      sky.addColorStop(0.42, '#0b060a');
      sky.addColorStop(1, '#030104');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);

      g.save();
      g.globalCompositeOperation = 'screen';
      var glows = [
        [0.48, 0.46, 0.56, 'rgba(255,236,194,0.26)'],
        [0.22, 0.24, 0.38, 'rgba(189,139,78,0.20)'],
        [0.78, 0.68, 0.42, 'rgba(255,220,165,0.18)'],
        [0.52, 0.90, 0.28, 'rgba(255,214,130,0.10)']
      ];
      for (var i = 0; i < glows.length; i += 1) {
        var glow = glows[i];
        var gx = glow[0] * width;
        var gy = glow[1] * height;
        var gr = glow[2] * reach;
        var wash = g.createRadialGradient(gx, gy, 0, gx, gy, gr);
        wash.addColorStop(0, glow[3]);
        wash.addColorStop(1, 'rgba(189,139,78,0)');
        g.fillStyle = wash;
        g.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      g.restore();

      // Carve dark pockets through the bloom so the glitter has real contrast.
      var voids = [
        [0.08, 0.74, 0.30, 'rgba(2,1,4,0.88)'],
        [0.92, 0.18, 0.26, 'rgba(2,1,4,0.82)'],
        [0.36, 0.10, 0.24, 'rgba(2,1,4,0.66)'],
        [0.62, 0.96, 0.22, 'rgba(2,1,4,0.70)']
      ];
      for (var v = 0; v < voids.length; v += 1) {
        var voidSpot = voids[v];
        var vx = voidSpot[0] * width;
        var vy = voidSpot[1] * height;
        var vr = voidSpot[2] * reach;
        var dark = g.createRadialGradient(vx, vy, 0, vx, vy, vr);
        dark.addColorStop(0, voidSpot[3]);
        dark.addColorStop(1, 'rgba(2,1,4,0)');
        g.fillStyle = dark;
        g.fillRect(vx - vr, vy - vr, vr * 2, vr * 2);
      }

      var count = lite ? 420 : 900;
      for (var s = 0; s < count; s += 1) {
        var clustered = random(0, 1) < 0.46;
        var sx;
        var sy;
        if (clustered) {
          var cluster = CLUSTERS[s % CLUSTERS.length];
          var angle = random(0, Math.PI * 2);
          var distance = Math.pow(random(0, 1), 0.55) * cluster[2] * reach;
          sx = cluster[0] * width + Math.cos(angle) * distance;
          sy = cluster[1] * height + Math.sin(angle) * distance;
        } else {
          sx = random(0, width);
          sy = random(0, height);
        }

        var big = random(0, 1) > (clustered ? 0.90 : 0.96);
        var radius = big ? random(1.3, 2.8) : random(0.4, 1.25);
        var tint = GOLD[s % GOLD.length];

        if (big) {
          var haloRadius = radius * random(8, 16);
          var halo = g.createRadialGradient(sx, sy, 0, sx, sy, haloRadius);
          halo.addColorStop(0, 'rgba(255,236,194,0.42)');
          halo.addColorStop(1, 'rgba(255,220,165,0)');
          g.save();
          g.globalCompositeOperation = 'screen';
          g.fillStyle = halo;
          g.fillRect(sx - haloRadius, sy - haloRadius, haloRadius * 2, haloRadius * 2);
          g.restore();
        }

        g.globalAlpha = starAlpha(big);
        g.fillStyle = tint;
        g.beginPath();
        g.arc(sx, sy, radius, 0, Math.PI * 2);
        g.fill();

        if (big) {
          g.globalAlpha *= 0.5;
          g.strokeStyle = tint;
          g.lineWidth = 0.8;
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

    paint();
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
