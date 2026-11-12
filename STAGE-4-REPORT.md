# Stage 4 completion report — Album template

## Status

**Implemented as an isolated V13 Album preview. Not yet deployed or wired as the active production build.**

## Implemented

1. Replaced the Stage 3 Album-player placeholder with the dedicated FSFM Media Player.
2. Migrated the Album hero/header, statement, Spotify embed and amber/gold presentation into the V13 component renderer.
3. Added the original aurora/starfield atmosphere script with reduced-motion support.
4. Added the player runtime for transport controls, track selection, seeking, timestamps, automatic progression, LRC parsing and synchronised line-wide lyric highlighting.
5. Added instrumental handling for the instrumental track, including avoiding unnecessary lyric-file requests.
6. Kept the existing public route `/the-early-bird.html` and the original track/audio/LRC associations.
7. Added a build script for an isolated, noindex Stage 4 preview. Preview indexing policy is independent from whether a third-party embed is rendered.

## Verification

- `npm run validate:v13`: passed. It reports 2 canonical page records, 7 Album tracks and all referenced LRC files found.
- `npm run build:v13:stage4-preview`: passed. Generated one Album preview page.
- `npm run check:v13:stage4`: passed all JavaScript syntax checks.
- `npm test`: **43 tests passed, 0 failed**.
- CSS parsed successfully with PostCSS.
- Generated Album HTML parsed successfully with Python's HTML parser.
- Player runtime tests exercise initialisation, accessible track buttons, lyric timestamp updates, track selection, instrumental behaviour, play/next and automatic progression.

## Not verified / remaining limitations

- Headless Chromium did not start reliably in this environment, so desktop/mobile browser screenshots and live visual interaction could not be signed off. This is explicitly not claimed as completed.
- The source package contains placeholders rather than the user's real `media/images` assets. Artwork and favicon paths are preserved, but the actual files must be supplied from the live repository before final migration/deployment.
- The hosted Pages CMS screen has not been connected or visually inspected.
- The normal root `npm run build` still runs the legacy V12 builder. Stage 4 uses a dedicated preview build. Switching production to V13 is deferred until the Homepage and remaining templates are migrated and final QA is completed.

## Next stage

**Stage 5 — Homepage migration.** Bring the one-of-one Vista Homepage into the same V13 renderer while preserving its existing hero, desktop gadgets, wallpaper switching, bubbles, window interactions, radio, shutdown transition and all current text/configuration.
