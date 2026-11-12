# FSFM Website V13 — Stage 6: Vista Window and Editorial templates

Stage 6 completes the reusable future-page workflows. Both page templates are rendered through the shared V13 component library and build pipeline.

## What changed

- Vista Window pages receive Vista glass-window defaults unless a block explicitly selects another supported presentation.
- Editorial pages receive the Editorial visual treatment by default, with a quieter reading width, serif display headings, generous spacing and editorial quote styling.
- Both templates use the shared global navigation, footer, wallpaper engine, page transitions, metadata and structured data.
- Page-level `templateData.footerText` can override the global footer.
- Homepage desktop gadgets remain exclusive to the Homepage template.
- Blocks can be grouped into responsive grids, stacks or columns. The CMS exposes optional grouping controls on statement, embed, events, socials, featured release, rich text, image, gallery, quote and link/button blocks.
- Presentation is an explicit CMS choice from the supported renderer variants; template defaults apply when the field is empty.
- Vista and Editorial collection filenames are generated from `identity.slug`, not the human-readable page name.
- Validation checks presentation variants and group IDs/layouts/column counts.
- New-page starter records live outside the page collections, so they do not appear as fake pages in the CMS or website.
- A small local scaffolder can create safe draft records for either template.
- Private previews can include drafts without putting them in navigation or the sitemap.

## Creating pages in Pages CMS

1. Open **Pages → Vista Pages** or **Pages → Editorial Pages**.
2. Create a new entry in the chosen collection. The collection is the template choice; there is no free-form template selector.
3. Complete **Page identity**. Use a lowercase URL slug and a public route such as `/pages/listening-room/`.
4. Add items to **Page building blocks**. Each block has content, a visibility toggle and a presentation choice. Some blocks also have a **Layout group**. Consecutive blocks with the same group ID are rendered together.
5. Set **Publishing and navigation**. New pages are drafts by default; publishing and navigation visibility are independent.
6. Choose wallpaper and page effects in **Page appearance**.
7. Complete SEO and sharing metadata.
8. Commit the change. Run validation and build a private preview before deployment.

## Local page scaffolder (optional)

Pages CMS remains the main editing workflow. The scaffolder is useful for local development or scripted page setup:

```sh
npm run new:page -- --template vista-window --name "Listening Room" --slug listening-room
npm run new:page -- --template editorial --name "Notes and Fragments"
```

It creates an unpublished page record under the matching collection, calculates the next page order, creates the route and canonical URL, and validates the new record. `--published` can be supplied deliberately, but the default is a draft.

## Build and preview commands

```sh
npm test
npm run validate:v13
npm run build
npm run preview:v13:stage6
npm run preview:v13:stage6:drafts
npm run preview:v13:stage6:templates
```

- `npm run build` writes the production static site to `dist-stage6/`.
- `npm run preview:v13:stage6` writes a noindex preview of published pages to `preview-v13-stage6/`.
- `npm run preview:v13:stage6:drafts` also renders unpublished collection entries for private inspection. Drafts remain absent from navigation and sitemap.
- `npm run preview:v13:stage6:templates` adds sample Vista Window and Editorial template previews under `preview-v13-stage6/templates/`. The sample pages are preview-only and not stored in the CMS collections.

## Important deployment notes

- Nothing is deployed by these scripts.
- The provided archive still lacks the user's live `media/` contents (including personal images, favicon artwork and the radio file). Preserve and merge the full live `media/` directory before final cutover.
- The hosted Pages CMS editor has not been visually inspected against the user's GitHub repository. The configuration has been parsed and tested locally, but the live editor still needs a connected-repository check.
- Browser-based desktop/mobile visual QA and real pointer/keyboard interaction checks remain for Stage 7. Chromium was unreliable in the previous environment, so automated structural checks are not presented as browser sign-off.

## Stage 6 verification snapshot

The final Stage 6 package passes **70 automated tests**. The canonical-content validator, Stage 5 and Stage 6 syntax checks, CMS YAML parsing, production/preview builds, seven generated HTML parser checks, both CSS parser checks, local asset/lyrics reference checks and private draft-preview integration all passed. See `STAGE-6-REPORT.md` for the exact scope and remaining limitations.
