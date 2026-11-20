# FSFM Project Log

> Chronological record of meaningful project work, discoveries and decisions. The current status and next action live in [PROJECT_STATE.md](./PROJECT_STATE.md).

## Date not recorded: Stage 1 architecture and design audit

**Scope:** Read-only inspection of the implementation on `v16-tinacms-prototype`.

**Outcome:** Audit completed without modifying project files.

**Main finding:** FSFM's content-rendering foundations were reasonably reusable, but the visual and interaction architecture had fragmented.

**Findings recorded:**

- The existing canonical route, validation, component-rendering and template-registry foundations should be preserved.
- Homepage Aero windows and Vista page windows used separate markup, CSS and interaction systems, despite representing the same general window concept.
- Desktop gadgets were a separate component family and should remain distinct.
- The Early Bird had a specialised album/player/atmosphere design that should be preserved rather than forced into a generic page template.
- The custom `/studio/` application should become the primary editing experience. TinaCMS should remain temporary while its role is assessed, avoiding two competing authoritative editors.
- Content definitions should increasingly drive editing, validation and rendering from shared sources.
- Performance concerns were recorded as investigation targets, not confirmed bottlenecks.

**Architectural direction established:** unify Vista window chrome and behaviour around the homepage Aero reference; preserve the Vista, Early Bird and Editorial visual identities; make Studio the primary authoring application; share content definitions where practical.

**Implementation status:** No CSS, renderer, interaction code, routes or production files were changed as part of the audit.

## 2026-11-20: Firefox recording chunk preparation and upload

**Purpose:** Make the large Firefox recordings retrievable in smaller pieces while preserving their exact bytes.

**Work completed:**

- Split the six original Early Bird and Homepage recording parts into 23 binary chunks, targeting a maximum of 4 MiB per chunk.
- Left the six original recording files untouched.
- Reconstructed all six original files locally from the chunks.
- The user reported that all six SHA-256 comparisons passed.

**Git commit:** [`260e1c46099bda1f8256abb45bd44f3d6828f303`](https://github.com/jesseiskewl01/fsfm/commit/260e1c46099bda1f8256abb45bd44f3d6828f303)  
**Commit message:** `Add chunked Firefox performance recordings`  
**Branch:** `firefox-recording-chunks`

GitHub verification on 2026-11-20 confirmed that the branch exists and is one commit ahead of `main`, containing the 23 new chunk files.

**Still outstanding:** Retrieve the chunks into the analysis environment, reconstruct the six recordings there, verify the bytes, and inspect the actual profiler evidence. No performance conclusions have been drawn yet.

## 2026-11-20: Project continuity documents established

**Decision:** Establish `PROJECT_STATE.md` as the current source of truth and `PROJECT_LOG.md` as the chronological record.

**Reason:** Project decisions and current work must survive conversation changes without reconstructing the project's history from old chats.

**Maintenance rule:** Update the state document after meaningful work; append to the log for significant discoveries, decisions and milestones. Do not log every routine commit.
