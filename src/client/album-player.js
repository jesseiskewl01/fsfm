(() => {
  'use strict';
  const root = document.querySelector('[data-album-player]');
  if (!root) return;

  let config;
  try {
    config = JSON.parse(root.querySelector('#albumPlayerData')?.textContent || '{}');
  } catch {
    const status = root.querySelector('#playerStatus');
    if (status) status.textContent = 'PLAYER CONFIGURATION COULD NOT BE READ';
    return;
  }

  const tracks = Array.isArray(config.tracks) ? config.tracks : [];
  const audio = root.querySelector('#albumAudio');
  const trackList = root.querySelector('#trackList');
  const playButton = root.querySelector('#playPause');
  const seekBar = root.querySelector('#seekBar');
  const currentTitle = root.querySelector('#currentTrackTitle');
  const trackCount = root.querySelector('#playerTrackCount');
  const currentTimeLabel = root.querySelector('#currentTime');
  const durationLabel = root.querySelector('#trackDuration');
  const playerStatus = root.querySelector('#playerStatus');
  const lyricPrevious = root.querySelector('#lyricPrevious');
  const lyricCurrent = root.querySelector('#lyricCurrent');
  const lyricNext = root.querySelector('#lyricNext');
  const lyricStatus = root.querySelector('#lyricStatus');
  const previousButton = root.querySelector('#previousTrack');
  const nextButton = root.querySelector('#nextTrack');
  if (!audio || !trackList || !playButton || !seekBar || !currentTitle || !trackCount || !currentTimeLabel || !durationLabel || !playerStatus || !lyricPrevious || !lyricCurrent || !lyricNext || !lyricStatus || !previousButton || !nextButton || !tracks.length) return;

  let currentIndex = 0;
  let currentLyrics = [];
  let currentLyricIndex = -1;
  let isSeeking = false;
  let lyricRequestId = 0;
  let karaokeFrame = 0;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };
  const setStatus = (message) => { playerStatus.textContent = message; };

  function parseLrc(text) {
    const parsed = [];
    String(text).split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\[(\d+):(\d{2})(?:[.](\d{1,3}))?\](.*)$/);
      if (!match) return;
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      const words = (match[4] || '').trim();
      if (words) parsed.push({ time: minutes * 60 + seconds + fraction, text: words });
    });
    return parsed.sort((a, b) => a.time - b.time);
  }

  function setLyricText(element, value) { element.textContent = value || ''; }
  function animateLyricLine() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    lyricCurrent.classList.remove('line-enter');
    void lyricCurrent.offsetWidth;
    lyricCurrent.classList.add('line-enter');
  }
  function findLyricIndex(time) {
    let low = 0, high = currentLyrics.length - 1, found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (currentLyrics[mid].time <= time) { found = mid; low = mid + 1; }
      else high = mid - 1;
    }
    return found;
  }

  function syncLyrics(timeOverride) {
    const time = Number.isFinite(timeOverride) ? timeOverride : (audio.currentTime || 0);
    const track = tracks[currentIndex];
    if (!currentLyrics.length) {
      setLyricText(lyricPrevious, '');
      setLyricText(lyricCurrent, track.instrumental ? '♪' : 'LYRICS UNAVAILABLE');
      setLyricText(lyricNext, '');
      lyricCurrent.style.setProperty('--fill', '0%');
      lyricCurrent.classList.remove('line-enter');
      lyricStatus.classList.toggle('instrumental', Boolean(track.instrumental));
      lyricStatus.textContent = track.instrumental ? 'INSTRUMENTAL TRACK' : 'LYRIC FILE COULD NOT BE LOADED';
      return;
    }

    const found = findLyricIndex(time);
    const next = found + 1 < currentLyrics.length ? currentLyrics[found + 1] : null;
    const changed = found !== currentLyricIndex;
    if (changed) currentLyricIndex = found;

    if (found < 0) {
      setLyricText(lyricPrevious, '');
      setLyricText(lyricCurrent, '♪');
      setLyricText(lyricNext, currentLyrics[0].text);
      lyricCurrent.style.setProperty('--fill', '0%');
      if (changed) animateLyricLine();
      const introIsLong = currentLyrics[0].time >= 15 && time >= 15;
      lyricStatus.classList.toggle('instrumental', introIsLong);
      lyricStatus.textContent = introIsLong ? 'INSTRUMENTAL SECTION' : ' ';
      return;
    }

    const active = currentLyrics[found];
    const nextTime = next ? next.time : (Number.isFinite(audio.duration) ? audio.duration : active.time + 5);
    const span = Math.max(0.001, nextTime - active.time);
    const elapsed = Math.max(0, time - active.time);
    const isLongSilence = span >= 15;
    const karaokeWindow = isLongSilence ? Math.min(span, 6.5) : span;
    const fill = Math.max(0, Math.min(100, (elapsed / Math.max(0.001, karaokeWindow)) * 100));
    const instrumentalGap = isLongSilence && elapsed >= 15 && time < nextTime;

    if (changed) {
      setLyricText(lyricPrevious, found > 0 ? currentLyrics[found - 1].text : '');
      setLyricText(lyricCurrent, active.text);
      setLyricText(lyricNext, next ? next.text : '');
      animateLyricLine();
    }
    lyricCurrent.style.setProperty('--fill', config.lineWideLyricHighlight === false ? '100%' : `${fill.toFixed(2)}%`);
    lyricStatus.classList.toggle('instrumental', instrumentalGap);
    lyricStatus.textContent = instrumentalGap ? 'INSTRUMENTAL SECTION' : ' ';
  }

  function animateKaraoke() {
    syncLyrics();
    if (!audio.paused && !audio.ended) karaokeFrame = window.requestAnimationFrame(animateKaraoke);
  }
  function startKaraokeAnimation() {
    if (karaokeFrame) window.cancelAnimationFrame(karaokeFrame);
    karaokeFrame = window.requestAnimationFrame(animateKaraoke);
  }
  function stopKaraokeAnimation() {
    if (karaokeFrame) window.cancelAnimationFrame(karaokeFrame);
    karaokeFrame = 0;
    syncLyrics();
  }

  function renderTrackList() {
    trackList.replaceChildren();
    tracks.forEach((track, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'track-link';
      button.setAttribute('aria-pressed', index === currentIndex ? 'true' : 'false');
      const number = document.createElement('span');
      number.className = 'track-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const name = document.createElement('span');
      name.className = 'track-name';
      name.textContent = track.title;
      button.append(number, name);
      button.addEventListener('click', () => selectTrack(index, !audio.paused));
      trackList.append(button);
    });
  }
  function updateTrackDisplay() {
    const track = tracks[currentIndex];
    currentTitle.textContent = track.title;
    trackCount.textContent = `TRACK ${String(currentIndex + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    durationLabel.textContent = formatTime(audio.duration);
    currentTimeLabel.textContent = '0:00';
    seekBar.value = '0';
    currentLyricIndex = -1;
    syncLyrics();
    renderTrackList();
  }
  async function loadTrackLyrics(track) {
    const requestId = ++lyricRequestId;
    currentLyrics = [];
    currentLyricIndex = -1;
    if (track.instrumental) { syncLyrics(); return; }
    if (!track.lyrics) {
      syncLyrics();
      return;
    }
    lyricStatus.textContent = 'LOADING LYRIC TIMINGS';
    try {
      const response = await fetch(track.lyrics, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (requestId !== lyricRequestId) return;
      currentLyrics = parseLrc(text);
      syncLyrics();
    } catch {
      if (requestId !== lyricRequestId) return;
      currentLyrics = [];
      setLyricText(lyricCurrent, 'LYRICS UNAVAILABLE');
      lyricStatus.textContent = 'CHECK THAT THE LRC FILE IS DEPLOYED';
    }
  }
  function startPlayback() {
    const attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => setStatus(`PLAYING · ${tracks[currentIndex].title}`))
        .catch(() => setStatus('PLAYBACK FAILED · CHECK THE AUDIO FILE URL OR FORMAT'));
    }
  }
  function selectTrack(index, autoPlay) {
    currentIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentIndex];
    audio.pause();
    currentLyrics = [];
    currentLyricIndex = -1;
    audio.src = track.src;
    audio.load();
    updateTrackDisplay();
    loadTrackLyrics(track);
    setStatus(`READY · ${track.title}`);
    if (autoPlay) startPlayback();
  }
  function updatePlayButton() {
    const playing = !audio.paused;
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playButton.title = playing ? 'Pause' : 'Play';
  }

  playButton.addEventListener('click', () => { if (audio.paused) startPlayback(); else audio.pause(); });
  previousButton.addEventListener('click', () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    selectTrack(currentIndex - 1, !audio.paused);
  });
  nextButton.addEventListener('click', () => selectTrack(currentIndex + 1, !audio.paused));
  audio.addEventListener('play', () => { updatePlayButton(); startKaraokeAnimation(); });
  audio.addEventListener('pause', () => { updatePlayButton(); stopKaraokeAnimation(); });
  audio.addEventListener('ended', () => {
    if (config.autoAdvance !== false && currentIndex < tracks.length - 1) selectTrack(currentIndex + 1, true);
    else { updatePlayButton(); setStatus('ALBUM PLAYBACK COMPLETE'); }
  });
  audio.addEventListener('loadedmetadata', () => { durationLabel.textContent = formatTime(audio.duration); syncLyrics(); });
  audio.addEventListener('timeupdate', () => {
    currentTimeLabel.textContent = formatTime(audio.currentTime);
    if (!isSeeking && Number.isFinite(audio.duration) && audio.duration > 0) seekBar.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    syncLyrics();
  });
  audio.addEventListener('error', () => setStatus('AUDIO COULD NOT LOAD · CHECK THE REPOSITORY URL'));
  seekBar.addEventListener('input', () => {
    isSeeking = true;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const seconds = (Number(seekBar.value) / 1000) * audio.duration;
      currentTimeLabel.textContent = formatTime(seconds);
      syncLyrics(seconds);
    }
  });
  seekBar.addEventListener('change', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (Number(seekBar.value) / 1000) * audio.duration;
    isSeeking = false;
  });

  selectTrack(0, false);
})();
