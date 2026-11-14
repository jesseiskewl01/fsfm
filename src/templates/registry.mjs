/** Template registry. Each template defines composition rules; the renderer arrives in Stage 3. */
export const TEMPLATES = Object.freeze({
  homepage: {
    label: 'Homepage', oneOfOne: true, route: '/',
    allowedComponentTypes: ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer'],
    features: ['vista-desktop','desktop-gadgets','wallpaper-engine','bubbles','shutdown-transition']
  },
  album: {
    label: 'Album', oneOfOne: false, routePattern: '/albums/{slug}/',
    allowedComponentTypes: ['site-header','marquee','artist-statement','embed-window','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer','album-header','album-player','spotify-embed'],
    requiredComponents: { 'album-header': 1, 'album-player': 1 },
    maximumComponents: { 'album-player': 1, 'album-header': 1, 'spotify-embed': 1 },
    features: ['album-player','synchronised-lyrics','album-amber-atmosphere']
  },
  'vista-window': {
    label: 'Vista', oneOfOne: false, routePattern: '/pages/{slug}/',
    allowedComponentTypes: ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer'],
    features: ['vista-windows','wallpaper-engine']
  },
  editorial: {
    label: 'Editorial Page', oneOfOne: false, routePattern: '/pages/{slug}/',
    allowedComponentTypes: ['site-header','hero','marquee','artist-statement','embed-window','bandsintown-events','social-links','featured-release','rich-text','image','gallery','quote','link-button','divider','spacer'],
    features: ['editorial-layout','wallpaper-engine']
  }
});

export function getTemplate(type) { return TEMPLATES[type] ?? null; }
