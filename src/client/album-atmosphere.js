'use strict';
(function() {
var TRACKS = [
  {
    "title": "I MADE YOU CRY",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/1.%20IMYC.ogg",
    "lrc": "lyrics/01-i-made-you-cry.lrc",
    "instrumental": false
  },
  {
    "title": "CARPE DIEM",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/2%20CARPE%20DIEM.ogg",
    "lrc": "lyrics/02-carpe-diem.lrc",
    "instrumental": false
  },
  {
    "title": "DO WHAT YOU WISH",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/3.%20DO%20WHAT%20YOU%20WISH.ogg",
    "lrc": "lyrics/03-do-what-you-wish.lrc",
    "instrumental": false
  },
  {
    "title": "BISCUIT",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/4.%20BISCUIT.ogg",
    "lrc": "lyrics/04-biscuit.lrc",
    "instrumental": false
  },
  {
    "title": "GOODNIGHT",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/5.%20GOODNIGHT!.ogg",
    "lrc": "lyrics/05-goodnight.lrc",
    "instrumental": false
  },
  {
    "title": "SANDISK CRUZER BLADE",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/6.%20SANDISK%20CRUZER%20BLADE.ogg",
    "lrc": "lyrics/06-sandisk.lrc",
    "instrumental": false
  },
  {
    "title": "CLEVELAND Z",
    "src": "https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/7.%20CLEVELAND%20Z.ogg",
    "lrc": "lyrics/07-cleveland-z.lrc",
    "instrumental": true
  }
];
var audio = document.getElementById('albumAudio');
var trackList = document.getElementById('trackList');
var playButton = document.getElementById('playPause');
var seekBar = document.getElementById('seekBar');
var currentTitle = document.getElementById('currentTrackTitle');
var trackCount = document.getElementById('playerTrackCount');
var currentTimeLabel = document.getElementById('currentTime');
var durationLabel = document.getElementById('trackDuration');
var playerStatus = document.getElementById('playerStatus');
var lyricPrevious = document.getElementById('lyricPrevious');
var lyricCurrent = document.getElementById('lyricCurrent');
var lyricNext = document.getElementById('lyricNext');
var lyricStatus = document.getElementById('lyricStatus');
var currentIndex = 0;
var currentLyrics = [];
var currentLyricIndex = -1;
var isSeeking = false;
var lyricRequestId = 0;
var karaokeFrame = 0;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  var whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}
function setStatus(message) { if (playerStatus) playerStatus.textContent = message; }
function parseLrc(text) {
  var parsed = [];
  text.split(/\r?\n/).forEach(function(line) {
    var match = line.match(/^\[(\d+):(\d{2})(?:\.(\d{1,3}))?\](.*)$/);
    if (!match) return;
    var minutes = Number(match[1]);
    var seconds = Number(match[2]);
    var fraction = match[3] ? Number('0.' + match[3]) : 0;
    var words = (match[4] || '').trim();
    if (!words) return;
    parsed.push({ time: minutes * 60 + seconds + fraction, text: words });
  });
  return parsed.sort(function(a, b) { return a.time - b.time; });
}
function animateLyricLine() {
  lyricCurrent.classList.remove('line-enter');
  void lyricCurrent.offsetWidth;
  lyricCurrent.classList.add('line-enter');
}
function setLyricText(element, value) { element.textContent = value || ''; }
function findLyricIndex(time) {
  var low = 0, high = currentLyrics.length - 1, found = -1;
  while (low <= high) {
    var mid = (low + high) >> 1;
    if (currentLyrics[mid].time <= time) { found = mid; low = mid + 1; }
    else high = mid - 1;
  }
  return found;
}
function syncLyrics(timeOverride) {
  var time = Number.isFinite(timeOverride) ? timeOverride : (audio.currentTime || 0);
  var item = TRACKS[currentIndex];
  if (!currentLyrics.length) {
    setLyricText(lyricPrevious, '');
    setLyricText(lyricCurrent, item.instrumental ? '♪' : 'LYRICS UNAVAILABLE');
    setLyricText(lyricNext, '');
    lyricCurrent.style.setProperty('--fill', '0%');
    lyricCurrent.classList.remove('line-enter');
    lyricStatus.classList.toggle('instrumental', !!item.instrumental);
    lyricStatus.textContent = item.instrumental ? 'INSTRUMENTAL TRACK' : 'LYRIC FILE COULD NOT BE LOADED';
    return;
  }

  var found = findLyricIndex(time);
  var next = found + 1 < currentLyrics.length ? currentLyrics[found + 1] : null;
  var changed = found !== currentLyricIndex;
  if (changed) currentLyricIndex = found;

  if (found < 0) {
    setLyricText(lyricPrevious, '');
    setLyricText(lyricCurrent, '♪');
    setLyricText(lyricNext, currentLyrics[0].text);
    lyricCurrent.style.setProperty('--fill', '0%');
    if (changed) animateLyricLine();
    var introIsLong = currentLyrics[0].time >= 15 && time >= 15;
    lyricStatus.classList.toggle('instrumental', introIsLong);
    lyricStatus.textContent = introIsLong ? 'INSTRUMENTAL SECTION' : ' ';
    return;
  }

  var active = currentLyrics[found];
  var nextTime = next ? next.time : (Number.isFinite(audio.duration) ? audio.duration : active.time + 5);
  var span = Math.max(0.001, nextTime - active.time);
  var elapsed = Math.max(0, time - active.time);
  var isLongSilence = span >= 15;
  // LRC gives us line start-times, not word-end-times. For a long gap, finish
  // the karaoke sweep promptly and hold it; never animate the lyric across silence.
  var karaokeWindow = isLongSilence ? Math.min(span, 6.5) : span;
  var fill = Math.max(0, Math.min(100, (elapsed / Math.max(0.001, karaokeWindow)) * 100));
  var instrumentalGap = isLongSilence && elapsed >= 15 && time < nextTime;

  if (changed) {
    setLyricText(lyricPrevious, found > 0 ? currentLyrics[found - 1].text : '');
    setLyricText(lyricCurrent, active.text);
    setLyricText(lyricNext, next ? next.text : '');
    animateLyricLine();
  }
  lyricCurrent.style.setProperty('--fill', fill.toFixed(2) + '%');
  lyricStatus.classList.toggle('instrumental', instrumentalGap);
  lyricStatus.textContent = instrumentalGap ? 'INSTRUMENTAL SECTION' : ' ';
}
function animateKaraoke() {
  syncLyrics();
  if (!audio.paused && !audio.ended) karaokeFrame = requestAnimationFrame(animateKaraoke);
}
function startKaraokeAnimation() {
  if (karaokeFrame) cancelAnimationFrame(karaokeFrame);
  karaokeFrame = requestAnimationFrame(animateKaraoke);
}
function stopKaraokeAnimation() {
  if (karaokeFrame) cancelAnimationFrame(karaokeFrame);
  karaokeFrame = 0;
  syncLyrics();
}
function renderTrackList() {
  trackList.innerHTML = '';
  TRACKS.forEach(function(track, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'track-link';
    button.setAttribute('aria-pressed', index === currentIndex ? 'true' : 'false');
    button.innerHTML = '<span class="track-number">' + String(index + 1).padStart(2, '0') + '</span><span class="track-name"></span>';
    button.querySelector('.track-name').textContent = track.title;
    button.addEventListener('click', function() { selectTrack(index, !audio.paused); });
    trackList.appendChild(button);
  });
}
function updateTrackDisplay() {
  var track = TRACKS[currentIndex];
  currentTitle.textContent = track.title;
  trackCount.textContent = 'TRACK ' + String(currentIndex + 1).padStart(2, '0') + ' / ' + String(TRACKS.length).padStart(2, '0');
  durationLabel.textContent = formatTime(audio.duration);
  currentTimeLabel.textContent = '0:00';
  seekBar.value = '0';
  currentLyricIndex = -1;
  syncLyrics();
  renderTrackList();
}
function loadTrackLyrics(track) {
  var requestId = ++lyricRequestId;
  currentLyrics = [];
  currentLyricIndex = -1;
  if (track.instrumental) { syncLyrics(); return; }
  lyricStatus.textContent = 'LOADING LYRIC TIMINGS';
  fetch(track.lrc, { cache: 'no-cache' })
    .then(function(response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.text(); })
    .then(function(text) {
      if (requestId !== lyricRequestId) return;
      currentLyrics = parseLrc(text);
      syncLyrics();
    })
    .catch(function() {
      if (requestId !== lyricRequestId) return;
      currentLyrics = [];
      lyricCurrent.textContent = 'LYRICS UNAVAILABLE';
      lyricStatus.textContent = 'CHECK THAT THE LRC FILE IS DEPLOYED';
    });
}
function selectTrack(index, autoPlay) {
  currentIndex = (index + TRACKS.length) % TRACKS.length;
  var track = TRACKS[currentIndex];
  audio.pause();
  currentLyrics = [];
  currentLyricIndex = -1;
  audio.src = track.src;
  audio.load();
  updateTrackDisplay();
  loadTrackLyrics(track);
  setStatus('READY · ' + track.title);
  if (autoPlay) startPlayback();
}
function startPlayback() {
  var attempt = audio.play();
  if (attempt && typeof attempt.then === 'function') {
    attempt.then(function() { setStatus('PLAYING · ' + TRACKS[currentIndex].title); })
      .catch(function() { setStatus('PLAYBACK FAILED · CHECK THE AUDIO FILE URL OR FORMAT'); });
  }
}
function updatePlayButton() {
  var playing = !audio.paused;
  playButton.textContent = playing ? 'Ⅱ' : '▶';
  playButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  playButton.title = playing ? 'Pause' : 'Play';
}

playButton.addEventListener('click', function() {
  if (audio.paused) startPlayback(); else audio.pause();
});
document.getElementById('previousTrack').addEventListener('click', function() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  selectTrack(currentIndex - 1, !audio.paused);
});
document.getElementById('nextTrack').addEventListener('click', function() { selectTrack(currentIndex + 1, !audio.paused); });
audio.addEventListener('play', function() { updatePlayButton(); startKaraokeAnimation(); });
audio.addEventListener('pause', function() { updatePlayButton(); stopKaraokeAnimation(); });
audio.addEventListener('ended', function() {
  if (currentIndex < TRACKS.length - 1) selectTrack(currentIndex + 1, true);
  else { updatePlayButton(); setStatus('ALBUM PLAYBACK COMPLETE'); }
});
audio.addEventListener('loadedmetadata', function() { durationLabel.textContent = formatTime(audio.duration); syncLyrics(); });
audio.addEventListener('timeupdate', function() {
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  if (!isSeeking && Number.isFinite(audio.duration) && audio.duration > 0) seekBar.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  syncLyrics();
});
audio.addEventListener('error', function() { setStatus('AUDIO COULD NOT LOAD · CHECK THE REPOSITORY URL'); });
seekBar.addEventListener('input', function() {
  isSeeking = true;
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    var seconds = (Number(seekBar.value) / 1000) * audio.duration;
    currentTimeLabel.textContent = formatTime(seconds);
    syncLyrics(seconds);
  }
});
seekBar.addEventListener('change', function() {
  if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (Number(seekBar.value) / 1000) * audio.duration;
  isSeeking = false;
});

selectTrack(0, false);
})();

'use strict';
(function() {
'use strict';

// A wide, slow-moving aurora over The Early Bird....
try {
  var canvas = document.getElementById('nebulaCanvas');
  var ctx = canvas && canvas.getContext('2d');
  if (canvas && ctx) {
    var width = 0, height = 0, dpr = 1, compact = false, frameId = 0, lastFrame = -1000, pageVisible = !document.hidden;
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionPreference.matches;
    var stars = [], blooms = [], curtains = [];
    function random(min, max) { return min + Math.random() * (max - min); }

    function resizeAurora() {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1 : 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];
      blooms = [];
      curtains = [];
      var starCount = Math.min(260, Math.max(90, Math.floor((width * height) / 6200)));
      compact = width < 640;
      for (var i = 0; i < starCount; i += 1) {
        var giant = i < Math.max(18, Math.floor(starCount * 0.075));
        stars.push({
          x: random(0, width), y: random(0, height),
          radius: giant ? random(compact ? 1.35 : 1.8, compact ? 2.7 : 3.8) : random(compact ? 0.35 : 0.45, compact ? 1.15 : 1.6),
          phase: random(0, Math.PI * 2), speed: random(0.24, 0.92),
          alpha: giant ? random(0.42, 0.82) : random(0.18, 0.58),
          drift: random(-0.035, 0.035), giant: giant
        });
      }
      for (var b = 0; b < 4; b += 1) {
        blooms.push({
          x: random(width * 0.02, width * 0.98),
          y: random(height * 0.04, height * 0.98),
          radius: random(Math.min(width, height) * 0.20, Math.min(width, height) * 0.55),
          alpha: random(0.045, 0.095), phase: random(0, Math.PI * 2), speed: random(0.11, 0.24)
        });
      }
      var curtainCount = Math.max(4, Math.min(7, Math.round(width / (compact ? 220 : 250)) + 2));
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
    }

    function drawCurtain(curtain, time) {
      var yTop = -height * (width < 640 ? 0.16 : 0.10);
      var yBottom = height * (compact ? Math.min(1.18, curtain.depth + 0.10) : Math.min(1.25, curtain.depth + 0.16));
      var steps = 28;
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

      var vertical = ctx.createLinearGradient(0, yTop, 0, yBottom);
      vertical.addColorStop(0, 'rgba(189,139,78,0)');
      vertical.addColorStop(0.12, 'rgba(189,139,78,0.20)');
      vertical.addColorStop(0.29, 'rgba(254,245,222,0.34)');
      vertical.addColorStop(0.46, 'rgba(189,139,78,0.30)');
      vertical.addColorStop(0.57, 'rgba(254,245,222,0.22)');
      vertical.addColorStop(0.72, 'rgba(254,245,222,0.26)');
      vertical.addColorStop(0.90, 'rgba(99,65,35,0.16)');
      vertical.addColorStop(1, 'rgba(10,8,6,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = vertical;
      ctx.globalAlpha = 0.76;
      ctx.filter = 'blur(18px)';
      ctx.fill(path);
      ctx.globalAlpha = 0.48;
      ctx.filter = 'blur(6px)';
      ctx.fill(path);
      ctx.globalAlpha = 0.24;
      ctx.filter = 'none';
      ctx.strokeStyle = 'rgba(254,245,222,0.32)';
      ctx.lineWidth = 1.1;
      ctx.stroke(path);

      // Delicate vertical folds give the broad light curtains an aurora-like texture.
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (var fold = 0; fold < 2; fold += 1) {
        ctx.beginPath();
        for (var point = 0; point <= steps; point += 1) {
          var q = point / steps;
          var yy = yTop + (yBottom - yTop) * q;
          var wav = Math.sin(q * Math.PI * 2.1 + curtain.phase + driftTime * curtain.speed) * curtain.amplitude;
          wav += Math.sin(q * Math.PI * 5.2 - curtain.phase * 0.7 + driftTime * curtain.speed * 0.62) * curtain.amplitude * 0.24;
          var wAt = curtain.width * (0.38 + Math.sin(Math.PI * Math.min(1, q)) * 0.62);
          var xx = curtain.x + wav + (fold - 1.5) * wAt * 0.16 + Math.sin(q * 8 + fold) * 7;
          if (point === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.strokeStyle = fold % 2 ? 'rgba(254,245,222,0.26)' : 'rgba(254,245,222,0.28)';
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawAurora(time) {
      if (!pageVisible || document.hidden) { frameId = 0; return; }
      if (time - lastFrame < 32) { frameId = requestAnimationFrame(drawAurora); return; }
      lastFrame = time;
      ctx.clearRect(0, 0, width, height);
      var clock = reduceMotion ? 0 : time;

      // Soft atmospheric blooms sit behind the curtains.
      blooms.forEach(function(bloom) {
        var pulse = reduceMotion ? 0.7 : (Math.sin(clock * 0.00024 * bloom.speed + bloom.phase) + 1) / 2;
        var glow = ctx.createRadialGradient(bloom.x, bloom.y, 0, bloom.x, bloom.y, bloom.radius);
        glow.addColorStop(0, 'rgba(254,245,222,' + (bloom.alpha * (0.8 + pulse * 0.7)) + ')');
        glow.addColorStop(0.34, 'rgba(189,139,78,' + (bloom.alpha * 0.85) + ')');
        glow.addColorStop(0.72, 'rgba(34,22,13,' + (bloom.alpha * 0.48) + ')');
        glow.addColorStop(1, 'rgba(10,8,6,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(bloom.x - bloom.radius, bloom.y - bloom.radius, bloom.radius * 2, bloom.radius * 2);
      });

      curtains.forEach(function(curtain) { drawCurtain(curtain, clock); });

      // A low horizon haze creates depth rather than leaving the lower half flat black.
      var horizon = ctx.createRadialGradient(width * 0.5, height * 0.92, 0, width * 0.5, height * 0.92, Math.max(width, height) * 0.72);
      horizon.addColorStop(0, 'rgba(189,139,78,0.12)');
      horizon.addColorStop(0.45, 'rgba(34,22,13,0.07)');
      horizon.addColorStop(1, 'rgba(10,8,6,0)');
      ctx.fillStyle = horizon;
      ctx.fillRect(0, 0, width, height);

      stars.forEach(function(star) {
        var shimmer = reduceMotion ? 0.78 : (Math.sin(clock * 0.001 * star.speed + star.phase) + 1) / 2;
        var alpha = star.alpha * (0.34 + shimmer * 0.82);
        if (star.giant) {
          var haloRadius = star.radius * (8 + shimmer * 6);
          var halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, haloRadius);
          halo.addColorStop(0, 'rgba(254,245,222,' + (alpha * 0.80) + ')');
          halo.addColorStop(0.18, 'rgba(189,139,78,' + (alpha * 0.42) + ')');
          halo.addColorStop(1, 'rgba(189,139,78,0)');
          ctx.fillStyle = halo;
          ctx.fillRect(star.x - haloRadius, star.y - haloRadius, haloRadius * 2, haloRadius * 2);
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * (0.78 + shimmer * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254,245,222,' + alpha + ')';
        ctx.fill();
        if (star.giant && shimmer > 0.36) {
          var flare = star.radius * (5.2 + shimmer * 3.1);
          ctx.strokeStyle = 'rgba(254,245,222,' + (alpha * 0.62) + ')';
          ctx.lineWidth = 0.8;
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
    window.addEventListener('resize', resizeAurora, { passive: true });
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
