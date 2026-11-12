import { escapeHtml, safeCanonical, safeImageUrl, safeJsonForHtml, safeRoute, safeUrl } from './html.mjs';
import { renderComponentList } from './components.mjs';
import { renderWallpaperLayer } from './wallpaper.mjs';

function siteNavigation(site, pages, currentPage) {
  const items = (pages || [])
    .filter((page) => page?.publishing?.published !== false && (page?.template === 'homepage' || page?.publishing?.showInNavigation === true))
    .sort((a, b) => (Number(a.identity?.order) || 0) - (Number(b.identity?.order) || 0));
  const links = items.map((page) => {
    const current = page.identity?.route === currentPage.identity?.route;
    const href = safeRoute(page.identity?.route, '/');
    const label = page.publishing?.navigationLabel || (page.template === 'homepage' ? 'Home' : page.identity?.name) || 'Page';
    const type = page.template === 'homepage' ? 'HOME' : page.template === 'album' ? 'ALBUM' : 'PAGE';
    return `<a href="${escapeHtml(href)}"${current ? ' aria-current="page"' : ''}><span>${escapeHtml(label)}</span><small>${type}</small></a>`;
  }).join('');
  return `<details class="site-menu"><summary aria-label="Open page menu"><span class="menu-glyph" aria-hidden="true">☰</span><span>Pages</span></summary><nav class="site-menu-panel" aria-label="Site pages">${links || '<span class="site-menu-empty">No published pages yet.</span>'}</nav></details>`;
}

function structuredData(page, site, canonical, description) {
  const siteUrl = safeCanonical(site.baseUrl, 'https://fsfm.port82.net/');
  const siteId = new URL('#website', siteUrl).href;
  const artistId = new URL('#artist', siteUrl).href;
  const pageId = `${canonical.replace(/#.*$/, '')}#webpage`;
  const pageName = page.template === 'album'
    ? (page.templateData?.album?.title || page.identity.name)
    : (page.identity?.name || site.siteName);
  const isHome = page.template === 'homepage';
  const isAlbum = page.template === 'album';
  const breadcrumbs = [{
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: siteUrl
  }];
  if (!isHome) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: pageName,
      item: canonical
    });
  }

  const graph = [
    {
      '@type': 'WebSite',
      '@id': siteId,
      url: siteUrl,
      name: site.siteName,
      description: site.description || '',
      publisher: { '@id': artistId },
      inLanguage: 'en'
    },
    {
      '@type': 'MusicGroup',
      '@id': artistId,
      name: site.siteName,
      url: siteUrl,
      description: site.description || description || '',
      sameAs: (site.socialProfiles || [])
        .map((item) => safeUrl(item.url, { allowRelative: false, requireHttps: true }))
        .filter(Boolean)
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical.replace(/#.*$/, '')}#breadcrumb`,
      itemListElement: breadcrumbs
    },
    {
      '@type': 'WebPage',
      '@id': pageId,
      url: canonical,
      name: pageName,
      description,
      isPartOf: { '@id': siteId },
      breadcrumb: { '@id': `${canonical.replace(/#.*$/, '')}#breadcrumb` },
      inLanguage: 'en',
      ...(isHome ? { mainEntity: { '@id': artistId } } : {})
    }
  ];

  if (isAlbum) {
    const album = page.templateData?.album || {};
    const player = page.templateData?.player || {};
    const albumNode = {
      '@type': 'MusicAlbum',
      '@id': `${canonical.replace(/#.*$/, '')}#album`,
      name: pageName,
      url: canonical,
      description,
      byArtist: { '@id': artistId },
      mainEntityOfPage: { '@id': pageId },
      isPartOf: { '@id': siteId },
      track: (player.tracks || []).map((track) => ({
        '@type': 'MusicRecording',
        name: track.title
      }))
    };
    const albumImage = safeImageUrl(album.artwork);
    if (albumImage) {
      try { albumNode.image = new URL(albumImage, siteUrl).href; } catch { /* omit malformed structured-data image */ }
    }
    graph[3].mainEntity = { '@id': albumNode['@id'] };
    graph.push(albumNode);
  }

  return { '@context': 'https://schema.org', '@graph': graph };
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
