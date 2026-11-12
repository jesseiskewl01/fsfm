# V13 Stage 6 — Verification report

## Result

The reusable Vista Window and Editorial page workflows are implemented and integrated into the default V13 build. The CMS collections already present in the architecture now have template-specific rendering defaults, validated presentation choices, reusable layout grouping, safe slug-based filenames, local page scaffolding and private template previews.

## Implemented

- Vista Window pages render shared content blocks with a Vista glass-window default presentation. They do not receive the Homepage-only desktop gadget layer.
- Editorial pages render shared components with an editorial default treatment, restrained reading width, serif display headings, spacious content rhythm and editorial quote styling.
- Explicit supported presentation variants remain selectable per block; an empty presentation inherits the page template's default.
- Optional layout grouping is available for artist statements, embeds, Bandsintown events, social links, featured releases, rich text, images, galleries, quotes and link/buttons. Groups support responsive grids, stacks and columns.
- The validator checks supported presentation variants, safe group IDs, valid group layouts and column counts.
- The shared page-level footer text can be overridden per Vista or Editorial page.
- Pages CMS Vista, Editorial and Album collection filenames are generated from the nested `identity.slug` value instead of display names.
- New Vista and Editorial pages are created unpublished by default, with page identity, route, page order, canonical URL and SEO fields populated.
- The local page scaffolder rejects invalid templates, invalid slugs, duplicate filenames and duplicate routes.
- Private preview builds can include draft collection entries. They remain noindex and are excluded from navigation and sitemap output.
- Two example template previews are generated outside the CMS content collections, so sample pages do not appear in the live website or collection lists.

## Verification

- **70 / 70** automated Node tests passed.
- V13 content validation passed: 2 canonical page records, 7 Album tracks and all referenced LRC files found.
- Stage 6 and Stage 5 JavaScript syntax checks passed.
- `.pages.yml` parsed successfully with PyYAML.
- Production build passed and generated the Homepage and existing Album only (2 published pages).
- Noindex preview build passed; template preview generation passed.
- Draft preview integration passed end-to-end: a temporary new Vista draft rendered into the private preview, had `noindex, nofollow`, was absent from navigation and sitemap, then was removed from the source tree.
- All 7 generated production/preview HTML documents parsed successfully.
- Both generated CSS files parsed without syntax errors.
- Generated local `/assets/` and `/lyrics/` references resolved.
- Template preview routes were checked for noindex, and production sitemap was checked to ensure it excluded private template previews.

## Pages CMS behavior and boundary

The template choice is represented by the collection: create an entry under **Vista Pages** for the Vista Window template, or under **Editorial Pages** for the Editorial template. This uses two deliberate, separately configured collections rather than an unvalidated free-form custom template selector. Pages CMS filename tokens support nested field values, and the new collection filename pattern uses `{fields.identity.slug}`. Official documentation: https://pagescms.org/docs/configuration/content/filename/ and https://pagescms.org/docs/configuration/content/fields/.

The `.pages.yml` configuration has been parsed and schema-tested locally, but the hosted Pages CMS editor has not been connected to the user's GitHub repository for visual UI verification.

## Known limitations

- The supplied source package contains placeholder media directories rather than the live user's `media/` contents. Original image, favicon, artwork and radio paths remain represented, but the actual user media must be merged before final cutover.
- Headless Chromium was unreliable in the previous environment. A real browser screenshot review, responsive visual inspection, actual audio/embed playback and manual keyboard/pointer interaction checks are still required in Stage 7.
- No deployment has occurred. The original live-root HTML files remain present as reference/rollback sources in the project copy.

## Build output

- Production: `dist-stage6/`
- Private preview: `preview-v13-stage6/`
- Template previews: `preview-v13-stage6/templates/`

## Deployment status

Nothing has been deployed. Stage 7 is the final integration, media-preservation, browser/accessibility/SEO QA and manual deployment handoff stage.
