/** Shared visual component contract. Rendering is added in Stage 3. */
export const COMPONENTS = Object.freeze({
  'site-header': { label: 'Site header', templates: ['homepage', 'album', 'vista-window', 'editorial'], singleton: true, required: ['content.name'] },
  hero: { label: 'Hero', templates: ['homepage', 'vista-window', 'editorial'], required: ['content.title'] },
  marquee: { label: 'Marquee', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.messages'] },
  'artist-statement': { label: 'Artist statement', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.body'] },
  'embed-window': { label: 'Embed window', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.url'] },
  'bandsintown-events': { label: 'Bandsintown events', templates: ['homepage', 'vista-window', 'editorial'], required: ['content.artistName', 'content.appId'] },
  'social-links': { label: 'Social links', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.links'] },
  'featured-release': { label: 'Featured release', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.title', 'content.url'] },
  'rich-text': { label: 'Rich text', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.body'] },
  image: { label: 'Image', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.src'] },
  gallery: { label: 'Image gallery', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.images'] },
  quote: { label: 'Quote', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.text'] },
  'link-button': { label: 'Link or button', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: ['content.label', 'content.url'] },
  divider: { label: 'Divider', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: [] },
  spacer: { label: 'Spacer', templates: ['homepage', 'album', 'vista-window', 'editorial'], required: [] },
  'album-header': { label: 'Album header', templates: ['album'], singleton: true, required: [] },
  'album-player': { label: 'FSFM Media Player', templates: ['album'], singleton: true, required: ['content.source'] },
  'spotify-embed': { label: 'Spotify album embed', templates: ['album'], singleton: true, required: ['content.source'] }
});

export function getComponent(type) { return COMPONENTS[type] ?? null; }
