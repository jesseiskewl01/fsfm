/** FSFM part definitions — the single source of truth.
 *
 *  Conversation term: "part". Code terms: "component", "effect", "chrome".
 *
 *  Everything downstream is derived from this file: template allowances,
 *  validator rules, renderer registration, and (in the Studio phase) editor
 *  controls and Tina fields. Adding a field once should make it editable,
 *  valid and renderable without touching three more registries.
 *
 *  [OpenCode, 2026-11-22]
 */

export const FIELD_TYPES = Object.freeze([
  'string', 'textarea', 'number', 'boolean', 'url', 'image', 'select', 'array', 'object'
]);

export const PRESENTATION_VARIANTS = Object.freeze([
  'vista-window', 'vista-desktop', 'editorial', 'amber-editorial', 'amber-player', 'plain', ''
]);

export const GROUP_LAYOUTS = Object.freeze(['grid', 'stack', 'columns']);

const field = (name, label, type = 'string', extra = {}) => ({ name, label, type, required: false, ...extra });
const required = (name, label, type = 'string', extra = {}) => ({ ...field(name, label, type, extra), required: true });

const select = (name, label, options, extra = {}) => field(name, label, 'select', { options, ...extra });

/** Display metadata for every supported album-atmosphere mode. */
export const ATMOSPHERE_MODES = Object.freeze({
  full: {
    label: 'Full',
    description: 'The complete amber aurora: drifting curtains, blooms, horizon haze and stars.'
  },
  lite: {
    label: 'Lite',
    description: 'Same palette and movement with a reduced canvas workload: fewer stars, curtains and soft-passes.'
  },
  off: {
    label: 'Off',
    description: 'No animated canvas. The amber wallpaper, vignette and grain remain.'
  }
});

/** Page-level effects are parts too — they can be enabled on any template. */
export const EFFECTS = Object.freeze({
  albumAtmosphere: {
    label: 'Album atmosphere',
    category: 'effect',
    templates: ['album'],
    portableTo: ['homepage', 'album', 'vista-window', 'editorial'],
    path: 'appearance.effects.albumAtmosphere.mode',
    defaultForTemplate: { album: 'full' },
    default: 'off',
    modes: Object.freeze(Object.keys(ATMOSPHERE_MODES)),
    script: 'album-atmosphere.js',
    required: []
  }
});

/** The 18 visual parts, with their authoring fields. */
const COMPONENT_SOURCE = {
  'site-header': {
    label: 'Site header', singleton: true,
    fields: [required('name', 'Name', 'string', { description: 'Displayed artist or site name.' }), field('handle', 'Handle'), field('logo', 'Logo', 'image')]
  },
  hero: {
    label: 'Hero',
    fields: [required('title', 'Title'), field('eyebrow', 'Eyebrow'), field('subtitle', 'Subtitle'), field('image', 'Image', 'image'), field('imageAlt', 'Image alt text'), field('linkText', 'Link text'), field('linkUrl', 'Link URL', 'url'), field('windowTitle', 'Window title')]
  },
  marquee: {
    label: 'Marquee',
    fields: [required('messages', 'Messages', 'array', { itemType: 'string', description: 'One scrolling message per entry.' })]
  },
  'artist-statement': {
    label: 'Artist statement',
    fields: [required('body', 'Body', 'textarea', { description: 'A short Markdown subset is supported.' })]
  },
  'embed-window': {
    label: 'Embed window',
    fields: [required('url', 'Embed URL', 'url'), field('title', 'Title'), field('provider', 'Provider'), field('height', 'Height', 'number')]
  },
  'bandsintown-events': {
    label: 'Bandsintown events',
    fields: [
      required('artistName', 'Artist ID'), required('appId', 'App ID'),
      field('displayDetails', 'Show details', 'boolean'), field('displayLineup', 'Show lineup', 'boolean'),
      field('displayStartTime', 'Show start time', 'boolean'), field('displayLocalDates', 'Show local dates', 'boolean'),
      select('localDatesPosition', 'Local dates position', ['tab', 'above', 'below']),
      select('followSectionPosition', 'Follow section position', ['hidden', 'top', 'bottom']),
      select('eventRsvpPosition', 'RSVP position', ['hidden', 'top', 'bottom'])
    ]
  },
  'social-links': {
    label: 'Social links',
    fields: [required('links', 'Links', 'array', { itemType: 'object', itemFields: [required('label', 'Platform'), required('url', 'URL', 'url')] })]
  },
  'featured-release': {
    label: 'Featured release',
    fields: [required('title', 'Title'), required('url', 'URL', 'url'), field('description', 'Description'), field('artwork', 'Artwork', 'image'), field('artworkAlt', 'Artwork alt text'), field('linkText', 'Link text')]
  },
  'rich-text': {
    label: 'Rich text',
    fields: [field('heading', 'Heading'), required('body', 'Body', 'textarea')]
  },
  image: {
    label: 'Image',
    fields: [required('src', 'Image', 'image'), field('alt', 'Alt text'), field('caption', 'Caption')]
  },
  gallery: {
    label: 'Image gallery',
    fields: [required('images', 'Images', 'array', { itemType: 'image' }), field('altText', 'Alt text'), field('caption', 'Caption')]
  },
  quote: {
    label: 'Quote',
    fields: [required('text', 'Quote', 'textarea'), field('attribution', 'Attribution')]
  },
  'link-button': {
    label: 'Link or button',
    fields: [required('label', 'Label'), required('url', 'URL', 'url'), select('style', 'Style', ['primary', 'secondary', 'text'])]
  },
  divider: {
    label: 'Divider',
    fields: [select('style', 'Style', ['line', 'star'])]
  },
  spacer: {
    label: 'Spacer',
    fields: [field('size', 'Height in pixels', 'number', { min: 0, max: 400 })]
  },
  'album-header': {
    label: 'Album header', singleton: true, source: 'templateData.album',
    fields: []
  },
  'album-player': {
    label: 'FSFM Media Player', singleton: true, source: 'templateData.player',
    fields: [required('source', 'Source', 'string', { description: 'Use templateData.player.' })]
  },
  'spotify-embed': {
    label: 'Spotify album embed', singleton: true, source: 'templateData.spotify',
    fields: [required('source', 'Source', 'string', { description: 'Use templateData.spotify.' })]
  }
};

const TEMPLATE_KEYS = Object.freeze(['homepage', 'album', 'vista-window', 'editorial']);

/** Attach the template list and derive `required` from `fields`, so the two
 *  can never disagree. Frozen, because a part's contract is not mutable at runtime. */
export const COMPONENTS = Object.freeze(Object.fromEntries(
  Object.entries(COMPONENT_SOURCE).map(([type, definition]) => {
    const templates = TEMPLATE_KEYS.filter((template) => {
      // Album-only and album-capable parts are declared by their source data.
      if (['album-header', 'album-player', 'spotify-embed'].includes(type)) return template === 'album';
      if (type === 'hero' || type === 'bandsintown-events') return template !== 'album';
      return true;
    });
    return [type, Object.freeze({
      type,
      label: definition.label,
      category: 'component',
      templates: Object.freeze(templates),
      singleton: definition.singleton === true,
      ...(definition.source ? { source: definition.source } : {}),
      fields: Object.freeze(definition.fields.map(Object.freeze)),
      required: Object.freeze(definition.fields.filter((item) => item.required).map((item) => `content.${item.name}`))
    })];
  })
));

export const COMPONENT_TYPES = Object.freeze(Object.keys(COMPONENTS));

export const PART_CATEGORIES = Object.freeze(['component', 'effect', 'chrome']);

export function getComponent(type) {
  return COMPONENTS[type] ?? null;
}

export function getEffect(name) {
  return EFFECTS[name] ?? null;
}

export function getPart(type, category = 'component') {
  if (category === 'effect') return getEffect(type);
  if (category === 'component') return getComponent(type);
  return null;
}

/** Resolve an effect mode from a page record, falling back to the template default. */
export function resolveEffectMode(effectName, page) {
  const effect = getEffect(effectName);
  if (!effect) return 'off';
  const configured = page?.appearance?.effects?.[effectName];
  const requested = typeof configured === 'string' ? configured : configured?.mode;
  if (effect.modes.includes(requested)) return requested;
  return effect.defaultForTemplate[page?.template] ?? effect.default;
}

/** Template allowances derive from the parts themselves. */
export function allowedComponentsFor(template) {
  return COMPONENT_TYPES.filter((type) => COMPONENTS[type].templates.includes(template));
}
