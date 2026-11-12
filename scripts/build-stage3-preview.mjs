import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/render/page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const [site, wallpapers, homepage, album] = await Promise.all([
  readJson('content/v13/site.json'),
  readJson('content/v13/wallpapers.json'),
  readJson('content/v13/homepage.json'),
  readJson('content/v13/albums/the-early-bird.json')
]);

const previewPage = {
  ...structuredClone(homepage),
  template: 'vista-window',
  identity: { name: 'Shared Components Preview', slug: 'shared-components', route: '/__preview__/shared-components.html', order: 0 },
  publishing: { published: false, showInNavigation: false, navigationLabel: '' },
  seo: { title: 'Shared Components Preview | FSFM', description: 'Private preview of the V13 shared component library.', canonical: 'https://fsfm.port82.net/__preview__/shared-components.html', socialImage: '/media/images/cover.png', allowIndexing: false },
  appearance: {
    wallpaper: {
      mode: 'cycle', presets: ['vista-violet-haze','vista-aqua-glass','vista-solar-flare','vista-rose-bloom'],
      initialSelection: 'random', cycle: { enabled: false, mode: 'sequential', intervalSeconds: 30, manualControl: true }
    },
    effects: { backgroundEffects: true, pageTransition: true, respectReducedMotion: true }
  },
  sections: [
    { id: 'preview-header', type: 'site-header', enabled: true, content: { name: site.siteName, handle: '@mirrorlesssmoke' } },
    { id: 'preview-hero', type: 'hero', enabled: true, presentation: { variant: 'plain' }, content: { eyebrow: 'V13 SHARED COMPONENTS', title: 'Built once. Used everywhere.', subtitle: 'A private preview of the shared visual building blocks that power the Homepage, Album, Vista and Editorial templates.', linkText: 'Listen on Spotify', linkUrl: 'https://open.spotify.com/artist/2PcGMMcKTObTrK7XVw9GSX' } },
    ...structuredClone(homepage.sections),
    { id: 'preview-featured', type: 'featured-release', enabled: true, presentation: { variant: 'vista-window', windowTitle: 'FEATURED RELEASE · REUSABLE COMPONENT' }, content: structuredClone(homepage.templateData.gadgets.featuredRelease) },
    { id: 'preview-rich', type: 'rich-text', enabled: true, presentation: { variant: 'editorial', windowTitle: 'RICH TEXT' }, content: { heading: 'A little room to write', body: '## A proper content block\n\nThis supports **bold text**, *italics*, inline `code`, links, and simple lists without allowing raw HTML into the page.\n\n- Reusable across templates\n- Editable in Pages CMS\n- Rendered as crawlable HTML' } },
    { id: 'preview-quote', type: 'quote', enabled: true, presentation: { variant: 'amber-editorial', windowTitle: 'QUOTE · AMBER PRESENTATION' }, content: { text: 'A strange, elaborate little corner of the internet.', attribution: 'FSFM V13 component preview' } },
    { id: 'preview-image', type: 'image', enabled: true, presentation: { variant: 'amber-editorial', windowTitle: 'IMAGE COMPONENT' }, content: { src: '/media/images/cover.png', alt: 'The Early Bird.... album artwork', caption: 'Artwork will display when the live media directory is merged.' } },
    { id: 'preview-gallery', type: 'gallery', enabled: true, presentation: { variant: 'editorial', windowTitle: 'IMAGE GALLERY' }, content: { images: ['/media/images/cover.png','/media/images/gallery-example.png'], altText: 'Example gallery item', caption: 'Multiple images, responsive grid.' } },
    { id: 'preview-link', type: 'link-button', enabled: true, presentation: { variant: 'plain' }, content: { label: 'A reusable button', url: 'https://open.spotify.com/artist/2PcGMMcKTObTrK7XVw9GSX', style: 'primary' } },
    { id: 'preview-divider', type: 'divider', enabled: true, presentation: { variant: 'plain' }, content: { style: 'star' } },
    { id: 'preview-spacer', type: 'spacer', enabled: true, presentation: { variant: 'plain' }, content: { size: 18 } }
  ]
};

const albumPreview = {
  ...structuredClone(album),
  identity: { ...album.identity, name: 'Album Template Components Preview', route: '/__preview__/album-components.html' },
  publishing: { published: false, showInNavigation: false, navigationLabel: '' },
  seo: { ...album.seo, title: 'Album Template Components Preview | FSFM', canonical: 'https://fsfm.port82.net/__preview__/album-components.html', allowIndexing: false },
  sections: album.sections.filter((section) => section.type !== 'album-player').map((section) => {
    if (section.type === 'album-player') return section;
    return section;
  }).map((section) => section.type === 'album-player' ? { ...section, enabled: true } : section)
};

const previewPages = [homepage, album, previewPage];
const output = path.join(root, 'preview-v13-stage3');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'assets'), { recursive: true });
await fs.mkdir(path.join(output, '__preview__'), { recursive: true });
for (const [source, target] of [
  ['src/styles/v13.css', 'assets/v13.css'],
  ['src/client/wallpaper-engine.js', 'assets/wallpaper-engine.js'],
  ['src/client/runtime.js', 'assets/runtime.js'],
  ['src/client/bandsintown.js', 'assets/bandsintown.js']
]) await fs.copyFile(path.join(root, source), path.join(output, target));

const common = { site, pages: previewPages, wallpapers, assets: '../assets', preview: true };
await fs.writeFile(path.join(output, '__preview__', 'shared-components.html'), renderPage(previewPage, common), 'utf8');
await fs.writeFile(path.join(output, '__preview__', 'album-components.html'), renderPage(albumPreview, common), 'utf8');
await fs.writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FSFM V13 Stage 3 Preview</title><style>body{font:16px/1.6 Segoe UI,Arial;background:#101a2c;color:#f7f7fb;padding:40px;max-width:800px;margin:auto}a{color:#a8ecff}li{margin:12px 0}</style><h1>FSFM V13 · Stage 3 Preview</h1><p>Private component-rendering preview. These files are for review only and are not production routes.</p><ul><li><a href="__preview__/shared-components.html">Shared component library · Vista presentation</a></li><li><a href="__preview__/album-components.html">Album component presentation · Amber</a></li></ul><p>Missing image files are expected in this source package. The live media directory has not yet been merged.</p></html>`, 'utf8');
await fs.writeFile(path.join(output, 'README.txt'), 'FSFM V13 Stage 3 preview only. Do not deploy this folder as the live website. Serve this folder locally over HTTP and open index.html. Missing images are expected because the supplied source archive contains only media placeholders.\n', 'utf8');
console.log(`Stage 3 preview generated at ${output}`);
