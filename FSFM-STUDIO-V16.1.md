# FSFM Studio (V16.1 prototype)

FSFM Studio is a custom local editing workspace built alongside the V16 TinaCMS prototype. Tina remains available at `/admin/index.html`; Studio is at `/studio/`.

## Local use

Keep the V16 local development process running and open http://127.0.0.1:3000/studio/.

The first iteration edits existing album JSON records in `content/v13/albums`. Album identity, presentation, artwork path, artist statement, player settings, track list, Spotify embed, appearance, publishing and SEO are shown together beside an iframe of the actual FSFM page. Save writes the local JSON file and the preview server rebuilds it.

## Save safety

- The API is served by the local preview server, which defaults to `127.0.0.1`.
- Only existing album records can be edited.
- The API validates album template, required identity, stable slug, player tracks and sections.
- Saves include a SHA-256 revision check. Stale edits are rejected rather than silently overwriting newer content.
- The file is replaced atomically with a temporary file and rename.
- Saves affect the local working tree only. They do not commit, push or publish.
- The existing FSFM preview builder remains responsible for rendering pages.
- The Tina admin and schema remain available and unchanged.

## Current limits

This first version covers album content only. It does not yet include click-to-edit overlays, file uploads, Homepage/Vista/Editorial editors or a publish workflow. Artwork paths can be changed, and Tina's existing media uploader remains available in Tina admin. Expand Studio after validating the local album-editing workflow.
