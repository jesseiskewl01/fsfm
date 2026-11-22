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
