/*
 * FSFM + TinaCMS prototype.
 * Six collections mirror the six stores in scripts/tina-local-adapter.mjs.
 * Part fields, block types and vocabularies come from src/core/parts.mjs.
 * [OpenCode, 2026-11-24]
 */
import { effectFields, groupLayoutOptions, pagePartFieldsFor, presentationBackgroundOptions, presentationOptions, presentationPaddingOptions, sectionTypesFor, unionContentFields } from './fields.mjs';
const hidden = (name, label, type = 'string') => ({
  type,
  name,
  label,
  ui: { component: 'hidden' },
});

const textField = (name, label, description) => ({
  type: 'string',
  name,
  label,
  ...(description ? { description } : {}),
});

const objectField = (name, label, fields, description) => ({
  type: 'object',
  name,
  label,
  fields,
  ...(description ? { description } : {}),
});

const listField = (name, label, fields, itemLabel) => ({
  type: 'object',
  name,
  label,
  list: true,
  ui: { itemProps: (item) => ({ label: item?.[itemLabel] || item?.name || 'New item' }) },
  fields,
});

const trackFields = [
  textField('id', 'Track ID', 'Unique stable ID, for example track-08.'),
  { ...textField('title', 'Track title'), required: true },
  textField('audioUrl', 'External audio URL', 'Use an HTTPS URL when the audio is hosted elsewhere.'),
  textField('audioFile', 'Repository audio path', 'Use a path such as /media/audio/track-name.ogg when the file is stored in FSFM.'),
  textField('lyricsFile', 'Lyrics file', 'Repository-relative path to the synchronized .lrc file.'),
  { type: 'boolean', name: 'instrumental', label: 'Instrumental' },
];

const fileActions = {
  create: false,
  delete: false,
  createFolder: false,
  createNestedFolder: false,
};

const folderActions = {
  create: true,
  delete: false,
  createFolder: false,
  createNestedFolder: false,
};

const folderUi = (fallback) => ({
  filename: {
    slugify: (values) => values?.identity?.slug || fallback,
    description: 'The file name follows the URL slug. FSFM generates the public route from the template and slug.',
  },
  allowedActions: folderActions,
});

const identityFields = (label = 'Page identity') => [
  { type: 'string', name: 'name', label: 'Name', required: true, isTitle: true },
  {
    type: 'string',
    name: 'slug',
    label: 'URL slug',
    required: true,
    description: 'Lowercase letters, numbers and hyphens. FSFM computes the public route from this value.',
  },
  hidden('route', 'Generated route'),
  { type: 'number', name: 'order', label: 'Navigation order' },
];

const albumTemplateDataFields = () => [
  objectField('album', 'Album presentation', [
    textField('windowTitle', 'Window title'),
    textField('title', 'Displayed title'),
    textField('artistLine', 'Artist line'),
    textField('eyebrow', 'Eyebrow / release label'),
    { type: 'image', name: 'artwork', label: 'Album artwork' },
  ]),
  objectField('player', 'Music player', [
    textField('windowTitle', 'Player window title'),
    textField('artistName', 'Artist name'),
    listField('tracks', 'Track list', trackFields, 'title'),
    objectField('behaviour', 'Playback behaviour', [
      { type: 'boolean', name: 'autoAdvance', label: 'Automatically advance tracks' },
      { type: 'boolean', name: 'lineWideLyricHighlight', label: 'Highlight the full lyric line' },
      {
        type: 'string',
        name: 'preload',
        label: 'Audio preload',
        options: ['none', 'metadata', 'auto'],
      },
    ]),
  ]),
  objectField('spotify', 'Spotify embed', [
    textField('label', 'Embed label'),
    textField('embedUrl', 'Spotify embed URL'),
    { type: 'number', name: 'height', label: 'Embed height (px)' },
  ]),
  textField('footerText', 'Album footer text'),
];

const pageTemplateDataFields = () => [
  textField('footerText', 'Footer override', 'Leave empty to use the global footer text.'),
];

const sectionsFields = (template, label) => [{
  type: 'object',
  name: 'sections',
  label: 'Parts',
  list: true,
  description: `Reorder the ${label.toLowerCase()} parts here. Keep each part ID unique and do not change a part type unless you intend to change how that section is rendered.`,
  ui: {
    itemProps: (item) => ({
      label: item?.presentation?.windowTitle || item?.type || item?.id || 'Page section',
    }),
  },
  fields: [
    textField('id', 'Part ID', 'Unique stable ID for this part.'),
    {
      type: 'string',
      name: 'type',
      label: 'Part type',
      options: sectionTypesFor(template),
      required: true,
    },
    { type: 'boolean', name: 'enabled', label: 'Show this part' },
    objectField('presentation', 'Presentation', [
      {
        type: 'string',
        name: 'variant',
        label: 'Visual style',
        options: presentationOptions,
      },
      textField('windowTitle', 'Window title'),
      { type: 'string', name: 'padding', label: 'Padding', options: presentationPaddingOptions },
      { type: 'string', name: 'background', label: 'Background', options: presentationBackgroundOptions },
    ]),
    objectField('group', 'Layout group', [
      textField('id', 'Group ID', 'Parts sharing this ID are laid out together.'),
      { type: 'string', name: 'layout', label: 'Layout', options: groupLayoutOptions },
      { type: 'number', name: 'columns', label: 'Columns' },
    ]),
    objectField('content', 'Part content', unionContentFields(template)),
  ],
}];

const publishingFields = () => [
  objectField('publishing', 'Publishing and navigation', [
    { type: 'boolean', name: 'published', label: 'Published' },
    { type: 'boolean', name: 'showInNavigation', label: 'Show in page navigation' },
    textField('navigationLabel', 'Navigation label'),
  ]),
];

const appearanceFields = (template) => [
  objectField('appearance', 'Appearance', [
    objectField('wallpaper', 'Wallpaper', [
      hidden('mode', 'Wallpaper mode'),
      hidden('preset', 'Wallpaper preset'),
      objectField('cycle', 'Wallpaper rotation', [
        { type: 'boolean', name: 'enabled', label: 'Enable wallpaper rotation' },
        { type: 'string', name: 'mode', label: 'Rotation order', options: ['sequential', 'random'] },
        { type: 'number', name: 'intervalSeconds', label: 'Interval (seconds)' },
        { type: 'boolean', name: 'manualControl', label: 'Allow manual wallpaper selection' },
      ]),
      {
        type: 'string',
        name: 'choice',
        label: 'Wallpaper style',
        options: [
          'template-default',
          'album-amber',
          'vista-violet-haze',
          'vista-aqua-glass',
          'vista-solar-flare',
          'vista-rose-bloom',
          'aurora',
          'custom',
          'cycle',
        ],
      },
      { type: 'image', name: 'customImage', label: 'Custom wallpaper image' },
      {
        type: 'string',
        name: 'customFit',
        label: 'Custom image fit',
        options: ['cover', 'contain'],
      },
      {
        type: 'string',
        name: 'customPosition',
        label: 'Custom image position',
        options: ['center', 'top', 'bottom', 'left', 'right'],
      },
    ]),
    objectField('effects', 'Page effects', effectFields()),
    objectField('parts', 'Visible parts', pagePartFieldsFor(template), 'Switch individual page parts on or off.'),
  ]),
];

const seoFields = () => [
  objectField('seo', 'Search and sharing', [
    textField('title', 'SEO title'),
    { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
    hidden('canonical', 'Generated canonical URL'),
    { type: 'image', name: 'socialImage', label: 'Social sharing image' },
    { type: 'boolean', name: 'allowIndexing', label: 'Allow search engines to index this page' },
  ]),
];

const pageFields = ({ template, identityLabel, templateData }) => [
  hidden('schemaVersion', 'Schema version', 'number'),
  hidden('template', 'Page template'),
  objectField('identity', identityLabel, identityFields(identityLabel), 'Name and URL details. The public route is computed by FSFM.'),
  ...(templateData ? [objectField('templateData', 'Template data', templateData)] : []),
  ...sectionsFields(template, identityLabel),
  ...publishingFields(),
  ...appearanceFields(template),
  ...seoFields(),
];

const siteFields = () => [
  hidden('schemaVersion', 'Schema version', 'number'),
  { ...textField('siteName', 'Site name'), required: true, isTitle: true },
  textField('baseUrl', 'Base URL'),
  { type: 'image', name: 'favicon', label: 'Favicon' },
  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
  textField('footerText', 'Footer text'),
  objectField('seoDefaults', 'Default search and sharing', [
    textField('title', 'Default title'),
    { type: 'string', name: 'description', label: 'Default description', ui: { component: 'textarea' } },
    { type: 'image', name: 'socialImage', label: 'Default social image' },
  ]),
  listField('socialProfiles', 'Social profiles', [
    textField('label', 'Platform'),
    textField('url', 'Profile URL'),
  ], 'label'),
];

const paletteFields = [
  textField('sky', 'Sky'),
  textField('deep', 'Deep'),
  textField('mid', 'Mid'),
  textField('glass', 'Glass'),
  textField('accent', 'Accent'),
  textField('bright', 'Bright'),
  textField('highlight', 'Highlight'),
  textField('ink', 'Ink'),
  textField('dark', 'Dark'),
  textField('earth', 'Earth'),
  textField('caramel', 'Caramel'),
  textField('cream', 'Cream'),
];

const wallpaperFields = () => [
  listField('presets', 'Wallpaper presets', [
    textField('id', 'Preset ID'),
    textField('name', 'Preset name'),
    textField('family', 'Family'),
    textField('colour', 'Colour'),
    textField('kind', 'Kind'),
    textField('imageUrl', 'Image URL'),
    objectField('palette', 'Colour palette', paletteFields),
  ], 'name'),
  objectField('customImage', 'Custom image settings', [
    textField('source', 'Media source'),
    textField('outputPrefix', 'Output prefix'),
    { type: 'string', name: 'fitOptions', label: 'Fit options', list: true },
  ]),
];

export default {
  // Cloud edits are kept on the isolated prototype branch.
  // Local mode uses the checked-out files and ignores Cloud credentials.
  branch: process.env.TINA_BRANCH || process.env.HEAD || 'v16-tinacms-prototype',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  // Tina admin stays in ./admin; the FSFM preview is built separately.
  build: {
    outputFolder: 'admin',
    publicFolder: '.',
  },

  // Artwork uploads go into FSFM's existing repository media directory.
  media: {
    tina: {
      publicFolder: '.',
      mediaRoot: 'media/images',
      static: false,
    },
  },

  schema: {
    collections: [
      {
        name: 'homepage',
        label: 'Homepage',
        path: 'content/v13',
        format: 'json',
        match: { include: 'homepage' },
        ui: { allowedActions: fileActions },
        fields: pageFields({ template: 'homepage', identityLabel: 'Page identity' }),
      },
      {
        name: 'site',
        label: 'Site settings',
        path: 'content/v13',
        format: 'json',
        match: { include: 'site' },
        ui: { allowedActions: fileActions },
        fields: siteFields(),
      },
      {
        name: 'wallpapers',
        label: 'Wallpapers',
        path: 'content/v13',
        format: 'json',
        match: { include: 'wallpapers' },
        ui: { allowedActions: fileActions },
        fields: wallpaperFields(),
      },
      {
        name: 'albums',
        label: 'Albums',
        path: 'content/v13/albums',
        format: 'json',
        ui: folderUi('new-album'),
        fields: pageFields({ template: 'album', identityLabel: 'Album identity', templateData: albumTemplateDataFields() }),
      },
      {
        name: 'vistaPages',
        label: 'Vista pages',
        path: 'content/v13/vista-pages',
        format: 'json',
        ui: folderUi('new-vista-page'),
        fields: pageFields({ template: 'vista-window', identityLabel: 'Page identity', templateData: pageTemplateDataFields() }),
      },
      {
        name: 'editorialPages',
        label: 'Editorial pages',
        path: 'content/v13/editorial-pages',
        format: 'json',
        ui: folderUi('new-editorial-page'),
        fields: pageFields({ template: 'editorial', identityLabel: 'Page identity', templateData: pageTemplateDataFields() }),
      },
    ],
  },
};
