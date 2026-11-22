/** The homepage is now an assembly of parts, not a self-contained renderer.
 *  Its sections come from the shared component list; its desktop chrome comes
 *  from named, configurable chrome parts. Markup is unchanged unless a part
 *  is explicitly disabled in content. [OpenCode, 2026-11-22]
 */
import { escapeHtml } from './html.mjs';
import { renderComponentList } from './components.mjs';
import { renderSiteShell } from './page.mjs';
import { renderDesktopChrome } from './chrome.mjs';

function text(value, fallback = '') { return typeof value === 'string' ? value : fallback; }

export function renderHomepage(page, { site, pages = [], wallpapers, assets = '/assets', preview = false } = {}) {
  if (!page || page.template !== 'homepage' || !site) throw new Error('renderHomepage requires a homepage record and site settings.');

  const rendered = renderComponentList(page.sections || [], { page, site, wallpapers, preview });
  const chrome = renderDesktopChrome(page, { site, pages, wallpapers });

  const bodyHtml = `${chrome.beforeMain}
  <main class="wrap" id="main-content">${chrome.hero}${rendered.html}<footer class="site-footer" id="siteFooter">${escapeHtml(text(page.templateData?.footerText, site.footerText || ''))}</footer>${chrome.belowFooter || ''}</main>
  ${chrome.afterMain}`;

  const pageWithData = {
    ...page,
    seo: {
      ...page.seo,
      title: page.seo?.title || site.siteName,
      description: page.seo?.description || site.description,
      canonical: page.seo?.canonical || 'https://fsfm.port82.net/',
      allowIndexing: page.seo?.allowIndexing !== false
    }
  };

  return renderSiteShell({
    page: pageWithData,
    site,
    pages,
    wallpapers,
    bodyHtml,
    scripts: [...rendered.scripts, ...chrome.scripts],
    assets,
    preview,
    homepageMode: true,
    homepageHead: chrome.head
  });
}
