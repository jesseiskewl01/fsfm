# FSFM Project State

 > Last updated: 2026-11-20  
> This is the current project handover and source of truth. The chronological record of meaningful changes and decisions is in [PROJECT_LOG.md](./PROJECT_LOG.md).

## At a glance

**FSFM is an architectural unification project. It is not primarily a CMS migration.** The goal is to preserve the good parts of the existing content/rendering pipeline, unify duplicated visual and interaction architecture, and build FSFM Studio into the primary authoring experience.

The public site must retain three distinct visual identities:

- **Vista:** authentic Aero windows, glass surfaces and desktop-like interactions.
- **The Early Bird:** its warm amber atmosphere, album-focused presentation and specialised music player.
- **Editorial:** typography-led content and flexible, quieter layouts.

The engineering should become more coherent without making those experiences look identical.

## Current status

| Area | Status | Notes |
|---|---|---|
| Stage 1: architecture and design audit | **Complete** | Read-only audit; no implementation changes were made during the audit. |
| Stage 2: performance and runtime investigation | **In progress** | All 23 chunks have been retrieved; both profiles reconstruct and parse. First comparative profiler pass is complete; task ownership and controlled A/B validation remain. |
| Stage 3: shared design foundations | Not started | Depends on evidence and deliberate architecture planning. |
| Stage 4: content architecture | Not started | Shared definitions for editor, validation and rendering. |
| Stage 5: FSFM Studio | Not started | Develop the custom Studio as the primary editing application. |
| Stage 6: integration and migration | Not started | Integrate carefully without losing existing behaviour. |
| Stage 7: final QA and production readiness | Not started | Regression, publishing and performance verification. |

### Repository and branch context

- The Firefox chunk-upload branch is `firefox-recording-chunks`.
- Chunk commit: [`260e1c46099bda1f8256abb45bd44f3d6828f303`](https://github.com/jesseiskewl01/fsfm/commit/260e1c46099bda1f8256abb45bd44f3d6828f303).
- GitHub comparison on 2026-11-20 confirmed that this branch is one commit ahead of `main`, with the 23 chunk files added.
- Its base was `main` at `43066f6d1cb1cac1022b260761d975b2f6ecb0d6`.
- **Important:** the Stage 1 implementation audit was performed against `v16-tinacms-prototype`. The Firefox chunk branch is an evidence-transfer branch based on `main`; do not assume those are the same code snapshot. Re-check the intended implementation branch before making architectural changes.
- The remote commit is verified. The local working-tree status has not been independently checked by this document.

## Project mission and architectural direction

### Preserve the foundations that already work

The Stage 1 audit identified useful existing foundations:

- `page-routes.mjs` for canonical routes.
- `page-validator.mjs` for content validation.
- `components.mjs` for rendering reusable content blocks.
- `registry.mjs` and `templates/registry.mjs` for component and template availability.
- The existing content JSON and static-rendering pipeline.

These are foundations to evolve, not reasons to rebuild the whole site.

### Unify the visual and interaction architecture

The central Stage 1 finding was that the content-rendering architecture is reasonably reusable, while the visual and interaction layers have fragmented.

The audit identified three relevant systems:

1. Homepage Aero windows using structures such as `.aero-window`, `.content-window`, `.titlebar` and `.window-body`, with `homepage-vista.css` as the canonical visual reference.
2. Vista page windows using a separate `.vista-window-frame` structure, styles in `v13.css`, and a separate controller in `vista-windows.js`.
3. Homepage desktop gadgets using their own `.fsfm-gadget` component family and positioning logic.

**Working direction:** use the homepage Aero window appearance as the visual source of truth for Vista window chrome, then move toward one shared window renderer, stylesheet layer and interaction controller. Preserve context-specific behaviour: for example, the homepage hero may trigger a desktop shutdown, while a normal Vista page window may close to a restore dock.

Desktop gadgets remain their own component family. They may share lower-level utilities where appropriate, but they are not to be collapsed into the window component.

### Preserve three distinct visual identities

Share implementation where it is genuinely useful; do not flatten the designs.

- Vista keeps its Aero/glass language and desktop interactions.
- The Early Bird keeps its album-specific hero, artwork, player, synchronised lyrics, atmosphere, typography and amber palette.
- Editorial keeps its typography-led identity and flexible content layouts.

The Early Bird should not become a generic Vista window with an amber stylesheet. Editorial should not become a glass-panel layout.

### Make FSFM Studio the primary editing application

The custom application at `/studio/` is the intended primary FSFM authoring experience. TinaCMS at `/admin/` may remain a temporary development surface while its value is assessed, but the project should not grow two competing authoritative editors for the same content.

The Stage 1 audit recorded that:

- Studio already handles areas including homepage, pages, wallpapers, albums and publishing.
- Its then-current interface used page navigation, a JSON-oriented editor and an iframe preview.
- Tina's configuration then covered an Albums collection, with deletion disabled.
- Studio was a very large single HTML document (approximately 95,766 characters in the audited snapshot).

These are findings from the audited snapshot, not a claim that the current branch has been rechecked.

The intended Studio direction includes contextual editing controls, asset management, live preview, direct component selection, responsive preview, undo/recovery, save state and publishing controls. Prefer an appropriate visual control for the data being edited rather than exposing arbitrary JSON wherever practical.

### Establish shared content definitions

Schemas, editor controls, validation rules, component definitions and rendering registries should derive from shared definitions wherever practical. Avoid independently maintained option lists and rules that can drift apart.

## Stage 2: performance and runtime investigation

Stage 2 must be evidence-led. The Stage 1 audit identified candidate areas to measure, not confirmed defects:

| Investigation target | Why it was flagged | Current conclusion |
|---|---|---|
| Studio preview rebuilds | Content changes appeared to invoke a preview/draft build, followed by a fixed 1.1-second wait and iframe reload. | Candidate for measurement; not yet proven to be a bottleneck. |
| Preview caching | The audited local preview server used `Cache-Control: no-store`. | Measure the network/reload cost before changing it. |
| Publishing status | The audited publishing inspection performed a Git fetch against `origin/main`. | Establish how often it runs and its actual impact. |
| Ambient animation | Homepage canvas and Early Bird atmosphere use separate animation loops and drawing work. | Profile frame cost and real-world impact; do not remove effects wholesale. |
| Shared CSS | The audited `v13.css` was approximately 46 KB. | Size alone does not establish a performance problem. |

### Firefox recording evidence

The user supplied six original recording parts:

- `earlybird-rec_part1.txt`
- `earlybird-rec_part2.txt`
- `earlybird-rec_part3.txt`
- `homepage-rec_part1.txt`
- `homepage-rec_part2.txt`
- `homepage-rec_part3.txt`

The originals were split locally into **23 binary chunks**, with a maximum target size of 4 MiB per chunk, and committed on `firefox-recording-chunks` in commit `260e1c4`.

The six originals were reconstructed locally from the chunks and their SHA-256 hashes were reported as matching across all six files. The original files were left untouched. The exact hash values were not recorded in the project log.

**Retrieval and first-pass analysis completed on 2026-11-20:**

- All 23 chunk blobs were retrieved through GitHub's Git Blobs endpoint and grouped in numeric order.
- The three Early Bird parts and three Homepage parts were each concatenated into valid Firefox Profiler JSON. This analysis pass confirmed that both profiles parse. The user's earlier local SHA-256 comparisons remain the recorded integrity check; the analysis environment did not recompute those hashes.
- The first separate analysis pass measured page-specific DOM event latency, site-process long-task markers, CSS animation properties and native sampled call names. The detailed observations and limitations are in `PROJECT_LOG.md`.
- The Early Bird profile recorded 160 site-process `MainThreadLongTask` markers in 37.74 seconds; the Homepage profile recorded two in 45.98 seconds. These are separate, uncontrolled capture windows, not a formal A/B comparison.
- The Early Bird page's DOM event p95 was 127.6 ms (174 events above 50 ms; 116 above 100 ms). The Homepage page's DOM event p95 was 25.1 ms in its separate capture.
- The Early Bird process profile includes native Skia blur/raster samples. Combined with the user's A/B observation that hiding the atmosphere canvas substantially improved responsiveness, this makes canvas raster work the leading hypothesis. Exact element-to-stack attribution is not yet proven.
- The captured `album-bloom-breathe` CSS animation used compositor-eligible `transform` and `opacity`; bloom is currently a lower-priority main-thread suspect.
- No performance bottleneck has been declared fully confirmed and no performance change has been deployed.

The real Firefox profile remains the meaningful test case because it reflects the user's actual browser environment. Preserve that scenario. A clean-profile run may be useful as a comparison, but must not replace the real-profile evidence or be treated as the only valid test.

## Immediate priority: NEXT ACTION

**Close Stage 2 with page/task attribution and a repeatable performance comparison.**

1. Inspect the Early Bird `MainThreadLongTask` intervals and the available marker/stack context to establish which work belongs to the album page, the homepage, or shared browser/content-process activity. Keep process-wide evidence distinct from page-specific event markers.
2. Identify whether the Skia `ThreeBoxApproxPass::blurSegment` samples are being driven by the atmosphere canvas filters, other CSS effects, or unrelated rendering work. The current source has two curtain blur filters per frame; this is a strong candidate, not proof of attribution.
3. Establish a preview/testing route for feature branches. The existing Pages workflow deploys production from `main`; do not use the production site as a casual branch-preview target.
4. Run separate, repeatable comparisons for the canvas, curtain blur, grain and bloom. Keep the test environment, browser and interaction sequence as consistent as possible, and record event latency, long tasks and sampled rendering work.
5. Decide which changes are justified, retain visual quality where possible, and document the outcome before closing Stage 2.

The separate `performance/early-bird-canvas-no-blur` branch is an unvalidated experiment only. Do not merge it into `main` until a safe preview or controlled validation exists.

**Next major programme after Stage 2:** Stage 3, shared design foundations. This is the substantial architecture task: establish a token/foundation layer and reusable primitives that support Vista, Early Bird and Editorial without flattening their identities. Stage 1's audit and the existing registries are the starting point; do not rebuild the content pipeline.

## Working rules

- Do not make speculative performance fixes. Measure first.
- Do not make reckless changes to `main`.
- Before refactoring, verify the current implementation branch and re-inspect the relevant code.
- Preserve existing functionality and the three visual identities.
- Do not delete files or systems without understanding dependencies and migration requirements.
- Keep the static public website and the authoring environment separate, connected through shared definitions and carefully chosen shared components.
- When reporting findings, label what is directly observed, what is inferred and what remains unknown.

## How to maintain project continuity

- Update this file after each meaningful task or stage, especially the status, blockers and **NEXT ACTION**.
- Append to `PROJECT_LOG.md` when a significant change, discovery or decision occurs. Include the date, reason, outcome and commit when known.
- Do not add a log entry for every routine commit.
- Before ending a substantial work session, leave the repository state and the next concrete action understandable without needing the conversation history.

**Git history records what changed. This file records what it means.**
