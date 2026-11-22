/** The inner-page shell, rendered as named parts.
 *
 *  The markup was moved verbatim out of `page.mjs`. Each piece can be
 *  switched off from `appearance.parts`; missing settings mean "on".
 *
 *  [OpenCode, 2026-11-22]
 */
import { escapeHtml, safeRoute, safeUrl } from './html.mjs';
import { renderWallpaperLayer } from './wallpaper.mjs';
import { isPagePartEnabled } from '../core/parts.mjs';

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

function renderGlobalHeader(site, nav) {
  return `<header class="global-header"><a class="brand-link" href="/" aria-label="${escapeHtml(site.siteName)} home"><span class="brand-mark" aria-hidden="true">✧</span><span>${escapeHtml(site.siteName)}</span></a>${nav}</header>`;
}

function renderFooter(site, page) {
  const socials = (site.socialProfiles || []).filter((item) => item?.label && safeUrl(item.url, { allowRelative: false, requireHttps: true }));
  const footerText = page?.templateData?.footerText || site.footerText || `© ${new Date().getFullYear()} ${site.siteName}`;
  return `<footer class="global-footer"><p>${escapeHtml(footerText)}</p>${socials.length ? `<nav aria-label="Social profiles" class="footer-socials">${socials.map((item) => `<a href="${escapeHtml(safeUrl(item.url, { allowRelative: false, requireHttps: true }))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a>`).join('')}</nav>` : ''}</footer>`;
}

function renderPageIntro(site, page) {
  const hasHeading = (page.sections || []).some((section) => section.enabled !== false && ['hero', 'album-header'].includes(section.type));
  if (hasHeading) return '';
  const label = page.template === 'album' ? 'Release' : page.template === 'vista-window' ? 'FSFM' : 'Fake Space Fog Machine';
  const name = page.identity?.name || site.siteName;
  return `<header class="page-intro"><p class="eyebrow">${escapeHtml(label)}</p><h1>${escapeHtml(name)}</h1></header>`;
}

/** All inner-page chrome parts in their historical document order. */
export function renderInnerPageChrome(page, { site, pages = [], wallpapers } = {}) {
  const enabled = (name) => isPagePartEnabled(page, name);
  const menu = enabled('siteMenu') ? siteNavigation(site, pages, page) : '';
  return {
    header: enabled('siteHeader') ? renderGlobalHeader(site, menu) : menu,
    footer: enabled('pageFooter') ? renderFooter(site, page) : '',
    intro: enabled('pageIntro') ? renderPageIntro(site, page) : '',
    wallpaper: enabled('wallpaperLayer') ? renderWallpaperLayer(page, wallpapers) : ''
  };
}
