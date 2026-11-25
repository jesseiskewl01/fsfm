# FSFM Studio — Fix List

> Written: 2026-11-22  
> Branch: `rv26` (at `245439b`)  
> Method: read-only source audit. **Studio was not run, and nothing was published.**  
> This is a working list, not a verdict. Items marked ❓ need a decision from Jesse.

---

## 0. Bottom line

Studio is **much further along than the old V16 docs admit**. The V16.1 doc says "no publish workflow" — but the current source has a full local-save → pending-queue → publish-to-`main` flow with safety checks.

The real problems are not missing buttons. They are:

1. **Studio and Tina are two separate editors writing the same files.** That is the exact thing the old state doc warned against — for once, it was right about the risk, just wrong about which tool to keep.
2. **Tina only knows about albums.** Jesse's Goal 1 is "every single bit of the website editable."
3. **Live publishing is deliberately locked** until the V16 release lands on `main`.

---

## 1. Verified facts (with real file references)

### Studio is a custom app, not a Tina client

| Fact | Evidence |
|---|---|
| Studio talks to a custom API at `/__fsfm/api` | `studio/index.html:597` |
| That API is served by a custom Node server | `scripts/dev-tina-preview.mjs` |
| `npm run dev:tina` uses the Tina CLI to launch that server | `package.json:36` |
| Tina admin is built into a separate `admin/` folder | `tina/config.js:50-54` |
| Studio is reached at `/studio/`, Tina admin at `/admin/` | server routing + `tina/config.js` |

**What this means:** Studio is a *sibling* of Tina, running in the same dev server and writing the same repo files. It does not call Tina's GraphQL/API to save content. Jesse's mental model — "Studio is a custom frontend FOR TinaCMS" — is the **destination**, not the current implementation.

### What Studio can already do

- Add / remove / reorder sections (blocks) in an editor: `studio/index.html` section-card UI, ~line 19 and ~line 670+
- Page creation modal with template choice (Vista, Album, Editorial): `studio/index.html:585`
- Component allowances, required components and maximum counts come from the real registries: `studio/index.html:669-673`, `src/components/registry.mjs`, `src/templates/registry.mjs`
- Live-ish preview in an iframe, with device sizes: `studio/index.html` preview CSS/HTML
- **Save local** → writes JSON to the working tree and records a SHA-256 in a pending manifest: `scripts/studio-publisher.mjs:286+`
- **Publish** → checks `main`, builds in a temporary worktree, runs `check:all` + `predeploy-check`, commits and pushes to `main`: `scripts/studio-publisher.mjs:321-386`
- Auth stored outside the repo at `%USERPROFILE%\.fsfm-studio\auth.json`: `dev-tina-preview.mjs:28-31`
- **24 test files**, including 8 Studio-specific tests (editor, navigation, preview, publisher, login, etc.)

That's a solid foundation. Do not throw it away.

### The publish gate (important for the live test)

`studio-publisher.mjs:194` requires `.fsfm-studio-deploy.json` to exist **on `main`**. I checked:

```
git show main:.fsfm-studio-deploy.json
→ fatal: path exists on disk, but not in 'main'
```

So Studio currently reports `mainReady: false` with the message *"Live publishing unlocks after the V16 Studio release has been merged into main."*

**This is intentional, not a bug.** But it means: we cannot test live publishing until the V16 work is merged to `main`. That is a real gate in Jesse's Step 6.

---

## 2. Gaps, prioritised

### P0 — blocks the stated goals

**P0-1. Two editors, one source of truth ❓**
Studio writes `content/v13/**` directly. Tina admin also writes `content/v13/albums` via `tina/config.js`. Nothing stops one overwriting the other, and neither is aware of the other's pending state.

Options:
- (a) Keep Tina only as a schema/field-definition source; Studio becomes the sole editor. Simple, honest, matches "Studio is friendly."
- (b) Make Studio a real client of Tina's backend so Tina is genuinely the engine. Matches Jesse's stated model, bigger job.
- (c) Retire Tina admin from day-to-day use.

**My leaning:** (a) short-term, (b) as a later design goal. But this is a *goal* decision — Jesse's call.

**P0-2. Tina's schema covers only albums**
`tina/config.js` has one collection (`album`) and `sectionTypes` of just 4 album blocks. Goal 1 says every bit of the site should be editable. So Tina currently covers roughly one page type.

**P0-3. Live publishing is locked**
Needs a deliberate merge of the V16 release into `main` before Step 6 is even testable. Must be planned with a rollback, not done casually.

### P1 — quality and performance

**P1-1. Fixed 1.1-second preview wait is still there**
`studio/index.html:918`: `setTimeout(..., 1100)` after a local save before reloading the preview. The Stage 1 audit flagged this as a candidate; it is confirmed present. Candidate for measurement, not yet proven to be the main lag.

**P1-2. The aurora canvas is still not a block**
`src/render/page.mjs` inserts `#nebulaCanvas` unconditionally for album templates. There is no `enabled` switch and Studio has no control for it. This is both a performance issue and a Goal 2 gap. (Roadmap Phases 1–3.)

**P1-3. Studio is one very large HTML document**
`studio/index.html` is ~95k characters of CSS + HTML + JS in one file. It works, but it is hard to reason about. Splitting it is a maintenance improvement, **not** a user-facing feature — defer until after greenlight.

### P2 — cleanliness

**P2-1. Stale V16 docs.** V16.1 says no publish workflow; there is one. V16.3 says local saves never publish — true *directly*, but they queue for later publishing. These docs misled us once already.

**P2-2. Tina's default branch is stale.** `tina/config.js:46` defaults to `v16-tinacms-prototype`. Should point at the current working line, or be driven by environment.

**P2-3. UI ease is untested.** Only Jesse can judge whether Studio is actually comfortable. That's an acceptance test, not a code fix.

---

## 3. Suggested order — CORRECTED 2026-11-22

Jesse decided: **Tina is the actual content backend and Studio must call it.** He also corrected the order: **the building blocks and architectural consolidation come before Studio.**

1. **BLOCKS FIRST (Roadmap Phases 3–5).** Refurbish the "mud huts": homepage and The Early Bird become assemblies of the shared 18 blocks. The aurora becomes a configurable block, not hardcoded canvas. No monolithic page renderers left.
2. **Then make Studio a real Tina client.** P0-1 option (b). Design how Studio calls Tina rather than writing JSON directly.
3. Confirm the local run works — `npm run dev:tina`, `/studio/`, disposable test page.
4. Fix P1-1 (1.1 s wait) and any remaining UX issues found in testing.
5. Plan the `main` merge that unlocks publishing, with rollback.

Do not start by rewriting Studio, and do not use Studio as a substitute for finishing the architecture. It already does too much correctly — its problem is what sits underneath it.

---

## 4. What I have NOT verified

- ❌ I did not run Studio or the dev server.
- ❌ I did not read all ~95k characters of `studio/index.html` line by line.
- ❌ I did not test publishing (it would push to `main`).
- ❌ I did not check whether the 24 tests currently pass.
- ❌ I did not open any credentials.

These are deliberate limits for a late-night read-only audit. The next session should do the local smoke test before treating any of this as final.

---

## 5. Decision — ANSWERED 2026-11-22

Jesse chose: **"It is the actual content backend, and Studio must call it."**

So P0-1 resolves to option (b): Studio becomes a real client of Tina, not a sibling that writes the same JSON files. This is a design requirement for the Studio phase — which now comes **after** the building-block architecture is consolidated.

---

## 6. Current visual and Studio UI backlog **[Jesse + OpenCode, 2026-11-24]**

> Status: not started. Jesse asked for these to be collected while he reviews the local Studio. Nothing below has been changed yet.

### Homepage / site visual fixes

1. Fix the odd bezel at the top of the bottom widgets at just-below-desktop width.
2. Remove the six-dot grab indicator from the bottom widgets; they are not movable.
3. Make the Bubble Frequency slider easier to read.
4. Add more breathing room between the top widgets.
5. Add push/collision behaviour when dragging one top widget into another: the widget being held pushes the widget it hits.
6. Fix the artist embed being dark grey inside a white container.
7. Vista window close button should close the window, not just minimize it. Minimizing already works well.

### Studio UI rehaul

8. Redesign the Studio UI. Two directions were discussed and the final choice is still Jesse's:
   - **AMOLED terminal:** Courier New, very dark, high contrast, dense but extremely helpful. Easier and faster to build; best for a tool you sit in for hours.
   - **Vista mirror:** make Studio feel like the homepage desktop. Cooler and more on-brand, but harder and risks becoming decorative instead of useful.
   - OpenCode recommendation: do the AMOLED terminal foundation first, then borrow Vista accents later.
9. Make the building-block editor much more visual and clean: cards, previews, clear status, and less nested chrome.
10. Fully flesh out error messages so they say exactly what went wrong, where it happened, and what to do next.
11. Reduce the number of dropdowns and Russian-doll submenus. Booleans should be obvious switches, not menus. Make the whole thing more idiot-proof and friendly.

### Local reliability

12. Make `localhost:3000` work for Studio as well as `127.0.0.1:3000`. Right now the site loads from either name, but Studio's origin check only accepts `127.0.0.1`.

### Performance

13. Do the overdue optimization pass: make the same site load with less repeated work, while preserving the byte-identical default homepage.
