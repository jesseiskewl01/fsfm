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

export const PRESENTATION_PADDINGS = Object.freeze(['default', 'compact', 'roomy']);
export const PRESENTATION_BACKGROUNDS = Object.freeze(['default', 'soft', 'glass', 'dark']);

export const GROUP_LAYOUTS = Object.freeze(['grid', 'stack', 'columns']);

const ALL_TEMPLATES = Object.freeze(['homepage', 'album', 'vista-window', 'editorial']);

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
  backgroundEffects: {
    label: 'Background effects',
    description: 'Ambient wallpaper overlays and the animated desktop canvas.',
    category: 'effect',
    templates: ALL_TEMPLATES,
    portableTo: ALL_TEMPLATES,
    path: 'appearance.effects.backgroundEffects',
    valueType: 'boolean',
    default: true
  },
  pageTransition: {
    label: 'Page transition',
    description: 'The short entrance animation applied to inner-page content.',
    category: 'effect',
    templates: ALL_TEMPLATES,
    portableTo: ALL_TEMPLATES,
    path: 'appearance.effects.pageTransition',
    valueType: 'boolean',
    default: true
  },
  respectReducedMotion: {
    label: 'Respect reduced motion',
    description: 'Honour the visitor’s reduced-motion preference for all page effects.',
    category: 'effect',
    templates: ALL_TEMPLATES,
    portableTo: ALL_TEMPLATES,
    path: 'appearance.effects.respectReducedMotion',
    valueType: 'boolean',
    default: true
  },
  albumAtmosphere: {
    label: 'Album atmosphere',
    description: 'The amber canvas treatment for album pages.',
    category: 'effect',
    templates: ['album'],
    portableTo: ALL_TEMPLATES,
    path: 'appearance.effects.albumAtmosphere.mode',
    defaultForTemplate: { album: 'full' },
    default: 'off',
    valueType: 'mode',
    modes: Object.freeze(Object.keys(ATMOSPHERE_MODES)),
    script: 'album-atmosphere.js',
    required: []
  }
});

/** Homepage desktop chrome is a part family too. Each piece can be switched
 *  off from content and now owns the copy it renders; the historical "everything
 *  on" state remains the default. [OpenCode, 2026-11-24]
 */
const desktopLabelField = (name, label) => field(name, label);

const desktopHeroFields = [
  field('windowTitle', 'Window title'),
  field('badge', 'Badge'),
  required('title', 'Title'),
  field('subtitle', 'Subtitle'),
  field('handle', 'Artist handle')
];

const gadgetLabelFields = [
  desktopLabelField('clock', 'Clock label'),
  desktopLabelField('calendar', 'Calendar label'),
  desktopLabelField('pictureFrame', 'Picture frame label'),
  desktopLabelField('importantDates', 'Important dates label'),
  desktopLabelField('stickyNote', 'Sticky note label'),
  desktopLabelField('barrelRoll', 'Barrel roll label'),
  desktopLabelField('bubbleFrequency', 'Bubble frequency label'),
  desktopLabelField('radio', 'Radio label'),
  desktopLabelField('purblePlace', 'Purble Place label'),
  desktopLabelField('barrelRollButton', 'Barrel roll button'),
  desktopLabelField('bubbleFrequencyLabel', 'Bubble frequency caption'),
  desktopLabelField('radioPlay', 'Radio play button'),
  desktopLabelField('radioPause', 'Radio pause button'),
  desktopLabelField('purblePlaceButton', 'Purble Place button')
];

const desktopGadgetFields = [
  field('photos', 'Photos', 'array', { itemType: 'image', description: 'Images shown in the picture frame gadget.' }),
  field('dates', 'Important dates', 'array', {
    itemType: 'object',
    itemFields: [required('title', 'Title'), required('date', 'Date')]
  }),
  field('stickyNote', 'Sticky note', 'object', { fields: [field('text', 'Note text', 'textarea')] }),
  field('funWidgets', 'Fun widgets', 'object', { fields: [
    field('showBarrelRoll', 'Show barrel roll', 'boolean'),
    field('showBubbleSlider', 'Show bubble slider', 'boolean'),
    field('showMusicPlayer', 'Show music player', 'boolean'),
    field('showPurblePlace', 'Show Purble Place', 'boolean')
  ] }),
  field('visibility', 'Gadget visibility', 'object', { fields: [
    field('showClock', 'Show clock', 'boolean'),
    field('showCalendar', 'Show calendar', 'boolean'),
    field('showFeaturedRelease', 'Show featured release', 'boolean'),
    field('showPhotos', 'Show photos', 'boolean'),
    field('showDates', 'Show dates', 'boolean'),
    field('showStickyNote', 'Show sticky note', 'boolean')
  ] }),
  field('radioAudioUrl', 'Radio audio URL', 'url'),
  field('bubbleDefault', 'Default bubble level', 'number', { min: 0, max: 100 }),
  field('purblePlaceUrl', 'Purble Place URL', 'url'),
  field('featuredRelease', 'Featured release', 'object', { fields: [
    required('windowTitle', 'Gadget title'),
    required('title', 'Release title'),
    field('description', 'Description'),
    field('artwork', 'Artwork', 'image'),
    required('linkText', 'Link text'),
    required('url', 'Link URL', 'url'),
    field('componentType', 'Component type')
  ] }),
  field('shutdownRedirectUrl', 'Shutdown redirect URL', 'url'),
  field('labels', 'Gadget labels', 'object', { fields: gadgetLabelFields })
];

const bootOverlayFields = [
  field('bootLoading', 'Loading message'),
  field('bootWelcome', 'Welcome message'),
  field('bootReady', 'Ready message'),
  field('bootCaption', 'Boot caption')
];

const shutdownOverlayFields = [
  field('shutdownTitle', 'Shutdown title'),
  field('shutdownMessage', 'Shutdown message')
];

const CHROME_SOURCE = {
  bootOverlay: ['Boot overlay', 'The startup progress screen.', bootOverlayFields],
  bubbleCanvas: ['Ambient bubble canvas', 'The animated glass-refraction canvas behind the desktop.', []],
  desktopGadgets: ['Desktop gadgets', 'Clock, calendar, featured release, photos, dates, notes and fun widgets.', desktopGadgetFields],
  desktopTaskbar: ['Desktop taskbar', 'The bottom navigation bar and page menu.', [field('homeNavigationLabel', 'Home navigation label')]],
  desktopHero: ['Desktop hero window', 'The large Aero window with the artist name and handle.', desktopHeroFields],
  purbleOverlay: ['Purble Place overlay', 'The dismissible game dialog.', []],
  shutdownOverlay: ['Shutdown overlay', 'The "Goodnight" closing dialog.', shutdownOverlayFields],
  themeEngine: ['Theme engine', 'Wallpaper palette selection and cycling script.', []],
  homepageFooter: ['Homepage footer', 'The global footer text at the bottom of the homepage desktop.', [field('footerText', 'Footer text')]],
  desktopWalls: ['Desktop walls', 'The two background wall panels behind the desktop.', []],
  desktopRuntime: ['Desktop runtime', 'Hidden settings and scripts that make the desktop interactive.', []]
};

export const CHROME_PARTS = Object.freeze(Object.fromEntries(
  Object.entries(CHROME_SOURCE).map(([name, [label, description, fields]]) => [name, Object.freeze({
    name,
    label,
    description,
    category: 'chrome',
    templates: Object.freeze(['homepage']),
    path: `appearance.parts.${name}.enabled`,
    contentPath: `appearance.parts.${name}.content`,
    default: true,
    fields: Object.freeze(fields.map(Object.freeze))
  })])
));

export const CHROME_PART_NAMES = Object.freeze(Object.keys(CHROME_PARTS));

/** Inner-page shell pieces are parts too: every template gets the same
 *  composability the homepage desktop now has. */
const SHELL_SOURCE = {
  siteHeader: ['Site header', 'The global brand header at the top of album, Vista and Editorial pages.', ['album', 'vista-window', 'editorial']],
  siteMenu: ['Site menu', 'The published-pages menu in the header.', ['album', 'vista-window', 'editorial']],
  pageFooter: ['Page footer', 'The global footer with site text and social profiles.', ['album', 'vista-window', 'editorial']],
  pageIntro: ['Page intro', 'The fallback title block when a page has no hero or album header.', ['album', 'vista-window', 'editorial']],
  wallpaperLayer: ['Wallpaper layer', 'The static wallpaper background behind inner pages.', ['album', 'vista-window', 'editorial']]
};

export const SHELL_PARTS = Object.freeze(Object.fromEntries(
  Object.entries(SHELL_SOURCE).map(([name, [label, description, templates]]) => [name, Object.freeze({
    name,
    label,
    description,
    category: 'shell',
    templates: Object.freeze(templates),
    path: `appearance.parts.${name}.enabled`,
    default: true
  })])
));

export const SHELL_PART_NAMES = Object.freeze(Object.keys(SHELL_PARTS));

/** Every switchable page part, across all templates. */
export const PAGE_PARTS = Object.freeze({ ...CHROME_PARTS, ...SHELL_PARTS });
export const PAGE_PART_NAMES = Object.freeze(Object.keys(PAGE_PARTS));

/** A missing setting means "on", preserving every existing content record. */
export function isPagePartEnabled(page, name) {
  const definition = PAGE_PARTS[name];
  if (!definition) return false;
  const value = page?.appearance?.parts?.[name];
  if (value === undefined) return definition.default;
  return value !== false && value.enabled !== false;
}

/** Kept as a compatibility name for the homepage chrome renderer. */
export const isChromePartEnabled = isPagePartEnabled;

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

export const PART_CATEGORIES = Object.freeze(['component', 'effect', 'chrome', 'shell']);

/** Every declared part, in one catalogue for the Studio phase. */
export const ALL_PARTS = Object.freeze({ ...COMPONENTS, ...EFFECTS, ...PAGE_PARTS });

export function getComponent(type) {
  return COMPONENTS[type] ?? null;
}

export function getEffect(name) {
  return EFFECTS[name] ?? null;
}

export function getPart(type, category) {
  if (category === undefined) return ALL_PARTS[type] ?? null;
  if (category === 'effect') return getEffect(type);
  if (category === 'component') return getComponent(type);
  if (category === 'chrome') return CHROME_PARTS[type] ?? null;
  if (category === 'shell') return SHELL_PARTS[type] ?? null;
  return null;
}

export function listParts(category) {
  if (!category) return Object.values(ALL_PARTS);
  if (category === 'component') return Object.values(COMPONENTS);
  if (category === 'effect') return Object.values(EFFECTS);
  if (category === 'chrome') return Object.values(CHROME_PARTS);
  if (category === 'shell') return Object.values(SHELL_PARTS);
  return [];
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
