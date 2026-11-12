import { escapeHtml, safeCanonical, safeImageUrl, safeJsonForHtml, safeRoute, safeUrl } from './html.mjs';
import { renderComponentList } from './components.mjs';
import { renderWallpaperLayer } from './wallpaper.mjs';

function siteNavigation(site, pages, currentPage) {
  const items = (pages || [])
    .filter((page) => page?.publishing?.published !== false && (page?.template === 'homepage' || page?.publishing?.showInNavigation === true))
    .sort((a, b) => (Number(a.identity?.order) || 0) - (Number(b.identity?.order) || 0));
  return `<nav class="site-navigation" aria-label="Main navigation">${items.map((page) => {
    const current = page.identity?.route === currentPage.identity?.route;
    const href = safeRoute(page.identity?.route, '/');
    const label = page.publishing?.navigationLabel || (page.template === 'homepage' ? 'Home' : page.identity?.name) || 'Page';
    return `<a href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  }).join('')}</nav>`;
}

function structuredData(page, site, canonical, description) {
  const common = {
    '@context': 'https://schema.org',
    '@type': page.template === 'homepage' ? 'MusicGroup' : page.template === 'album' ? 'MusicAlbum' : 'WebPage',
    name: page.template === 'album' ? (page.templateData?.album?.title || page.identity.name) : page.identity.name,
    url: canonical,
    description
  };
  if (page.template === 'homepage') {
    common.sameAs = (site.socialProfiles || []).map((item) => safeUrl(item.url, { allowRelative: false, requireHttps: true })).filter(Boolean);
  }
  if (page.template === 'album') {
    common.byArtist = { '@type': 'MusicGroup', name: page.templateData?.player?.artistName || site.siteName };
    const albumImage = safeImageUrl(page.templateData?.album?.artwork);
    if (albumImage) {
      try { common.image = new URL(albumImage, canonical).href; } catch { /* omit malformed structured-data image */ }
    }
    common.track = (page.templateData?.player?.tracks || []).map((track) => ({
      '@type': 'MusicRecording', name: track.title
    }));
  }
  return common;
}

function renderGlobalHeader(site, nav) {
  return `<header class="global-header"><a class="brand-link" href="/" aria-label="${escapeHtml(site.siteName)} home"><span class="brand-mark" aria-hidden="true">✧</span><span>${escapeHtml(site.siteName)}</span></a>${nav}</header>`;
}

function renderFooter(site, page) {
  const socials = (site.socialProfiles || []).filter((item) => item?.label && safeUrl(item.url, { allowRelative: false, requireHttps: true }));
  const footerText = page?.templateData?.footerText || site.footerText || `© ${new Date().getFullYear()} ${site.siteName}`;
  return `<footer class="global-footer"><p>${escapeHtml(footerText)}</p>${socials.length ? `<nav aria-label="Social profiles" class="footer-socials">${socials.map((item) => `<a href="${escapeHtml(safeUrl(item.url, { allowRelative: false, requireHttps: true }))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a>`).join('')}</nav>` : ''}</footer>`;
}

export function renderSiteShell({ page, site, pages = [], wallpapers, bodyHtml, scripts = [], assets = '/assets', pageTitle, description, preview = false, homepageMode = false, homepageHead = '' }) {
  const title = pageTitle || page.seo?.title || site.seoDefaults?.title || site.siteName;
  const desc = description || page.seo?.description || site.seoDefaults?.description || site.description || '';
  const fallbackRoute = safeRoute(page.identity?.route, '/');
  const baseUrl = safeCanonical(site.baseUrl, 'https://fsfm.port82.net/');
  const canonical = safeCanonical(page.seo?.canonical, new URL(fallbackRoute, baseUrl).href);
  const socialImage = safeImageUrl(page.seo?.socialImage || site.seoDefaults?.socialImage || site.favicon);
  const robots = preview || page.seo?.allowIndexing === false ? 'noindex, nofollow' : 'index, follow';
  const nav = siteNavigation(site, pages, page);
  const scriptsToLoad = homepageMode ? new Set() : new Set(['wallpaper-engine.js', 'runtime.js']);
  if (scripts.includes('bandsintown')) scriptsToLoad.add('bandsintown.js');
  if (scripts.includes('album-player')) scriptsToLoad.add('album-player.js');
  if (page.template === 'album') scriptsToLoad.add('album-atmosphere.js');
  if (homepageMode) {
    for (const name of ['homepage-desktop.js','homepage-interactions.js','homepage-gadgets.js']) scriptsToLoad.add(name);
  }
  const wallpaper = homepageMode ? '' : renderWallpaperLayer(page, wallpapers);
  const ld = structuredData(page, site, canonical, desc);
  const template = page.template || 'editorial';
  const effects = page.appearance?.effects || {};
  const backgroundEffects = effects.backgroundEffects === false ? 'false' : 'true';
  const pageTransition = effects.pageTransition === false ? 'false' : 'true';
  const albumAtmosphere = page.template === 'album' ? '<canvas id="nebulaCanvas" class="album-atmosphere" aria-hidden="true"></canvas><div class="bloom-vignette" aria-hidden="true"></div><div class="album-grain" aria-hidden="true"></div>' : '';
  const siteChrome = homepageMode ? bodyHtml : `<div class="site-shell">${renderGlobalHeader(site, nav)}<main id="main-content" class="page-main template-main-${escapeHtml(template)}">${bodyHtml}</main>${renderFooter(site, page)}</div>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  ${site.favicon ? `<link rel="icon" href="${escapeHtml(safeImageUrl(site.favicon) || '/favicon.ico')}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  ${socialImage ? `<meta property="og:image" content="${escapeHtml(new URL(socialImage, baseUrl).href)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  ${socialImage ? `<meta name="twitter:image" content="${escapeHtml(new URL(socialImage, baseUrl).href)}">` : ''}
  <link rel="stylesheet" href="${escapeHtml(assets)}/v13.css">
  ${homepageMode ? `<link rel="stylesheet" href="${escapeHtml(assets)}/homepage-vista.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">` : ''}
  ${homepageHead}
  <script type="application/ld+json">${safeJsonForHtml(ld)}</script>
</head>
<body class="template-${escapeHtml(template)}" data-template="${escapeHtml(template)}" data-background-effects="${backgroundEffects}" data-page-transition="${pageTransition}">
  ${wallpaper}
  ${albumAtmosphere}
  ${siteChrome}
  ${[...scriptsToLoad].map((name) => `<script src="${escapeHtml(assets)}/${escapeHtml(name)}" defer></script>`).join('\n  ')}
</body>
</html>`;
}

export function renderPage(page, { site, pages = [], wallpapers, assets = '/assets', preview = false, previewEmbeds = preview } = {}) {
  if (!page || !site) throw new Error('renderPage requires a page record and site settings.');
  const rendered = renderComponentList(page.sections || [], { page, site, wallpapers, preview: previewEmbeds });
  const hasHeading = (page.sections || []).some((section) => section.enabled !== false && ['hero', 'album-header'].includes(section.type));
  const heading = hasHeading ? '' : `<header class="page-intro"><p class="eyebrow">${escapeHtml(page.template === 'album' ? 'Release' : page.template === 'vista-window' ? 'FSFM' : 'Fake Space Fog Machine')}</p><h1>${escapeHtml(page.identity?.name || site.siteName)}</h1></header>`;
  const bodyHtml = `${heading}<div class="page-content">${rendered.html}</div>`;
  return renderSiteShell({ page, site, pages, wallpapers, bodyHtml, scripts: rendered.scripts, assets, preview });
}
