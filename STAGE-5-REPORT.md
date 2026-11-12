# V13 Stage 5 — Verification report

## Result

Homepage migration implemented. The V13 builder renders both the Homepage and `The Early Bird....` Album from canonical V13 records into `dist-stage5/`. The private preview build is generated separately in `preview-v13-stage5/`.

## Fresh verification (2026-11-12)

- **59 / 59** Node tests passed (`npm test`).
- V13 content validation passed: 2 page records, 7 Album tracks and all referenced LRC files found (`npm run validate:v13`).
- JavaScript syntax checks passed for the Homepage renderer, shared renderers and all Homepage/wallpaper client scripts (`npm run check:v13:stage5`).
- `.pages.yml` parsed successfully with PyYAML; top-level sections are `media`, `components`, `content` and `settings`.
- Production and noindex preview builds completed successfully (`npm run build`, `npm run preview:v13:stage5`).
- Both generated pages parsed successfully with Python's HTML parser, in production and preview modes.
- Both production CSS files parsed with zero CSS syntax errors (tinycss2).
- Generated HTML references to local `/assets/` and `/lyrics/` files resolved.
- Both output directories contain `index.html`, `the-early-bird.html`, `robots.txt` and `sitemap.xml`.
- Original root `index.html`, `the-early-bird.html` and root `sitemap.xml` are retained unchanged as legacy reference/rollback files.
- The default `npm run build` targets the V13 builder. The old generator remains available explicitly as `npm run build:legacy` and should not be used for V13 output.

## Homepage functionality represented in V13

- Homepage hero window and dedicated Vista desktop shell.
- Original ten gadget modules: clock, calendar, featured release, picture frame, important dates, sticky note, Barrel Roll, bubble frequency, FSFM Radio and Purble Place shortcut.
- Gadget visibility and configurable text labels.
- Four existing Vista wallpapers and their names/palette values, plus Aurora and custom image rendering.
- Sequential and random wallpaper cycle options, interval, manual controls, custom image fit and focal position.
- Ambient bubble frequency default of 50; zero correctly disables the bubbles.
- Manual radio playback only; no autoplay.
- Purble Place iframe loads only when requested and can be dismissed.
- Configurable shutdown destination.
- Marquee text rendered server-side for crawlable HTML.
- Reduced-motion and page-visibility safeguards.
- Homepage-only gadget rendering; Album pages do not receive the desktop gadget layer.

## Known limitations / not yet verified

- The provided source archives contain placeholder `.gitkeep` files rather than the real live `media/images`, `media/audio` and user-uploaded gadget image files. References and paths are preserved; the live media folder must be merged before final cutover.
- Headless Chromium would not start reliably in this environment. Browser screenshots, responsive visual review, real audio playback and pointer/keyboard interaction QA are not claimed as complete.
- Pages CMS configuration parses, but the hosted Pages CMS editor has not been connected to the user's GitHub repository for visual UI verification.
- Stage 6 still needs the complete repeatable Vista Window and Editorial page workflows. Stage 7 remains for final production integration, media merge, full browser QA and deployment handoff.

## Deployment status

Nothing has been deployed. The original root HTML remains unchanged. V13 output is under `dist-stage5/`; the preview output under `preview-v13-stage5/` has `noindex` and a disallowing `robots.txt`.
