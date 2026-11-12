# Live media merge — verified V13 handoff

## Verified source

The existing GitHub repository `jesseiskewl01/fsfm`, branch `main`, was inspected on 2026-11-12. Its `media/` tree contains exactly these tracked entries:

| Path | Size | Purpose |
|---|---:|---|
| `media/.gitkeep` | 1 byte | Media directory marker |
| `media/images/asadadasdges-removebg-preview.png` | 238,413 bytes | Site favicon |
| `media/images/cover.png` | 2,150,667 bytes | Album and featured-release artwork |
| `media/images/crunchsomenumbers.png` | 103,626 bytes | Additional personal image; preserve |
| `media/images/earlybirdcd.jpg` | 67,364 bytes | Homepage picture-frame photo |

The exact inventory and Git blob SHAs are recorded in `LIVE-MEDIA-VERIFIED.json`.

## Important: merge, do not replace

The V13 source archive intentionally contains placeholder-only media folders. The original image bytes are already present in the existing GitHub repository; they are absent only from this exported ZIP.

When merging this package into a local clone of `jesseiskewl01/fsfm`:

1. Keep the existing `media/` directory intact. Do not delete it, replace it with the archive's placeholder folder, rename files, or flatten its structure.
2. Copy the V13 source/configuration files into the repository, excluding the archive's `media/` directory. Preserve any other local changes you have made.
3. From the repository root, run `npm test`, `npm run validate:v13`, and `npm run predeploy-check`.
4. The V13 build script copies the repository's entire `media/` directory into `dist/media/`. The strict check should therefore see the three required files when run in the merged repository.
5. Inspect `dist/media/` and confirm all four tracked images are present before considering deployment.

Example safe copy from an extracted package directory into an existing repository (run from the package directory):

```bash
rsync -av --exclude='media/' ./ /path/to/existing/fsfm/
```

Review the destination and your own changes before proceeding. Do not deploy the ZIP's existing `dist/` as-is: it was built in an environment without the live image bytes. Rebuild in the merged repository.

## Release boundary

Nothing has been committed, pushed, or deployed by this handoff. Manual deployment remains under the site owner's control. Deploy only the contents of the freshly generated `dist/` after `npm run predeploy-check` passes, and complete the hosted Pages CMS and online audio/embed checks first.
