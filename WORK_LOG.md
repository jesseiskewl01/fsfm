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
