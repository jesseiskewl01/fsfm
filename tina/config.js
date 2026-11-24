/*
 * FSFM + TinaCMS prototype.
 * The schema edits FSFM's existing JSON files without changing its renderer.
 * Part fields, block types and vocabularies are derived from src/core/parts.mjs.
 * [OpenCode, 2026-11-22]
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

const trackFields = [
  textField('id', 'Track ID', 'Unique stable ID, for example track-08.'),
  { ...textField('title', 'Track title'), required: true },
  textField('audioUrl', 'External audio URL', 'Use an HTTPS URL when the audio is hosted elsewhere.'),
  textField('audioFile', 'Repository audio path', 'Use a path such as /media/audio/track-name.ogg when the file is stored in FSFM.'),
  textField('lyricsFile', 'Lyrics file', 'Repository-relative path to the synchronized .lrc file.'),
  { type: 'boolean', name: 'instrumental', label: 'Instrumental' },
];

// Derived from the part definitions: adding a part's field once makes it
// editable here, valid in the build and renderable on the page.
const sectionTypes = sectionTypesFor('album');

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
        name: 'album',
        label: 'Albums',
        path: 'content/v13/albums',
        format: 'json',
        ui: {
          filename: {
            slugify: (values) => values?.identity?.slug || 'new-album',
            description: 'The file name follows the URL slug. FSFM generates the public album route from the template and slug.',
          },
          allowedActions: {
            create: true,
            delete: false,
            createFolder: false,
            createNestedFolder: false,
          },
        },
        fields: [
          hidden('schemaVersion', 'Schema version', 'number'),
          hidden('template', 'Page template'),

          objectField('identity', 'Album identity', [
            { type: 'string', name: 'name', label: 'Album name', required: true, isTitle: true },
            {
              type: 'string',
              name: 'slug',
              label: 'URL slug',
              required: true,
              description: 'Lowercase letters, numbers and hyphens. The public URL is /albums/your-slug/.',
            },
            hidden('route', 'Generated route'),
            { type: 'number', name: 'order', label: 'Navigation order' },
          ], 'Name and URL details. The public route is computed by FSFM.'),

          objectField('templateData', 'Album content', [
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
              {
                type: 'object',
                name: 'tracks',
                label: 'Track list',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title || 'New track' }),
                },
                fields: trackFields,
              },
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
          ]),

          {
            type: 'object',
            name: 'sections',
            label: 'Parts',
            list: true,
            description: 'Reorder the album parts here. Keep each part ID unique and do not change a part type unless you intend to change how that section is rendered.',
            ui: {
              itemProps: (item) => ({
                label: item?.presentation?.windowTitle || item?.type || item?.id || 'Album section',
              }),
            },
            fields: [
              textField('id', 'Part ID', 'Unique stable ID for this part.'),
              {
                type: 'string',
                name: 'type',
                label: 'Part type',
                options: sectionTypes,
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
              objectField('content', 'Part content', unionContentFields('album')),
            ],
          },

          objectField('publishing', 'Publishing and navigation', [
            { type: 'boolean', name: 'published', label: 'Published' },
            { type: 'boolean', name: 'showInNavigation', label: 'Show in page navigation' },
            textField('navigationLabel', 'Navigation label'),
          ]),

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
            objectField('parts', 'Visible parts', pagePartFieldsFor('album'), 'Switch individual page chrome on or off.'),
          ]),

          objectField('seo', 'Search and sharing', [
            textField('title', 'SEO title'),
            { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
            hidden('canonical', 'Generated canonical URL'),
            { type: 'image', name: 'socialImage', label: 'Social sharing image' },
            { type: 'boolean', name: 'allowIndexing', label: 'Allow search engines to index this page' },
          ]),
        ],
      },
    ],
  },
};
