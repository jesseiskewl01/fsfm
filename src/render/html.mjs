const SITE_BASE = 'https://fsfm.port82.net/';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

export function safeUrl(value, options = {}) {
  const { allowRelative = true, allowMailto = false, requireHttps = false } = options;
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();
  if (/^(\/|\.\/|\.\.\/|#)/.test(raw)) {
    if (!allowRelative || /^\/\//.test(raw)) return null;
    return raw;
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  try {
    const parsed = new URL(raw, SITE_BASE);
    if (parsed.username || parsed.password) return null;
    if (requireHttps && parsed.protocol !== 'https:') return null;
    if (parsed.protocol === 'https:' || (!requireHttps && parsed.protocol === 'http:')) return parsed.href;
    if (allowMailto && parsed.protocol === 'mailto:') return parsed.href;
    return null;
  } catch {
    return null;
  }
}


export function safeRoute(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const route = value.trim();
  if (!route.startsWith('/') || route.startsWith('//') || /[\\\u0000-\u001f]/.test(route)) return fallback;
  return route;
}

export function safeImageUrl(value) {
  return safeUrl(value, { allowRelative: true, requireHttps: true });
}

export function safeEmbedUrl(value) {
  return safeUrl(value, { allowRelative: false, requireHttps: true });
}

export function safeCanonical(value, fallback) {
  return safeUrl(value, { allowRelative: false, requireHttps: true }) || fallback;
}

export function safeJsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function inlineMarkdown(text) {
  let result = escapeHtml(text);
  // Deliberately small Markdown subset; raw HTML is never interpreted.
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  result = result.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_m, label, url) => {
    const safe = safeUrl(url);
    return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  return result;
}

export function renderRichText(markdown = '') {
  const source = String(markdown ?? '').replace(/\r\n?/g, '\n').trim();
  if (!source) return '';
  const lines = source.split('\n');
  const blocks = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${paragraph.map(inlineMarkdown).join('<br>')}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
      list = [];
    }
  };
  for (const line of lines) {
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = Math.min(heading[1].length + 1, 4);
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const item = line.match(/^\s*[-*+]\s+(.+)$/);
    if (item) { flushParagraph(); list.push(item[1]); continue; }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList();
  return blocks.join('\n');
}

export function safeCssColor(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?$/.test(v)) return v;
  return null;
}
