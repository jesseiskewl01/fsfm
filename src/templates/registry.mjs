/** Template registry. Composition rules are declared here; the list of parts a
 *  template accepts is derived from the parts' own `templates` arrays.
 *  [OpenCode, 2026-11-22] */
import { allowedComponentsFor } from '../core/parts.mjs';

const withParts = (name, definition) => Object.freeze({
  ...definition,
  allowedComponentTypes: Object.freeze(allowedComponentsFor(name))
});

const TEMPLATE_SOURCE = {
  homepage: {
    label: 'Homepage', oneOfOne: true, route: '/',
    features: ['vista-desktop', 'desktop-gadgets', 'wallpaper-engine', 'bubbles', 'shutdown-transition']
  },
  album: {
    label: 'Album', oneOfOne: false, routePattern: '/albums/{slug}/',
    requiredComponents: Object.freeze({ 'album-header': 1, 'album-player': 1 }),
    maximumComponents: Object.freeze({ 'album-player': 1, 'album-header': 1, 'spotify-embed': 1 }),
    features: ['album-player', 'synchronised-lyrics', 'album-amber-atmosphere']
  },
  'vista-window': {
    label: 'Vista', oneOfOne: false, routePattern: '/pages/{slug}/',
    features: ['vista-windows', 'wallpaper-engine']
  },
  editorial: {
    label: 'Editorial Page', oneOfOne: false, routePattern: '/pages/{slug}/',
    features: ['editorial-layout', 'wallpaper-engine']
  }
};

export const TEMPLATES = Object.freeze(Object.fromEntries(
  Object.entries(TEMPLATE_SOURCE).map(([name, definition]) => [name, withParts(name, definition)])
));

export function getTemplate(type) { return TEMPLATES[type] ?? null; }
