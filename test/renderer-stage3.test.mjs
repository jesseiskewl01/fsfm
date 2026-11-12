import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, safeUrl, safeEmbedUrl, renderRichText, safeJsonForHtml } from '../src/render/html.mjs';
import { renderComponent, renderComponentList, RENDERED_COMPONENT_TYPES } from '../src/render/components.mjs';
import { COMPONENTS } from '../src/components/registry.mjs';
import { safeRoute } from '../src/render/html.mjs';
import { resolveWallpaperConfig, renderWallpaperLayer } from '../src/render/wallpaper.mjs';
import { renderPage } from '../src/render/page.mjs';

const site = {
  siteName: 'Fake Space Fog Machine', baseUrl: 'https://fsfm.port82.net/', favicon: '/media/images/favicon.png',
  description: 'Land of the free', footerText: '© 2026 FAKE SPACE FOG MACHINE',
  seoDefaults: { title: 'Fake Space Fog Machine', description: 'Land of the free', socialImage: '/media/images/cover.png' },
  socialProfiles: [{ label: 'Spotify', url: 'https://open.spotify.com/artist/example' }]
};
const wallpapers = { presets: [
  { id: 'vista-violet-haze', kind: 'image', imageUrl: 'https://example.com/violet.webp', palette: { sky: '#1d0f5e' } },
  { id: 'album-amber', kind: 'template-preset', palette: { ink: '#0a0806' } }
] };
const page = {
  template: 'vista-window', identity: { name: 'A Test Page', slug: 'test', route: '/pages/test/' },
  seo: { title: 'A Test Page | FSFM', description: 'A test.', canonical: 'https://fsfm.port82.net/pages/test/', allowIndexing: true },
  appearance: { wallpaper: { mode: 'preset', preset: 'vista-violet-haze' }, effects: { respectReducedMotion: true } },
  publishing: { published: true, showInNavigation: true, navigationLabel: 'Test' },
  sections: [{ id: 's1', type: 'artist-statement', enabled: true, content: { body: 'Hello **there**.' } }]
};

test('escapes HTML and rejects executable URLs', () => {
  assert.equal(escapeHtml('<script "x">'), '&lt;script &quot;x&quot;&gt;');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,hello'), null);
  assert.equal(safeEmbedUrl('/relative/embed'), null);
  assert.equal(safeRoute('javascript:alert(1)'), '/');
  assert.equal(safeRoute('/\\\\evil.example/'), '/');
  assert.equal(safeRoute('/pages/about/'), '/pages/about/');
  assert.equal(safeEmbedUrl('https://open.spotify.com/embed/artist/example'), 'https://open.spotify.com/embed/artist/example');
});

test('rich text renders a safe Markdown subset without interpreting raw HTML', () => {
  const html = renderRichText('# Heading\n\nA **bold** word and <script>alert(1)</script>.\n- One\n- Two');
  assert.match(html, /<h2>Heading<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /<ul>/);
});

test('component renderer supports Vista and amber variants and skips disabled sections', () => {
  const vista = renderComponent({ id: 'about', type: 'artist-statement', enabled: true, presentation: { variant: 'vista-window', windowTitle: 'ABOUT FSFM' }, content: { body: 'A bio.' } });
  assert.match(vista.html, /variant-vista-window/);
  assert.match(vista.html, /ABOUT FSFM/);
  const amber = renderComponent({ id: 'quote', type: 'quote', enabled: true, presentation: { variant: 'amber-editorial' }, content: { text: 'A quote.' } });
  assert.match(amber.html, /variant-amber-editorial/);
  assert.equal(renderComponent({ id: 'off', type: 'quote', enabled: false, content: { text: 'Hidden' } }).html, '');
});

test('component groups preserve their order and expose responsive grid metadata', () => {
  const result = renderComponentList([
    { id: 'a', type: 'artist-statement', enabled: true, group: { id: 'g', layout: 'grid', columns: 2 }, content: { body: 'A' } },
    { id: 'b', type: 'quote', enabled: true, group: { id: 'g', layout: 'grid', columns: 2 }, content: { text: 'B' } },
    { id: 'c', type: 'divider', enabled: true, content: {} }
  ]);
  assert.match(result.html, /group-grid/);
  assert.ok(result.html.indexOf('A') < result.html.indexOf('B'));
  assert.match(result.html, /component-divider/);
});

test('wallpaper config carries selected presets, cycling mode and reduced-motion preference', () => {
  const p = { ...page, appearance: { wallpaper: { mode: 'cycle', presets: ['vista-violet-haze'], initialSelection: 'random', cycle: { enabled: true, mode: 'random', intervalSeconds: 45, manualControl: true } }, effects: { respectReducedMotion: true } } };
  const config = resolveWallpaperConfig(p, wallpapers);
  assert.equal(config.cycle.mode, 'random');
  assert.equal(config.cycle.intervalSeconds, 45);
  assert.equal(config.respectReducedMotion, true);
  assert.equal(config.presets.length, 1);
  const layer = renderWallpaperLayer(p, wallpapers);
  assert.match(layer, /data-wallpaper-next/);
  assert.match(layer, /background-image:url/);
});

test('page renderer emits crawlable HTML, canonical SEO, schema, navigation and noindex preview', () => {
  const html = renderPage(page, { site, pages: [page], wallpapers, preview: true });
  assert.match(html, /<p>Hello <strong>there<\/strong>\.<\/p>/);
  assert.match(html, /rel="canonical" href="https:\/\/fsfm\.port82\.net\/pages\/test\//);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /data-background-effects="true"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /wallpaper-engine\.js/);
});

test('preview mode does not load third-party event scripts', () => {
  const result = renderComponentList([{ id: 'events', type: 'bandsintown-events', enabled: true, content: { artistName: 'artist', appId: 'app' } }], { preview: true });
  assert.deepEqual(result.scripts, []);
  assert.match(result.html, /live widget will load/);
});

test('JSON for inline script contexts neutralises HTML-significant characters', () => {
  const value = safeJsonForHtml({ value: '</script><script>alert(1)</script>' });
  assert.doesNotMatch(value, /<\/script>/i);
  assert.match(value, /\\u003c/);
});

test('every registered component has a renderer', () => {
  for (const type of Object.keys(COMPONENTS)) assert.ok(RENDERED_COMPONENT_TYPES.includes(type), `Missing renderer for ${type}`);
});

test('Wallpaper renderer applies custom fit, focal position and the Aurora CSS preset', () => {
  const custom = {
    ...page,
    appearance: { wallpaper: { mode: 'custom', customImage: '/media/images/custom.webp', customFit: 'contain', customPosition: 'top-left' }, effects: { respectReducedMotion: true } }
  };
  const customConfig = resolveWallpaperConfig(custom, wallpapers);
  assert.equal(customConfig.fit, 'contain');
  assert.equal(customConfig.position, 'top left');
  const auroraPage = {
    ...page,
    appearance: { wallpaper: { mode: 'preset', preset: 'aurora' }, effects: { respectReducedMotion: true } }
  };
  const auroraLayer = renderWallpaperLayer(auroraPage, {
    presets: [...wallpapers.presets, { id: 'aurora', kind: 'css-preset', palette: {} }]
  });
  assert.match(auroraLayer, /radial-gradient\(ellipse at 18% 18%/);
  assert.match(auroraLayer, /background-size:cover/);
});
