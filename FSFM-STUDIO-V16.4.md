# FSFM Studio V16.4: website-wide content editor

## What Studio can edit

- The Homepage record, including its hero, desktop labels, gadgets, photos, important dates, sticky note, featured release, radio player, fun widgets, Purble Place integration, bubble defaults, shutdown transition and content blocks.
- Album pages, including album presentation, media player settings, track metadata, audio sources, Spotify embed, appearance and SEO.
- Vista Window pages and Editorial pages, with their identity, publishing settings, appearance, SEO and ordered sections.
- Global site settings, including the site name, base URL, favicon, default SEO, social profiles and footer.
- The wallpaper catalogue, including presets, image sources, families and colour palettes.
- All 18 registered building blocks, with their enabled state, presentation, layout group and renderer-specific content fields.
- Synced LRC lyrics files linked to album tracks.
- Local image and audio uploads into the site's media library, with filename, size and file-signature checks. Uploaded images and audio are saved locally and queued for deliberate publication.

## Page and block editing

Studio reads the shared component and template registries. Each page exposes only the blocks allowed by its template. Blocks can be added, removed when optional, reordered, enabled or disabled, and configured through nested fields, lists and switches. Template-required album header and player components remain protected.

New Album, Vista Window and Editorial pages can be created as unpublished drafts from the repository's existing page starters. Homepage remains a single fixed record.

Page slugs are read-only after creation because they determine the content filename and public route. Page identity, publishing, appearance and SEO are editable.

## Validation and local saves

All JSON page saves are normalized using the shared route model and checked against the complete site with `validateSite`. This checks template constraints, component compatibility, required blocks, duplicate IDs, route/slug collisions, album tracks, audio references and lyrics files before the content is written.

Global site settings and wallpaper catalogues have dedicated validation. Wallpaper image sources may be HTTPS URLs or existing files inside `/media/images/`. Revision hashes reject stale edits. Local saves update only the local repository working tree and add the saved content file to the Stage 2 publishing queue.

## Media uploads

Image fields and album `audioFile` fields include a local file picker. Images are stored under `media/images/`; audio is stored under `media/audio/`, which is the local path format expected by the FSFM album player. Uploads reject unsupported extensions, mismatched file signatures, duplicate names and files larger than 30 MB. Uploading an asset saves that file locally and queues it for deployment; the page or track still needs its own **Save local** action to store the asset path in the content record.

## Lyrics editing

Album track cards expose an LRC editor for the linked file in `lyrics/`. Lyrics saves use their own revision check and publishing queue entry; they do not silently overwrite unsaved album metadata.

## Preview and deployment

The embedded preview displays the last locally saved render. Responsive viewport controls are still the Stage 4 implementation target. Save & deploy live remains gated until the V16 release protocol is present on `main`, and its Stage 2 production checks and explicit confirmation remain required.

## Notes

The editor uses the existing FSFM JSON model rather than generating a new CMS schema. Fields are rendered from the actual nested record data, so template-specific settings and renderer options remain editable without duplicating the renderer's configuration contract.
