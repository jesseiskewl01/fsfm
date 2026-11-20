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
| Stage 2: performance and runtime investigation | **In progress** | Both Firefox profiles have been reconstructed and analysed; the Early Bird canvas/curtain blur is the leading bottleneck. A read-only V16.9 audit has also identified the Studio preview rebuild and per-refresh Git fetch paths. Controlled timings and A/B validation remain. |
| Stage 3: shared design foundations | Not started | Depends on evidence and deliberate architecture planning. |
| Stage 4: content architecture | Not started | Shared definitions for editor, validation and rendering. |
| Stage 5: FSFM Studio | Not started | Develop the custom Studio as the primary editing application. |
| Stage 6: integration and migration | Not started | Integrate carefully without losing existing behaviour. |
| Stage 7: final QA and production readiness | Not started | Regression, publishing and performance verification. |

### Repository and branch context

- The Firefox chunk-upload branch is `firefox-recording-chunks`.
- Chunk commit: [`260e1c46099bda1f8256abb45bd44f3d6828f303`](https://github.com/jesseiskewl01/fsfm/commit/260e1c46099bda1f8256abb45bd44f3d6828f303).
- The initial upload commit added the 23 chunk files; subsequent commits on this branch maintain these handover documents and record the profiler analysis. The diagnostic branch has not been merged into `main`.
- The canonical `PROJECT_STATE.md` and `PROJECT_LOG.md` updates in this handover are on `firefox-recording-chunks`, not `main` or `v16-tinacms-prototype`.
- A separate, unvalidated experiment exists on `performance/early-bird-canvas-no-blur` (commit `5c116236ebdf378d1d0bf006fc93ee91064b5e2e`). It removes the two per-frame curtain blur filters, but has not been safely previewed, benchmarked or deployed.
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
| Studio preview rebuilds | A content PUT schedules a full preview/draft build after a 300 ms debounce; the browser reloads the iframe after a fixed 1.1 seconds. | Confirmed code path; no build-duration measurement or completion handshake. A race is possible if the build outlasts the fixed delay. |
| Preview caching | The local server sends `Cache-Control: no-store` for every static file and API response; each iframe reload also adds a timestamp query. | Confirmed cache-bypass behaviour; actual transfer/reload cost remains unmeasured. |
| Publishing status | Every `/deploy/status` request runs `git fetch origin main`; the UI requests status at startup and after several editing actions, including local saves. | Confirmed code path; `saveLocal()` awaits the status refresh, so remote Git latency can delay the save UI. The final deploy independently rechecks status. Runtime duration remains unmeasured. |
| Ambient animation | Homepage canvas and Early Bird atmosphere use separate animation loops and drawing work. | Profile frame cost and real-world impact; do not remove effects wholesale. |
| Shared CSS | The audited `v13.css` was approximately 46 KB. | Size alone does not establish a performance problem. |

### Studio preview and publishing path audit

Read-only inspection of the audited V16.9 source on `v16-tinacms-prototype` confirmed:

- `scripts/dev-tina-preview.mjs` builds the private preview by spawning `scripts/build-v13.mjs --preview --include-drafts`. Every content write schedules a full rebuild after a 300 ms debounce. The build removes and recreates `preview-v13`, validates the site, renders all preview pages, copies CSS/JS and media/lyrics, and writes sitemap/robots files.
- The Studio frontend waits a fixed 1,100 ms after a successful save, then hides the preview loading overlay and reloads the iframe. The server does not return a build-completion token or expose an explicit preview-ready signal. Given the 300 ms debounce, only about 800 ms remain between scheduled build start and the iframe reload; a slower build can race the refresh, while a faster build still incurs the fixed wait.
- The local server uses `Cache-Control: no-store` for static files and JSON responses. The iframe adds a new `studioPreview=Date.now()` query on each reload. This guarantees fresh responses but also prevents browser reuse of otherwise unchanged preview assets. The actual bytes transferred and reload cost have not been measured.
- `/__fsfm/api/deploy/status` calls `publisher.getStatus()`; this calls `inspectMain()`, which performs a remote `git fetch` of `origin/main` with a 180-second command timeout. The Studio requests status on startup and after local page saves, page creation, lyric saves, asset uploads and publishing.
- The normal `saveLocal()` path awaits `refreshPublishStatus()` before its `finally` block clears the saving state. The remote status check therefore sits on the local-save UI completion path, even though the content has already been written to disk.
- The actual `deploy()` operation independently calls `getStatus()` again before creating a temporary worktree and pushing. This means the UI status can potentially use a short-lived cached/background check while preserving a fresh mandatory remote check at deployment time.

This is confirmed source behaviour, not yet a measured performance result. The current preview and publisher tests verify viewport controls, browser script validity and publishing safety; they do not benchmark build duration, preview readiness races, cache transfer cost or remote fetch latency. The server's loopback-only binding should be preserved.

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
- Deeper call-stack traversal now shows Firefox's native Skia ThreeBoxApproxPass::blurSegment frames immediately under the Early Bird page's drawCurtain() and drawAurora() JavaScript frames. The same page-specific sample data places drawAurora in 83.6% and drawCurtain in 78.6% of site-thread samples, and the blur routine in 26.8%. This is strong code-path evidence that curtain drawing/blur is a leading bottleneck candidate. It does not distinguish every Canvas API operation or establish an exact CPU percentage.
- The captured `album-bloom-breathe` CSS animation used compositor-eligible `transform` and `opacity`; bloom is currently a lower-priority main-thread suspect.
- No performance bottleneck has been declared fully confirmed and no performance change has been deployed.

The real Firefox profile remains the meaningful test case because it reflects the user's actual browser environment. Preserve that scenario. A clean-profile run may be useful as a comparison, but must not replace the real-profile evidence or be treated as the only valid test.

## Immediate priority: NEXT ACTION

**Close Stage 2 with repeatable measurements and controlled validation.**

1. Establish a safe, non-production preview route for the no-blur Early Bird experiment. The current Pages workflow deploys only main; do not overwrite production or merge an unverified branch to get a test URL.
2. Compare the current Early Bird page with the no-blur experiment in the same Firefox profile and on the same machine. Record event latency, long tasks, sampled blur/canvas work and visual quality.
3. Instrument or time the Studio preview builder. Measure the full preview build duration and determine whether the fixed 1,100 ms iframe refresh can race the rebuild. Replace the fixed wait only after a repeatable completion signal is designed.
4. Measure the cost of no-store preview asset delivery and evaluate selective revalidation/caching without allowing stale HTML or assets.
5. Measure the remote Git fetch in Studio status refresh. Consider moving non-critical status refresh off the local-save critical path, while retaining the mandatory fresh getStatus() preflight inside deploy().
6. Record Stage 2 conclusions and prioritised changes. Then begin Stage 3 shared design foundations, using the existing V16 registries and Stage 1 audit rather than rebuilding the content pipeline.

The Early Bird canvas/curtain blur is the leading high-confidence performance candidate. The Studio preview race and status-fetch behaviour are confirmed code paths but have not yet been measured in runtime. No optimisation has been deployed.

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
