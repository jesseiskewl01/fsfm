# V13 Stage 4 — Album template

Stage 4 implements the reusable Album template's first complete rendering path and the dedicated FSFM Media Player.

## What is included

- Album header with full-bleed artwork presentation, eyebrow, title and artist line.
- Amber/gold Album presentation using the existing palette.
- Artist statement section using the shared artist-statement component.
- Dedicated FSFM Media Player with play/pause, previous/next, track selection, seeking, elapsed/duration display, automatic progression and synchronised LRC lyrics.
- Line-wide karaoke lyric fill and instrumental-section handling.
- Spotify album embed and editable label.
- Original aurora/starfield atmosphere with reduced-motion safeguards.
- Route-aware LRC references for the retained `/the-early-bird.html` route and future nested Album routes.
- Non-indexable Album preview output that can still include the actual Spotify embed.

## Build and test

From the project root:

```bash
npm run validate:v13
npm run build:v13:stage4-preview
npm run check:v13:stage4
npm test
```

The Stage 4 preview is written to `preview-v13-stage4/`.

## Important boundaries

- This is an intermediate V13 package, not a production deployment.
- The active root `index.html`, `the-early-bird.html` and V12 build command have not been replaced. The V13 Album is generated as an isolated preview.
- Actual personal images are not present in the source archive. The favicon and Album artwork references are retained, but the live `media/` directory must be brought across during the final migration.
- Browser screenshot QA could not be completed in the current environment because headless Chromium did not start reliably. Automated runtime tests, content validation, generated HTML parsing and CSS parsing passed; visual sign-off remains outstanding.
- Deployment remains manual and under the site owner's control.
