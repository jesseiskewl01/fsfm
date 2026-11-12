import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'content', 'pages');
const outputRoot = path.join(root, 'pages');
const siteUrl = 'https://fsfm.port82.net';
const siteContentPath = path.join(root, 'data', 'site-content.json');
const siteContent = fs.existsSync(siteContentPath) ? JSON.parse(fs.readFileSync(siteContentPath, 'utf8')) : {};
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const safeUrl = (v = '') => {
  const value = String(v).trim();
  if (!value) return '#';
  try {
    const u = new URL(value, `${siteUrl}/`);
    if (!['http:', 'https:'].includes(u.protocol)) return '#';
    if (/^(javascript|data|vbscript):/i.test(value)) return '#';
    return esc(value);
  } catch { return '#'; }
};
const jsonForScript = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
const inline = (v = '') => esc(v).replace(/\n/g, '<br>');
const visible = b => b && b.hidden !== true;

function blockInner(b = {}) {
  switch (b.type) {
    case 'hero': return `<div class="eyebrow">${esc(b.eyebrow || '')}</div><h1>${esc(b.heading || '')}</h1><p>${inline(b.subheading || '')}</p>${b.image ? `<img class="hero-image" src="${safeUrl(b.image)}" alt="${esc(b.imageAlt || '')}">` : ''}`;
    case 'marquee': return `<div class="marquee" aria-label="${esc((b.messages || []).join(' · '))}"><div>${(b.messages || []).map(x => `<span>${esc(x)}　✦　</span>`).join('')}</div></div>`;
    case 'text': return `<section class="text-block">${b.heading ? `<h2>${esc(b.heading)}</h2>` : ''}<div>${inline(b.body || '')}</div></section>`;
    case 'image': return b.src ? `<figure class="image-block"><img src="${safeUrl(b.src)}" alt="${esc(b.alt || '')}">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>` : '';
    case 'embed': { const h = Math.max(180, Math.min(900, Number(b.height) || 420)); return `<iframe src="${safeUrl(b.url || '')}" title="${esc(b.heading || 'Embedded content')}" loading="lazy" height="${h}" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`; }
    case 'release': return `<a class="release" href="${safeUrl(b.url || '')}" rel="noopener noreferrer">${b.artwork ? `<img src="${safeUrl(b.artwork)}" alt="${esc(b.artworkAlt || '')}">` : ''}<span><strong>${esc(b.title || '')}</strong><small>${esc(b.description || '')}</small><em>${esc(b.linkText || 'OPEN')}</em></span></a>`;
    case 'musicPlayer': return `<p>${esc(b.artist || '')}</p><ol>${(b.tracks || []).map(t => `<li><a href="${safeUrl(t.audioUrl || '')}" rel="noopener">${esc(t.title || 'Track')}</a></li>`).join('')}</ol>`;
    case 'divider': return b.style === 'star' ? '<div class="divider star">✦</div>' : b.style === 'space' ? '<div class="space"></div>' : '<hr class="divider">';
    case 'spacer': return `<div class="space" style="height:${Math.max(8, Math.min(240, Number(b.size) || 32))}px"></div>`;
    default: return '';
  }
}

function renderBlock(b, pageType) {
  if (!visible(b)) return '';
  const inner = blockInner(b);
  if (!inner) return '';
  if (b.type === 'divider' || b.type === 'spacer' || b.type === 'marquee') return inner;
  const desktopWindow = pageType === 'desktop' && ['hero', 'text', 'image'].includes(b.type);
  const standardWindow = ['embed', 'release', 'musicPlayer'].includes(b.type);
  if (!desktopWindow && !standardWindow) return inner;
  const windowClass = pageType === 'desktop' ? 'window vista-window' : 'window';
  const labels = { hero: 'WELCOME', text: 'INFORMATION', image: 'IMAGE', embed: 'EMBED', release: 'FEATURED RELEASE', musicPlayer: 'MUSIC PLAYER' };
  const windowTitle = b.windowTitle || b.heading || labels[b.type] || 'FSFM';
  return `<section class="${windowClass}" data-window><header>${esc(windowTitle)}</header><div class="window-content">${inner}</div></section>`;
}

function wallpaperCss(page) {
  const presets = {
    'vista-purple': 'radial-gradient(ellipse at 20% 0%,#7055a5 0,transparent 42%),linear-gradient(145deg,#171b42,#384b78 55%,#4b8c9b)',
    'vista-teal': 'radial-gradient(ellipse at 20% 0%,#3f9eaa 0,transparent 42%),linear-gradient(145deg,#082c42,#17627a 55%,#62a99a)',
    'vista-orange': 'radial-gradient(ellipse at 20% 0%,#e69b55 0,transparent 42%),linear-gradient(145deg,#40243b,#9a593c 55%,#d6a35b)',
    'vista-pink': 'radial-gradient(ellipse at 20% 0%,#d68bb4 0,transparent 42%),linear-gradient(145deg,#402747,#865b88 55%,#d49aaf)',
    aurora: 'radial-gradient(ellipse at 20% 0%,#3e9c8d 0,transparent 42%),radial-gradient(ellipse at 80% 20%,#5267a7 0,transparent 45%),linear-gradient(145deg,#071a2e,#153d4c 55%,#202c58)'
  };
  if (page.wallpaper === 'custom' && page.customWallpaper) return `url("${safeUrl(page.customWallpaper)}") center/cover fixed`;
  return presets[page.wallpaper] || presets['vista-teal'];
}

function template(page, publishedPages) {
  const title = page.seo?.title || page.title || siteContent.siteName || 'Fake Space Fog Machine';
  const desc = page.seo?.description || siteContent.description || 'Fake Space Fog Machine';
  const canonical = page.seo?.canonical || `${siteUrl}/pages/${page.slug}/`;
  const image = page.seo?.socialImage || siteContent.seo?.socialImage || '/media/images/cover.png';
  const desktop = page.pageType === 'desktop';
  const blocks = (page.layout || []).map(b => renderBlock(b, page.pageType)).filter(Boolean).join('\n');
  const nav = publishedPages.filter(p => p.showInNavigation !== false && p.navigationLabel).sort((a,b) => (Number(a.order)||0) - (Number(b.order)||0)).map(p => `<a href="/pages/${esc(p.slug)}/">${esc(p.navigationLabel)}</a>`).join('');
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: desc, url: canonical,
    isPartOf: { '@type': 'WebSite', name: siteContent.siteName || 'Fake Space Fog Machine', url: `${siteUrl}/` },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: page.title, item: canonical }
    ] }
  };
  const bg = wallpaperCss(page);
  const bodyClass = desktop ? 'desktop' : page.pageType === 'minimal' ? 'minimal' : 'editorial';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${safeUrl(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><link rel="icon" href="${safeUrl(siteContent.favicon || '/media/images/asadadasdges-removebg-preview.png')}">
<script type="application/ld+json">${jsonForScript(schema)}</script><style>
:root{color-scheme:dark;--glass:rgba(224,246,255,.18);--line:rgba(255,255,255,.38);--ink:#effaff;--accent:#9eefff;--wallpaper:${bg}}*{box-sizing:border-box}body{margin:0;min-height:100vh;color:var(--ink);font:16px/1.65 'Segoe UI',Tahoma,Arial,sans-serif;background:var(--wallpaper);background-attachment:fixed}.site-shell{width:min(960px,calc(100% - 32px));margin:7vh auto;padding:clamp(18px,4vw,48px);border:1px solid var(--line);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.06));box-shadow:0 24px 70px #00101e99,inset 0 1px 0 #fff8;backdrop-filter:blur(22px);animation:page-in .55s cubic-bezier(.2,.8,.2,1) both}.editorial{--accent:#f0c27e;--line:#bd8b4e66}.editorial .site-shell{background:linear-gradient(145deg,#22160ddd,#0a0806ee);box-shadow:0 28px 80px #000b}.minimal .site-shell{background:#101820e8;backdrop-filter:blur(10px)}.topline{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font:11px 'Roboto Mono',monospace;letter-spacing:.12em;opacity:.8;margin-bottom:28px}.topline nav{display:flex;gap:14px;flex-wrap:wrap}.topline a,.back{color:var(--accent);text-decoration:none}.topline a:hover,.back:hover{text-decoration:underline}.hero{padding:clamp(24px,5vw,54px) 0 36px}.eyebrow{font:11px 'Roboto Mono',monospace;letter-spacing:.2em;color:var(--accent)}h1{font-size:clamp(34px,7vw,76px);line-height:1.02;letter-spacing:-.055em;margin:14px 0}h2{font-size:clamp(22px,4vw,34px);line-height:1.15;margin:0 0 14px}.hero p{max-width:650px;font-size:clamp(16px,2vw,21px);opacity:.82}.hero-image{display:block;max-width:100%;max-height:460px;object-fit:cover;border-radius:12px;margin-top:28px}.marquee{overflow:hidden;border-block:1px solid var(--line);padding:12px 0;margin:20px 0 34px;font:12px 'Roboto Mono',monospace;white-space:nowrap}.marquee div{display:inline-block;animation:scroll 28s linear infinite}.marquee:hover div{animation-play-state:paused}@keyframes scroll{to{transform:translateX(-50%)}}.text-block{padding:22px 0;max-width:760px}.window{margin:24px 0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--glass);box-shadow:0 12px 34px #00101e55,inset 0 1px 0 #fff8;backdrop-filter:blur(16px);transition:transform .22s,box-shadow .22s,opacity .22s;animation:window-in .38s cubic-bezier(.2,.8,.2,1) both}.window:hover{box-shadow:0 16px 42px #00101e77,inset 0 1px 0 #fff9}.window>header{padding:10px 14px;background:linear-gradient(#ffffff40,#ffffff0d);border-bottom:1px solid var(--line);font:11px 'Roboto Mono',monospace;letter-spacing:.1em}.window iframe{display:block;width:100%;border:0;background:#121212}.window p,.window ol{padding:0 20px}.vista-window{position:relative}.window-content{min-width:0}.window-controls{display:flex;gap:5px;float:right}.window-controls button{width:19px;height:19px;padding:0;border:1px solid #ffffff77;border-radius:50%;color:#fff;background:linear-gradient(#ffffff66,#ffffff18);cursor:pointer;font:12px/16px Arial}.window-controls button:hover{filter:brightness(1.3)}.window.is-minimized .window-content{display:none}.window.is-closed{opacity:0;transform:scale(.96);pointer-events:none;margin-block:0;max-height:0;overflow:hidden}.image-block{margin:28px 0}.image-block img{width:100%;height:auto;border-radius:12px;border:1px solid var(--line)}figcaption{font-size:12px;opacity:.7;margin-top:8px}.release{display:flex;gap:18px;align-items:center;color:inherit;text-decoration:none;border:1px solid var(--line);border-radius:12px;padding:14px;margin:24px 0;background:var(--glass);transition:transform .2s,background .2s}.release:hover{transform:translateY(-3px);background:#ffffff2b}.release img{width:112px;aspect-ratio:1;object-fit:cover;border-radius:7px}.release span{display:grid;gap:5px}.release small,.release em{opacity:.75}.release em{font:11px 'Roboto Mono',monospace;font-style:normal;color:var(--accent)}.divider{border:0;border-top:1px solid var(--line);margin:30px 0}.divider.star{text-align:center;border:0;color:var(--accent)}.space{height:32px}footer{margin-top:52px;padding-top:18px;border-top:1px solid var(--line);font:10px 'Roboto Mono',monospace;opacity:.65}@keyframes page-in{from{opacity:0;filter:blur(8px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}@keyframes window-in{from{opacity:0;transform:translateY(9px) scale(.985)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}@media(max-width:600px){.site-shell{margin:16px auto;width:calc(100% - 20px);padding:18px}.release img{width:82px}}
</style></head><body class="${bodyClass}"><main class="site-shell"><div class="topline"><a class="back" href="/">← ${esc(siteContent.siteName || 'FAKE SPACE FOG MACHINE')}</a><nav aria-label="Site navigation">${nav}</nav><span>${esc((page.pageType || 'editorial').toUpperCase())} PAGE</span></div>${blocks}<footer>${esc(siteContent.footerText || '© 2026 FAKE SPACE FOG MACHINE')}</footer></main>
<script>document.querySelectorAll('[data-window]').forEach(function(w){var h=w.querySelector(':scope > .window-content > header');if(!h)return;var c=document.createElement('span');c.className='window-controls';c.innerHTML='<button type="button" aria-label="Minimise window" title="Minimise">−</button><button type="button" aria-label="Close window" title="Close">×</button>';h.appendChild(c);var b=c.querySelectorAll('button');b[0].addEventListener('click',function(){w.classList.toggle('is-minimized');b[0].textContent=w.classList.contains('is-minimized')?'□':'−';b[0].setAttribute('aria-label',w.classList.contains('is-minimized')?'Restore window':'Minimise window')});b[1].addEventListener('click',function(){w.classList.add('is-closed')})});</script></body></html>`;
}

if (!fs.existsSync(source)) process.exit(0);
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
const pages = fs.readdirSync(source).filter(f => f.endsWith('.json')).map(file => JSON.parse(fs.readFileSync(path.join(source, file), 'utf8')));
const published = pages.filter(p => p.published && p.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) && !['home', 'the-early-bird'].includes(p.slug));
const seen = new Set();
for (const page of published) {
  if (seen.has(page.slug)) throw new Error(`Duplicate page slug: ${page.slug}`);
  seen.add(page.slug);
  const out = path.join(outputRoot, page.slug, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, template(page, published));
  console.log(`Built /pages/${page.slug}/`);
}
// Keep the bespoke album experience, but generate its crawlable SEO metadata from CMS content.
const albumHtmlPath = path.join(root, 'the-early-bird.html');
if (fs.existsSync(albumHtmlPath)) {
  let html = fs.readFileSync(albumHtmlPath, 'utf8');
  const album = siteContent.album || {};
  const seo = siteContent.seo || {};
  const albumTitle = seo.albumTitle || siteContent.albumBrowserTitle || `${album.title || 'The Early Bird....'} | ${siteContent.siteName || 'Fake Space Fog Machine'}`;
  const albumDescription = seo.albumDescription || album.bio || 'The Early Bird.... by Fake Space Fog Machine.';
  const albumCanonical = seo.albumUrl || `${siteUrl}/the-early-bird.html`;
  const albumImage = seo.socialImage || '/media/images/cover.png';
  const albumSchema = {
    '@context': 'https://schema.org', '@type': 'MusicAlbum',
    name: album.title || 'The Early Bird....', description: albumDescription,
    url: albumCanonical, image: new URL(albumImage, `${siteUrl}/`).href,
    byArtist: { '@type': 'MusicGroup', name: siteContent.siteName || 'Fake Space Fog Machine', url: `${siteUrl}/` },
    sameAs: siteContent.home?.featuredLinkUrl || 'https://open.spotify.com/album/0clOFZSG1MHTVtK9DAjUOe'
  };
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(albumTitle)}</title>`);
  html = html.replace(/<meta name="description" id="siteDescription" content="[^"]*">/i, `<meta name="description" id="siteDescription" content="${esc(albumDescription)}">`);
  html = html.replace(/\s*<link rel="canonical" id="albumCanonical"[^>]*>/i, '');
  html = html.replace(/\s*<meta[^>]+id="albumOg[^"]*"[^>]*>/gi, '');
  html = html.replace(/\s*<script type="application\/ld\+json" id="fsfmAlbumSchema">[\s\S]*?<\/script>/i, '');
  const albumMeta = `<link rel="canonical" id="albumCanonical" href="${esc(albumCanonical)}"><meta property="og:type" id="albumOgType" content="music.album"><meta property="og:title" id="albumOgTitle" content="${esc(albumTitle)}"><meta property="og:description" id="albumOgDescription" content="${esc(albumDescription)}"><meta property="og:url" id="albumOgUrl" content="${esc(albumCanonical)}"><meta property="og:image" id="albumOgImage" content="${safeUrl(albumImage)}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json" id="fsfmAlbumSchema">${jsonForScript(albumSchema)}</script>`;
  html = html.replace(/<\/head>/i, `${albumMeta}\n</head>`);
  fs.writeFileSync(albumHtmlPath, html);
}

const urls = [
  { loc: `${siteUrl}/`, priority: '1.0' },
  { loc: `${siteUrl}/the-early-bird.html`, priority: '0.9' },
  ...published.map(p => ({ loc: `${siteUrl}/pages/${p.slug}/`, priority: '0.7' }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
