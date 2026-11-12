# FSFM Website V13 — Stage 7 handover

## Status

The V13 production renderer and release checks are complete as a **release candidate**. The exported ZIP does not contain the real live `media/` binaries, but the existing GitHub `main` branch has been inspected and the complete tracked media inventory verified. Merge the V13 source into that existing repository without replacing its `media/` directory, then run the strict pre-deployment check there.

Nothing has been deployed. Deployment remains manual and under the site owner's control.

## What Stage 7 did

- Switched the default `npm run build` command to the unified V13 renderer and the clean `dist/` output directory.
- Added a production audit covering required pages, metadata, canonical URLs, robots, sitemap, duplicate HTML IDs, image alt attributes, iframe titles, safe external links and local asset references.
- Added a strict `predeploy-check` that refuses release when the three known live images are absent.
- Merged the latest live Homepage gadget content into the V13 canonical Homepage record: picture-frame image path, event date/title, sticky-note text and fun-widget toggles.
- Preserved the exact Homepage copy, original Wallpaper names/URLs/palettes, Album page route, seven track names, seven audio URLs and seven LRC associations.
- Ran a Chromium rendering/interaction check at desktop and mobile viewport widths using the generated HTML, CSS and JavaScript. External network requests were blocked in the test environment; audio playback, remote wallpaper downloads and live third-party embeds therefore still need an online check.
- Created screenshot evidence and a machine-readable browser-results file in `qa/`.

## Requirements before deployment

The source archive has placeholder-only `media/` folders. The existing GitHub repository already contains the complete tracked media inventory: the three required images plus `crunchsomenumbers.png`. Preserve the **whole existing `media/` directory** when merging the V13 source. At minimum these paths must exist:

- `media/images/cover.png` — Album artwork.
- `media/images/asadadasdges-removebg-preview.png` — site favicon.
- `media/images/earlybirdcd.jpg` — Homepage picture-frame image.

Do not rename these files or change the references in the canonical content. Preserve any other personal images in the live directory as well.

After restoring media, run:

```bash
npm run predeploy-check
```

That command rebuilds `dist/` and runs the strict release audit. It should exit successfully only when the known required media is present and the structural checks pass.

## Local workflow

Install a current Node.js LTS release, then run:

```bash
npm test
npm run validate:v13
npm run build
npm run audit:v13
```

Useful previews:

```bash
npm run preview:v13
npm run preview:v13:drafts
npm run preview:v13:templates
```

- Production output: `dist/`
- Private preview output: `preview-v13/`
- Template preview pages: `preview-v13/templates/`
- Draft preview output includes unpublished page records only when requested with `--include-drafts`; preview output sets `noindex` and disallows crawler access.

## Deployment

When `npm run predeploy-check` passes, deploy the **contents of `dist/`** to the existing static hosting target. Do not deploy `preview-v13/`, `qa/`, source-only folders or the old V11/V12 HTML as the active site. Keep a backup of the current live site and its complete `media/` directory until the V13 deployment has been checked.

After deployment, verify at minimum:

1. `https://fsfm.port82.net/` loads the Vista Homepage, favicon, wallpaper and picture frame.
2. `https://fsfm.port82.net/the-early-bird.html` loads the album artwork and Spotify embed.
3. All seven album tracks can play; lyrics follow the correct audio and instrumental handling remains correct.
4. Homepage radio is still manual-play only; gadget visibility and wallpaper cycling work.
5. Mobile navigation and page layouts work on a real phone.
6. The live Pages CMS editor can read and write the V13 canonical content records in the connected Git repository.
7. Sitemap, canonical tags, robots and social previews are correct on the live domain.

## Important limits of this handover

- The original media binaries were not copied into this exported ZIP. Their presence, exact paths, sizes and Git blob SHAs were verified in `jesseiskewl01/fsfm` on `main`; see `LIVE-MEDIA-VERIFIED.json` and `LIVE-MEDIA-MERGE.md`.
- The Pages CMS YAML configuration was parsed and structurally checked locally, but the hosted Pages CMS interface was not connected to the repository for visual end-to-end verification.
- Chromium tested the generated HTML/CSS/JavaScript in an in-memory page. The environment blocked network navigation and external resource requests, so this does not certify real hosted audio, third-party embeds or remote image delivery.
- The automated strict media gate currently checks the three known required image paths. The full live media folder must still be preserved during the merge.

See `STAGE-7-REPORT.md` for the exact test and audit results, and `LIVE-MEDIA-MERGE.md` for the asset restoration checklist.
