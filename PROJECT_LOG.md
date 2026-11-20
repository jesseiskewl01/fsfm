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
