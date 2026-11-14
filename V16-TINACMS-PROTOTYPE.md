# V16 TinaCMS prototype

This prototype is isolated on the v16-tinacms-prototype branch. It does not change the production website or the GitHub Pages deployment workflow.

## Current scope

- Tina's framework-agnostic editor is configured for the existing content/v13/albums/*.json files.
- The existing FSFM album record format is preserved. The schema models identity, album metadata, player/tracks, page sections, appearance, publishing and SEO.
- Tina's repository media store uploads album artwork into the existing media/images directory.
- The Tina admin is generated into the ignored local admin/ folder.
- The FSFM draft preview is generated separately into preview-v13/. This prevents preview builds from erasing the Tina admin.
- The local preview server watches content folders and rebuilds the preview after an edit is saved.
- The first milestone tests the basic editor and file persistence. It does not yet implement Tina's native click-to-edit overlays or a true side-by-side live visual editor.

## Run locally

From a local clone of the repository:

~~~bash
git fetch origin
git switch v16-tinacms-prototype
npm run dev:tina
~~~

Open:

- FSFM preview: http://localhost:3000/
- Tina editor: http://localhost:3000/admin/index.html

The first run downloads the Tina CLI through npx. No TinaCloud token is required for local mode.

## Local mode versus TinaCloud

In local mode, Tina saves changes directly into the files in the local working tree. Those changes are not automatically committed or pushed to GitHub. Review them with git status, then commit and push the prototype branch normally.

For TinaCloud mode, create a local .env file from .env.example and fill in the Client ID and read-only token from the TinaCloud project. Do not commit .env. Keep TINA_BRANCH=v16-tinacms-prototype while testing so Cloud edits cannot target main.

The TinaCloud project must also be configured to use the prototype branch. The config defaults to v16-tinacms-prototype, but an explicit TINA_BRANCH environment value takes precedence.

## Validation still required

1. Confirm Tina's CLI accepts the album schema and indexes The Early Bird.
2. Edit a harmless album field and save.
3. Confirm the JSON file changes without removing existing fields.
4. Confirm the local preview rebuilds and displays the change.
5. Test an image upload and verify that it lands in media/images.
6. Only after those pass, expand the schema to Homepage, Vista and Editorial pages.
7. Investigate a custom live-preview bridge separately. Tina's official live visual editing is documented for React-based frameworks and Astro; FSFM is a custom Node-rendered static site.

## Safety rails

- Do not merge this branch into main during the prototype.
- Do not change the production deployment workflow as part of this test.
- Do not remove .pages.yml or the Pages CMS setup until a replacement has been proven.
- Keep the FSFM validator and production build as the final authority on valid content.
