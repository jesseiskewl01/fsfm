import { escapeHtml, safeJsonForHtml, safeUrl } from './html.mjs';
import path from 'node:path';

function publicLyricsPath(value, route = '/') {
  const raw = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!raw || raw.split('/').includes('..')) return '';
  const encoded = raw.split('/').map((part) => encodeURIComponent(part)).join('/');
  const routeValue = route || '/';
  const routeDir = routeValue.endsWith('/') ? routeValue : path.posix.dirname(routeValue);
  return path.posix.relative(routeDir, `/${encoded}`) || encoded;
}

export function renderAlbumPlayer(page) {
  const player = page?.templateData?.player || {};
  const album = page?.templateData?.album || {};
  const tracks = Array.isArray(player.tracks) ? player.tracks : [];
  const safeTracks = tracks.map((track) => {
    const audio = track.audioUrl || track.audioFile || '';
    const audioUrl = safeUrl(audio, { allowRelative: true, requireHttps: /^https:/i.test(audio) });
    return {
      id: String(track.id || ''),
      title: String(track.title || 'Untitled track'),
      src: audioUrl || '',
      lyrics: track.instrumental ? '' : publicLyricsPath(track.lyricsFile, page.identity?.route),
      instrumental: Boolean(track.instrumental)
    };
  });
  const firstTrack = safeTracks[0];
  const art = safeUrl(album.artwork || '', { allowRelative: true, requireHttps: /^https:/i.test(album.artwork || '') });
  const config = {
    tracks: safeTracks,
    autoAdvance: player.behaviour?.autoAdvance !== false,
    lineWideLyricHighlight: player.behaviour?.lineWideLyricHighlight !== false
  };
  const preload = ['none', 'metadata', 'auto'].includes(player.behaviour?.preload) ? player.behaviour.preload : 'metadata';
  const artLayer = art
    ? `<img class="player-artwork" src="${escapeHtml(art)}" alt="" aria-hidden="true" loading="lazy" decoding="async">`
    : '';

  return `<div class="player-window" data-album-player>
    <div class="player-titlebar"><span>${escapeHtml(player.windowTitle || 'FSFM Media Player')}</span><small>FAKE SPACE FOG MACHINE</small></div>
    <div class="player-inner">
      <div class="player-main-grid">
        <div class="player-visual">
          ${artLayer}<div class="player-visual-shade" aria-hidden="true"></div>
          <div class="player-visual-top"><div class="player-screen-label">NOW PLAYING</div><div class="player-track-count" id="playerTrackCount">TRACK 01 / ${String(safeTracks.length).padStart(2, '0')}</div></div>
          <div class="player-visual-bottom"><h2 id="currentTrackTitle">${escapeHtml(firstTrack?.title || 'SELECT A TRACK')}</h2><p>${escapeHtml(player.artistName || album.artistLine || 'Fake Space Fog Machine')}</p></div>
        </div>
        <div class="lyrics-screen" aria-live="polite" aria-atomic="true">
          <p class="lyrics-screen-heading">SYNCHRONISED LYRICS</p>
          <p class="lyrics-line previous" id="lyricPrevious"></p>
          <p class="lyrics-line current" id="lyricCurrent">${firstTrack?.instrumental ? '♪' : 'SELECT A TRACK'}</p>
          <p class="lyrics-line next" id="lyricNext"></p>
          <p class="lyrics-note" id="lyricStatus">${firstTrack?.instrumental ? 'INSTRUMENTAL TRACK' : ' '}</p>
        </div>
      </div>
      <div class="player-transport">
        <div class="transport-row">
          <div class="transport-buttons">
            <button class="transport-button" id="previousTrack" type="button" aria-label="Previous track" title="Previous track">|◀</button>
            <button class="transport-button primary" id="playPause" type="button" aria-label="Play" title="Play">▶</button>
            <button class="transport-button" id="nextTrack" type="button" aria-label="Next track" title="Next track">▶|</button>
          </div>
          <div class="timeline"><time id="currentTime">0:00</time><input id="seekBar" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek within track"><time id="trackDuration">--:--</time></div>
        </div>
        <p class="player-status" id="playerStatus" role="status">Select a track to begin playback.</p>
      </div>
      <div class="track-list" id="trackList" aria-label="Choose a track"></div>
      <audio class="player-audio" id="albumAudio" preload="${preload}"></audio>
      <script type="application/json" id="albumPlayerData">${safeJsonForHtml(config)}</script>
    </div>
  </div>`;
}
