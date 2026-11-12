# FSFM Website V13 — Stage 5: Homepage migration

Stage 5 migrates the unique FSFM Homepage into the V13 shared rendering pipeline. It preserves the Homepage's special Vista desktop experience while using the same underlying site shell, component registry, page records, wallpaper engine and validation system as the Album template.

## What is included

- Dedicated one-of-one Homepage renderer with the existing Vista desktop layout and hero window.
- Shared component rendering for marquee, artist statement, Spotify embed window, Bandsintown events, social links and general content blocks.
- All ten original desktop gadgets, restricted to the Homepage template and the existing desktop viewport breakpoint.
- Editable gadget visibility, picture-frame images, important dates, sticky note, featured release, radio audio URL, bubble frequency and Purble Place URL.
- Editable desktop loading/shutdown labels and gadget titles/button labels in the CMS.
- Original wallpaper image URLs and palette identities: Violet Haze, Aqua Glass, Solar Flare and Rose Bloom.
- Static preset, custom image, Aurora and Vista cycling support. Cycle configuration supports sequential and random modes, selected presets and an interval.
- Custom wallpaper fit and focal position support.
- Ambient bubble system with a default of 50 and a real off state at zero.
- User-initiated FSFM Radio with no autoplay, and deferred/dismissible Purble Place overlay.
- Hero shutdown transition with configurable HTTPS destination.
- Crawlable marquee text rendered into the HTML before client-side enhancement.
- Reduced-motion and page-visibility safeguards.
- Shared crawlable SEO metadata, canonical URL and MusicGroup structured data.

## Build and validation

Requires Node.js with ES module support. No new npm dependencies were added.

```bash
npm test
npm run validate:v13
npm run check:v13:stage5
npm run build
npm run preview:v13:stage5
```

- `npm run build` builds the V13 Stage 5 site into `dist-stage5/`.
- `npm run preview:v13:stage5` builds a private preview into `preview-v13-stage5/` with `noindex` and a disallowing `robots.txt`.
- `npm run build:legacy` invokes the retained V12-era builder. It writes generated legacy files at the project root and is retained only for comparison/rollback; do not use it for V13 builds.

## Canonical content

- Homepage: `content/v13/homepage.json`
- Global site identity: `content/v13/site.json`
- Wallpaper catalogue: `content/v13/wallpapers.json`
- Album: `content/v13/albums/the-early-bird.json`
- Pages CMS configuration: `.pages.yml`

The Homepage has a fixed `homepage` template identity and is not a repeatable page type. Its desktop gadgets are rendered only for this template. The Album remains a separate reusable template with its dedicated FSFM Media Player.

## Preservation and remaining work

The original root `index.html`, `the-early-bird.html` and root `sitemap.xml` are retained unchanged as legacy reference/rollback files. The V13 output is generated in `dist-stage5/`, not over those files.

The supplied V11/V12 source archives did not contain the real live `media/images` contents, the radio audio file or personal gadget photographs. Paths and references are preserved, but the actual live `media/` directory must be copied from the current repository before final migration and deployment.

Automated tests, content validation, JavaScript syntax checks, HTML parsing and CSS parsing pass. A reliable headless Chromium screenshot run could not be completed in this environment, so visual screenshot sign-off, actual browser interaction/playback checks, and responsive mobile inspection remain part of the final QA stage.

**This is an implementation stage, not a deployment package. Do not upload it as the finished live website yet.**
