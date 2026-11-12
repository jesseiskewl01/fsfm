import { escapeHtml, safeImageUrl, safeJsonForHtml, safeRoute, safeUrl } from './html.mjs';
import { renderComponentList } from './components.mjs';
import { renderSiteShell } from './page.mjs';
import { wallpaperBackground } from './wallpaper.mjs';

function safeImage(value) { return safeImageUrl(value) || ''; }
function text(value, fallback = '') { return typeof value === 'string' ? value : fallback; }

function renderClockGadget(title = 'Clock') {
  return `<section class="fsfm-gadget" id="gadget-clock" data-gadget="clock" aria-label="${escapeHtml(title)} gadget">
    <header class="gadget-titlebar" data-drag-handle tabindex="0" aria-label="Drag ${escapeHtml(title)} gadget. Use arrow keys to move it."><span class="gadget-grip" aria-hidden="true">⠿</span><span class="gadget-title">${escapeHtml(title)}</span><span class="gadget-mark">FSFM</span></header>
    <div class="gadget-body clock-body"><svg class="analog-clock" viewBox="0 0 160 160" role="img" aria-label="Current local time">
      <defs><radialGradient id="clockGlass" cx="34%" cy="25%"><stop offset="0" stop-color="#fff" stop-opacity=".98"/><stop offset=".58" stop-color="#e8f7ff" stop-opacity=".82"/><stop offset="1" stop-color="#9fc9df" stop-opacity=".68"/></radialGradient></defs>
      <circle cx="80" cy="80" r="73" fill="url(#clockGlass)" stroke="#fff" stroke-width="2.5"/><circle cx="80" cy="80" r="66" fill="none" stroke="#5c7891" stroke-opacity=".45" stroke-width="1"/>
      <g class="clock-ticks" stroke="#314b64" stroke-linecap="round"><path d="M80 14v8 M80 138v8 M14 80h8 M138 80h8" stroke-width="2.5"/><path d="M80 19v4 M80 137v4 M19 80h4 M137 80h4 M49 26l2 4 M109 130l2 4 M26 49l4 2 M130 109l4 2 M111 26l-2 4 M51 130l-2 4 M134 49l-4 2 M30 109l-4 2" stroke-width="1.5"/></g>
      <g fill="#183149" font-family="Segoe UI,Arial" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle"><text x="80" y="35">12</text><text x="125" y="82">3</text><text x="80" y="128">6</text><text x="35" y="82">9</text></g>
      <g id="clockHands" transform="translate(80 80)"><path id="clockHour" d="M0 5 L0 -31" stroke="#1c354b" stroke-width="5" stroke-linecap="round"/><path id="clockMinute" d="M0 7 L0 -48" stroke="#24465f" stroke-width="3.5" stroke-linecap="round"/><path id="clockSecond" d="M0 12 L0 -55" stroke="#a64f32" stroke-width="1.5" stroke-linecap="round"/><circle r="4.3" fill="#24465f" stroke="#fff" stroke-width="1.2"/></g>
      <path d="M28 38 Q56 7 103 17" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/></svg><div class="clock-digital" id="clockDigital">--:--:--</div></div>
  </section>`;
}

function renderCalendarGadget(title = 'Calendar') {
  return `<section class="fsfm-gadget" id="gadget-calendar" data-gadget="calendar" aria-label="${escapeHtml(title)} gadget"><header class="gadget-titlebar" data-drag-handle tabindex="0" aria-label="Drag ${escapeHtml(title)} gadget. Use arrow keys to move it."><span class="gadget-grip" aria-hidden="true">⠿</span><span class="gadget-title">${escapeHtml(title)}</span><span class="gadget-mark">FSFM</span></header><div class="gadget-body calendar-body"><div class="calendar-heading"><button type="button" class="calendar-nav" data-calendar-step="-1" aria-label="Previous month">‹</button><strong id="calendarMonth">MONTH YEAR</strong><button type="button" class="calendar-nav" data-calendar-step="1" aria-label="Next month">›</button></div><div class="calendar-grid calendar-weekdays" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="calendar-grid" id="calendarDays" aria-label="Calendar dates"></div><div class="calendar-legend"><i></i> FSFM dates</div></div></section>`;
}

function gadgetShell(id, title, body, compact = false, label = title) {
  return `<section class="fsfm-gadget${compact ? ' gadget-compact' : ''}" id="${id}" data-gadget="${id.replace(/^gadget-/, '')}" aria-label="${escapeHtml(label)} gadget"><header class="gadget-titlebar" data-drag-handle tabindex="0" aria-label="Drag ${escapeHtml(title)} gadget. Use arrow keys to move it."><span class="gadget-grip" aria-hidden="true">⠿</span><span class="gadget-title">${escapeHtml(title)}</span><span class="gadget-mark">FSFM</span></header>${body}</section>`;
}

function renderGadgets(page, site) {
  const g = page.templateData?.gadgets || {};
  const featured = g.featuredRelease || {};
  const labels = g.labels || {};
  const label = (key, fallback) => text(labels[key], fallback);
  const artwork = safeImage(featured.artwork);
  const featuredUrl = safeUrl(featured.url, { allowRelative: false, requireHttps: true }) || '';
  const featuredHref = featuredUrl ? `href="${escapeHtml(featuredUrl)}"${featuredUrl.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}` : 'aria-disabled="true"';
  const featuredRelease = `<section class="fsfm-gadget" id="gadget-now-playing" data-gadget="featured-release" aria-label="Featured release gadget"><header class="gadget-titlebar" data-drag-handle tabindex="0" aria-label="Drag Featured Release gadget. Use arrow keys to move it."><span class="gadget-grip" aria-hidden="true">⠿</span><span class="gadget-title" id="featuredGadgetTitle">${escapeHtml(text(featured.windowTitle, label('featuredRelease', 'FEATURED RELEASE')))}</span><span class="gadget-mark">FSFM</span></header><a class="featured-release-link" id="featuredReleaseLink" ${featuredHref} aria-label="Open featured release"><div class="gadget-body featured-body"><div class="featured-art" id="featuredAlbumArt"${artwork ? '' : ' hidden'}>${artwork ? `<img id="featuredAlbumCover" src="${escapeHtml(artwork)}" alt="${escapeHtml(text(featured.title, 'Featured release'))} artwork" loading="lazy">` : '<img id="featuredAlbumCover" alt="" hidden>'}</div><div class="featured-copy"><strong id="featuredAlbumTitle">${escapeHtml(text(featured.title))}</strong><small id="featuredAlbumMeta">${escapeHtml(text(featured.description))}</small><span id="featuredLinkText">${escapeHtml(text(featured.linkText, 'OUT NOW....'))}</span></div></div></a></section>`;
  const photo = gadgetShell('gadget-photos', label('pictureFrame', 'Picture Frame'), `<div class="gadget-body photo-body"><div class="photo-stage" id="photoStage"><img id="gadgetPhoto" alt="FSFM picture frame photograph" hidden><div class="photo-empty" id="photoEmpty" hidden><span>PICTURE FRAME</span></div></div><div class="photo-controls" hidden><button type="button" id="photoPrevious" aria-label="Previous photo">‹</button><span id="photoCounter" hidden></span><button type="button" id="photoNext" aria-label="Next photo">›</button></div></div>`);
  const date = gadgetShell('gadget-dates', label('importantDates', 'Important Dates'), `<div class="gadget-body dates-body"><div id="gadgetDateList" class="gadget-date-list"><div class="gadget-empty">ADD DATES IN PAGES CMS</div></div></div>`);
  const noteText = text(g.stickyNote?.text, '');
  const note = gadgetShell('gadget-note', label('stickyNote', 'Sticky Note'), `<div class="gadget-body note-body"><p id="gadgetStickyText">${escapeHtml(noteText)}</p><span class="note-pin" aria-hidden="true"></span></div>`);
  const barrel = gadgetShell('gadget-barrel-roll', label('barrelRoll', 'Barrel Roll'), `<div class="gadget-body control-body"><button type="button" id="barrelRollButton" class="gadget-control-button">${escapeHtml(label('barrelRollButton', 'DO A BARREL ROLL'))}</button></div>`, true);
  const bubbles = gadgetShell('gadget-bubbles', label('bubbleFrequency', 'Bubble Frequency'), `<div class="gadget-body gadget-range-body"><label class="gadget-range-label" for="bubbleRateSlider">${escapeHtml(label('bubbleFrequencyLabel', 'AMBIENT BUBBLES'))}</label><input id="bubbleRateSlider" type="range" min="0" max="100" step="1" value="${Math.max(0, Math.min(100, Number.isFinite(Number(g.bubbleDefault)) ? Number(g.bubbleDefault) : 50))}" aria-label="Bubble frequency"><output class="gadget-range-output" id="bubbleRateValue" for="bubbleRateSlider">DEFAULT · 1×</output></div>`, true);
  const radioUrl = safeUrl(g.radioAudioUrl || 'https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/groovy.mp3', { allowRelative: false, requireHttps: true }) || 'https://github.com/jesseiskewl01/fsfm/raw/refs/heads/main/audio/groovy.mp3';
  const radio = gadgetShell('gadget-radio', label('radio', 'FSFM Radio'), `<div class="gadget-body control-body"><button type="button" id="homeMusicToggle" class="gadget-control-button" aria-pressed="false"><span aria-hidden="true">▶</span> <span id="homeMusicLabel">${escapeHtml(label('radioPlay', 'PLAY MUSIC'))}</span></button></div><audio id="homeMusicAudio" preload="none" loop aria-hidden="true" src="${escapeHtml(radioUrl)}"></audio>`, true);
  const gameUrl = safeUrl(g.purblePlaceUrl || 'https://www.play-games.com/iframe/37376.html', { allowRelative: false, requireHttps: true }) || 'https://www.play-games.com/iframe/37376.html';
  const purble = gadgetShell('gadget-purble', label('purblePlace', 'Purble Place'), `<div class="gadget-body control-body"><button type="button" id="purbleOpenButton" class="gadget-control-button">${escapeHtml(label('purblePlaceButton', 'OPEN PURBLE PLACE'))}</button></div>`, true);
  return `<div class="fsfm-gadgets-desktop" id="fsfmGadgets" aria-label="FSFM desktop gadgets">${renderClockGadget(label('clock', 'Clock'))}${renderCalendarGadget(label('calendar', 'Calendar'))}${featuredRelease}${photo}${date}${note}${barrel}${bubbles}${radio}${purble}</div><script type="application/json" id="fsfmGadgetConfig">${safeJsonForHtml({ photos: g.photos || [], dates: g.dates || [], stickyNote: g.stickyNote || { text: '' }, funWidgets: g.funWidgets || {}, visibility: g.visibility || {}, positions: g.positions || {}, gameUrl })}</script>`;
}

function renderTaskbar(site, pages, currentPage) {
  const navPages = [currentPage, ...(pages || [])]
    .filter((page, index, arr) => page?.publishing?.published !== false && (index === 0 || page?.publishing?.showInNavigation === true))
    .filter((page, index, arr) => arr.findIndex((candidate) => candidate.identity?.route === page.identity?.route) === index)
    .sort((a, b) => (Number(a.identity?.order) || 0) - (Number(b.identity?.order) || 0));
  const links = navPages.map((page) => {
    const isCurrent = page.identity?.route === currentPage.identity?.route;
    const href = safeRoute(page.identity?.route, '/');
    const label = page.template === 'homepage' ? (page.templateData?.desktopLabels?.homeNavigationLabel || 'Home') : (page.publishing?.navigationLabel || page.identity?.name || 'Page');
    return `<a href="${escapeHtml(href)}" class="task-button${isCurrent ? ' active' : ''}"${isCurrent ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  }).join('');
  return `<nav class="taskbar" aria-label="Desktop navigation"><div class="taskbar-inner"><div class="brand-title"><div class="start-orb" aria-hidden="true"></div><span id="taskbarSiteName">${escapeHtml(site.siteName)}</span></div><div class="task-buttons">${links}</div></div></nav>`;
}

function renderHero(page) {
  const hero = page.templateData?.hero || {};
  return `<div class="aero-window hero-window" aria-label="Homepage hero window"><div class="titlebar"><div class="window-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#081722" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/></svg><span id="heroWindowTitle">${escapeHtml(text(hero.windowTitle, 'Homepage'))}</span></div><div class="caption-buttons"><button type="button" class="caption-button minimize" data-window-action="minimize" aria-label="Minimize homepage hero window" title="Minimize">−</button><button type="button" class="caption-button close" data-window-action="close" aria-label="Close homepage desktop" title="Close">×</button></div></div><div class="window-body"><header class="hero" id="heroSection"><div class="hero-badge" id="heroBadge">${escapeHtml(text(hero.badge, ':]'))}</div><div class="hero-mark" id="heroTitle">${escapeHtml(text(hero.title, page.identity?.name || 'Fake Space Fog Machine'))}</div><div class="hero-sub" id="heroSubtitle">${escapeHtml(text(hero.subtitle))}</div><div class="hero-handle" id="heroHandle">${escapeHtml(text(hero.handle))}</div></header></div></div>`;
}

function renderPurbleOverlay(gadgets = {}) {
  const dialogTitle = text(gadgets.labels?.purblePlace, 'Purble Place').toUpperCase();
  const gameUrl = safeUrl(gadgets.purblePlaceUrl || 'https://www.play-games.com/iframe/37376.html', { allowRelative: false, requireHttps: true }) || 'https://www.play-games.com/iframe/37376.html';
  return `<div class="purble-overlay" id="purbleOverlay" hidden><section class="purble-dialog" role="dialog" aria-modal="true" aria-labelledby="purbleDialogTitle"><header class="purble-titlebar"><span id="purbleDialogTitle">${escapeHtml(dialogTitle)}</span><button type="button" id="purbleCloseButton" aria-label="Close Purble Place">×</button></header><iframe class="purble-frame" id="purbleFrame" title="Purble Place game" src="about:blank" data-src="${escapeHtml(gameUrl)}" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"></iframe><div class="purble-fallback">Game not loading? <a href="${escapeHtml(gameUrl)}" target="_blank" rel="noopener noreferrer">Open Purble Place in a new tab</a>.</div></section></div>`;
}

export function renderHomepage(page, { site, pages = [], wallpapers, assets = '/assets', preview = false } = {}) {
  if (!page || page.template !== 'homepage' || !site) throw new Error('renderHomepage requires a homepage record and site settings.');
  const rendered = renderComponentList(page.sections || [], { page, site, wallpapers, preview });
  const wallpaperSettings = page.appearance?.wallpaper || {};
  const catalogue = wallpapers?.presets || [];
  const presetIds = Array.isArray(wallpaperSettings.presets) ? wallpaperSettings.presets : [];
  const selected = presetIds.length ? catalogue.filter((item) => presetIds.includes(item.id)) : catalogue.filter((item) => item.family === 'vista');
  const aurora = { sky: '#06162d', deep: '6, 22, 45', mid: '11, 48, 70', glass: '44, 155, 160', accent: '#238e9e', bright: '74, 211, 194', hi: '174, 245, 226' };
  const mapTheme = (preset) => ({ id: preset.id, name: preset.name, img: safeImage(preset.imageUrl), background: wallpaperBackground(preset), sky: preset.palette?.sky || aurora.sky, deep: preset.palette?.deep || aurora.deep, mid: preset.palette?.mid || aurora.mid, glass: preset.palette?.glass || aurora.glass, accent: preset.palette?.accent || aurora.accent, bright: preset.palette?.bright || aurora.bright, hi: preset.palette?.highlight || preset.palette?.hi || aurora.hi });
  let themeList = selected.map(mapTheme);
  if (wallpaperSettings.mode === 'preset') { const one = catalogue.find((item) => item.id === wallpaperSettings.preset); themeList = one ? [mapTheme(one)] : themeList.slice(0, 1); }
  if (!themeList.length) themeList = catalogue.filter((item) => item.family === 'vista').slice(0, 4).map(mapTheme);
  if (wallpaperSettings.mode === 'custom' && safeImage(wallpaperSettings.customImage)) { const palette = themeList[0] || mapTheme(catalogue[0] || { id: 'vista-aqua-glass', name: 'Aqua Glass', palette: {} }); themeList = [{ ...palette, id: 'custom', name: 'Custom wallpaper', img: safeImage(wallpaperSettings.customImage) }]; }
  const themeConfig = { themes: themeList, settings: wallpaperSettings };
  const homepageHead = `<script>window.__FSFM_THEME_CONFIG__=${safeJsonForHtml(themeConfig)};window.VISTA_THEMES=window.__FSFM_THEME_CONFIG__.themes;window.paintPalette=function(t){var r=document.documentElement.style;r.setProperty('--sky-bg',t.sky||'#004b4c');r.setProperty('--deep-rgb',t.deep||'0,75,76');r.setProperty('--mid-rgb',t.mid||'0,110,112');r.setProperty('--glass-rgb',t.glass||'30,170,175');r.setProperty('--bright-rgb',t.bright||'38,201,207');r.setProperty('--hi-rgb',t.hi||'129,254,250');r.setProperty('--accent',t.accent||'#007a82');};(function(){var a=window.__FSFM_THEME_CONFIG__.settings||{},list=window.VISTA_THEMES||[],idx=0;if(a.mode==='preset'){idx=0;}else if(a.mode==='custom'){idx=0;}else if(a.initialSelection==='random'){idx=Math.floor(Math.random()*list.length);try{var last=Number(sessionStorage.getItem('fsfm_home_theme'));if(list.length>1&&idx===last)idx=(idx+1+Math.floor(Math.random()*(list.length-1)))%list.length;sessionStorage.setItem('fsfm_home_theme',String(idx));}catch(e){}}else{var found=list.findIndex(function(t){return t.id===a.initialSelection;});idx=found>=0?found:0;}window.__themeIdx=idx; if(list[idx])window.paintPalette(list[idx]);})();</script>`;
  const g = page.templateData?.gadgets || {};
  const runtimeWallpaper = { ...wallpaperSettings, fit: wallpaperSettings.customFit || wallpaperSettings.fit || 'cover', position: String(wallpaperSettings.customPosition || wallpaperSettings.position || 'center').replaceAll('-', ' ') };
  const homeRuntime = { labels: page.templateData?.desktopLabels || {}, gadgetLabels: g.labels || {}, shutdownRedirectUrl: safeUrl(g.shutdownRedirectUrl, { allowRelative: false, requireHttps: true }) || 'https://open.spotify.com/track/2CnrJj6Jz4vSe5E1hsWtpg', marqueeMessages: (page.sections || []).find((s) => s.type === 'marquee' && s.enabled !== false)?.content?.messages || [], bubbleDefault: Math.max(0, Math.min(100, Number.isFinite(Number(g.bubbleDefault)) ? Number(g.bubbleDefault) : 50)), wallpaper: runtimeWallpaper, effects: page.appearance?.effects || {} };
  const bodyHtml = `<div class="fsfm-boot-overlay" id="fsfmBootScreen" role="status" aria-live="polite"><div class="boot-brand" id="bootBrand">${escapeHtml(site.siteName.toUpperCase())}</div><div class="boot-progress-container"><div class="boot-progress-bar" id="bootProgressBar"></div></div><div class="boot-status" id="bootStatus">${escapeHtml(text(page.templateData?.desktopLabels?.bootLoading, 'LOADING YOUR DESKTOP'))}</div><div class="boot-caption">${escapeHtml(text(page.templateData?.desktopLabels?.bootCaption, 'SONIC SPACE-AGE AESTHETICS'))}</div></div>
  <div class="wall" id="wallA" aria-hidden="true"></div><div class="wall" id="wallB" aria-hidden="true"></div><canvas id="bgCanvas" aria-hidden="true"></canvas>
  ${renderGadgets(page, site)}
  ${renderTaskbar(site, pages, page)}
  <main class="wrap" id="main-content">${renderHero(page)}${rendered.html}<footer class="site-footer" id="siteFooter">${escapeHtml(text(page.templateData?.footerText, site.footerText || ''))}</footer></main>
  ${renderPurbleOverlay(g)}<div class="fsfm-shutdown" id="fsfmShutdown" hidden role="status" aria-live="polite"><div class="shutdown-dialog"><strong id="shutdownTitle">${escapeHtml(text(page.templateData?.desktopLabels?.shutdownTitle, 'Goodnight.'))}</strong><p id="shutdownMessage">${escapeHtml(text(page.templateData?.desktopLabels?.shutdownMessage, 'Closing the FSFM desktop...'))}</p></div></div>
  <script type="application/json" id="fsfmHomeRuntimeConfig">${safeJsonForHtml(homeRuntime)}</script>`;
  const pageWithData = { ...page, seo: { ...page.seo, title: page.seo?.title || site.siteName, description: page.seo?.description || site.description, canonical: page.seo?.canonical || 'https://fsfm.port82.net/', allowIndexing: page.seo?.allowIndexing !== false } };
  return renderSiteShell({ page: pageWithData, site, pages, wallpapers, bodyHtml, scripts: [...rendered.scripts, 'homepage-desktop','homepage-interactions','homepage-gadgets'], assets, preview, homepageMode: true, homepageHead });
}
