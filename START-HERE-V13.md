# START HERE — FSFM Website V13 source overlay

This ZIP is designed to be merged into your EXISTING `jesseiskewl01/fsfm` repository. Its paths are already rooted at the repository root; do not create a new subfolder for it.

## Preserve these existing repository items

The archive intentionally omits the following because they already exist in your repository and must be retained:

- `media/` — keep the entire folder, including all four original images under `media/images/`.
- `audio/` — keep the entire folder, including all seven original album OGG files and `groovy.mp3`.
- `CNAME` — keep your custom-domain configuration unchanged.
- `google47366a80744746e8.html` — keep your Google site-verification file unchanged.
- `dist/` — generated output; it is intentionally omitted and must be regenerated from the merged source.

Do not delete or empty any of those paths when applying this update.

## Apply the update

1. Make a backup of your current repository.
2. Extract this ZIP directly into the root of your existing `fsfm` repository.
3. Overwrite/replace matching project files when prompted.
4. Leave the preserved folders and files listed above untouched.
5. Commit/push the merged project files to your existing repository.

The archive contains the V13 source, CMS configuration, canonical page records, shared components, templates, build scripts, tests, documentation, QA evidence and the seven original LRC files.

## Verify after merging

Run these commands from the repository root, where the original `media/` and `audio/` folders are still present:

```bash
npm test
npm run validate:v13
npm run check:all
npm run build
npm run predeploy-check
```

`npm run predeploy-check` should pass once the existing `media/` folder has been preserved. If it reports a missing image, stop and check that the media folder and exact original filenames are still present.

## Deployment boundary

Do not deploy the repository root or any preview/QA folders as the production site. After the CMS and external services have been checked, deploy the **contents of the freshly generated `dist/` directory** to the existing hosting target.

No deployment is performed by this package. Deployment remains manual and under the site owner's control.

## What still needs live verification

- The hosted Pages CMS editor must be checked while connected to the actual repository.
- Real hosted OGG playback, synchronised lyrics, Spotify/Bandsintown embeds, remote wallpaper delivery and the live mobile experience need online smoke tests.
