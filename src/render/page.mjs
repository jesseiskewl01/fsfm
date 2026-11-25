import { escapeHtml, safeCanonical, safeImageUrl, safeJsonForHtml, safeRoute, safeUrl } from './html.mjs';
import { renderComponentList } from './components.mjs';
import { renderAtmosphere } from './effects.mjs';
import { renderInnerPageChrome } from './shell.mjs';

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

export function renderSiteShell({ page, site, pages = [], wallpapers, bodyHtml, scripts = [], assets = '/assets', pageTitle, description, preview = false, homepageMode = false, homepageHead = '' }) {
  const title = pageTitle || page.seo?.title || site.seoDefaults?.title || site.siteName;
  const desc = description || page.seo?.description || site.seoDefaults?.description || site.description || '';
  const fallbackRoute = safeRoute(page.identity?.route, '/');
  const baseUrl = safeCanonical(site.baseUrl, 'https://fsfm.port82.net/');
  const canonical = safeCanonical(page.seo?.canonical, new URL(fallbackRoute, baseUrl).href);
  const socialImage = safeImageUrl(page.seo?.socialImage || site.seoDefaults?.socialImage || site.favicon);
  const robots = preview || page.seo?.allowIndexing === false ? 'noindex, nofollow' : 'index, follow';
  const shell = homepageMode ? null : renderInnerPageChrome(page, { site, pages, wallpapers });
  const scriptsToLoad = homepageMode ? new Set() : new Set(['wallpaper-engine.js', 'runtime.js']);
  if (scripts.includes('bandsintown')) scriptsToLoad.add('bandsintown.js');
  if (scripts.includes('album-player')) scriptsToLoad.add('album-player.js');
  const atmosphere = renderAtmosphere(page);
  if (atmosphere.scripts.includes('album-atmosphere.js')) scriptsToLoad.add('album-atmosphere.js');
  if (page.template === 'vista-window') scriptsToLoad.add('vista-windows.js');
  if (homepageMode) {
    for (const name of scripts) scriptsToLoad.add(name.endsWith('.js') ? name : `${name}.js`);
  }
  const wallpaper = shell?.wallpaper || '';
  const ld = structuredData(page, site, canonical, desc);
  const template = page.template || 'editorial';
  const effects = page.appearance?.effects || {};
  const backgroundEffects = effects.backgroundEffects === false ? 'false' : 'true';
  const pageTransition = effects.pageTransition === false ? 'false' : 'true';
  const respectReducedMotion = effects.respectReducedMotion === false ? 'false' : 'true';
  const albumAtmosphere = atmosphere.html;
  // The mode is content-driven, but the homepage body stays byte-for-byte unchanged.
  const atmosphereModeAttr = homepageMode ? '' : ` data-atmosphere-mode="${escapeHtml(atmosphere.mode)}"`;
  const siteChrome = homepageMode ? bodyHtml : `<div class="site-shell">${shell.header}<main id="main-content" class="page-main template-main-${escapeHtml(template)}">${shell.intro}${bodyHtml}</main>${shell.footer}</div>`;
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
<body class="template-${escapeHtml(template)}" data-template="${escapeHtml(template)}" data-background-effects="${backgroundEffects}" data-page-transition="${pageTransition}" data-respect-reduced-motion="${respectReducedMotion}"${atmosphereModeAttr}>
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
  const bodyHtml = `<div class="page-content">${rendered.html}</div>`;
  return renderSiteShell({ page, site, pages, wallpapers, bodyHtml, scripts: rendered.scripts, assets, preview });
}
