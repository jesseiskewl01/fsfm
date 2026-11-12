# Fake Space Fog Machine — V13 Architecture & Build Plan

## Project goal
Replace the V12 hybrid architecture with one coherent static-site system. The Homepage, Album pages, Vista Window pages and Editorial pages are all page instances rendered through the same build pipeline and shared component library. Templates control composition, styling and specialised behaviour; page records hold content and settings.

## Agreed architecture

### Templates
- **Homepage**: one-of-one, protected template. Retains the existing Vista desktop, hero window, desktop gadgets, wallpaper switching, bubble system, shutdown interaction and homepage-only gadget layer.
- **Album**: reusable template. Retains the amber/gold atmosphere and the dedicated FSFM Media Player, tracklist, synchronised LRC lyrics, transport controls, automatic track progression and Spotify embed. The album player is a single required section; it can be repositioned but not duplicated.
- **Vista Window Page**: reusable template for future window-based pages. Vista windows and page components are available, but Homepage desktop gadgets are not.
- **Editorial Page**: reusable template for polished, content-led pages such as The Early Bird....'s existing presentation style where appropriate.
- Future types (EP, Single, Discography, Event, Merchandise) are introduced only when deliberately designed and approved.

### Shared page settings
Every page has a name, slug, public route, order, publication state, navigation visibility and label, wallpaper settings, appearance effects, SEO title/description/canonical/social image and indexing preference. Published, shown in navigation and indexed are separate controls.

Wallpaper settings support a static preset, custom image, or a selected Vista cycle. Cycle mode supports both sequential and random order, selectable presets, an interval, manual switching, and reduced-motion/performance safeguards. The Homepage's existing theme names and palette data are retained: Violet Haze, Aqua Glass, Solar Flare and Rose Bloom. User-facing colour families are Purple, Teal, Orange and Pink. Aurora and Album Amber are also catalogue entries; Album Amber remains the Album template default.

### Shared component library
Components are implemented once and may be used by multiple templates where appropriate. The same component can have template-specific presentation variants (for example a Vista-window artist statement versus an amber editorial statement). The initial registry includes: header, hero, marquee, artist statement, generic embed window, Bandsintown events, social links, featured release, rich text, image, image gallery, quote, link/button, divider, spacer, album header, dedicated album player and Spotify embed.

Homepage desktop gadgets remain Homepage-only template features. Their underlying content such as featured release remains reusable data/component content where appropriate.

### Album page-builder rules
The Album template has built-in album header, optional artist statement, exactly one required album-player, optional Spotify embed, and an ordered component list. Extra supported blocks may be inserted between or around the built-in sections. Empty optional blocks do not render. Album track records own their audio URL, LRC file reference and instrumental flag. Track order is the CMS list order.

### Content and publishing
Pages CMS edits Git-backed JSON/YAML content. The build pipeline validates and compiles those records into crawlable static HTML. The CMS is not the renderer. Previews and validation happen before manual deployment; deployment remains under Jesse's control.

### Preservation requirements
- Preserve all user-supplied wording, punctuation, casing and Unicode exactly.
- Preserve `/the-early-bird.html` as the existing public Album route.
- Preserve favicon `/media/images/asadadasdges-removebg-preview.png` and artwork `/media/images/cover.png`.
- Preserve all seven existing GitHub raw OGG audio URLs and all seven LRC paths/timestamps.
- Preserve the existing artist Spotify link and embed, Bandsintown widget configuration, social links, Homepage gadget defaults and Homepage wallpaper image URLs/palette values.
- Preserve the existing Vista Homepage design and amber/gold Album design; migration changes their content management and rendering architecture, not their creative identities.
- Preserve the live `media/` directory and any user-only imagery when the live repository is supplied. The current source ZIP only contains `.gitkeep` placeholders in `media/`.

## Staged implementation plan

1. **Stage 1 — Architecture contract and canonical data model** (this package): define template/component registries, create canonical Homepage and first Album page records, validate records and preservation references. No rendered site behaviour changes in this stage.
2. **Stage 2 — CMS model** (implemented): replaced the hybrid `.pages.yml` model with grouped Homepage, Albums, Vista Pages, Editorial Pages and Site settings editors. Reusable CMS field components map to the canonical records; track audio/LRC media sources are defined. Hosted editor UI verification remains pending a connection to the user’s GitHub repository.
3. **Stage 3 — Shared renderer and component library** (implemented): safe HTML renderers, presentation variants, shared navigation/footer/SEO, page shells, wallpaper engine, generic block rendering and isolated component preview pages.
4. **Stage 4 — Album renderer** (implemented): migrate the Album layout, amber/gold presentation, atmosphere and full custom player behaviour into the Album template; preserve the seven audio/LRC mappings and existing public route. Automated runtime and content tests pass; desktop/mobile Chromium screenshots and client-side track-selection checks are recorded in `qa/`. External audio and embed delivery still require online verification.
5. **Stage 5 — Homepage renderer** (implemented): migrate the special Homepage, hero, marquee, windows, desktop gadgets, theme controls, bubbles and shutdown behaviour into the unified pipeline.
6. **Stage 6 — Future-page templates** (implemented): complete the Vista Window and Editorial page workflows, template-specific styling defaults, reusable block grouping, slug-based collection filenames, local page scaffolding and private draft/template previews.
7. **Stage 7 — QA, SEO, preview and deployment handoff** (release candidate prepared): 74 automated tests, content validation, production build/audit, YAML/JSON parsing, Chromium desktop/mobile render and interaction checks, screenshot evidence, sitemap/robots/canonical/schema checks, and manual deployment notes. Deployment remains blocked until the complete live `media/` directory is merged and external resources/CMS are verified online.

## Stage status

- Stage 1 — complete: architecture contract, canonical records, registries, validator and migration tests.
- Stage 2 — complete: Pages CMS configuration, grouped template collections, reusable field/block definitions and media sources.
- Stage 3 — complete: shared static renderer, component library, site shell, SEO output, wallpaper runtime, component preview pages and renderer tests.
- Stage 4 — complete as a V13 template: reusable Album renderer, amber/gold layout, full FSFM Media Player, synchronised LRC lyrics, Spotify embed and original atmosphere. Album data and player runtime tests pass; browser screenshot verification remains outstanding.
- Stage 5 — complete as a V13 template: dedicated Homepage Vista desktop renderer, original hero, all ten desktop gadgets, wallpaper switching/cycling, ambient bubble controls, radio, Purble Place overlay, shutdown behaviour, crawlable marquee copy and CMS-editable interface labels. The Homepage and Album build together from canonical V13 records. Homepage live gadget values were reconciled against the current public repository during Stage 7.
- Stage 6 — complete as reusable page workflows: Vista Window and Editorial pages use template-aware visual defaults; shared blocks can be grouped into responsive grids, stacks or columns; CMS presentation variants are constrained to supported choices; collection filenames use `identity.slug`; page creation scaffolding creates safe unpublished draft records; draft previews are noindex and excluded from navigation/sitemap. Stage 6 handover recorded 70 tests.

## Current implementation boundary (Stage 7)

The default `npm run build` generates all published V13 page records into a clean `dist/` folder. The present canonical site contains the unique Homepage and `/the-early-bird.html` Album. Vista and Editorial pages are added as canonical JSON records in their respective `content/v13/` collections and are rendered through the same build pipeline. The default build omits unpublished records; `npm run preview:v13:drafts` includes them in a private preview with `noindex`. Template sample previews are generated by `npm run preview:v13:templates`.

The new `npm run audit:v13` checks the production output for expected pages, core SEO metadata, canonical routes, sitemap/robots correctness, duplicate IDs, image alt attributes, iframe titles, safe new-window links and local references. `npm run predeploy-check` runs the production build and strict audit, and intentionally fails until the known required live images are restored.

The current source archive still contains placeholder-only `media/` folders. The full live `media/` directory must be merged before deployment, including at least `media/images/cover.png`, `media/images/asadadasdges-removebg-preview.png` and `media/images/earlybirdcd.jpg`. The latest public Homepage gadget configuration has been reconciled into the V13 canonical Homepage data. Chromium desktop/mobile rendering and client-side interaction checks are recorded in `qa/`; external audio, remote image delivery, live embeds and the hosted Pages CMS interface require online verification. See `README-V13-STAGE-7.md`, `STAGE-7-REPORT.md` and `LIVE-MEDIA-MERGE.md` for the handover. Nothing has been deployed.
