const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_SITE_URL = 'https://fsfm.port82.net/';
const DEFAULT_WALLPAPERS = Object.freeze({ homepage: 'vista-violet-haze', 'vista-window': 'vista-violet-haze', editorial: 'aurora', album: 'album-amber' });
const DEFAULT_CYCLE_PRESETS = ['vista-violet-haze', 'vista-aqua-glass', 'vista-solar-flare', 'vista-rose-bloom'];

/**
 * Public routes are derived from page type and slug.
 * Editors never need to type or maintain routes by hand.
 */
export function routeForPage(page) {
  if (page?.template === 'homepage') return '/';

  const slug = String(page?.identity?.slug || '').trim().toLowerCase();
  if (!SLUG.test(slug)) {
    throw new Error(`Page "${page?.identity?.name || 'Unnamed page'}" needs a URL slug using lowercase letters, numbers and hyphens.`);
  }

  if (page.template === 'album') return `/albums/${slug}/`;
  if (page.template === 'vista-window' || page.template === 'editorial') return `/pages/${slug}/`;

  throw new Error(`No public route rule exists for template "${page?.template || 'unknown'}".`);
}


function normalizeWallpaper(page) {
  const current = page?.appearance?.wallpaper;
  if (!current || typeof current !== 'object' || Array.isArray(current)) return current;
  const legacyMode = current.mode || 'template-default';
  const choice = current.choice || (legacyMode === 'custom' ? 'custom' : legacyMode === 'cycle' ? 'cycle' : (current.preset || 'template-default'));
  if (choice === 'custom') return { ...current, choice, mode: 'custom' };
  if (choice === 'cycle') {
    return {
      ...current,
      choice,
      mode: 'cycle',
      presets: DEFAULT_CYCLE_PRESETS,
      initialSelection: current.initialSelection || 'random',
      cycle: { ...current.cycle, enabled: true, mode: current.cycle?.mode === 'random' ? 'random' : 'sequential', intervalSeconds: Math.max(5, Math.min(3600, Number(current.cycle?.intervalSeconds) || 30)), manualControl: current.cycle?.manualControl !== false }
    };
  }
  const preset = choice === 'template-default' ? (DEFAULT_WALLPAPERS[page.template] || 'vista-violet-haze') : choice;
  return { ...current, choice, mode: 'preset', preset };
}

/**
 * Add computed values that are deliberately hidden from the CMS editor.
 * A legacy or manually-entered identity.route is overwritten by the canonical
 * route for its template. Missing block IDs are deterministic and stable.
 */
export function normalizePageRecord(page, site = {}) {
  const route = routeForPage(page);
  const baseUrl = site.baseUrl || DEFAULT_SITE_URL;
  const canonical = new URL(route, baseUrl).href;
  const slug = page.template === 'homepage' ? 'home' : page.identity.slug;
  const seen = new Set();

  const sections = Array.isArray(page.sections)
    ? page.sections.map((section, index) => {
        if (!section || typeof section !== 'object' || Array.isArray(section)) return section;
        let id = typeof section.id === 'string' ? section.id.trim() : '';
        if (!id) {
          const type = String(section.type || 'section').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
          id = `${slug}-${type}-${index + 1}`;
          let suffix = 2;
          while (seen.has(id)) id = `${slug}-${type}-${index + 1}-${suffix++}`;
        }
        seen.add(id);
        const group = section.group && typeof section.group === 'object' ? { ...section.group } : section.group;
        if (group && typeof group === 'object') {
          if (typeof group.name === 'string' && group.name.trim()) {
            group.id = group.name.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          }
        }
        const content = section.type === 'marquee'
          ? { ...(section.content && typeof section.content === 'object' ? section.content : {}), messages: Array.isArray(section.content?.messages) ? section.content.messages : [] }
          : section.content;
        return { ...section, id, ...(group ? { group } : {}), ...(content !== undefined ? { content } : {}) };
      })
    : page.sections;

  return {
    ...page,
    identity: { ...page.identity, route },
    sections,
    ...(page.appearance && typeof page.appearance === 'object' ? { appearance: { ...page.appearance, wallpaper: normalizeWallpaper(page) } } : {}),
    ...(page.template === 'homepage' || page.template === 'album' ? {} : { templateData: page.templateData && typeof page.templateData === 'object' ? page.templateData : {} }),
    seo: {
      ...page.seo,
      title: page.seo?.title || page.identity?.name || site.siteName || '',
      description: page.seo?.description || '',
      canonical,
      socialImage: page.seo?.socialImage || site.seoDefaults?.socialImage || site.favicon || '',
      allowIndexing: typeof page.seo?.allowIndexing === 'boolean' ? page.seo.allowIndexing : true
    }
  };
}

export function normalizePages(pages, site = {}) {
  return pages.map((page) => normalizePageRecord(page, site));
}
