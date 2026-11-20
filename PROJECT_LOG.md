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


## 2026-11-20: Firefox profiler recordings reconstructed and first-pass analysis completed

**Purpose:** Complete the retrieval step in Stage 2 and replace assumptions about the performance problem with evidence from the user's actual Firefox captures.

**Retrieval and reconstruction:**

- Retrieved all 23 chunk blobs from `firefox-recording-chunks` using GitHub's Git Blobs endpoint. The GitHub contents endpoint returned an empty payload for a large chunk, so it was not used for the full reconstruction.
- Reassembled the three Early Bird parts and the three Homepage parts in numeric chunk order. Joining the three parts for each profile produced valid, parseable Firefox Profiler JSON.
- This analysis pass independently confirmed that both reconstructed profiles parse and contain the expected profile structure. It did **not** recompute the original local SHA-256 checksums; the earlier user-reported checksum comparisons remain the recorded byte-integrity check.
- Both recordings were made on 2026-11-07 in Firefox 159 on Windows 10, using an Intel Core i5-6500 @ 3.20 GHz (4 physical/logical cores). The captures represent different time windows and are not a controlled benchmark pair.

**Early Bird recording:**

- Profile duration: 37.74 seconds.
- The `port82.net` content-process GeckoMain thread contained 13,726 samples and 17,222 markers.
- The Early Bird page's own inner-window markers contained 1,848 DOM event records. Recorded event latency had a 127.6 ms p95; 174 events exceeded 50 ms, 116 exceeded 100 ms, and the maximum was 535.2 ms.
- The same content-process thread recorded 160 `MainThreadLongTask` markers during the profile window: 152 exceeded 100 ms, 62 exceeded 200 ms, one exceeded 500 ms, and the longest was approximately 861.3 ms.
- Important attribution limit: the long-task markers are recorded on the shared content-process thread and are not tagged with the page's inner-window ID. The profile contained both the Homepage and Early Bird page contexts, so the 160 process-level tasks cannot honestly be labelled as 160 tasks caused exclusively by the album page.
- Native samples included Skia's `ThreeBoxApproxPass::blurSegment` implementation: 460 self samples (3.4%) in its blur lambda and 272 (2.0%) in the blur function, plus other pixel conversion/copy routines. This is direct evidence of notable native raster/blur work in the site content process, but the available stack data does not identify the exact DOM element or drawing call responsible.
- The page recorded the `album-bloom-breathe` CSS animation on `transform` and `opacity`, both marked as compositor-eligible. That makes it a weaker candidate for the main-thread stalls than the canvas/raster path, although it does not rule out all compositor/GPU cost.

**Homepage recording:**

- Profile duration: 45.98 seconds.
- The `port82.net` GeckoMain thread contained 19,196 samples and 105,825 markers.
- The active Homepage page context contained 9,796 DOM event records. Recorded event latency had a 25.1 ms p95; 28 events exceeded 50 ms, 16 exceeded 100 ms, and the maximum was 313.9 ms.
- Two `MainThreadLongTask` markers were recorded on the site content-process thread, at approximately 80.3 ms and 120.4 ms.
- This capture is a separate user/session interval, not a controlled A/B run. The numbers establish a useful contrast, not a formal performance ratio.

**Combined interpretation:**

- The Early Bird capture shows substantially worse observed main-thread responsiveness than the Homepage capture, but the capture conditions differ and process-level task attribution is incomplete.
- The leading investigation target is the Early Bird atmosphere canvas and its repeated raster work. The production source in `src/client/album-atmosphere.js` draws each curtain with `ctx.filter = 'blur(13px)'` and `ctx.filter = 'blur(4px)'` on each animation frame. The profiler's Skia blur samples and the user's qualitative A/B test (hiding `.album-atmosphere` helped substantially; hiding grain helped slightly; disabling the bloom vignette helped only marginally) point in the same direction.
- This is a **strong hypothesis, not yet a proven one-to-one attribution**. The Skia symbols do not prove that every blur sample came from those canvas filters, and the long-task markers do not carry page-level ownership.
- Bloom should be deprioritised as the primary main-thread cause. Its captured CSS animation was compositor-eligible, and the user's A/B result was only marginal.
- No optimisation was merged to `main` or deployed as part of this analysis.

**Separate experimental branch:** `performance/early-bird-canvas-no-blur` contains a test change that removes the two per-frame curtain blur filters. It is not a validated benchmark result and is not deployed. Keep it separate until a preview or controlled test can compare it against the production source.

**Next work:** Finish Stage 2 by correlating the long-task intervals with usable task/stack evidence, identifying the most likely owner of the Skia blur work, and setting up a repeatable A/B measurement path. Test canvas visibility, curtain blur, grain and bloom independently; record frame/input responsiveness and profiler results. Do not merge speculative changes into `main`. Once the evidence is sufficiently closed, proceed to Stage 3: shared design foundations.


## 2026-11-20: Second-pass Early Bird canvas stack attribution

**Purpose:** Follow up the initial profiler pass by traversing parent stacks correctly and checking the sampled work against the actual source implementation.

**Detailed observations:**

- The Early Bird site content thread has 13,726 samples across approximately 37.74 seconds. The relevant page context is the Early Bird route, inner-window ID 8300024299535.
- The site's drawAurora function appears in 11,481 sampled stacks (83.6%); drawCurtain appears in 10,786 (78.6%).
- Firefox's native Skia ThreeBoxApproxPass::blurSegment function appears in 3,679 sampled stacks (26.8%). Representative parent chains are: native blurSegment lambda → native blurSegment → site's drawCurtain → site's drawAurora. This links the native raster/blur work to the Early Bird canvas rendering path much more directly than the first-pass native symbol list did.
- Sample-weighted inclusive totals were approximately 28.6 seconds under drawAurora, 26.8 seconds under drawCurtain and 9.2 seconds under the native blur routine. Inclusive stack weights overlap; these are not independent CPU totals.
- The same site thread's sample-level eventDelay field has p50 110.2 ms, p95 336.1 ms, p99 397.5 ms and maximum 875.5 ms. This is a different profiler field from the page DOMEvent-marker latency distribution in the first-pass entry (Early Bird p95 127.6 ms). Preserve both labels and do not compare them as if they were the same metric.
- In the separate Homepage capture, drawAeroScene appears in 805 stacks with approximately 2.25 seconds of inclusive sample weight across 45.98 seconds. The Homepage site thread's sample-level eventDelay p95 is 4.9 ms, p99 18.1 ms and maximum 108.5 ms; the DOMEvent-marker p95 in the first pass is 25.1 ms. Again, these are separate measures.

**Source correlation:**

- The inspected src/client/album-atmosphere.js blob is identical on main and v16-tinacms-prototype (SHA 97ed887246f3c414dff3279f72a2ee9e4d89a416).
- drawCurtain() sets CanvasRenderingContext2D.filter to blur(13px) and then blur(4px) on successive fill passes. drawAurora() calls drawCurtain() for each curtain on the repeating animation cycle, with the frame loop throttled to approximately 32 ms.
- The direct sampled call chain, the source's two per-curtain blur passes, and the user's manual observation that hiding the atmosphere canvas substantially improves responsiveness reinforce one another. The best current explanation is that the repeated canvas curtain blur is a major contributor on the Early Bird page.
- This is still not a controlled performance comparison. Function-level stacks show the native blur inside drawCurtain(), but do not establish an exact per-API CPU cost or rule out other simultaneous work.

**Experiment boundary:** The performance/early-bird-canvas-no-blur branch removes the two blur filters while leaving the animation loop and other scene elements in place. It remains unpreviewed, unbenchmarked and undeployed. The feature branch must not be merged merely to obtain a test URL.

**Next action:** Build a safe preview/measurement route, then compare the current version and no-blur branch under the same Firefox profile and repeatable interaction sequence. Keep the broader Stage 2 Studio save/preview and publishing-status investigations open.


## 2026-11-20: V16.9 Studio preview and publishing-path audit

**Purpose:** Extend Stage 2 beyond the public-page recordings by tracing the local Studio save/preview and publishing-status paths identified in Stage 1.

**Scope:** Read-only inspection of `studio/index.html`, `scripts/dev-tina-preview.mjs`, `scripts/build-v13.mjs`, `scripts/studio-publisher.mjs`, `package.json` and the related Studio tests on `v16-tinacms-prototype`. No code was modified.

### Preview rebuild path

- The browser saves content through a PUT to the local Studio API. The server validates the record, writes the JSON file atomically and calls `scheduleRebuild()`.
- `scheduleRebuild()` debounces changes by 300 ms. The resulting `buildPreview()` spawns a separate Node process running `scripts/build-v13.mjs --preview --include-drafts`.
- This is a full static preview build, not an incremental page-only rebuild. The build validates all page records, removes and recreates `preview-v13`, renders the preview pages, copies CSS/JS and media/lyrics, and writes sitemap and robots files.
- After the PUT returns, the Studio frontend uses a hard-coded 1,100 ms timeout, then hides the loading overlay and changes the iframe URL by appending `studioPreview=Date.now()`. It does not wait for the server's build to complete, and the server does not expose an explicit preview-ready signal.
- Because the server starts the rebuild after a 300 ms debounce, the frontend's fixed refresh can occur only about 800 ms after the expected build start. If the full build takes longer, the iframe can request files while the preview directory is still being rebuilt. If the build finishes sooner, the interface still waits for the full 1,100 ms. This is a **code-level race/latency risk**, not yet a measured incident.
- The local server sends `Cache-Control: no-store` for every static file and JSON response. The timestamp query on every iframe refresh independently ensures a new document URL. This avoids stale previews but also prevents reuse of unchanged preview CSS/JS/assets. The actual bytes transferred and user-visible reload cost have not been measured.
- The server binds to loopback only (127.0.0.1 by default and rejects non-loopback hosts). Preserve this security boundary.

### Publishing-status path

- The Studio calls `GET /__fsfm/api/deploy/status` through `refreshPublishStatus()`.
- `publisher.getStatus()` invokes `inspectMain()`, which checks the local Git root/branch/remote and then performs `git fetch --no-tags origin +refs/heads/main:refs/remotes/origin/main`. The Git command timeout is 180 seconds.
- The frontend invokes status refresh on initial startup, after a successful page save, after deployment, after creating a page, after saving lyrics and after uploading an asset. It is not a continuous polling loop.
- A normal `saveLocal()` awaits `refreshPublishStatus()` before exiting its saving state. The file has already been saved locally, but the UI remains in its save flow until the remote status request returns.
- Crucially, the actual `deploy()` operation calls `getStatus()` again before creating its temporary worktree and pushing to main. Therefore, a future optimization could decouple the UI's non-critical status display from the local-save completion path while preserving a fresh remote verification immediately before any production publication.
- No actual Git-fetch latency was measured in this audit.

### Existing test coverage

- `test/studio-preview.test.mjs` covers desktop/tablet/mobile viewport dimensions and accessible preview controls.
- `test/studio-browser-script.test.mjs` checks that the inline browser script parses and the shared page-state module is served with the expected JavaScript MIME type.
- `test/studio-publisher.test.mjs` checks publishing safeguards, queued-file scope, branch preservation and failure behaviour.
- These tests do not measure preview build time, the 1,100 ms refresh race, cache transfer cost or Git-fetch frequency/latency.

**Stage 2 interpretation:** two additional measurable candidates are now identified. The preview path has a fixed-delay/readiness race and broad no-store caching; the publishing-status path performs a remote Git fetch on each UI status refresh and is awaited by save operations. Both are confirmed implementation behaviours, but neither is yet proven to be a user-visible performance bottleneck.

**Recommended next validation:** instrument preview build duration and readiness; measure the Git fetch duration in the actual local environment; then design changes around measured results. Preserve a mandatory fresh publishing check inside the final deploy operation. No production code or deployment was changed.
