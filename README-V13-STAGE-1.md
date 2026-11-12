# V13 Stage 1 — Architecture foundation

This is the first implementation stage of the unified FSFM website architecture.

## What's included
- `V13-ARCHITECTURE.md`: the agreed architecture, preservation rules and staged roadmap.
- `content/v13/`: canonical Homepage, Album, site and wallpaper records. These records preserve the current visible wording, Homepage sections/gadget defaults, the four original Vista wallpaper definitions and the seven original Album audio/LRC associations.
- `src/components/registry.mjs`: shared component contract.
- `src/templates/registry.mjs`: Homepage, Album, Vista Window and Editorial template contract.
- `src/core/page-validator.mjs`: shared validation for template, page settings, section compatibility, album track data and route uniqueness.
- `scripts/validate-v13.mjs` and `test/`: runnable validation and regression tests.

## Run the checks

```sh
npm run validate:v13
npm run test:v13
```

## Important: not yet a deployable V13 site
This stage deliberately does **not** change `index.html`, `the-early-bird.html`, `.pages.yml`, or the current V12 build output. The V13 records and registries are not connected to the live renderer or Pages CMS yet. This lets us verify the data contract before changing any visible site behaviour.

The source archive's `media/images/` folder contains only `.gitkeep`, not the live images. Keep the full live media directory when merging later stages.


Stage 2 is documented in `README-V13-STAGE-2.md`. The V13 Pages CMS schema now lives in `.pages.yml`; it replaces the old V12 split editor for the canonical V13 records.
