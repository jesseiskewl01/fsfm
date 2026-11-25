# Fake Space Fog Machine

Static website for Fake Space Fog Machine.

## Production build

```sh
npm install
npm run build
npm run predeploy-check
```

`npm run build` writes the deployable site to `dist/`. The GitHub Pages workflow runs tests, Tina checks, the production build, and the release audit before publishing.

## Local checks

- `npm test` — site tests
- `npm run check:all` — tests, content validation, syntax checks
- `npm run check:tina` — Tina schema/content audit
- `npm run test:tina:local` — local Studio/Tina smoke test; set `TINA_TEST_PORT` to avoid port conflicts
- `npm run preview:v13:drafts` — private local preview including drafts

The publishing source is the generated `dist/` directory deployed by GitHub Actions.
