# FSFM Work Log

> The three-line handover. Updated after each objective so nobody has to reconstruct the conversation.  
> Last updated: 2026-11-21  
> Full plan: `ROADMAP.md` · Precursor plan: `PRECURSOR_ROADMAP.md` · This file: current objective · `archive/`: historical state/log

---

## ✅ Objective just finished

**Orientation and evidence recovery (2026-11-21).**

- Located the real status documents (Jesse remembered them as "status-log / status-report"). Both have been archived to `archive/PROJECT_STATE.md` and `archive/PROJECT_LOG.md` with archival headers.
- Read both in full and reconciled them with Jesse's stated goals.
- Mapped the three local checkouts and their branches (see `ROADMAP.md` §2.5). No files were moved, merged or deleted.
- Verified the building-block system is real: **18 components defined and 18 rendered**, 4 templates registered.
- Confirmed the shell is non-admin (Medium integrity), so no system-level changes are possible without explicit elevation.
- Recorded Jesse's Firefox A/B finding: removing the Early Bird `<canvas>` drastically improved performance.
- Identified that the aurora canvas is **not** a configurable block — it is hardcoded in `page.mjs`.
- Noted that the archived state doc has the Tina/Studio roles backwards. Corrected intent is recorded in `ROADMAP.md` §1 and §2.6; the archived file itself is left as historical.

---

## 📦 Archive operation (2026-11-21)

- Created `C:\Users\jesse\fsfm-main\archive\`.
- Moved `PROJECT_STATE.md` and `PROJECT_LOG.md` into it, added archival headers pointing to `ROADMAP.md` / `WORK_LOG.md`, and updated all references in the live docs.
- Confirmed `v16-tinacms-prototype` is **156 commits ahead of, 0 behind `main`** and is the only checkout with `studio/`, `tina/`, `admin/`, `dist/` → this is THE version.
- The 156 commits were 105+26+25 across 12–14 Nov, mostly tiny content/test/polish commits. Hygiene issue, not divergence. Do not rewrite that history.

**No project source files were modified during this objective.**

---

## 🔄 Objective currently in progress

**Docs relocation + Studio reconnaissance (2026-11-22) — complete on writing.**

- All four planning docs moved into `C:\Users\jesse\fsfm` (untracked on `rv26`) ✅
- `STUDIO_FIX_LIST.md` written in the canonical folder ✅
- Key finding: Studio is a custom app on its own `/__fsfm/api`, **not** a Tina client. Tina config covers albums only. This needs Jesse's decision.
- Key finding: live publishing is locked because `.fsfm-studio-deploy.json` is not on `main`. Intentional gate.
- Key finding: the 1.1 s fixed preview wait (line 918) is still present.
- No tests run, server not started, nothing published.

---

## ✅ Safety net — DONE (2026-11-22)

- Created branch **`rv26`** from `v16-tinacms-prototype` in `C:\Users\jesse\fsfm`.
- Committed the six previously-unsaved files onto `rv26` as `245439b` — "Preserve in-progress content and Studio work on rv26" (6 files, 270 insertions, 12 deletions).
- Working tree is now **clean**. `v16-tinacms-prototype` is untouched.
- Git line: `rv26` → `245439b` → `8386c1d` (old prototype tip).

---

## ✅ Decisions made 2026-11-22 (Jesse)

- **TinaCMS is the actual content backend. Studio must call it.** (Second option in `STUDIO_FIX_LIST.md` §5.)
- **Order corrected:** building blocks / architectural consolidation come **before** Studio. The mud-hut analogy — refurbish homepage and Early Bird into the same concrete as the 18 blocks first; Studio is the final layer on top.

`PRECURSOR_ROADMAP.md` and `STUDIO_FIX_LIST.md` have both been corrected.

---

## ⏭️ What comes next

**Roadmap Phases 3–5 — the building blocks first.**

1. Make homepage and Early Bird genuinely assembled from the shared 18 blocks; remove monolithic special-case rendering.
2. Promote the aurora canvas into a configurable block with an on/off control.
3. Single-source content definitions (editor controls, validation, rendering).
4. **Only then** build Studio as a real client of Tina.

Studio work is explicitly parked until the above is done. The aurora measurement (Roadmap Phase 1) is folded into item 2 above.

---

## History

| Date | Objective finished | Started next | Notes |
|---|---|---|---|
| 2026-11-21 | Orientation, evidence recovery, continuity docs | Precursor plan + safety net | First session with Jesse; goals confirmed, version decision answered with evidence |
| 2026-11-21 | Precursor roadmap, archive operation | Precursor Step 0 (safety net) | `ROADMAP.md` preserved; `PRECURSOR_ROADMAP.md` added; state/log archived |
| 2026-11-22 | Safety net: `rv26` branch + commit `245439b` | Docs relocation, then Studio recon | Six unsaved files preserved; working tree clean; prototype untouched |
| 2026-11-22 | Docs moved to canonical folder; `STUDIO_FIX_LIST.md` written | Jesse decides Tina's role, then local smoke test | Studio is a custom app, not a Tina client; publish gate discovered |
| 2026-11-22 | Tina role + order decided by Jesse | Roadmap Phases 3–5: blocks first, Studio last | Tina is the real backend; Studio must call it; mud-hut refurbishment comes first |

---

## Maintenance rule

After each objective: move its summary into **Finished**, replace **Current** with the new active objective, and update **Next**. Keep it short — the roadmap holds the detail.

---

## Documentation protocol **[Jesse, 2026-11-22 — appended, supersedes the above]**

From 2026-11-22 onward these documents are **append-only**. Do not delete or silently rewrite earlier entries. Corrections go in as new dated entries.

Every addition must be tagged **[Jesse]**, **[OpenCode]**, or **[Jesse + OpenCode]** so it is always clear whose call it was.

`START_HERE.md` is the entry point and holds the full protocol, the mud-hut analogy, the locked decisions and the guardrails for working while Jesse is weary.

## Session rules added **[Jesse, 2026-11-22]**

- [Jesse] Write the mud-hut analogy down properly → done in `START_HERE.md` §3 and `ROADMAP.md` §8.
- [Jesse] Assistant must regularly refer back to the important files → `START_HERE.md` §1 is the required reading list.
- [Jesse] Add to the docs but never remove → append-only protocol above.
- [Jesse] Tag every addition as assistant-initiated or Jesse-initiated → attribution rule above.
- [Jesse] Save all of this into the files → this entry, `START_HERE.md`, and `ROADMAP.md` §8.
- [Jesse] Can the assistant be set off on a big task while Jesse is weary? → yes, within the guardrails in `START_HERE.md` §6.
- [Jesse] Can the assistant be trusted to colour within the lines? → yes: local commits only, no push/merge/force/delete, no credentials, no live publishing, stop and ask on any goal-level question.

## Ready big task **[OpenCode, 2026-11-22]**

The architectural refurbishment itself: Roadmap Phases 3–5. Make homepage and Early Bird genuinely assembled from the shared 18 blocks, promote the aurora canvas into a configurable block, and single-source the content definitions so editor controls, validation and rendering cannot drift. Awaiting Jesse's "go" before starting.

---

## Refurbishment started — baseline recorded **[OpenCode, 2026-11-22]**

**Jesse gave the go-ahead** ("go ahead", "godspeed", "don't stop until everything is parts") with permission to report less frequently while weary.

**Terminology:** **parts** in conversation, **components** in code. [Jesse + OpenCode]

**Pre-change test baseline — recorded before touching source:**

- `npm test`: 144 tests, **131 pass, 13 fail**.
- The 13 failures are **pre-existing** and unrelated to the refactor: one Tina-local script, several Pages CMS config expectations, and several content-expectation tests that drifted when the six saved files were committed in `245439b` (e.g. the homepage artist-statement text in `homepage.json` no longer matches what `homepage-template-stage5.test.mjs` expects).
- This list is the reference point: any *new* failure after a refactor step is mine to fix.

**Private collaboration notes:** created `C:\Users\jesse\AppData\Local\OpenCode\ABOUT_JESSE.md` at Jesse's request [Jesse], outside the public repo and outside OneDrive. Path-only pointer appended to `START_HERE.md` §7. No personal detail is stored in FSFM.

**Next:** golden-output baseline capture, then Stage B — atmosphere as a configurable part.

---

## Stage B complete — atmosphere is now a part **[OpenCode, 2026-11-22]**

- Added `scripts/capture-render-baseline.mjs`: captures/compares byte-exact rendered HTML for all 4 published pages, outside the repo by default. Baseline is deterministic and stable.
- Added `src/core/parts.mjs`: the seed shared definition layer — `ATMOSPHERE_MODES`, `EFFECTS`, re-exported `COMPONENTS`, and `resolveEffectMode()`.
- Added `src/render/effects.mjs`: renders the atmosphere part from definitions. Portable to any template via `appearance.effects.albumAtmosphere.mode`; historical default preserved (album on, others untouched). `off` drops the canvas and client script but keeps the cheap amber vignette/grain layers.
- Wired `src/render/page.mjs` to the part instead of a template hardcode; script loading now follows the part's own declaration.
- `src/client/album-atmosphere.js`: added a genuine `lite` path — lower DPR, half the blooms, fewer/narrower curtains, fewer stars, fewer curve steps, no per-frame blur passes, no giant-star halos. The `full` path is untouched.
- Added explicit `albumAtmosphere.mode: "full"` to The Early Bird, new-album and the album starter content records.
- Validator now checks effect modes from the same definition.
- Added `test/parts-atmosphere.test.mjs` — 8 tests, all green.

**Verification:** `npm test` 152 tests / 139 pass / **13 fail — exactly the same 13 pre-existing failures**, with 8 new passes. `npm run validate:v13` and `npm run build` both pass. Baseline compare: 3 pages byte-identical; The Early Bird differs by **one new attribute only** (`data-atmosphere-mode="full"`), confirmed by word diff. No visual change.

**Next:** Stage C — fold full field definitions into the shared part layer so editor controls, validation and renderer registration derive from one place.

---

## Stage C complete — one definition per part **[OpenCode, 2026-11-22]**

- `src/core/parts.mjs` is now the authoritative source: all 18 parts with labels, template lists, singleton rules, field metadata (name/label/type/required/options) and derived `required` paths. Also owns the shared presentation-variant and group-layout vocabularies and the effect definitions.
- `src/components/registry.mjs` is now a compatibility re-export pointing at the shared definitions.
- `src/templates/registry.mjs` derives every template's `allowedComponentTypes` from the parts themselves; required/maximum component rules remain declared per template.
- `src/render/components.mjs` derives `RENDERED_COMPONENT_TYPES` and its variant set from the shared definitions.
- `src/core/page-validator.mjs` uses the shared vocabularies; required-field checks already follow the now-derived `required` arrays.
- Added `test/parts-definitions.test.mjs` (6 tests) which pins the pre-refactor rules as expected values, proving the derivation changed no behaviour.

**Verification:** `npm test` 158 tests / 145 pass / **the same 13 pre-existing failures**. `validate:v13` and `build` pass. Baseline compare still shows only the intentional `data-atmosphere-mode="full"` attribute on The Early Bird; the other three pages are byte-identical.

**Still owed (Studio phase, later):** derive Tina fields and Studio controls from these definitions — `tina/config.js` still carries a separate album-only schema. The shared part layer is ready for it.

**Next:** Stage D — refurbish the homepage mud hut so its desktop chrome (gadgets, taskbar, hero window, boot/shutdown) is made of the same part system as The Early Bird.

---

## Stage D complete — the homepage mud hut is refurbished **[OpenCode, 2026-11-22]**

- Added `src/render/chrome.mjs`: the homepage desktop chrome moved **verbatim** out of the monolithic renderer and split into named part renderers — boot overlay, ambient bubble canvas, gadgets, taskbar, hero window, Purble overlay, shutdown overlay, theme engine, plus the runtime config. `src/render/homepage.mjs` is now thin assembly: shared component sections + chrome parts + the generic site shell.
- Added the eight chrome parts to `src/core/parts.mjs` as `CHROME_PARTS`, with labels, descriptions, paths and `default: true`. A missing setting means "on", so no existing content record changes its appearance. `isChromePartEnabled()` accepts either `false` or `{ enabled: false }`.
- `content/v13/homepage.json` now lists all eight parts explicitly as enabled. The baseline proves this is a visual no-op.
- Validator checks `appearance.parts` from those definitions: must be an object; each known part must be a boolean or `{ enabled: boolean }`. Invalid values fail with the part's shared path.
- Hardened `src/client/homepage-desktop.js`: it no longer assumes the theme-engine part exists. It falls back to an empty theme list and a no-op palette setter, and `applyTheme`/`cycleTheme` return early when there are no themes. This makes every chrome toggle genuinely safe in the browser, not just in the HTML.
- Added `test/parts-chrome.test.mjs` (7 tests): definitions and defaults, explicit-config visual no-op, every part toggled independently, both toggle forms, all-off still keeps content/footer/scripts, client fallback, and validation from the definitions.

**Verification:** `npm test` 165 tests / 152 pass / **the same 13 pre-existing failures** (test numbers shifted by the 7 new tests; the names are unchanged). `validate:v13` and `build` pass. Golden baseline: homepage, Vista and Editorial are byte-for-byte identical; The Early Bird differs only by the intentional `data-atmosphere-mode="full"` attribute from Stage B.

**Next:** Stage E — refurbish The Early Bird's album shell into the same shared part system, then derive Tina/Studio controls from the part definitions (Studio stays last).

---

## Stage E complete — every visible feature is now a part **[OpenCode, 2026-11-22]**

- Added `src/render/shell.mjs`: the inner-page shell moved verbatim out of `page.mjs` — site header, site menu, page footer, page intro and wallpaper layer. `page.mjs` is now a thin assembly: shell parts + section components + effect parts + generic document shell.
- Added the five shell parts to `src/core/parts.mjs`. `PAGE_PARTS` (13 switchable parts) now covers both the homepage desktop and the inner-page shell. Added the unified catalogue: `ALL_PARTS` / `listParts()` / `getPart()`, four categories — 18 components, 1 effect, 8 chrome parts, 5 shell parts = **32 parts**.
- Validator checks every switchable part from `PAGE_PARTS`, not just the homepage chrome.
- Declared shell parts explicitly in The Early Bird, new-album, Vista and Editorial records plus all three page starters. Verified as a visual no-op.
- Added `test/parts-shell.test.mjs` (6 tests) and extended `parts-definitions.test.mjs` with the 32-part catalogue contract.

**Verification:** `npm test` 172 tests / 159 pass / **the same 13 pre-existing failures** (numbering shifted by 13 new tests; names unchanged). `validate:v13` and `build` pass. Golden baseline: homepage, Vista and Editorial byte-identical; The Early Bird still differs only by the intentional Stage B `data-atmosphere-mode="full"` attribute.

**Milestone:** the architecture phase is complete. Both mud huts and every inner page are now assembled from the same declared parts; nothing is published and no registry was altered.

**Next:** Studio phase — derive Tina fields and Studio controls from these 32 definitions instead of maintaining a separate schema, without touching deployment or live publishing.

---

## Stage F complete — Studio and Tina controls now derive from the parts **[OpenCode, 2026-11-22]**

- Added `src/core/studio-controls.mjs`: a plain-JSON `partCatalogue()` projection of all 32 parts, the four part categories, page/chrome/shell parts, the atmosphere effect, template allowances and the shared variant/layout vocabularies. This is the browser-safe bridge between `parts.mjs` and editor controls — no functions, secrets or duplicate labels.
- Added `tina/fields.mjs`: converts part field metadata into Tina fields, and derives section types, unioned content fields, presentation/layout options, effect controls and page-part toggles from `parts.mjs`.
- Updated `tina/config.js`: the album collection's part types, content fields, visual-style options, layout options, atmosphere mode and visible-part switches now come from the shared definitions. Outdated "building block" wording was changed to "part". Tina generated files were **not** regenerated and no Tina CLI/network/publishing was used.
- Updated `scripts/dev-tina-preview.mjs`: `/__fsfm/api/catalog` now serves the complete part catalogue alongside the existing component/template payload.
- Updated `studio/index.html`: Studio now takes part labels and descriptions from `S.catalog`, reads atmosphere modes and design vocabularies from the catalogue, and renders the appearance panel from the declared page parts/effects. Its old hardcoded `COMPONENT_LABELS` map is gone; safe fallback option lists remain for resilience.
- Added `test/studio-derived-controls.test.mjs` (6 tests): catalogue completeness/serialisability, Tina block types and content fields from album allowances, shared vocabularies, atmosphere/page-part controls, field-type conversion, and Studio/server wiring.

**Verification:** `npm test` 178 tests / 165 pass / **the same 13 pre-existing failures** (names unchanged). `validate:v13` and `build` pass. Golden baseline still has homepage, Vista and Editorial byte-identical; The Early Bird differs only by the intentional Stage B `data-atmosphere-mode="full"` attribute. Studio inline scripts and the changed Node modules pass syntax checks.

**Scope note:** this completes Phase 5 — editor controls are derived from the declared parts. Studio still writes through its existing local JSON API; Phase 6 (the exact Studio/Tina backend-client relationship) remains a future decision and was not attempted.

**Next:** commit Stage F locally on `rv26`, then pause before Phase 6 unless Jesse directs otherwise; no push, credentials, publishing or generated Tina artifacts.

---

## Phase 6 paused **[Jesse + OpenCode, 2026-11-22]**

- Jesse chose **Pause Phase 6** when asked how Studio should call Tina. No Phase 6 implementation was started.
- D3 remains locked: TinaCMS is the actual content backend and Studio must call it. This decision only defers the work.
- Stage F / `d7eac7f` is the stopping point. Do not resume Studio/Tina backend wiring, credentials, live publishing or Tina CLI generated artifacts without an explicit new instruction from Jesse.

---

## Phase 6 reopened — direction #1 **[Jesse + OpenCode, 2026-11-22]**

- Jesse explicitly reopened Phase 6 and chose **option #1**: Studio stays the friendly `/studio/` editor and becomes a custom client on Tina's backend.
- This resolves the roadmap D1 leaning ("Custom client, per Jesse — needs technical confirmation") into an active implementation direction, recorded as D10 in `START_HERE.md`.
- D9 is not erased: it was the pause. D10 is the explicit reopening.
- Scope remains local/dev only under the existing guardrails: no credentials/auth files, no live publishing, no push/merge/history rewrite, no generated Tina artifacts unless separately authorised.
- A read-only mapping subagent was launched to document the current Studio save paths, Tina configuration and local API options before any files are changed.

### Phase 6 clarification from Jesse **[Jesse + OpenCode, 2026-11-22]**

- Studio's existing local Save / Deploy Live split is the intended model. Phase 6 changes the save path to Tina; Deploy Live stays parked under the existing guardrails.
- **D11:** autosave should be local-only and debounced. It must never deploy. Explicit Save and stale-revision protection remain.
- **D12:** if a change touches content or rendering that looks deliberate, strange or risky, OpenCode must stop and ask Jesse rather than guessing.

### Phase 6 reconnaissance and pause **[Jesse + OpenCode, 2026-11-22]**

- A read-only mapping subagent completed a thorough survey. No files were changed by the survey.
- Key finding: Studio currently calls `/__fsfm/api`, whose server writes repository JSON directly. Tina's checked-in GraphQL schema is album-only and stale versus the current derived config; it cannot safely round-trip homepage, site, wallpapers, Vista or Editorial records.
- Literal Tina GraphQL would require expanding the Tina schema to all six stores and regenerating `tina/__generated__/*`, which is not currently authorised.
- Safer alternative identified: keep Studio's API contract and response shapes, but put a local Tina storage adapter behind the server's read/write seams. That would preserve revisions, validators, stale-save protection and the publish queue while making the backend Tina-backed rather than raw file I/O.
- Jesse chose **Pause and think** when asked which bridge counts as “Studio calls Tina”. Recorded as D13. No Phase 6 implementation files were changed.

### Phase 6 adapter-first direction **[Jesse + OpenCode, 2026-11-22]**

- Jesse asked whether GraphQL is ever needed. Conclusion: not for current local/dev goals. GraphQL would only be needed later for Tina Cloud, remote/multi-user editing, or official Tina admin editing every collection.
- **D14:** proceed with the adapter-first path, superseding D13. Studio keeps `/studio/` and `/__fsfm/api`; server reads/writes move behind a local Tina-backed storage adapter seam. Local-only debounced autosave is in scope; explicit Save and stale-revision protection remain; deploy/publishing stays locked.
- Dependency/implementation note: `package.json` currently declares no dependencies. Cached Tina packages exist in the npx cache, but committing a cache-path dependency is brittle. Adding `@tinacms/graphql` and `memory-level` as local dev dependencies requires explicit approval or a safe alternative. No Phase 6 implementation files changed yet by this decision entry.

### Phase 6 adapter seam + local autosave **[Jesse + OpenCode, 2026-11-22]**

- Jesse approved adding pinned dev dependencies: `@tinacms/graphql@4.1.0` and `memory-level@1.0.0` (`--save-dev --save-exact`). `node_modules/` remains git-ignored; `package.json` and `package-lock.json` updated.
- Added `scripts/tina-local-adapter.mjs` as the local content adapter seam. It owns content read/raw/write/readStoredPages with the same SHA-256 revision, atomic temp-write, publisher queue, rollback and rebuild behavior.
- Wired `scripts/dev-tina-preview.mjs` to delegate `readContentFile`, `writeContentFile` and `readStoredPages` through the adapter. The `/__fsfm/api` contract, origin checks, session gating, stale `409` saves, validators, deploy/auth/assets/lyrics routes, and preview rebuild behavior remain unchanged.
- Added local-only debounced autosave in `studio/index.html` (`autosaveMs:1200`, quiet autosave, conflict pauses autosave, no deploy calls). Explicit Save and stale-revision protection remain.
- Added `test/studio-phase6-adapter.test.mjs` (5 tests) covering adapter seam wiring, revision/write contract, publisher-failure rollback, autosave-local-only behavior, and explicit save/conflict protection.

**Verification:** `node --test` on targeted Studio suites passed (37 tests) plus new adapter suite (5 tests). `npm test` **183 tests / 170 pass / 13 fail** — same 13 pre-existing failures, +5 passing tests from the new suite. `npm run validate:v13` passed. `npm run build` passed. `node scripts/capture-render-baseline.mjs --compare` reports homepage, Vista and Editorial SAME; The Early Bird has the same known intentional Stage B delta (`a887b166af6e917a -> ecd9375223b463b9`, first difference at character 7430).

**Scope note:** this is the first Phase 6 adapter slice. Studio still uses the local `/__fsfm/api` contract, now backed by a dedicated adapter seam. Deploy remains locked. No generated Tina artifacts, no credentials, no live publishing.

**Follow-up [OpenCode, 2026-11-22]:** Adapter now builds a TinaSchema (via `@tinacms/schema-tools`) for the 6 content stores and exposes `getTinaSchema()`/`collections`; create flow is routed through `contentAdapter.createPage()`. Targeted Studio + adapter tests pass after the wiring update.

**Follow-up [OpenCode, 2026-11-22]:** Adapter now async-initializes a best-effort Tina local Database (`@tinacms/graphql` Database + `FilesystemBridge` + `memory-level`) and warms it on writes, while keeping file-backed read/write contract and API behavior unchanged. Server content handlers await adapter reads/writes. `npm test` remains 183/170/13.

**Follow-up [OpenCode, 2026-11-22]:** Adapter now seeds schema/lookup/graphql in memory and indexes repo content through Tina Database when available (`dbReady` verified on real repo content). Reads are DB-verified with file-shaped responses; writes keep atomic file+publisher+rollback contract and then update the DB index. No `tina/__generated__/*` files touched.

**Follow-up [OpenCode, 2026-11-22]:** `readStoredPages()` now reads through the adapter's DB-verified `read()` path, so content listing/validation also traverses the Tina-backed adapter seam. Tests remain green.


### Phase 6 local acceptance pass **[Jesse + OpenCode, 2026-11-22]**

- Ran shape-compat check across all 7 content records: Tina DB records matched file records exactly after stripping Tina system keys (`_collection`, `_keepTemplateKey`, `_template`, `_relativePath`, `_id`, `_sys`). No missing content keys.
- Switched adapter reads to DB-authoritative when `dbReady`, returning DB records with Tina system keys stripped; file-backed fallback retained. Writes remain atomic temp-write + publisher queue + rollback, then DB index update.
- **D15:** Phase 6 local acceptance pass complete on adapter-first path. Studio remains `/studio/` + `/__fsfm/api`; Tina local DB is indexed/verified; autosave local-only/debounced; deploy locked.

**Verification:** `npm test` 183 / 170 pass / 13 fail (same 13 pre-existing failures). `npm run validate:v13` pass. `npm run build` pass. `node scripts/capture-render-baseline.mjs --compare` same known Early Bird delta (`a887b166af6e917a -> ecd9375223b463b9`), homepage/Vista/Editorial SAME. No generated Tina artifacts, no credentials, no live publishing, no push.


### Roadmap v2 appended **[Jesse + OpenCode, 2026-11-22]**

- Appended **ROADMAP.md §9 “Roadmap v2 — Current working plan”** (append-only; earlier sections preserved).
- Captures verified current reality (Stages A–F complete, Phase 6 local acceptance D14/D15 complete) and live smoke findings F1–F4: homepage hero/gadgets as templateData specials, Studio UI disconnected, Editorial Pages menu z-index/stacking bug, Vista window rendering inconsistent between homepage and vista-window template.
- Proposes active phases N1–N5: bugfix/consistency, mud-hut refurbishment, Studio UX, CMS/backend hardening, QA/release readiness. No code changes in this entry.


### Tina lockfile drift note **[Jesse + OpenCode, 2026-11-22]**

- `tina/tina-lock.json` changed locally (unstaged, not committed) during Studio localhost use. Diff indicates a Tina schema/lock regen: same version/collection, but “Building blocks” -> “Parts”, expanded part type options, group fields; ~74k -> ~105k.
- Likely caused by running `npm run dev:tina` / Tina CLI dev, which can regenerate Tina artifacts. No harm observed, but per guardrails generated Tina artifacts are not committed casually.
- **Action:** left unstaged intentionally. Do not commit without an explicit decision. If unwanted noise, restore with `git restore -- tina/tina-lock.json` (may reappear if `dev:tina` is run again).


### N2.3 Vista window convergence **[OpenCode, 2026-11-22]**

- Added canonical `renderWindow()` in `src/render/components.mjs`; homepage hero (`chrome.mjs`), homepage content windows (`renderHomeWindow`), and vista-window template sections (`windowWrap`) now render through shared Aero window chrome.
- Canonical class `vista-window` added across window types; legacy aliases kept (`aero-window`, `content-window`, `vista-window-frame`, `vista-window-*`) for compatibility.
- `homepage-interactions.js` now ignores `[data-vista-window]` so draggable/dock windows are handled only by `vista-windows.js`; in-place minimize/hero shutdown preserved for homepage windows.
- `homepage-vista.css` selectors extended for canonical `.vista-window.content-window` alias. Vista template window CSS remains Aero-aligned in `v13.css`.
- Tests: updated stale hero marker assertions in `test/homepage-template-stage5.test.mjs` and `test/parts-chrome.test.mjs` to accept canonical class order. `npm run build` pass, `npm run validate:v13` pass, `npm test` 183/170/13 (baseline).
- `tina/tina-lock.json` remains unstaged local drift; not committed.

### N2.3 polish **[OpenCode, 2026-11-22]**

- Confirmed with Jesse: same Vista chrome everywhere, context-specific behavior (homepage in-place minimize/hero shutdown; vista template drag/dock/restore).
- Canonicalized vista template CSS selectors from `.vista-window-frame` to `.vista-window` under `body.template-vista-window` in `src/styles/v13.css`.
- Album hero window left as album-specific identity (separate chrome) for now; CSS duplication still partially present across homepage-vista.css/v13.css but markup is unified.
- Verify: build/validate pass, npm test 183/170/13 baseline.


### N2.5 automated smoke, N2.1 audit, N1.4 embed/release smoke, N3 simple CMS controls **[OpenCode, 2026-11-22]**

- **N2.5 automated smoke (build/output):** dist checked for homepage, vistatest, new-editorial-page, Early Bird. Homepage/vistatest have canonical `vista-window`/titlebar/window-body/data-window-action markup; vistatest has `data-vista-window` drag/dock attrs, homepage does not. Editorial has no vista window chrome (expected). Album has album-player + spotify reference. All have main/footer. This is an automated HTML smoke pass, not a human browser visual pass.
- **N1.4 embedding/release flow smoke (automated):** homepage dist contains Spotify embed iframe (`data-testid="embed-iframe"`) and no `component-fallback`; Early Bird has album-player and Spotify reference, no fallback. Render path uses `safeEmbedUrl` and preview fallback remains in place. Live Studio browser smoke still recommended.
- **N2.1 CMS->CSS audit (findings):** renderers are mostly clean (inline styles limited to content-driven spacer height, group columns, wallpaper/background). Main mud-hut/CMS gaps: (1) many window visual values still hardcoded in `homepage-vista.css`/`v13.css` (colors, padding, glass gradients) rather than CMS tokens; (2) homepage default window labels in `renderHomeWindow` are fallback-only but fine; (3) album hero window remains a separate album-identity chrome; (4) section presentation had no padding/background controls - addressed in N3.
- **N3 simple CMS controls (safe, no tina-lock regen):** added optional `presentation.padding` (default/compact/roomy) and `presentation.background` (default/soft/glass/dark) in `src/core/parts.mjs`, validator, studio-controls, renderers, and v13.css. Added fields to `tina/fields.mjs` and `tina/config.js` presentation block; **did not** regenerate/commit `tina/tina-lock.json` (still unstaged drift). Visibility: `section.enabled` already exists and is enforced by validator; render treats enabled!==false as visible.
- **Verify:** `npm run build` pass, `npm run validate:v13` pass, `npm test` 183/170/13 baseline.


### Smoke-report fixes **[OpenCode, 2026-11-22]**

- **Vistatest titlebar layout:** added `justify-content:space-between` and `.window-title` flex in `v13.css` so caption buttons align right (not next to title).
- **Vistatest window icons:** replaced hardcoded ✧ with type-based `vistaWindowIcon()` in `components.mjs`.
- **Vistatest marquee:** non-homepage marquee no longer wrapped in vista window; renders as `.marquee.content-marquee` band (v13 marquee styles already present). Theme-star homepage behavior remains homepage-only.
- **Inner footer:** removed social profile nav from `renderFooter` in `shell.mjs`; inner pages now use simple copyright footer like homepage intent.
- **Editorial alignment:** centered `.page-intro` and `.page-content` with auto margins in `v13.css`.
- **Investigated/not code-changed:** homepage gadgets are enabled in content and present in dist; CSS shows them only at `min-width:1320px` and `min-height:700px`. Editorial Instagram link -> instagram.com is page content. Bandsintown load and album player playback are known/external/historic issues. Lag noted.
- **Verify:** build/validate pass, npm test 183/170/13 baseline.

### Smoke follow-up: gadgets, boot, vistatest parity **[OpenCode, 2026-11-22]**

- **Homepage gadgets (1280x720 laptop):** lowered gadget breakpoint in `src/styles/homepage-vista.css` from 1320x700/1319x699 to 1180x600/1179x599 so 1280x720 viewports show gadgets. Updated `test/homepage-template-stage5.test.mjs` and `test/studio-preview.test.mjs` to match intentional breakpoint.
- **Boot overlay every navigation:** `src/client/homepage-desktop.js` now uses sessionStorage `fsfm_boot_seen_v1`; after first boot in session, overlay is skipped/hidden immediately while theme still applies.
- **Vistatest window parity:** removed conflicting old `variant-vista-window` border-radius/titlebar rules in `v13.css`; fixed title/icon selectors (`.window-title` font/ellipsis, `.window-mini-icon` styling); added `window-body` position/overflow; added in-place `window-minimized` styles for vista template.
- **Vistatest minimize/close UX:** changed `src/client/vista-windows.js` minimize/close from dock-popup hide to in-place collapse (restore by clicking again). This is a behavior change from earlier dock-restore design; Jesse should confirm if dock restore is still preferred for close.
- **Verify:** `npm run validate:v13` pass, `npm run build` pass, preview rebuilt, `npm test` 183/170/13 baseline. `tina/tina-lock.json` remains unstaged drift.

### Smoke follow-up 2: gadgets, purble, vista marquee/close, footer **[OpenCode, 2026-11-22]**

- **Homepage gadgets not movable/clustered:** `src/client/homepage-gadgets.js` still had old 1320x700 media-query guard; updated to 1180x600 so drag/position JS runs on 1280x720 laptops.
- **Purble Place overlay broken:** missing `.purble-overlay/.purble-dialog/.fsfm-shutdown` CSS added to `src/styles/homepage-vista.css` (centered dimmed modal). 
- **Vista marquee "not in a window"/broken:** reverted marquee to normal windowed section on vista template (`render/components.mjs`), removed plain-band special case. **Architecture note:** homepage marquee remains a special-case renderer for theme-star easter egg behavior; this divergence is intentional behavior but should stay visible as "mud/clay" risk - window/chrome should converge, behavior can vary by context.
- **Vista close:** close now uses dock reopen (hideWindow) while minimize stays in-place collapse; fixes "close does not work" confusion.
- **Vista/footer polish:** removed focus-within bezel outline; centered `.global-footer`.
- **Verify:** validate/build/preview pass, npm test 183/170/13. `tina/tina-lock.json` unstaged.

### Smoke follow-up 3: gadget layout, boot flash, vista behavior, marquee **[OpenCode, 2026-11-22]**

- **Boot overlay flash on every homepage navigation:** added early inline sessionStorage check in `renderBootOverlay` and `html.fsfm-boot-seen` CSS hide in `homepage-vista.css` to prevent flash before JS loads.
- **Homepage gadgets layout:** `computeDesktopLayout` now uses gradated 6-gadget frame (clock/featured/dates left, calendar/photo/note right; middle stepped inward). Extra widgets (barrel, bubbles, radio, purble) moved below copyright footer in `chrome.mjs`/`homepage.mjs` with flow layout styles.
- **Vista windows:** drag disabled (no grab cursor/handle, no transform persistence) per smoke report; close now in-place collapse like minimize (no dock popup). `renderWindow` emits `data-vista-window-action` only for vista/draggable windows to preserve template isolation.
- **Vista marquee:** remains windowed; added v13 styling for marquee component body/track/items to be closer to homepage band look (no homepage star easter egg).
- **Tests:** updated `v15-desktop-regressions.test.mjs` and `vista-windows.test.mjs` for intentional layout/behavior changes. Validate/build/preview pass, npm test 183/170/13 baseline. `tina/tina-lock.json` unstaged.

### N2.1 mud-hut audit + safe consolidation **[OpenCode, 2026-11-22]**

- **Scope:** no-visual-change audit/refactor only (no smoke-dependent tuning). `tina/tina-lock.json` left unstaged; no push.

- **Small safe refactors applied:**
  - `src/styles/homepage-vista.css`: merged redundant caption-control declarations into canonical `.caption-buttons`/`.caption-button` rules (added `align-items:stretch`, `padding:0`, `text-decoration:none` where missing; removed duplicate later block). Removed redundant `.vista-window.content-window .titlebar, .content-window .titlebar` height/padding rule already covered by `.titlebar`.
  - `src/styles/v13.css`: normalized `body.template-vista-window .vista-window .component-body,.template-vista-window .vista-window .window-body` selector to include `body` on both sides for consistency (no intended specificity/visual change).

- **Window/CSS duplication map (homepage-vista.css vs v13.css):**
  - **Caption controls:** `homepage-vista.css` defines canonical `.caption-button` Aero styling using CSS variables (`--hi/bright/glass/deep/mid-rgb`); `v13.css` defines near-equivalent `body.template-vista-window .vista-window-button` with hardcoded blue-gray values. `renderWindow()` emits both class families. *Not safe to blindly merge* without a shared token layer because color systems differ by context.
  - **Window chrome base:** homepage defines `.titlebar/.window-title/.window-body/.content-window.vista-window` base; vista template defines scoped `body.template-vista-window .vista-window*` rules in `v13.css`. Both are Aero-family but context-scoped (homepage-vista.css loads only in homepage mode; v13 loads everywhere). Consolidation target: extract shared Aero window tokens/primitives into a common layer loaded by both contexts, then keep context-specific overrides minimal.
  - **Minimized state:** `homepage-vista.css` has `.window-minimized { padding-bottom:0!important; }` and `.window-minimized > .window-body { display:none!important; }`; `v13.css` has template-scoped `body.template-vista-window .vista-window.window-minimized...` equivalents. Duplication is small but scope-divergent; safe future target is a shared `.window-minimized` contract.
  - **Legacy/compat classes still emitted:** `windowWrap()` emits `variant-${variant}` (`variant-vista-window`/`variant-vista-desktop`) alongside canonical `vista-window` classes; `.content-window` remains an alias. Keep until a deliberate cleanup pass confirms no content/CSS/JS dependency.
  - **Presentation controls:** pad/bg rules in `v13.css` already target both `.content-section` and `.vista-window` - good shared pattern.

- **Architecture “mud and clay” audit (special-case renderers / divergence risk):**
  - **Homepage marquee:** special-case behavior/easter egg (star icon, wallpaper/theme interaction) in homepage renderer/styles/JS; vista template marquee is windowed plain content. Chrome should converge, but behavior is intentionally context-specific - keep documented.
  - **Hero/shutdown:** homepage hero and shutdown overlay are desktop-chrome behaviors, not normal content parts; they intentionally bypass generic section rendering.
  - **Album identity chrome:** album header/player/statement have album-specific renderers and `template-album` CSS; they share window/Aero language partially but remain identity-specific. Future convergence should preserve album atmosphere/identity.
  - **Homepage gadgets:** rendered as desktop chrome/config (`renderDesktopChrome`, gadget config JSON, dedicated JS/CSS), not section-part instances. Extra widgets below footer are flow-layout gadgets. This is a deliberate boundary; turning them into generic parts would need careful data-model migration.
  - **Vista close/minimize semantics:** currently in-place collapse for both on vista template; earlier smoke requested dock-reopen behavior for close. Needs Jesse decision before changing.
  - **General risk:** adding one-off renderer/CSS forks per complaint increases “18 mud components”. Preferred path: keep `renderWindow/windowWrap` canonical, put visual differences in presentation tokens/classes/content, and isolate unavoidable behavior differences behind explicit, tested context flags.

- **Verify:** `npm run validate:v13` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm test` **183/170/13** (same baseline).

### Autonomous readiness pass — brief **[OpenCode, 2026-11-24]**

- Jesse asked for a long autonomous work run toward three outcomes: Studio ready for the Tina → Git Actions → website deploy path, the site fully assembled from building blocks with no old architecture, and all checks passing.
- Guardrails remain unchanged: local commits only; no push/merge/force/history rewrite/file deletion; no credentials or live publishing; no generated Tina artifacts; `tina/tina-lock.json` remains unstaged; stop for deliberate/strange/risky changes or goal-level decisions.
- Starting triage: failing tests, Studio/deploy chain, and remaining mud-hut architecture are being audited in parallel. Milestones and roadblocks will be logged as work lands.

### Readiness milestone 1 — green checks and restored content **[Jesse + OpenCode, 2026-11-24]**

- Restored the public homepage bio from Studio-introduced keyboard mash back to the canonical legacy sentence in `content/v13/homepage.json`, per Jesse's explicit confirmation.
- Hid the temporary Vista test page again: `content/v13/vista-pages/vistatest.json` is now `published: false`, `showInNavigation: false`, and its marquee messages are empty. Production build no longer emits `/pages/vistatest/`; private draft preview still includes it.
- Removed the Studio-introduced keyboard-mash `stateymenty` artist-statement section from `content/v13/albums/the-early-bird.json`, per Jesse's note that the Early Bird page had more gibberish. The intentional `08/21/2026` eyebrow and enabled radio/Purble gadget defaults remain.
- Test harness: `npm test` now runs only `test/*.test.mjs`; `scripts/test-tina-local.mjs` remains an explicit opt-in smoke harness because it launches Tina CLI and mutates temporary content. CRLF-fragile assertions in CMS/deployment tests now normalize line endings at read time. Migration/release tests now document the two intentional content deltas (radio/Purble enabled, album eyebrow year) rather than failing on them.
- **Verify:** `npm test` **182/182 pass**; `npm run validate:v13` pass; `npm run build` pass (3 published pages); `node scripts/build-v13.mjs --preview --include-drafts` pass (5 pages, 3 published). `tina/tina-lock.json` remains modified but unstaged and untouched by this pass.
- Studio/deploy audit result: local Studio → adapter → preview path is working, and the queued publish handoff is implemented; live deploy remains correctly locked because the deploy marker/workflow are not on `origin/main`. No push, publish, credentials, or history operations were performed.

### Readiness milestone 2 — Studio polish and safe building-block consolidation **[OpenCode, 2026-11-24]**

- Studio UI hardening committed as `60682bf`: loading a fresh record now clears a stale autosave conflict, the GitHub Actions link survives publish-status refreshes, preview refresh waits for the iframe instead of a fixed timer, and the version label is consistent at V16.8. New source-level tests guard each behavior.
- Architecture audit completed. Safe no-visual-change migrations applied:
  - Editorial shell now gets the same `isolation: isolate` stacking context as the Vista shell, fixing the known “Pages” menu stacking gap without changing identities.
  - Vista windows now always emit the canonical `.vista-window-titlebar` hook that the CSS already targets; drag handle behavior is unchanged and dragging remains disabled.
  - Removed the hardcoded duplicate album player from `src/client/album-atmosphere.js`. The atmosphere client now owns only canvas/aurora effects; playback, transport, track list and LRC sync come solely from the canonical config-driven `album-player.js`.
  - Replaced all stale `.site-navigation` CSS with the live `.site-menu` / `.site-menu-panel` vocabulary, preserving album amber menu styling and responsive padding.
- **Verify:** `npm test` **187/187 pass**; `npm run validate:v13` pass; `npm run build` pass; `npm run predeploy-check` pass; `npm run check:all` pass; draft preview build pass. `tina/tina-lock.json` remains modified but unstaged.
- Still needing Jesse's explicit decision before any further “100% building blocks” work: homepage hero/gadgets content-shape migration, expanding the 32-part catalogue with page behavior effects, expanding Tina from album-only to all six stores, removing legacy/stage npm scripts, re-enabling Vista drag, and moving the deploy marker/workflow to `origin/main` to unlock live publishing. None of these were attempted.

### Decision checkpoint **[Jesse + OpenCode, 2026-11-24]**

- Jesse approved: migrate homepage hero/gadgets into composable parts; declare `backgroundEffects`, `pageTransition`, and `respectReducedMotion` as effects; expand Tina from album-only to all six stores **and regenerate Tina artifacts** (explicit override of the earlier no-generated-artifacts guardrail); remove legacy/stage npm script exposure while leaving files; hide the placeholder `new-editorial-page`; keep Vista drag disabled; leave live publishing locked.
- A local checkpoint commit and tag will be created before schema/content-shape changes begin. Nothing will be pushed. The existing unstaged `tina/tina-lock.json` drift will be handled deliberately once regeneration is authorized and reviewed.

### Milestone 3 — private placeholder and script exposure **[OpenCode, 2026-11-24]**

- Hid `content/v13/editorial-pages/new-editorial-page.json`: `publishing.published` and `publishing.showInNavigation` are now both `false`. No content was deleted.
- Removed `build:legacy` and every stage-era `build:*`, `preview:*`, and `check:*` entry from `package.json`. The corresponding script files remain untouched; `check:all` now runs only canonical test, validation, and syntax checks.
- Added regression coverage for the hidden placeholder and for the reduced npm script surface.
- **Verify:** `npm test` **188/188 pass**. The pre-existing unstaged `tina/tina-lock.json` drift remains untouched.

### Milestone 4 — page-behaviour effects are real parts **[OpenCode, 2026-11-24]**

- Declared `backgroundEffects`, `pageTransition`, and `respectReducedMotion` in `src/core/parts.mjs` as boolean effects available to all four templates. The catalogue is now 35 parts (18 visual parts, 4 effects, 8 chrome parts, 5 shell parts).
- Effect validation, Studio catalogue projection, Tina field generation, and Pages CMS controls now derive from those definitions instead of hardcoded toggle lists. Boolean effects stay flat under `appearance.effects` so content shape and rendering remain compatible.
- The rendered `<body>` now exposes `data-respect-reduced-motion`. Reduced-motion CSS and the desktop canvas honor the declared flag; the default `true` path preserves the previous visual behaviour.
- **Verify:** `npm test` **191/191 pass**. `tina/tina-lock.json` still remains untouched and unstaged.

### Milestone 5 — homepage desktop content now lives on parts **[Jesse + OpenCode, 2026-11-24]**

- Moved the homepage hero, gadgets, boot/shutdown/taskbar copy out of `templateData` and into `appearance.parts.<part>.content`; added `contentPath` and declared field metadata to the eight chrome parts in `src/core/parts.mjs`. The catalogue stays at 35 parts.
- The renderer now reads those declared part contents, and the homepage footer reads `site.footerText`. The saved pre-migration HTML baseline is still byte-for-byte identical (28,931 characters) after the migration.
- Updated the validator, Studio Appearance panel, Tina field derivation, Pages CMS schema, and migration/release/Studio tests to the new model. Studio no longer exposes a homepage `templateData` panel, and homepage `templateData` is now rejected by validation.
- **Verify:** `npm test` **191/191 pass**; `npm run check:all` pass; `npm run predeploy-check` pass; `npm run validate:v13` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass. The pre-existing unstaged `tina/tina-lock.json` drift remains untouched and is not part of this commit.
- Next: expand Tina from album-only to all six adapter stores and regenerate artifacts.

### Milestone 6 — Tina covers all six stores and the local Studio smoke test passes **[Jesse + OpenCode, 2026-11-24]**

- Replaced the album-only Tina schema with six collections matching `scripts/tina-local-adapter.mjs`: `homepage`, `site`, `wallpapers`, `albums`, `vistaPages`, and `editorialPages`. File collections use `match.include` so Tina indexes all three singleton JSON files; page collections derive blocks, parts, effects and vocabularies from `src/core/parts.mjs`.
- Regenerated `tina/tina-lock.json`, `tina/__generated__/*`, and the local `admin/` shell with the Tina CLI in local mode. No credentials or TinaCloud calls were used. The generated `admin/` and `tina/__generated__/` directories remain ignored by the existing `.gitignore`; only the tracked lock file is being committed.
- Fixed Windows-local Studio reliability found by the opt-in smoke harness: `npx`/shell invocation and process-tree cleanup in `scripts/test-tina-local.mjs`, an unawaited page-create call in `scripts/dev-tina-preview.mjs`, and an `EPERM` rename failure under watcher-held files in `scripts/tina-local-adapter.mjs` (atomic temp write now falls back to copy on Windows). Added API error logging for failed saves.
- Added regressions for six-store config coverage, homepage part-content fields, and per-template block lists. `npm test` is now **194/194 pass**.
- **Verify:** `npm run check:tina` passes with all six collections audited (1 homepage, 1 site, 1 wallpapers, 2 albums, 1 Vista page, 1 editorial page); `npm run test:tina:local` passes end-to-end (admin, preview, login, all content stores, assets, lyrics, create/activate/deactivate, stale-revision protection); `npm run check:all` pass; `npm run predeploy-check` pass; `npm run validate:v13` pass; `npm run build` pass; draft preview build pass. Homepage HTML remains byte-for-byte equal to the saved 28,931-character baseline. No push, merge, force, history rewrite, live publish, or credential access.
- Next: final architecture audit for remaining legacy/stage-era code exposure, then final all-checks pass.

### Milestone 7 — final architecture audit, visual smoke, and last active-exposure cleanup **[Jesse + OpenCode, 2026-11-24]**

- Ran a read-only architecture audit. Confirmed clean: no active reads of legacy parallel data (`data/**`, `content/pages`), no homepage `templateData`, no stale album-only Tina collection, no stage builder npm scripts, no internal doc links from Studio, and no templates directory in current `dist/` or `preview-v13/`.
- Removed the last stage-era npm alias, `preview:v13:templates`, and added guards so no npm script can expose `build-v13-template-previews.mjs`. The script file itself remains untouched. Added a regression test for the client wallpaper URL guard: a template-preset wallpaper with `imageUrl: null` no longer requests a `/null` image, while valid HTTPS wallpapers still apply.
- Browser smoke used `node scripts/dev-tina-preview.mjs` only. Homepage, album, and Studio login rendered correctly. The album smoke found and fixed the `/null` wallpaper request; after rebuild, there are no console errors and no `/null` resource requests. External media host failures seen on the homepage are third-party host responses, not local build or routing errors.
- Audit items left deliberately unchanged pending Jesse: the legacy album URL compatibility redirect in the active builder/audit, stage-era test file names/fixtures, v13/v14 compatibility naming, and the broader homepage shell/footer/scripting structure that is not yet fully governed by declared parts.
- **Verify:** `npm test` **196/196 pass**; `npm run check:tina` pass; `npm run test:tina:local` pass; `npm run predeploy-check` pass; `npm run validate:v13` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass. Homepage HTML remains byte-for-byte equal to the saved 28,931-character baseline. No push, merge, force, history rewrite, live publish, file deletion, or credential access.

### Milestone 8 — every homepage behaviour now has a part switch **[Jesse + OpenCode, 2026-11-24]**

- Added three homepage chrome parts: `homepageFooter`, `desktopWalls`, and `desktopRuntime`. The footer text now lives on its part under `appearance.parts.homepageFooter.content.footerText`, with a safe fallback to `site.footerText`; the other two parts are simple on/off switches for the background walls and the hidden runtime settings plus the three desktop scripts.
- The part catalogue is now 38 parts (18 components, 4 effects, 11 chrome parts, 5 shell parts). Studio, Tina, Pages CMS, the validator, and the count/marker tests derive from those definitions. With all chrome parts off, only the main content remains: no footer, no walls, no runtime config, and no homepage scripts.
- Renderers now take the homepage script list from the passed parts instead of a hardcoded three-script list; the desktop client tolerates missing wall elements. Default-on HTML is unchanged, including script order, runtime config key order, and the exact footer/wall markup.
- Regenerated `tina/tina-lock.json` locally with the Tina CLI. Generated `admin/` and `tina/__generated__/` remain ignored.
- **Verify:** `npm test` **196/196 pass**; `npm run check:all` pass; `npm run check:tina` pass; `npm run test:tina:local` pass; `npm run predeploy-check` pass; `npm run validate:v13` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass. Homepage HTML remains byte-for-byte equal to the saved 28,931-character baseline. Browser smoke via `node scripts/dev-tina-preview.mjs` passed: homepage shows footer, two walls, runtime config and all three homepage scripts; album page has no console errors and no `/null` requests. No push, merge, force, history rewrite, live publish, file deletion, or credential access.

### Milestone 9 — the deploy road now runs the same safety checks **[Jesse + OpenCode, 2026-11-24]**

- Read-only audit of `.github/workflows/v15-validation.yml` and `.github/workflows/deploy-pages.yml`: both already used Node 22, `npm ci`, the canonical build/check commands, and uploaded `dist` with the official Pages actions. No active old architecture was found in the delivery path.
- Added `npm run check:tina` and `npm run test:tina:local` to the deploy workflow, so a direct Studio publish to `main` no longer skips Tina checks. Updated `.fsfm-studio-deploy.json` verification list to match.
- Updated `scripts/studio-publisher.mjs` so its local pre-push checks run all four commands, and its main-branch safeguard refuses to unlock unless the deploy workflow includes both Tina checks. Added a regression test for a main workflow missing those checks.
- **Verify:** `npm test` **197/197 pass**; `npm run check:all` pass; `npm run check:tina` pass; `npm run test:tina:local` pass; `npm run predeploy-check` pass. No push, merge, force, history rewrite, live publish, file deletion, or credential access.

### Milestone 10 — first visual fixes from the live review **[Jesse + OpenCode, 2026-11-24]**

- Bottom homepage widgets: removed the six-dot drag grip because they are not movable, softened the doubled top bezel, and increased the gap between cards.
- Bubble Frequency slider: replaced the small native control with a clear custom track, larger thumb, stronger label, and a value readout box.
- Top widgets: increased the row spacing and added collision behaviour — a held widget now pushes any widget it hits, with a brief glow on the pushed widget. This also works with arrow-key nudging.
- Fixed the artist embed mismatch by making the whole Spotify window dark, matching its dark iframe instead of leaving a white shell around it.
- Vista windows: the close button now actually closes the window and shows a **Reopen** dock item; minimize still minimizes.
- `localhost:3000` now works for Studio as well as `127.0.0.1:3000` and `::1`; cross-site origins are still rejected with the exact original error wording.
- Added `test/studio-visual-fixes.test.mjs` covering collision, slider, grip, embed frame, close versus minimize, and loopback origins.
- **Baseline note:** the saved 28,931-character baseline was stale by one navigation link that already existed at `HEAD`. A fresh baseline was captured from the current committed output (29,030 characters). None of the changes in this milestone touch rendered HTML.
- **Verify:** `npm test` **202/202 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; browser check confirmed hidden grips, 18px gadget gap, dark Spotify frame and 16px slider control. No push, merge, force, history rewrite, live publish, file deletion, or credential access.

### Milestone 11 — small visual nits from the live review [Jesse + OpenCode, 2026-11-24]

- Shrank the header orb beside Fake Space Fog Machine from 32px to 26px (22px on narrow screens) and scaled its highlight with it; centred the ✧ glyph inside the album-page header orb.
- Centred the "On the Horizon" event grid inside its window with a flex fallback, so the grid no longer sits off-centre.
- The first press of a marquee wallpaper star now clears the automatic cycle timer, so a visitor-chosen wallpaper stays put.
- Widgets collide using an 8px padded hitbox and push along the drag axis; hidden widgets are skipped. The barrel-roll button is forced visible at every breakpoint without changing saved content.
- Purble Place now opens in a fixed, dark Vista-style window with a reserved scrollbar gutter, so opening it no longer resizes or shifts the homepage.
- Spotify window chrome is dark with cyan-tinted borders, the iframe is filtered darker, and inset corner masks cover the white seams.
- The Early Bird hero titlebar icon is now the album cover itself; the hero and window corners use matching radii and a pale seam overlay, so the bottom corners no longer turn black.
- Added `test/visual-interaction-fixes.test.mjs` with seven regressions for these behaviours.
- **Verify:** `npm test` **209/209 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; production `dist/index.html` still equals the saved 29,030-character baseline byte-for-byte. Browser checks confirmed the barrel roll is visible, the orb is 26px, the event grid is centred, the star lock is set, Purble open/close causes no viewport shift, the album header glyph is centred, the cover icon is loaded, and the Spotify embed area has zero near-white pixels in a viewport capture. The pre-existing unstaged `studio/index.html` rehaul remains untouched and is not part of this commit. No push, merge, force, history rewrite, live publish, file deletion, or credential access.

### Milestone 12 — gutter widgets, normal Spotify chrome, and refurbished scrollbar **[Jesse + OpenCode, 2026-11-24]**

- Matched the album header inset to the homepage taskbar with `max(12px, calc((100% - 880px) / 2))`; the computed taskbar inner left edge and album brand left edge are both 491px.
- Restored the Spotify window to normal chrome instead of the rejected dark-window workaround. The iframe now has a 5px radius, the player body masks the embed's white corner slivers with `#121212`, and only the window's own rounded corners keep a dark finish. The loud red outline seen during review was a temporary browser-only visual probe, not source code; the computed window outline is `none`.
- Replaced the earlier padded-hitbox and axis-push experiment with plain widget boxes, a 16px collision gap, and gutter-aware two-column placement between the website edges and the hero edges. `settleWidgets()` now runs on init, pointer drag, keyboard nudge, and reflow; pushed widgets are not marked user-custom, and reflow never persists clamped positions.
- Refurbished the scrollbar in both homepage and reusable-page CSS: a slimmer 10px rounded glowing thumb, dark track, and distinct hover/active states.
- Updated regressions in `studio-visual-fixes.test.mjs`, `visual-interaction-fixes.test.mjs`, `v15-desktop-regressions.test.mjs`, and `homepage-template-stage5.test.mjs` to lock the new decisions.
- **Verify:** `node --check src/client/homepage-gadgets.js` pass; targeted tests pass; `npm test` **210/210 pass**; `node scripts/build-v13.mjs --preview --include-drafts` pass; `node scripts/build-v13.mjs` pass. Production `dist/index.html` remains byte-for-byte identical to the saved 29,030-character baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser DOM checks at 1882x1864 showed hero edges at 511/1351, widgets at clock `55,72`, now-playing `263,72`, dates `55,295`, calendar `1414,72`, photos `1622,72`, and note `1414,345`, with zero overlap pairs at a 16px gap. A simulated keyboard drag moved the clock to `195,72` and settled now-playing to `395,72`, still with zero overlap pairs.
- Browser computed-style checks confirmed `scrollbar-width: thin`, Spotify iframe radius `5px`, body corner mask `z-index: 3`, window corner mask `z-index: 6`, and no outline. Screenshot sampling of the Spotify corners was inconclusive, so no visual screenshot claim is made for them. Local gadget position storage was cleared and the homepage reloaded after verification; no server content changed.
- The pre-existing unstaged `studio/index.html` partial rehaul remains untouched and is excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 13 — The Early Bird background bonanza **[Jesse + OpenCode, 2026-11-24]**

- Painted the atmosphere with cached offscreen sprites for blooms, stars, horizon haze, and bokeh instead of rebuilding radial gradients every frame; the full path keeps its original bounded workload and 30 FPS cap.
- Added a cached whole-scene lite path: `lite` mode now draws one prebuilt backdrop with a slow breathe/drift and only animates small bokeh and stars, while `off` still means no atmosphere script.
- Brightened and enriched the canvas palette: stronger amber/cream light wells, brighter curtains and folds, more visible giant-star halos, and a warmer horizon; the bloomy CSS layer now has breathing light wells, two drifting shaft layers, and a soft edge vignette, all scoped to album pages.
- Made the effect mode honestly content-driven on non-homepage pages with `data-atmosphere-mode` on `<body>`; `lite` slows the CSS drift and `off` suppresses the extra bloom layers. The homepage shell deliberately omits the attribute so its HTML remains byte-stable.
- Added regressions in `test/parts-atmosphere.test.mjs` for the body attribute, homepage omission, cached sprites, cached lite scene, no per-frame gradients, and album-scoped bloom modes; updated `test/v15-desktop-regressions.test.mjs` expectations indirectly through the shared bounded-workload rules.
- **Verify:** `node --check src/client/album-atmosphere.js` pass; `node --check src/render/page.mjs` pass; targeted tests pass; `npm test` **212/212 pass**; `node scripts/build-v13.mjs --preview --include-drafts` pass; `node scripts/build-v13.mjs` pass. Production `dist/index.html` remains byte-for-byte identical to the saved 29,030-character baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser checks on `/albums/the-early-bird/` showed `data-atmosphere-mode="full"`, canvas `mix-blend-mode: screen`, opacity `1`, average luma rising from `47.78` to `92.5`, bright pixels from `0.01%` to `1.126%`, and mid-tone pixels from `24.56%` to `75.72%`. Computed CSS confirmed `album-bloom-breathe`, `album-bloom-drift-one`, `album-bloom-drift-two`, and a `blur(26px)` shaft layer, with no console errors. These are canvas/CSS measurements, not a claim about exact screenshot colour sampling.
- The pre-existing unstaged `studio/index.html` partial rehaul remains untouched and is excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 14 — corrected gutter stagger **[Jesse + OpenCode, 2026-11-24]**

- Replaced the two-up side rows from Milestone 12 with the three-row stagger Jesse specified: clock, featured release, and important dates descend the left outside/inside/outside; calendar, picture, and sticky note descend the right outside/inside/outside.
- Row tops are now shared across both gutters, using the tallest widget in each row, so the three bands line up around the hero while the middle widget in each band steps toward it. Short viewports reduce the row gap and only allow a tiny vertical offset when the two columns are separate, keeping the 16px collision gap intact.
- Added regressions in `test/v15-desktop-regressions.test.mjs` and `test/visual-interaction-fixes.test.mjs` for the exact six-widget mapping, shared row heights, and stagger-safe row gap.
- **Verify:** `node --check src/client/homepage-gadgets.js` pass; targeted tests pass; `npm test` **212/212 pass**; `node scripts/build-v13.mjs --preview --include-drafts` pass; `node scripts/build-v13.mjs` pass. Production `dist/index.html` remains byte-for-byte identical to the saved 29,030-character baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser DOM checks at 1882x1864 with no saved gadget positions confirmed hero edges at 511/1351 and widgets at clock `55,72`, featured release `263,345`, dates `55,560`, calendar `1622,72`, picture `1414,345`, and sticky note `1622,560`, with zero overlap pairs at the 16px collision gap. A preview screenshot was opened for review, but no visual claim is made from pixel sampling.
- The pre-existing unstaged `studio/index.html` partial rehaul remains untouched and is excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 15 — tighter collisions, matched header, gadget reset, and clean Spotify corners **[Jesse + OpenCode, 2026-11-24]**

- Tightened the widget collision gap from 16px to 12px. A dragged widget now nudges a hit widget by the smallest clearing distance along the drag direction instead of inheriting the full pointer delta; hover glow and push feedback are preserved, and `settleWidgets()` runs on release and keyboard end rather than on every pointer move.
- Matched the Early Bird header to the homepage taskbar: 880px content inset, 26px brand mark, 700 weight, normal letter-spacing, and a 29px menu with `padding: 3px 13px; text-transform: none`. The required wording `Authentication requests must come from this local FSFM Studio origin.` and `The homepage cannot be deactivated` is unchanged.
- Added a small Vista-style reset icon at the bottom of the gadget area. It is injected by `homepage-gadgets.js` into `.fsfm-gadgets-extras`, so saved homepage HTML stays byte-identical. Pressing it removes `fsfm_gadget_positions_v2` and `fsfm_gadget_positions_v1`, dispatches `fsfm:reset-gadgets`, clears `customPositions`, and reflows every widget to its computed default spawn point without re-saving positions. It uses the same caption-button glass language as the other window icons and appears wherever the extra gadget row renders.
- Rejected both the radial corner patches and the solid `.spotify-window::after` strip Jesse described as fully scuffed. The Spotify window now keeps normal Vista glass chrome, with the existing outer shadow and highlight plus a clipped `inset 0 -8px 0 #121212` on `.spotify-window.content-window`. The higher-specificity selector was needed so the inset wins over the generic window rule. The iframe keeps `border-radius: 5px` and `clip-path: inset(0 round 5px)`; there is no overlay pseudo-element left.
- Updated regressions in `test/studio-visual-fixes.test.mjs`, `test/visual-interaction-fixes.test.mjs`, and `test/v15-desktop-regressions.test.mjs` for the 12px gap, minimal push, reset storage keys and event, header geometry, and clipped inset shadow with no `::after` strip.
- **Verify:** `node --check src/client/homepage-gadgets.js` pass; targeted tests pass; `npm test` **213/213 pass**; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run build` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser checks confirmed clicking `#fsfmGadgetReset` clears both localStorage keys and restores clock `55,72`, featured release `263,345`, dates `55,560`, calendar `1622,72`, picture `1414,345`, and sticky note `1622,560`. Computed Spotify styles confirm the third inset shadow, `padding: 0px 6px 6px`, `border-radius: 7px 7px 4px 4px`, no `::after` content, and a dark clipped iframe. A screenshot was opened for review, but no visual claim is made from pixel sampling; Jesse's eyes on the bottom corners are still the final check.
- The pre-existing unstaged `studio/index.html` partial rehaul remains untouched and is excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 16 — restored the vanilla Spotify window as a clean base **[Jesse + OpenCode, 2026-11-24]**

- Jesse called the corner-patching approach a dead end and asked for the normal base window back before changing anything further. Superseded: the edge-to-edge body, 12px iframe clip, 5px clip, inset shadow strip, radial corner patches, and window/body overlay pseudo-elements.
- `src/styles/homepage-vista.css` now restores the original vanilla Spotify rules: normal `.content-window` Vista chrome and `0 6px 6px` padding, `.spotify-window-body { padding:0; background:#121212; }`, and a plain iframe with `border-radius:0`, no clip, no filter, and no overlay. The collision, header, and gadget reset work from Milestone 15 is unchanged.
- Updated `test/studio-visual-fixes.test.mjs` and `test/visual-interaction-fixes.test.mjs` to lock in the vanilla base and reject every experimental corner patch, while leaving the rest of the regression suite intact.
- Browser reload confirmed computed values: window `padding: 0px 6px 6px`, `border-radius: 7px 7px 4px 4px`, normal two-part box shadow; body `padding: 0px`, `border-radius: 0px`, `background: rgb(18, 18, 18)`; iframe `border-radius: 0px`, `clip-path: none`, `filter: none`; no `::after` content on the window or body. A full-window crop and a corner crop were opened in the Review pane for Jesse's visual check; no final visual claim is made without Jesse's eyes.
- **Verify:** targeted tests pass **19/19**; `npm test` **213/213 pass**; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run build` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- The pre-existing unstaged `studio/index.html` partial rehaul remains untouched and is excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 17 — brown Spotify embed with two-tone runtime corners **[Jesse + OpenCode, 2026-11-24]**

- Jesse identified two Spotify embed variants: the brown color without `theme=0` and the black color with `theme=0`. Our rendered source forced color 2, so the live fix switches the iframe to the color 1 URL with `si=5263054ac6d0459f` and no `theme=0`.
- The brown embed exposes its own rounded edge against our rectangular window body. Rejected iframe-only background, border, outline, box-shadow spread, inset shadow, clip-path, and 50x50 corner squares after live testing. Jesse confirmed the final geometry: 15x15 squares at the four extreme corners, two `#372828` on top and two `#493A3A` below.
- `src/client/homepage-gadgets.js` now injects the color 1 src, `border-radius:12px; background:#372828` iframe style, a two-tone `linear-gradient(#372828 0 50%, #493A3A 50% 100%)` body background, and the four 15x15 corner squares at runtime. The parts CSS and rendered HTML remain byte-identical; the squares are idempotent and use `pointer-events:none`.
- Added a regression in `test/visual-interaction-fixes.test.mjs` for the color 1 URL, absence of `theme=0`, iframe style, two-tone gradient, square size, z-index, and both corner colors. The vanilla CSS regressions remain intact.
- **Verify:** `node --check src/client/homepage-gadgets.js` pass; targeted tests pass **15/15**; `npm test` **214/214 pass**; `npm run build` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`). Jesse confirmed the 15x15 top/bottom squares live before the source change; no post-change visual claim is made without his eyes.
- The local preview server serves `preview-v13/`, not `dist/`, so `node scripts/build-v13.mjs --preview --include-drafts` was run after the commit. A reload then confirmed the committed injection itself: color 1 URL, `border-radius:12px; background:#372828` iframe, two-tone body gradient, and four squares at ~14.995px with correct top/bottom colors and `z-index:2`. The `dist/index.html` hash still matches the baseline.

### Milestone 18 — return to black Spotify embed with new two-tone corners **[Jesse + OpenCode, 2026-11-24]**

- Jesse decided he prefers Spotify color 2 after all, then supplied a corner crop. Pixel analysis of that image gave exact colors: top `#1F1F1F` (31,31,31), bottom `#121212` (18,18,18).
- The runtime injection in `src/client/homepage-gadgets.js` now uses the color 2 URL with `theme=0&si=5263054ac6d0459f`, an iframe style of only `border-radius:12px`, a two-tone `linear-gradient(#1F1F1F 0 50%, #121212 50% 100%)` body background, and the same four 15x15 corner squares recolored to match the black embed. The idempotent, `pointer-events:none` patching remains runtime-only, so the parts CSS and saved homepage HTML stay byte-identical.
- Updated the regression in `test/visual-interaction-fixes.test.mjs` to lock the color 2 URL, the presence of `theme=0`, the simplified iframe style, the new gradient colors, and the absence of the old brown colors. The vanilla CSS regressions remain intact.
- **Verify:** `node --check src/client/homepage-gadgets.js` pass; targeted tests pass **15/15**; `npm test` **214/214 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- A homepage reload after the preview rebuild confirmed the committed injection itself: color 2 URL, `border-radius:12px` iframe, `#1F1F1F`/`#121212` body gradient, and four 15px squares with the correct top/bottom colors. The pre-existing unstaged `studio/index.html` rehaul remains untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.

### Milestone 19 — Studio rehaul tested and fully wired **[Jesse + OpenCode, 2026-11-24]**

- Jesse chose to test the uncommitted Studio UI rehaul before starting the Early Bird background. First pass: inline script syntax clean, existing Studio tests **60/60**, full suite **214/214**. Browser smoke on the existing `/studio/` tab found the skin loading with no console errors, but exposed real gaps: the view button was inert, quick panels and wallpaper chips never rendered, Site/Wallpaper menus had no advanced drawer, and section drag handles did nothing.
- Added `test/studio-ui-rehaul.test.mjs` with four source-level regressions for view-mode wiring/persistence, quick panels plus bottom advanced drawers in every menu, wallpaper-chip field writes, and delegated drag reorder. The new tests fail against the pre-wiring rehaul conceptually and pass with the fix.
- Wired `studio/index.html`: `setViewMode()` now persists `fsfm_studio_view_mode`, updates body classes/button state, and re-renders the editor; `applyViewMode()` runs at startup. Page, Site, and Wallpaper editors now render quick panels first and a bottom `advanced` drawer last. Wallpaper chips call `applyQuickWallpaper()`, which writes `appearance.wallpaper.mode` and `appearance.wallpaper.preset` through the normal `set()`/`dirty()` path. Section grips use delegated dragstart/dragover/drop/dragend handlers and reorder through `moveDraggedSection()`.
- Browser smoke after the fix confirmed: toggle switches `simple-mode`/`advanced-mode`, stores the choice, hides quick panels in Advanced, and opens all drawers; all six menus render one quick panel, a bottom advanced drawer, and the correct label; the first wallpaper chip changed mode `cycle` → `preset` and marked the record unsaved; dragging card 1 onto card 3 reordered the block list and showed drag/drop styling. Console errors were clean after the final reload.
- During the chip/drag smoke, local autosave rewrote `content/v13/homepage.json` with formatting-only JSON changes and no semantic content delta. The file was restored from `HEAD` immediately; final `git status` contains only the intended Studio UI files. The test localStorage key was removed and the tab was reloaded to a clean, saved state.
- **Verify:** inline script `node --check` pass; targeted Studio rehaul/design/form/content tests **18/18 pass**; `npm test` **218/218 pass**; `npm run build` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`). No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 20 — violet-haze Studio terminal, page lifecycle tools, and pinned homepage panel **[Jesse + OpenCode, 2026-11-24]**

- Finished the Studio UI rehaul and page lifecycle tools from the earlier red-terminal pass, then replaced that red skin at Jesse's request. The visible terminal now uses a true-black violet-haze phosphor palette: `--accent:#b873ff`, `--accent-bright:#dab7ff`, `--crt-green:#c9a2ff`, `--crt-cyan:#b873ff`, and `--crt-violet:#e3d0ff` over true black with scanlines. Both retained terminal layers were recoloured so inherited surfaces, focus rings, scrollbars, chips, dialogs, and toasts all read violet. Browser-computed values confirmed violet controls and no console errors in Jesse's existing Studio tab.
- Added the approved lifecycle controls to `studio/index.html`: per-page UNSAVED badges, Discard local edits, Duplicate block, Rename page / URL, Duplicate page, and Retire page. Retirement uses two dialogs plus an exact typed page name; retired pages disappear from the normal sidebar and reappear only through search. Friendly wallpaper labels are Studio-only (`purple (violet haze)`, `turquoise (aqua glass)`, `orange (solar flare)`, `pink (rose bloom)`); stored wallpaper names and IDs were not changed.
- Added `src/core/page-tools.mjs` and wired `scripts/dev-tina-preview.mjs`, `scripts/tina-local-adapter.mjs`, and `scripts/studio-publisher.mjs`. New local-only APIs handle `/content/retire`, `/content/rename`, and `/content/duplicate`; `contentIndex()` now exposes `retired`. Rename moves the JSON file to the new slug, duplicate creates a fresh local draft, and retirement writes a valid unpublished tombstone that keeps schema version, template, identity, appearance, SEO, sections, and template data. The next new page of the same type renames and reuses that retired file; no content file is deleted. The publish queue drops the old path after a move and records the new one, without live publishing.
- Fixed the public homepage left panel so the About window stays pinned while the desktop scrolls. `src/styles/homepage-vista.css` now flattens `.home-window-grid` into the desktop `.wrap` grid on `min-width:761px`, places events and social windows in the right column, and gives `.bio-window` `position:sticky; top:48px` through the content rows. It stops before the footer instead of overlapping it, and a hidden About window collapses the grid back to one column. The protected homepage HTML was not edited.
- Added `test/studio-page-tools.test.mjs` for tombstones, rename/duplicate helpers, same-slug and different-slug carcass reuse, stale-revision refusal, source-page preservation, friendly labels, violet terminal tokens, page-tool wiring, and server/adapter seams. Updated `test/studio-navigation.test.mjs` for retired-aware state, and added a sticky-panel regression to `test/visual-interaction-fixes.test.mjs`. The protected wording `Authentication requests must come from this local FSFM Studio origin.` and `The homepage cannot be deactivated` is unchanged, and `Save & deploy live` remains disabled.
- **Verify:** inline `node --check` pass; `node --check` on all changed server, core, and test modules pass; targeted page-tool/navigation/visual tests pass; `npm test` **230/230 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/` and `/studio/` tabs. After rebuild and reload, the About window stayed at `top:64px` under the taskbar at scroll 700 and at the page bottom, events stayed in the right column, the footer was not overlapped, and there were no console errors. Studio showed violet computed tokens and controls, no dirty badges, no open dialogs, and disabled Save/Discard/Deploy. No content save or live publish was performed. The Early Bird background refurb has not started; it remains queued for Jesse's sign-off on this Studio work. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 21 — pinned Studio topbar and left page menu **[Jesse + OpenCode, 2026-11-24]**

- Jesse reported that the menu on the left still fell away while scrolling page content. In his existing Studio tab the viewport sits in the `761px`–`1020px` range, where `.topbar` was still static and scrolled out of view while the sidebar stuck at `top:70px`. The shell now pins both: `.topbar` is `position:sticky; top:0; z-index:30` and `.sidebar` has its own `z-index:20`, so the left page menu stays directly under the toolbar during document scrolling.
- Added a regression to `test/visual-interaction-fixes.test.mjs` that asserts the sticky topbar and sticky sidebar rules. Made `test/studio-page-tools.test.mjs` independent of the live draft state by clearing `publishing.retired` on its in-memory source and temporary fixture copy; the tests now exercise a fresh page rather than inheriting whatever draft Jesse has retired in Studio.
- **Verify:** inline Studio module and changed test module pass `node --check`; targeted visual test passes; `npm test` **231/231 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` still matches the saved baseline exactly (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/studio/` tab. After reload, the computed topbar stayed at `top:0` and the left sidebar at `top:70px` while scrolling through the content; no console errors, no save, and no live publish. Three draft records (`new-album.json`, `vistatest.json`, and `new-editorial-page.json`) were observed in the working copy with `published:false` and `retired:true`; they were left untouched and excluded from this commit. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 22 — pre-visual checkpoint, homepage gadget repair, and full-width lower windows **[Jesse + OpenCode, 2026-11-24]**

- Created a local-only checkpoint before any Early Bird background work: annotated tag `checkpoint-pre-early-bird-background` on `aba6cad`, plus `C:\Users\jesse\fsfm-backups\pre-early-bird-background-20261124-232842\` containing `fsfm-repo.bundle` (134,855,137 bytes), `working-tree.zip` (86,177,627 bytes), and `CHECKPOINT.txt`. The archive excludes `.git`/`node_modules` and deliberately includes Jesse's three uncommitted retired draft records; the tag and commit exclude them. No push, merge, force-push, history rewrite, live publish, or credential access.
- Jesse reported a broken homepage: six desktop gadgets were stacked at `16,90` and the content windows had no buffer below the marquee. The gadget runtime had returned early when the window was not desktop-sized at load, and never re-ran after the viewport grew. It now keeps its runtime alive, applies initial positions only when the desktop media query matches, and schedules a reflow on both `resize` and media-query `change`. Browser verification in Jesse's existing `/` tab showed the expected staggered positions (`clock 55,72`, `featured release 263,345`, `dates 55,560`, `calendar 1622,72`, `picture 1414,345`, `note 1622,560`), a live clock, and zero overlap pairs.
- Added a 20px margin below the marquee for ABOUT FSFM and FSFM ON SPOTIFY. Kept window order and placement, changed ABOUT FSFM from `grid-row:3 / 6` to `grid-row:3`, and made ON THE HORIZON and FIND FSFM span `grid-column:1 / -1`. Browser verification showed the marquee ending at `818`, both first-row windows starting at `838`, and both lower windows at `left 511`, `width 840`, with the footer still below them and no console errors.
- Added regressions for delayed desktop gadget layout, the marquee buffer, and the full-width lower-window grid. **Verify:** `node --check` on the changed client/test files pass; targeted visual test passes; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the saved baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Jesse's three intentional retired draft records remain untouched and excluded from this commit. Early Bird background work has **not** started; the next step is to scheme the new background direction from the checkpoint.


### Milestone 23 — Sunrise Cathedral Early Bird background **[Jesse + OpenCode, 2026-11-25]**

- Replaced the old aurora renderer in `src/client/album-atmosphere.js` with a Sunrise Cathedral scene: a midnight-to-amber painted sky, low sun and horizon line, dark cathedral piers, tapered vertical light shafts, and a sparse star field. Sky, shafts, and stars are painted once into cached offscreen layers on resize; lite mode pre-composites one still layer at 0.8 DPR. Every visible frame is only `drawImage` calls with bounded alpha/transform drift at `1000 / 24` (24 FPS), paused on `visibilitychange`, with reduced motion handled through the same media query. No per-frame gradients, paths, filters, or fresh geometry.
- Rewrote the album bloom CSS in `src/styles/v13.css`: new dark amber dawn body gradient, `.album-atmosphere` at `mix-blend-mode: normal` with no filter, static cathedral shaft/bloom/star gradients, and compositor-only `transform`/`opacity` keyframes (`cathedral-bloom-breathe`, `cathedral-shaft-drift`, `cathedral-horizon-glow`). Removed the animated `filter: blur()` and `mix-blend-mode: screen` passes. Lite mode freezes the CSS drift; off mode keeps the amber vignette and grain. Stored wallpaper ID/name `album-amber` and its palette are unchanged.
- Updated atmosphere regressions to assert the cached-layer contract, 24 FPS cap, no per-frame gradient/path/filter work, and the new cathedral keyframes. **Verify:** `node --check` on the changed JS/tests passes; targeted tests pass; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke in Jesse's existing album tab: fetched assets contain the new cathedral CSS/renderer and no old bloom; the canvas is fixed, normal blend, and unfiltered; after one frame the canvas is fully painted (top `13,10,13`, sun `245,236,213`, horizon `241,230,201`, left pier `70,53,39`); pseudo-element animations are the three cathedral keyframes with no blur or screen blend; no console errors; a 2-second sample recorded 99 rAF callbacks and zero long tasks. The first preview build hit a Windows `ENOTEMPTY` race with the dev-server preview rebuild after tests touched content; a clean rerun passed. No push, merge, force-push, history rewrite, live publish, or credential access occurred. No user content or source files were deleted; only generated preview/dist output was rebuilt by the canonical script. Jesse's three intentional retired draft records remain untouched and excluded.


### Milestone 24 — smokey starry nebula Early Bird background and aligned album top bar **[Jesse + OpenCode, 2026-11-25]**

- Jesse rejected Sunrise Cathedral: it was not the right look and, more importantly, it did not visibly move. New direction: a huge smokey starry nebula. `src/client/album-atmosphere.js` now paints a deep violet/amber sky, 48 overlapping smoke clouds, a bright elliptical nebula core with curved filaments, and a 240-star field with bright cross-glints. All geometry is painted once into cached offscreen layers on resize at `SCENE_SCALE = 1.28`; animation is only bounded `drawImage` transforms with parallax, rotation, scale, and alpha drift at `1000 / 24` (24 FPS). Lite mode uses a lower DPR cap, fewer clouds/stars, and one pre-composited still layer. Reduced motion and hidden-tab pauses are preserved.
- Reworked the album veil in `src/styles/v13.css`: new nebula body gradient, static smoke/star/core veil gradients, and compositor-only `nebula-veil-breathe`, `nebula-smoke-drift`, and `nebula-core-pulse` keyframes. No per-frame gradient, path, blur, or 400-unique-frames-per-second work. Stored wallpaper ID/name `album-amber` and its palette are unchanged.
- Fixed the album top bar spacing Jesse specified: `.template-album .global-header` now uses `calc((100% - 920px) / 2)` so it lines up with the album shell. Browser measurement in Jesse's existing tab confirmed `headerPaddingLeft: 471px` and `shellLeft: 471px` at a `1882px` viewport.
- Updated atmosphere, canvas-workload, and header-spacing regressions to lock the new layer names, counts, cached-draw contract, nebula keyframes, absence of cathedral leftovers, and the `920px` inset. **Verify:** `node --check` on changed JS/tests passes; targeted tests pass **33/33**; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. After reload the canvas is painted (`941x932`, mode `full`), three canvas samples over 800ms are all different (`moving: true`), and console errors are empty. A 5.8s steady-state trace recorded **0 long tasks / 0ms long-task blocking**; the reload trace captured initial-paint long tasks only. This session cannot view screenshot images directly, so final visual approval is left to Jesse in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 25 — Golden Glitter Sky: simpler, warmer, denser, still dynamic **[Jesse + OpenCode, 2026-11-25]**

- Jesse said the nebula was overcomplicated and gave the real target: a huge beautiful star field in the back, using all the yellows of the rest of the page, with tons of glitter and bloom, awesome and dynamic. Removed the smoke/cloud/core/filament machinery entirely. `src/client/album-atmosphere.js` now paints one oversized canvas once on load and on resize: a dark warm base, four broad golden bloom washes, and **900** glitter stars (**420** in lite mode) in the page's own yellow palette (`#fef5de`, `#fff3cf`, `#ffe6b8`, `#ffd9a0`, `#ffffff`, `#bd8b4e`). The brightest stars get soft radial halos and cross-glints. DPR is capped at `1` full / `0.75` lite.
- There is no JavaScript animation loop at all now — no `requestAnimationFrame`, no frame timer, no per-frame draw. Motion lives in CSS: `golden-sky-drift` slowly translates/scales the canvas, while `golden-bloom-breathe` and `golden-sparkle` move the warm bloom wash and a few larger sparkles. All are compositor-only `transform`/`opacity` animations; reduced motion disables the canvas animation too. The album header stays aligned at the `920px` shell inset.
- Rewrote the atmosphere regressions for the simpler contract: one paint function, no frame loop/layers, real lite reduction, golden palette, compositor motion, reduced-motion coverage, and no nebula/cathedral leftovers. **Verify:** `node --check` on changed JS/tests passes; targeted tests pass **33/33**; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. After reload the canvas is painted (`2197x2200`, mode `full`, 2304/2304 sampled pixels lit), its computed transform changes over 900ms under `golden-sky-drift`, the bloom runs `golden-bloom-breathe`, header padding and shell left are both `471px`, and console errors are empty. An 8.5s steady-state trace recorded **0 long tasks / 0ms long-task blocking**. This session cannot view screenshot images directly, so final visual approval is left to Jesse in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 26 — cooler, visibly dynamic golden glitter sky **[Jesse + OpenCode, 2026-11-25]**

- Jesse wanted it cooler and actually moving dynamically. Kept the one-canvas paint-once model and added six one-time DOM streaks (`3` in lite mode, none when the atmosphere is off). `addStreaks()` only positions them and sets CSS custom properties; every frame is a compositor-only `glitter-shoot` transform/opacity animation. Reduced motion hides the streaks. No JavaScript animation loop was introduced.
- Sped up and widened the compositor motion: `golden-sky-drift` now runs in 18s with a larger translate/scale range, `golden-sky-twinkle` pulses opacity in 5.5s, `golden-bloom-breathe` runs in 12s/9s, and `golden-sparkle` runs in 7s with twelve larger star points instead of six. The canvas still uses the full yellow palette and 900/420 glitter stars; the header inset remains aligned.
- Updated regressions for the streak contract, two canvas animations, new timings, and reduced-motion hiding. **Verify:** `node --check` on changed JS/tests passes; targeted tests pass **33/33**; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. After reload the canvas runs `golden-sky-drift, golden-sky-twinkle` and its transform changes over 900ms; six `.glitter-streak` elements exist, run `glitter-shoot`, and one moved about **119px in 900ms**, so the motion is obvious. The bloom still runs `golden-bloom-breathe`; console errors are empty; a 5s steady-state trace recorded **0 long tasks / 0ms long-task blocking**. This session cannot view screenshot images directly, so final visual approval is left to Jesse in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 27 — remove shooting stars, add clustered contrast and dark voids **[Jesse + OpenCode, 2026-11-25]**

- Jesse rejected the shooting streaks. Removed every `.glitter-streak` / `glitter-shoot` creation, style, mode override, reduced-motion rule, and regression assertion. The background no longer creates any streak elements; `src/client/album-atmosphere.js` still paints exactly one canvas on load/resize, with no JavaScript animation loop.
- Rebuilt the single painted frame around contrast instead of motion gimmicks: the base gradient is now almost black (`#020104` / `#0b060a` / `#030104`), four dark radial pockets are painted after the warm bloom and before the stars, and 46% of the 900 glitter stars (420 in lite mode) are pulled into five designed clusters. The palette now leads with `#ffffff` before the page's warm yellows, bright stars get `8–16x` halos, and the CSS vignette uses `rgba(2,1,4,.68)` plus two explicit dark pockets. The existing `golden-sky-drift` (18s), `golden-sky-twinkle` (5.5s), bloom breathe (12s/9s), and sparkle (7s) compositor animations remain, so it is still dynamic without per-frame paint.
- Updated regressions for the new cluster/void/contrast contract and for the absence of streaks. **Verify:** `node --check` on changed JS/tests passes; targeted tests pass **33/33**; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. After reload there are **0** `.glitter-streak` elements, console errors are empty, the canvas runs `golden-sky-drift, golden-sky-twinkle` with both transform and opacity changing over 900ms, and the bloom runs `golden-bloom-breathe`. Sampled luminance shows the intended contrast: cluster `avg 50 / max 86`, center `avg 70 / max 72`, dark void `avg 2 / max 3`. Header padding and shell left are both `471px`. A quiet 7.0s steady-state trace recorded **0 long tasks / 0ms long-task blocking**; earlier marker-based wait traces were discarded because the wait's accessibility snapshot itself introduced tasks. This session cannot view screenshot images directly, so final visual approval is left to Jesse in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 28 — vary star brightness without adding motion or paint **[Jesse + OpenCode, 2026-11-25]**

- Jesse loved the contrast version and asked for some variation in star brightness. Kept the single paint-once canvas, the 900/420 star counts, the clusters, the dark voids, and every compositor animation exactly as they were. Added a small deterministic `starAlpha(big)` helper with four tiers: about 18% faint dust at `0.08–0.20`, 54% soft mid-tones at `0.22–0.52`, 23% bright glitter at `0.56–0.86`, and 5% near-white hero stars at `0.90–1`. Big halo stars are confined to the upper end (`0.76–0.92` or `0.93–1`) so they still read as the brightest points. This replaces the old uniform small-star range `0.30–0.86` and big-star range `0.82–1` with a spread that has real dim dust and rare standout glitter.
- Updated regressions to assert all four tiers, the `g.globalAlpha = starAlpha(big)` wiring, and the absence of the old uniform contract; the V15 paint-once test now also requires the helper. **Verify:** `node --check` on changed JS/tests passes; targeted tests pass **33/33**; `npm test` **233/233 pass**; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. After reload there are **0** streaks, console errors are empty, the canvas runs `golden-sky-drift, golden-sky-twinkle` with a changing transform, and the bloom runs `golden-bloom-breathe`. A 180px sample in a glitter cluster shows a real spread (`p50 45`, `p90 55`, `p99 71`, `max 236`) and the dark void still holds (`p50 7`, `p90 26`, `p99 74`, `max 251` from rare stars), so the dark pockets survive while individual stars now pop at different brightnesses. Header padding `87.2px` and shell left `87px` remain aligned in the current viewport. A quiet 5.7s steady-state trace recorded **0 long tasks / 0ms long-task blocking**; the first 6.1s sample had one boundary task at `50.25ms` with only `0.254ms` blocking, and a clean rerun followed. This session cannot view screenshot images directly, so final visual approval is left to Jesse in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 29 — album Spotify embed gets the homepage two-tone corner mask **[Jesse + OpenCode, 2026-11-25]**

- Jesse wants the Early Bird Spotify album embed to match the homepage before posting. `renderEmbed()` now accepts an album-only `options.corners` flag. The album `spotify-embed` part passes it; the homepage `embed-window` call still uses the original two-argument form, so the protected homepage HTML is unchanged byte-for-byte. The album output now has a rectangular `.fsfm-spotify-frame` (`border-radius: 0`), keeps the iframe's own `border-radius:12px`, and adds four 15px `.fsfm-spotify-corner` squares with the exact homepage colors: top `#1F1F1F`, bottom `#121212`. The frame background uses the same `linear-gradient(#1F1F1F 0 50%, #121212 50% 100%)`. The stored embed URL and `si` value were left untouched; only the presentation changed.
- CSS for the mask lives only in `src/styles/v13.css` under `.player-listen .fsfm-spotify-*`; no homepage CSS/client code was changed. Added a regression asserting the options contract, the four corner order/names, the iframe radius, the album-only single call site, and all four color/position rules. **Verify:** targeted tests pass **30/30**; `npm test` **234/234 pass**; `npm run check:v14` pass; `npm run validate:v14` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run predeploy-check` pass (production audit + required local media); `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Inspected the built production album HTML: it contains `.embed-frame fsfm-spotify-frame`, the `style="border-radius:12px"` iframe, and four ordered corner spans; the built `v13.css` contains the rectangular frame and four color rules. Jesse's existing `/albums/the-early-bird/` dev tab was reloaded, but that local dev server serves Studio preview markup (`.embed-preview`, no live iframe), so final visual confirmation of the real embed must come from the production page. Console errors were empty. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access. Live publishing remains locked until Jesse explicitly unlocks it and confirms.


### Milestone 31 — slow the Early Bird sky before deeper optimisation **[Jesse + OpenCode, 2026-11-25]**

- Jesse confirmed the production preview works, then said the background feels far too laggy and asked to try slowing it down before optimising. Slowed every CSS-only motion in `src/styles/v13.css`: `golden-sky-drift` `18s -> 40s`, `golden-sky-twinkle` `5.5s -> 14s`, `golden-bloom-breathe` `12s -> 26s` and `9s -> 20s`, and `golden-sparkle` `7s -> 16s`. Also narrowed the ranges so the remaining motion is gentler: canvas drift `±2% / ±1.5%` and scale `1.02–1.06`, twinkle opacity `.9–1`, bloom scale `1–1.04` with opacity `.7–.9`, sparkle `±1%` with scale `.99–1.02` and opacity `.55–.82`.
- No JavaScript, canvas paint count, star count, contrast, or spotify **parts** were touched. This is purely a speed/range change; slowing an animation changes how fast it moves but does not by itself remove per-frame compositing work, so if Jesse still feels lag the next step is real optimisation of the animated layers.
- Updated regressions for the new durations and narrowed keyframes. **Verify:** targeted tests pass **34/34**; `npm test` **234/234 pass**; `npm run check:v14` pass; `npm run validate:v14` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run predeploy-check` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab after the rebuilt preview CSS was served. Computed durations are `40s, 14s` on the canvas, `26s` on the bloom, `20s` on the after-bloom, and `16s` on the sparkle layer; there are still **0** streaks and console errors are empty. The canvas transform still changes over 900ms, but by about `0.16px` instead of the previous several pixels, so it remains dynamic while feeling much calmer. Final visual feel is left to Jesse. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 32 — calm the Early Bird sky while scrolling **[Jesse + OpenCode, 2026-11-25]**

- Jesse said scrolling still feels a little juddery after the slowdown. Kept the single paint-once canvas and all CSS-only compositor motion, then reduced how much layer area the browser has to move: canvas overscan `118% -> 108%` at `top/left -4%`, bloom `inset -8% -> -4%`, pseudo-layer inset `-12% -> -6%`, and removed the extra `will-change: transform, opacity` hints from the bloom and sparkle layers (canvas keeps only `will-change: transform`). Added a passive `scroll` listener in `src/client/album-atmosphere.js` with one 180ms debounce timer that toggles `body.album-scroll-calm`; CSS pauses the canvas, bloom, and both pseudo-layers with `animation-play-state: paused` during scroll and resumes them after scrolling settles. No `requestAnimationFrame`, no per-frame JavaScript, no new **parts**, no change to star counts, colours, contrast, or the Spotify corner mask.
- Added regressions in `test/parts-atmosphere.test.mjs` and `test/v15-desktop-regressions.test.mjs` for the passive listener, 180ms debounce, class name, paused state, smaller layer geometry, reduced `will-change`, and the continuing absence of streaks and per-frame drawing. **Verify:** `npm test` **235/235 pass**; `npm run check:v14` pass; `npm run validate:v14` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run predeploy-check` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Browser smoke used only Jesse's existing `/albums/the-early-bird/` tab. With instant scrolling, `album-scroll-calm` appeared within about `11ms`, computed `animation-play-state` was `paused` on canvas and bloom, then the class cleared about `192ms` after scrolling stopped and both resumed to `running`; console errors were empty and there were still **0** streaks. A 5.4s scroll trace recorded **0 long tasks / 0ms long-task blocking**, `UpdateLayoutTree` `256 / 149.2ms` (was `321 / 176.5ms`), `ScrollLayer` `57 / 10.1ms` (was `86 / 9ms`), and no `ImageDecodeTask` in the retained trace (baseline had `51ms`). This is a measurable reduction in layout work, but final scroll feel still needs Jesse's judgement in the live tab. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 33 — unpin the homepage About window **[Jesse + OpenCode, 2026-11-25]**

- Jesse reported two things: the Early Bird scroll is smooth in the in-app preview but still lags in his normal web browser, and the homepage `ABOUT FSFM` window appears pinned while scrolling. The second was an explicit desktop rule: `src/styles/homepage-vista.css` had `position:sticky; top:48px; z-index:20` on `body.template-homepage .home-window-grid > .bio-window`, with a comment saying it should stay pinned. Removed those declarations and rewrote the comment so the About window now stays in its grid row and scrolls normally. The desktop grid layout, window order, `margin-top:20px`, hidden-About fallback, and all other **parts** remain unchanged.
- Updated `test/visual-interaction-fixes.test.mjs` to require the new non-sticky `bio-window` rule and to reject `position:sticky` on it. **Verify:** `npm test` **235/235 pass**; `npm run check:v14` pass; `npm run validate:v14` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run predeploy-check` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- The browser mismatch is still unresolved: the in-app preview uses Jesse's existing `localhost:3000` album tab and a placeholder embed, while his normal browser may be using the production `localhost:3100`/`dist` build with the real Spotify iframe. No new tab was opened and no comparison screenshot was taken. Need Jesse to confirm the exact URL and browser before changing more code. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 34 — isolate the live Spotify iframe from scrolling **[Jesse + OpenCode, 2026-11-25]**

- Jesse confirmed the lag is in Firefox private mode on `localhost:3100`, the production `dist` build with the real Spotify iframe. The in-app tab was temporarily navigated from `localhost:3000` to that exact URL (no new tab). The first production scroll trace showed **3 long tasks / 73.686ms**, while the dev placeholder had 0. A CPU profile during scrolling was almost entirely idle, so the stall was not site JavaScript. Temporarily replacing the 352px iframe with a static placeholder of the same height produced **0 long tasks**; forcing fresh iframe loads and alternating baseline/contained traces later were intermittently clean, so the trigger appears to be the live cross-origin iframe's own rendering rather than a repeatable site-script bug.
- Kept the real iframe, stored URL, and all four corner **parts** untouched. Added `contain: paint; isolation: isolate` to `.player-listen .fsfm-spotify-frame` and `transform: translateZ(0); backface-visibility: hidden` to its iframe in `src/styles/v13.css`. This keeps the embed visible and interactive, but confines its paint and promotes it to its own compositor layer. Rejected `visibility:hidden` and `content-visibility:hidden` diagnostics because they blank the embed while scrolling. Added a regression requiring the containment/promotion and forbidding those hiding rules.
- **Verify:** `npm test` **236/236 pass**; `npm run check:v14` pass; `npm run validate:v14` pass; `npm run build` pass; `node scripts/build-v13.mjs --preview --include-drafts` pass; `npm run predeploy-check` pass; `git diff --check` pass. Production `dist/index.html` remains byte-for-byte identical to the protected baseline (29,030 chars, 29,131 bytes, SHA-256 `987A78BFDB86BFF1AFC4180249403F68E985153EB1CAB66A8721B6F71EBF46F7`).
- Final browser check used the same existing album tab on `localhost:3100`: computed `contain: paint`, `isolation: isolate`, an identity 3D transform, `backface-visibility: hidden`, one live iframe, four 15px corners with exact `rgb(31,31,31)` top and `rgb(18,18,18)` bottom colours, **0** streaks, empty console, and **0 long tasks / 0ms blocking** on the final scroll trace. The tab was then restored to its original `localhost:3000/albums/the-early-bird/` URL. Firefox feel still needs Jesse's confirmation. Jesse's three intentional retired draft records remain untouched and excluded. No push, merge, force-push, history rewrite, file deletion, live publish, or credential access.


### Milestone 35 — authorize and attempt GitHub Pages deployment **[Jesse + OpenCode, 2026-11-25]**

- Jesse said we are ready to deploy for real and then explicitly answered `Yes — unlock and deploy`, authorizing the merge into `main`, the push to `origin/main`, and GitHub Pages publishing. Preflight on `rv26` passed `check:all` **236/236**, `check:tina`, `test:tina:local` on isolated port `3101`, `predeploy-check`, and the exact protected homepage hash. Merged `rv26` into `main` in the separate worktree with no conflicts, reran the same four-command chain there on the merged tree, and committed as `e5ef5f0`. Pushed `origin/main` normally (`43066f6..e5ef5f0`); no force-push, history rewrite, file deletion, or credential access. Jesse's three intentional retired draft records were left uncommitted in the canonical repo and stayed excluded from the build.
- Workflow run `#13` completed checkout, install, tests, Tina audit, local smoke test, production audit, Pages configuration, and artifact upload successfully, but `Deploy website` failed with `No artifacts named "github-pages" were found for this workflow run`. The run's artifacts API showed one `github-pages` artifact (2,520,087 bytes, not expired) and githubstatus.com reported All Systems Operational, so this appears to be the transient metadata race described in the workflow annotation. This append-only log entry triggers one clean retry with unchanged site **parts** and the same protected homepage hash.
