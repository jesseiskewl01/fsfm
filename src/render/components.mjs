import { escapeHtml, safeUrl, safeImageUrl, safeEmbedUrl, renderRichText } from './html.mjs';
import { renderAlbumPlayer } from './album-player.mjs';

const VARIANTS = new Set(['vista-window', 'vista-desktop', 'editorial', 'amber-editorial', 'amber-player', 'plain', '']);
const ICONS = {
  Spotify: '♫', TikTok: '♪', Bandcamp: 'B', Instagram: '◎', Twitter: '𝕏', YouTube: '▶'
};

function imageMarkup(src, alt, className = '') {
  const url = safeImageUrl(src);
  if (!url) return `<div class="media-placeholder ${escapeHtml(className)}" role="img" aria-label="${escapeHtml(alt || 'Image unavailable')}">Image unavailable</div>`;
  return `<span class="media-frame ${escapeHtml(className)}"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt || '')}" loading="lazy" decoding="async"><span class="media-fallback" aria-hidden="true">Image unavailable in this source package</span></span>`;
}

function defaultVariant(section, context = {}) {
  const requested = section?.presentation?.variant;
  if (requested && VARIANTS.has(requested)) return requested;
  const template = context.page?.template;
  if (['divider', 'spacer'].includes(section?.type)) return 'plain';
  if (template === 'vista-window') return 'vista-window';
  if (template === 'editorial') return 'editorial';
  if (template === 'album') return section?.type === 'album-player' ? 'amber-player' : 'amber-editorial';
  return 'plain';
}

function vistaWindowTitle(section) {
  const labels = {
    'site-header': 'SITE IDENTITY', hero: 'FEATURED WINDOW',
    'artist-statement': 'ABOUT', 'embed-window': 'MEDIA PLAYER',
    'bandsintown-events': 'EVENTS', 'social-links': 'SOCIAL LINKS',
    'featured-release': 'FEATURED RELEASE', 'rich-text': 'NOTES',
    image: 'IMAGE VIEWER', gallery: 'IMAGE GALLERY', quote: 'QUOTE', 'link-button': 'LINK'
  };
  return (section.presentation?.windowTitle || labels[section.type] || String(section.type || 'FSFM WINDOW').replace(/[-_]/g, ' ').toUpperCase()).trim();
}

function windowWrap(section, inner, extraClass = '', context = {}) {
  const presentation = section.presentation || {};
  const variant = defaultVariant(section, context);
  const isVistaWindow = context.page?.template === 'vista-window' && ['vista-window', 'vista-desktop'].includes(variant) && !['divider', 'spacer', 'marquee'].includes(section.type);
  const title = ['album-header', 'album-player'].includes(section.type) ? '' : (presentation.windowTitle || '').trim();
  const windowTitle = isVistaWindow ? vistaWindowTitle(section) : title;
  const classes = ['content-section', 'variant-' + variant, isVistaWindow ? 'vista-window-frame' : '', extraClass].filter(Boolean).join(' ');
  const titlebar = isVistaWindow
    ? '<div class="vista-window-titlebar" data-vista-drag-handle tabindex="0" aria-label="Move ' + escapeHtml(windowTitle) + ' window" title="Drag to move · Use arrow keys to nudge"><span class="vista-window-icon" aria-hidden="true">✧</span><span class="vista-window-title">' + escapeHtml(windowTitle) + '</span><span class="vista-window-controls"><button type="button" class="vista-window-button minimize" data-vista-window-action="minimize" aria-label="Minimize ' + escapeHtml(windowTitle) + '" title="Minimize">−</button><button type="button" class="vista-window-button close" data-vista-window-action="close" aria-label="Close ' + escapeHtml(windowTitle) + '" title="Close">×</button></span></div>'
    : title
      ? '<div class="component-titlebar"><span class="component-title">' + escapeHtml(title) + '</span></div>'
      : '';
  const groupId = section.group?.id ? ' data-layout-group="' + escapeHtml(section.group.id) + '"' : '';
  const vistaAttributes = isVistaWindow ? ' data-vista-window data-vista-window-id="' + escapeHtml(section.id || section.type) + '" data-vista-window-title="' + escapeHtml(windowTitle) + '"' : '';
  return '<section class="' + classes + '" id="section-' + escapeHtml(section.id || section.type) + '" data-component="' + escapeHtml(section.type) + '"' + groupId + vistaAttributes + '>' + titlebar + '<div class="component-body">' + inner + '</div></section>';
}

function renderMarquee(content = {}) {
  const messages = (Array.isArray(content.messages) ? content.messages : []).map((x) => String(x).trim()).filter(Boolean);
  if (!messages.length) return '';
  const run = messages.map((message) => `<span class="marquee-item">${escapeHtml(message)}</span>`).join('<span class="marquee-separator" aria-hidden="true">✦</span>');
  return `<div class="marquee-track" role="group" aria-label="${escapeHtml(messages.join(' • '))}"><div class="marquee-run">${run}</div><div class="marquee-run" aria-hidden="true">${run}</div></div>`;
}

function renderEmbed(content = {}, preview = false) {
  const url = safeEmbedUrl(content.url);
  if (preview) return `<div class="embed-preview"><span class="embed-preview-mark" aria-hidden="true">♫</span><strong>${escapeHtml(content.title || 'External media embed')}</strong><span>Live media embed shown on the actual page.</span></div>`;
  if (!url) return `<p class="component-fallback">This embed needs a valid HTTPS URL.</p>`;
  const height = Math.max(180, Math.min(900, Number(content.height) || 352));
  const title = content.title || `${content.provider || 'External'} embed`;
  return `<div class="embed-frame"><iframe src="${escapeHtml(url)}" title="${escapeHtml(title)}" loading="lazy" height="${height}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

function renderSocialLinks(content = {}) {
  const links = (Array.isArray(content.links) ? content.links : []).filter((item) => item?.label && safeUrl(item.url, { allowRelative: false, requireHttps: true }));
  if (!links.length) return '';
  return `<ul class="social-link-list">${links.map((item) => {
    const url = safeUrl(item.url, { allowRelative: false, requireHttps: true });
    return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><span class="social-link-icon" aria-hidden="true">${escapeHtml(ICONS[item.label] || '↗')}</span><span>${escapeHtml(item.label)}</span><span class="external-indicator" aria-hidden="true">↗</span></a></li>`;
  }).join('')}</ul>`;
}

function renderHomeSocialLinks(content = {}) {
  const paths = {
    TikTok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-2-3.16V4h2z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 4c0 2.5 2 4.2 4.3 4.2" stroke="currentColor" stroke-width="2.2"/>',
    Bandcamp: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.6" fill="currentColor"/>',
    Instagram: '<rect x="3" y="5" width="18" height="15" rx="4.5" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12.5" r="4" stroke="currentColor" stroke-width="2.2"/><circle cx="17.2" cy="8.3" r="1.3" fill="currentColor"/>',
    Twitter: '<path d="M3 11.2L21 3l-8 18-2.6-7.6L3 11.2z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    YouTube: '<rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="2.2"/><polygon points="10,9 16,12 10,15" fill="currentColor"/>'
  };
  const links = (Array.isArray(content.links) ? content.links : []).filter((item) => item?.label && safeUrl(item.url, { allowRelative: false, requireHttps: true }));
  if (!links.length) return '';
  return `<div class="icon-row">${links.map((item) => {
    const url = safeUrl(item.url, { allowRelative: false, requireHttps: true });
    const svg = paths[item.label] || '<path d="M7 17 17 7M7 7h10v10" stroke="currentColor" stroke-width="2" fill="none"/>';
    return `<a class="icon-orb" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.label)}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${svg}</svg></a>`;
  }).join('')}</div>`;
}

function homeTitleIcon(type) {
  const icons = {
    'artist-statement': '<span class="window-mini-icon" aria-hidden="true">i</span>',
    'embed-window': '<span class="window-mini-icon music" aria-hidden="true">♫</span>',
    'bandsintown-events': '<span class="window-mini-icon calendar" aria-hidden="true">▦</span>',
    'social-links': '<span class="window-mini-icon social" aria-hidden="true">✧</span>'
  };
  return icons[type] || '<span class="window-mini-icon" aria-hidden="true">✧</span>';
}

function renderHomeWindow(section, inner, preview = false) {
  const type = section.type;
  if (type === 'marquee') {
    const messages = (Array.isArray(section.content?.messages) ? section.content.messages : []).map((message) => String(message).trim()).filter(Boolean);
    const run = (hidden = false) => `<span${hidden ? ' aria-hidden="true"' : ''}>${messages.map((message) => `<span class="marquee-message">${escapeHtml(message)}</span><button type="button" class="star-icon" aria-label="Change wallpaper theme" title="Change wallpaper theme">✦</button>`).join('')}</span>`;
    return `<div class="marquee" id="home-marquee"${messages.length ? '' : ' hidden'}><div class="marquee-track" id="marqueeTrack" role="group" aria-label="${escapeHtml(messages.join(' • '))}">${messages.length ? `${run()}${run(true)}` : ''}</div></div>`;
  }
  const title = section.presentation?.windowTitle || ({'artist-statement':'ABOUT FSFM','embed-window':'FSFM ON SPOTIFY','bandsintown-events':'ON THE HORIZON','social-links':'FIND FSFM'}[type] || 'FSFM');
  const ids = {'artist-statement':'about','embed-window':'spotify','bandsintown-events':'events','social-links':'social'};
  const extras = {'artist-statement':'bio-window','embed-window':'spotify-window','bandsintown-events':'events-window','social-links':'social-window'};
  const id = `home-${ids[type] || (section.id || type)}`;
  const bodyClass = type === 'artist-statement' ? 'bio-window-body' : type === 'embed-window' ? 'spotify-window-body' : type === 'bandsintown-events' ? 'bit-container' : type === 'social-links' ? 'social-window-body' : 'home-component-body';
  const aria = type === 'artist-statement' ? 'About Fake Space Fog Machine' : type === 'embed-window' ? 'Fake Space Fog Machine on Spotify' : type === 'bandsintown-events' ? 'Upcoming events' : type === 'social-links' ? 'Social links' : title;
  const body = type === 'artist-statement'
    ? `<div class="bio-text">${renderRichText(section.content?.body || '')}</div>`
    : type === 'embed-window'
      ? `<iframe data-testid="embed-iframe" title="${escapeHtml(section.content?.title || 'Fake Space Fog Machine on Spotify')}" src="${escapeHtml(safeEmbedUrl(section.content?.url) || '')}" width="100%" height="${Math.max(180, Math.min(900, Number(section.content?.height) || 352))}" frameborder="0" allowfullscreen loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : type === 'social-links' ? renderHomeSocialLinks(section.content || {})
      : type === 'bandsintown-events' ? renderBandsintown(section.content || {}, preview)
      : inner;
  return `<section class="reveal content-window ${extras[type] || 'home-component-window'}" id="${escapeHtml(id)}" aria-label="${escapeHtml(aria)}" data-component="${escapeHtml(type)}"><div class="titlebar"><div class="window-title">${homeTitleIcon(type)}<span>${escapeHtml(title)}</span></div><div class="caption-buttons"><button type="button" class="caption-button minimize" data-window-action="minimize" aria-label="Minimize ${escapeHtml(title)} window" title="Minimize">−</button><button type="button" class="caption-button close" data-window-action="close" aria-label="Close ${escapeHtml(title)} window" title="Close">×</button></div></div><div class="window-body ${bodyClass}">${body}</div></section>`;
}

function renderFeaturedRelease(content = {}) {
  const url = safeUrl(content.url, { allowRelative: false, requireHttps: true });
  if (!content.title || !url) return '';
  const artwork = content.artwork ? imageMarkup(content.artwork, content.artworkAlt || `${content.title} artwork`, 'featured-artwork') : '';
  return `<article class="featured-release">${artwork}<div class="featured-copy"><h3>${escapeHtml(content.title)}</h3>${content.description ? `<p>${escapeHtml(content.description)}</p>` : ''}<a class="component-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(content.linkText || 'Listen')}</a></div></article>`;
}

function renderBandsintown(content = {}, preview = false) {
  if (preview) return '<div class="component-fallback">Bandsintown event widget preview. The live widget will load on the deployed page.</div>';
  if (!content.artistName || !content.appId) return '<p class="component-fallback">Event listings are not configured yet.</p>';
  const attrs = {
    'data-artist-name': content.artistName,
    'data-app-id': content.appId,
    'data-display-details': content.displayDetails !== false,
    'data-display-lineup': content.displayLineup !== false,
    'data-display-start-time': content.displayStartTime !== false,
    'data-display-local-dates': content.displayLocalDates !== false,
    'data-local-dates-position': content.localDatesPosition || 'tab',
    'data-font': content.font || 'Segoe UI',
    'data-follow-section-position': content.followSectionPosition || 'hidden',
    'data-follow-section-alignment': content.followSectionAlignment || 'center',
    'data-follow-section-cta-text': content.followSectionCtaText || 'FOLLOW',
    'data-event-rsvp-position': content.eventRsvpPosition || 'hidden',
    'data-play-my-city-position': content.playMyCityPosition || 'bottom',
    'data-play-my-city-alignment': content.playMyCityAlignment || 'center',
    'data-play-my-city-cta-icon': content.playMyCityCtaIcon !== false,
    'data-event-rsvp-only-show-icon': content.eventRsvpOnlyShowIcon !== false
  };
  const serialized = Object.entries(attrs).map(([key, value]) => `${key}="${escapeHtml(String(value))}"`).join(' ');
  return `<div class="bandsintown-widget"><a class="bit-widget-initializer" ${serialized}> </a></div>`;
}

function renderSectionInner(section, context = {}) {
  const c = section.content || {};
  switch (section.type) {
    case 'site-header':
      return `<div class="block-site-header">${c.logo ? imageMarkup(c.logo, c.name || 'Site logo', 'site-logo') : ''}<div><strong>${escapeHtml(c.name || context.site.siteName)}</strong>${c.handle ? `<span>${escapeHtml(c.handle)}</span>` : ''}</div></div>`;
    case 'hero':
      return `<div class="block-hero">${c.eyebrow ? `<p class="eyebrow">${escapeHtml(c.eyebrow)}</p>` : ''}<h1>${escapeHtml(c.title || '')}</h1>${c.subtitle ? `<p class="hero-subtitle">${escapeHtml(c.subtitle)}</p>` : ''}${c.image ? imageMarkup(c.image, c.imageAlt || c.title, 'hero-image') : ''}${c.linkText && safeUrl(c.linkUrl) ? `<a class="component-button" href="${escapeHtml(safeUrl(c.linkUrl))}">${escapeHtml(c.linkText)}</a>` : ''}</div>`;
    case 'marquee': return renderMarquee(c);
    case 'artist-statement': {
      if (!c.body) return '';
      if (context.page?.template === 'album') return `<div class="intro-quote"><div class="bio-text">${renderRichText(c.body)}</div></div>`;
      return `<div class="artist-statement">${renderRichText(c.body)}</div>`;
    }
    case 'embed-window': return renderEmbed(c, context.preview);
    case 'bandsintown-events': return renderBandsintown(c, context.preview);
    case 'social-links': return context.page?.template === 'homepage' ? renderHomeSocialLinks(c) : renderSocialLinks(c);
    case 'featured-release': return renderFeaturedRelease(c);
    case 'rich-text': return `${c.heading ? `<h2>${escapeHtml(c.heading)}</h2>` : ''}<div class="rich-text">${renderRichText(c.body || '')}</div>`;
    case 'image': return `${imageMarkup(c.src, c.alt || '', 'content-image')}${c.caption ? `<p class="image-caption">${escapeHtml(c.caption)}</p>` : ''}`;
    case 'gallery': {
      const images = Array.isArray(c.images) ? c.images : [];
      if (!images.length) return '';
      return `<div class="image-gallery">${images.map((src, index) => imageMarkup(src, `${c.altText || 'Gallery image'} ${index + 1}`, 'gallery-image')).join('')}</div>${c.caption ? `<p class="image-caption">${escapeHtml(c.caption)}</p>` : ''}`;
    }
    case 'quote': return c.text ? `<blockquote class="editorial-quote"><p>${escapeHtml(c.text)}</p>${c.attribution ? `<cite>${escapeHtml(c.attribution)}</cite>` : ''}</blockquote>` : '';
    case 'link-button': {
      const url = safeUrl(c.url);
      return c.label && url ? `<a class="component-button button-${['primary','secondary','text'].includes(c.style) ? c.style : 'primary'}" href="${escapeHtml(url)}"${/^https:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(c.label)}</a>` : '';
    }
    case 'divider': return c.style === 'star' ? '<div class="ornamental-divider" aria-hidden="true">✦ ✧ ✦</div>' : '<hr class="content-divider">';
    case 'spacer': return `<div class="content-spacer" style="--spacer-height:${Math.max(0, Math.min(400, Number(c.size) || 32))}px" aria-hidden="true"></div>`;
    case 'album-header': {
      const a = context.page?.templateData?.album || {};
      const art = safeImageUrl(a.artwork);
      const artworkLayers = art ? `<div class="album-hero-art" aria-hidden="true"><img class="album-hero-blur" src="${escapeHtml(art)}" alt=""><img class="album-hero-sharp" src="${escapeHtml(art)}" alt=""></div>` : '';
      return `<div class="album-hero-window"><div class="album-window-titlebar"><span class="album-window-symbol" aria-hidden="true">◉</span><span>${escapeHtml(a.windowTitle || a.title || context.page.identity.name)}</span></div><header class="album-hero">${artworkLayers}<div class="album-hero-shade" aria-hidden="true"></div><div class="album-hero-inner">${a.eyebrow ? `<p class="album-eyebrow">${escapeHtml(a.eyebrow)}</p>` : ''}<h1>${escapeHtml(a.title || context.page.identity.name)}</h1><p class="album-artist-line">${escapeHtml(a.artistLine || context.site.siteName)}</p></div></header></div>`;
    }
    case 'album-player': return renderAlbumPlayer(context.page);
    case 'spotify-embed': {
      const spotify = context.page?.templateData?.spotify || {};
      return `<div class="player-listen"><div class="player-listen-label">${escapeHtml(spotify.label || 'OUT ON SPOTIFY')}</div>${renderEmbed({ url: spotify.embedUrl, title: `${context.page?.templateData?.album?.title || 'Album'} on Spotify`, height: spotify.height }, context.preview)}</div>`;
    }
    default: return '';
  }
}

export const RENDERED_COMPONENT_TYPES = Object.freeze(['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer','album-header','album-player','spotify-embed']);

export function renderComponent(section, context = {}) {
  if (!section || section.enabled === false) return { html: '', scripts: [] };
  const inner = renderSectionInner(section, context);
  if (!inner.trim() && !(context.page?.template === 'homepage' && section.type === 'marquee')) return { html: '', scripts: [] };
  const scripts = [];
  if (section.type === 'bandsintown-events' && !context.preview) scripts.push('bandsintown');
  if (section.type === 'album-player') scripts.push('album-player');
  if (context.page?.template === 'homepage') {
    if (section.type === 'marquee') return { html: renderHomeWindow(section, inner, context.preview), scripts: [] };
    return { html: renderHomeWindow(section, inner, context.preview), scripts };
  }
  if (section.type === 'divider' || section.type === 'spacer' || section.type === 'marquee') {
    return { html: windowWrap(section, inner, `component-${section.type}`, context), scripts: [] };
  }
  return { html: windowWrap(section, inner, '', context), scripts };
}

export function renderComponentList(sections = [], context = {}) {
  const html = [];
  const scripts = new Set();
  let index = 0;
  while (index < sections.length) {
    const section = sections[index];
    if (section.enabled === false) { index += 1; continue; }
    const groupId = section.group?.id;
    if (groupId) {
      const grouped = [];
      while (index < sections.length && sections[index].group?.id === groupId) {
        const item = renderComponent(sections[index], context);
        if (item.html) grouped.push(item.html);
        item.scripts.forEach((script) => scripts.add(script));
        index += 1;
      }
      if (grouped.length) {
        const layout = ['grid','stack','columns'].includes(section.group.layout) ? section.group.layout : 'grid';
        const columns = Math.max(1, Math.min(4, Number(section.group.columns) || 2));
        if (context.page?.template === 'homepage' && layout === 'grid') html.push(`<div class="home-window-grid" style="--group-columns:${columns}">${grouped.join('\n')}</div>`);
        else html.push(`<div class="component-group group-${layout}" style="--group-columns:${columns}">${grouped.join('\n')}</div>`);
      }
      continue;
    }
    const item = renderComponent(section, context);
    if (item.html) html.push(item.html);
    item.scripts.forEach((script) => scripts.add(script));
    index += 1;
  }
  return { html: html.join('\n'), scripts: [...scripts] };
}
