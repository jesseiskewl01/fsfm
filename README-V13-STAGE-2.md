# FSFM Website V13 — Stage 2: Pages CMS model

Stage 2 replaces the old V12 split editor with one Pages CMS configuration for the canonical V13 content records.

## CMS navigation

The `.pages.yml` file groups the editor into:

- **Pages → Homepage** — one fixed Homepage record. It cannot be created, renamed or deleted through the CMS.
- **Pages → Albums** — create as many Album pages as needed.
- **Pages → Vista Pages** — reusable Vista Window pages.
- **Pages → Editorial Pages** — reusable Editorial pages.
- **Site settings → Global identity and defaults** — site name, base URL, favicon, description, footer, default SEO and social profiles.
- **Site settings → Wallpaper catalogue** — registered wallpaper records and palette values.

Each page editor exposes the shared identity, publishing, appearance and SEO field groups. Template-specific data appears only in the matching template collection.

## Creating an Album

Create an entry under **Pages → Albums**. The editor asks for the page identity (name, slug, public route and order), album details, player settings, tracks, ordered sections, publishing, appearance and SEO.

The initial Album layout is created with:

1. Album header — built-in and required.
2. FSFM Media Player — built-in and required.
3. Spotify album embed — included by default but optional.

The artist statement is optional and can be added from the block list. Additional shared components can be inserted and reordered around the built-in sections. The CMS can technically allow duplicate blocks; the V13 validator rejects duplicate singleton components and requires exactly one enabled album header and player.

Each track has a stable internal ID, title, one audio source and an LRC lyrics file. Audio can be either an HTTPS external URL or an uploaded file in `media/audio/`. Clear the other source when switching; validation rejects both sources being populated or both being empty. LRC files are selected from `lyrics/` and remain repository-relative, preserving the current `.lrc` paths.

## Shared building blocks

The Homepage, Album, Vista and Editorial editors share the same building-block vocabulary where each template supports it:

- Site header and hero
- Marquee
- Artist statement
- Embed window
- Bandsintown events (not offered in Album pages)
- Social links and featured release
- Rich text, image, image gallery and quote
- Link/button, divider and spacer

The component schemas share field groups for presentation settings, page identity, publication, appearance and SEO. Templates still control the visual treatment and allowed component set.

## Publishing and deletion safety

- New collection entries start unpublished.
- Navigation visibility is independent of publication.
- Search indexing is an independent SEO setting.
- Page collection rename and delete operations are disabled to reduce accidental route/content loss. Unpublish or hide a page instead; deliberate archival and deletion flows can be added later.
- Homepage is one fixed file and cannot be deleted from the CMS.

## Media sources

- `media/images/` — artwork, photos, favicons and custom wallpapers.
- `media/audio/` — uploaded album audio (OGG, MP3, WAV, M4A, AAC or FLAC).
- `lyrics/` — timestamped LRC lyrics files.

Image uploads retain their original filenames so existing asset references are not rewritten unexpectedly. The media folders in this package are placeholders; copy the actual live `media/` directory into the final project before migration/deployment.

## Wallpaper settings

Pages can select a registered preset, custom image, Vista cycling or their template default. Cycling supports sequential and random modes, selected Vista backgrounds, a configurable interval and manual controls. Custom images have cover/contain and focal-position settings. The wallpaper dropdown choices are registered in `.pages.yml`; adding a brand-new preset also requires registering its ID/label there and implementing its rendering in the wallpaper engine.

## Important implementation boundary

This stage delivers the V13 `.pages.yml` model and content mapping. The Pages CMS hosted editor has not been connected to the user's GitHub repository, so its rendered UI has not been visually inspected in that account. The YAML was parsed and structurally audited against every existing canonical V13 record. The V13 renderer is not complete yet: the current website output still comes from the V12 renderer until Stage 3 and the later Homepage/Album migrations are finished. Do not deploy this intermediate package as the finished V13 website.
