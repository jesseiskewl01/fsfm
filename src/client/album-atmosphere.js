'use strict';
(function() {

// Sunrise Cathedral: a painted amber dawn cached into three still layers, then
// composited with bounded alpha/drift. Gradients and paths are built once on
// resize; no frame creates a gradient, blur, or new geometry. [Jesse + OpenCode, 2026-11-24]
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    var mode = canvas.getAttribute('data-atmosphere-mode') || 'full';
    var lite = mode === 'lite';
    var FRAME_MS = 1000 / 24;
    var width = 0, height = 0, dpr = 1;
    var frameId = 0, lastFrame = -1000, pageVisible = !document.hidden;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionPreference.matches;
    var skyLayer = null, shaftLayer = null, starLayer = null, stillLayer = null;
    var shafts = [], stars = [];

    function random(min, max) { return min + Math.random() * (max - min); }

    function makeLayer() {
      var buffer = document.createElement('canvas');
      buffer.width = Math.max(1, Math.round(width));
      buffer.height = Math.max(1, Math.round(height));
      return buffer;
    }

    // The sky is painted once: midnight at the top, amber dawn at the bottom,
    // a low sun, a calm horizon, and two dark cathedral piers.
    function paintSky(g) {
      g.clearRect(0, 0, width, height);
      var sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#07050a');
      sky.addColorStop(0.30, '#150c0a');
      sky.addColorStop(0.62, '#3a1f0e');
      sky.addColorStop(0.84, '#201208');
      sky.addColorStop(1, '#080503');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);

      g.save();
      g.globalCompositeOperation = 'screen';
      var horizonRadius = Math.max(width, height) * 0.66;
      var horizon = g.createRadialGradient(width * 0.5, height * 0.90, 0, width * 0.5, height * 0.90, horizonRadius);
      horizon.addColorStop(0, 'rgba(255,244,214,0.92)');
      horizon.addColorStop(0.14, 'rgba(255,211,143,0.56)');
      horizon.addColorStop(0.38, 'rgba(189,139,78,0.30)');
      horizon.addColorStop(1, 'rgba(189,139,78,0)');
      g.fillStyle = horizon;
      g.fillRect(0, 0, width, height);

      var sunRadius = Math.min(width, height) * (width < 640 ? 0.19 : 0.15);
      var sun = g.createRadialGradient(width * 0.5, height * 0.80, 0, width * 0.5, height * 0.80, sunRadius);
      sun.addColorStop(0, 'rgba(254,245,222,0.96)');
      sun.addColorStop(0.42, 'rgba(255,220,165,0.72)');
      sun.addColorStop(0.78, 'rgba(189,139,78,0.28)');
      sun.addColorStop(1, 'rgba(189,139,78,0)');
      g.fillStyle = sun;
      g.beginPath();
      g.arc(width * 0.5, height * 0.80, sunRadius, 0, Math.PI * 2);
      g.fill();
      g.restore();

      var line = g.createLinearGradient(width * 0.14, 0, width * 0.86, 0);
      line.addColorStop(0, 'rgba(254,245,222,0)');
      line.addColorStop(0.5, 'rgba(254,245,222,0.22)');
      line.addColorStop(1, 'rgba(254,245,222,0)');
      g.fillStyle = line;
      g.fillRect(width * 0.14, height * 0.895, width * 0.72, 1);

      g.save();
      g.globalAlpha = 0.62;
      [0.10, 0.90].forEach(function(fraction) {
        var pier = g.createLinearGradient(0, 0, 0, height);
        pier.addColorStop(0, 'rgba(7,5,10,0.94)');
        pier.addColorStop(0.72, 'rgba(7,5,10,0.78)');
        pier.addColorStop(1, 'rgba(7,5,10,0.30)');
        g.fillStyle = pier;
        g.fillRect(width * fraction - width * 0.035, 0, width * 0.07, height);
      });
      g.restore();
    }

    // Tall, tapered light shafts are the cathedral windows. Built once,
    // composited as a whole later.
    function paintShafts(g) {
      g.clearRect(0, 0, width, height);
      g.save();
      g.globalCompositeOperation = 'screen';
      shafts.forEach(function(shaft) {
        var light = g.createLinearGradient(0, 0, 0, height);
        light.addColorStop(0, 'rgba(254,245,222,0)');
        light.addColorStop(0.16, 'rgba(254,245,222,' + (shaft.alpha * 0.42).toFixed(3) + ')');
        light.addColorStop(0.46, 'rgba(255,220,165,' + shaft.alpha.toFixed(3) + ')');
        light.addColorStop(0.74, 'rgba(189,139,78,' + (shaft.alpha * 0.72).toFixed(3) + ')');
        light.addColorStop(1, 'rgba(189,139,78,0)');
        g.fillStyle = light;
        g.beginPath();
        g.moveTo(shaft.x - shaft.width * 0.42, 0);
        g.lineTo(shaft.x + shaft.width * 0.42, 0);
        g.lineTo(shaft.x + shaft.width * 0.88, height);
        g.lineTo(shaft.x - shaft.width * 0.88, height);
        g.closePath();
        g.fill();

        g.globalAlpha = 0.30;
        g.fillStyle = 'rgba(255,236,196,0.72)';
        g.fillRect(shaft.x - 1, height * 0.14, 2, height * 0.68);
        g.globalAlpha = 1;
      });
      g.restore();
    }

    // A sparse, top-weighted star field, drawn once into its own layer.
    function paintStars(g) {
      g.clearRect(0, 0, width, height);
      g.save();
      g.globalCompositeOperation = 'screen';
      stars.forEach(function(star) {
        g.globalAlpha = star.alpha;
        g.fillStyle = '#fef5de';
        g.beginPath();
        g.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        g.fill();
        if (star.giant) {
          g.globalAlpha = star.alpha * 0.46;
          g.strokeStyle = '#ffe6b8';
          g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(star.x - star.radius * 4, star.y);
          g.lineTo(star.x + star.radius * 4, star.y);
          g.moveTo(star.x, star.y - star.radius * 4);
          g.lineTo(star.x, star.y + star.radius * 4);
          g.stroke();
        }
      });
      g.restore();
    }

    function buildLayers() {
      skyLayer = makeLayer();
      paintSky(skyLayer.getContext('2d'));
      shaftLayer = makeLayer();
      paintShafts(shaftLayer.getContext('2d'));
      starLayer = makeLayer();
      paintStars(starLayer.getContext('2d'));
      stillLayer = null;
      if (lite) {
        stillLayer = makeLayer();
        var still = stillLayer.getContext('2d');
        still.drawImage(skyLayer, 0, 0, width, height);
        still.save();
        still.globalCompositeOperation = 'screen';
        still.globalAlpha = 0.86;
        still.drawImage(shaftLayer, 0, 0, width, height);
        still.globalAlpha = 0.78;
        still.drawImage(starLayer, 0, 0, width, height);
        still.restore();
      }
    }

    function resizeScene() {
      dpr = Math.min(window.devicePixelRatio || 1, lite ? 0.8 : 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastFrame = -1000;

      var compact = width < 640;
      var starCount = lite ? (compact ? 20 : 28) : (compact ? 42 : 72);
      stars = [];
      for (var i = 0; i < starCount; i += 1) {
        var giant = i < Math.max(4, Math.floor(starCount * 0.1));
        stars.push({
          x: random(0, width),
          y: random(0, height * 0.68),
          radius: giant ? random(1.1, 2.1) : random(0.35, 1.05),
          alpha: giant ? random(0.52, 0.9) : random(0.22, 0.62),
          giant: giant
        });
      }

      var shaftCount = lite ? (compact ? 3 : 4) : (compact ? 5 : 7);
      shafts = [];
      for (var s = 0; s < shaftCount; s += 1) {
        shafts.push({
          x: width * ((s + 0.5) / shaftCount) + random(-width * 0.02, width * 0.02),
          width: width * (compact ? random(0.12, 0.22) : random(0.07, 0.15)),
          alpha: random(0.18, 0.36)
        });
      }
      buildLayers();
    }

    // Every visible frame is just a few cached drawImage calls.
    function drawScene(time) {
      if (!pageVisible || document.hidden) { frameId = 0; return; }
      if (time - lastFrame < FRAME_MS) { frameId = requestAnimationFrame(drawScene); return; }
      lastFrame = time;
      ctx.clearRect(0, 0, width, height);

      if (stillLayer) {
        var breathe = reduceMotion ? 0.98 : 0.95 + Math.sin(time * 0.00022) * 0.04;
        var stillDrift = reduceMotion ? 0 : Math.sin(time * 0.00008) * 12;
        ctx.globalAlpha = breathe;
        ctx.drawImage(stillLayer, stillDrift, 0, width, height);
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(skyLayer, 0, 0, width, height);
        var sway = reduceMotion ? 0 : Math.sin(time * 0.00012) * 10;
        var shaftAlpha = reduceMotion ? 0.82 : 0.82 + Math.sin(time * 0.00018) * 0.12;
        ctx.globalAlpha = shaftAlpha;
        ctx.drawImage(shaftLayer, sway, 0, width, height);
        ctx.globalAlpha = 1;
        var starAlpha = reduceMotion ? 0.72 : 0.66 + Math.sin(time * 0.00026) * 0.18;
        ctx.globalAlpha = starAlpha;
        ctx.drawImage(starLayer, 0, 0, width, height);
        ctx.globalAlpha = 1;
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
