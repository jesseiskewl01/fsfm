import { routeForPage } from './page-routes.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PAGE_FOLDER_BY_TEMPLATE = Object.freeze({
  album: 'albums',
  'vista-window': 'vista-pages',
  editorial: 'editorial-pages',
});

export function pageFolderForTemplate(template) {
  const folder = PAGE_FOLDER_BY_TEMPLATE[template];
  if (!folder) throw new Error('Only album, Vista and editorial pages can be managed from Studio.');
  return folder;
}

export function pageKeyForRecord(page) {
  if (page?.template === 'homepage') return 'homepage';
  const slug = page?.identity?.slug;
  if (!slug) return '';
  return pageFolderForTemplate(page.template) + '/' + slug;
}

export function cleanPageSlug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function assertValidPageSlug(value) {
  const slug = cleanPageSlug(value);
  if (!SLUG.test(slug)) {
    throw new Error('The URL slug needs lowercase letters, numbers and single hyphens.');
  }
  return slug;
}

/**
 * A retired page stays in its JSON file as a valid, unpublished record.
 * Identity, appearance, SEO, sections and templateData are deliberately kept
 * so the next page of the same type can rename and reuse the file.
 * [Jesse + OpenCode, 2026-11-24]
 */
export function buildRetiredPage(page) {
  if (!page || page.template === 'homepage') throw new Error('This page cannot be retired.');
  return {
    ...page,
    publishing: {
      ...page.publishing,
      retired: true,
      published: false,
      showInNavigation: false,
    },
  };
}

export function buildRenamedPage(page, options = {}, site = {}) {
  const name = String(options.name || '').trim();
  if (!name) throw new Error('A page name is required.');
  const slug = assertValidPageSlug(options.slug);
  const identity = { ...page.identity, name, slug };
  const next = { ...page, identity };
  identity.route = routeForPage(next);
  const seo = { ...page.seo };
  if (site.siteName) seo.title = `${name} | ${site.siteName}`;
  return { ...next, seo };
}

export function buildDuplicatePage(page, options = {}, site = {}) {
  const next = buildRenamedPage(page, options, site);
  const publishing = { ...next.publishing, published: false };
  publishing.showInNavigation = page.publishing?.showInNavigation !== false;
  delete publishing.retired;
  return { ...next, publishing };
}

export function validatePageIdentityChange(next, { pages = [], sourceKey = '' } = {}) {
  const nextKey = pageKeyForRecord(next);
  let nextRoute;
  try {
    nextRoute = routeForPage(next);
  } catch (error) {
    return error.message;
  }
  for (const other of pages) {
    const otherKey = pageKeyForRecord(other);
    if (!otherKey || otherKey === sourceKey || otherKey === nextKey) continue;
    if (other.template !== 'homepage' && other.identity?.slug === next.identity?.slug) {
      return `A page already uses the URL slug "${next.identity.slug}". Choose another.`;
    }
    try {
      if (routeForPage(other) === nextRoute) {
        return `The public route ${nextRoute} is already in use. Choose another URL slug.`;
      }
    } catch {
      // Another malformed page is reported by the full site validation.
    }
  }
  return null;
}

export function findReusableCarcass(pages, template) {
  return pages
    .filter((page) => page.template === template && page.publishing?.retired === true)
    .sort((a, b) => {
      const orderA = Number(a.identity?.order) || 0;
      const orderB = Number(b.identity?.order) || 0;
      return orderA - orderB || pageKeyForRecord(a).localeCompare(pageKeyForRecord(b));
    })[0] || null;
}
