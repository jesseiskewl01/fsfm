# FSFM Roadmap — Revitalise, Don't Rebuild

> Last updated: 2026-11-21  
> Owner: Jesse (artist, Fake Space Fog Machine)  
> Companion documents: `WORK_LOG.md` (the living three-line handover) and `archive/PROJECT_STATE.md` + `archive/PROJECT_LOG.md` (historical only, archived 2026-11-21).

---

## 0. What this document is for

This roadmap translates Jesse's stated ambitions into an ordered, checkable plan. It exists so that work can survive a change of conversation, a change of assistant, or a change of mood.

The single most important sentence: **FSFM is an architectural unification and authoring project, not a ground-up rebuild.**

Every phase below must be read against the working rules at the end. If a rule and a phase conflict, the rule wins.

---

## 1. The mission

### Goal 1 — CMS-backed editing

**Problem:** Editing the site currently means swapping HTML files around. There is no comfortable, repeatable way for a non-technical artist to change something and see it published.

**Intended outcome:**

- All editable content lives in structured data (JSON / content definitions), not hand-edited HTML.
- Editing happens through a CMS interface — **TinaCMS is the content backend**.
- **FSFM Studio is the custom client frontend for TinaCMS**: it makes the same content approachable rather than competing with Tina as a second source of truth.
- The publish chain is explicit and automatic:

```
Studio (friendly UI)
    → TinaCMS (content API / Git-backed source of truth)
        → content files committed to Git
            → GitHub Actions builds the static site
                → custom subdomain (fsfm.port82.net)
```

- There is **exactly one authoritative place** for each piece of content. No two editors writing the same JSON.

**Why this works with a static site:** the static output remains fast, cheap and deployable; the CMS only changes the *input* side. Nothing about the public site's delivery model needs to change.

### Goal 2 — A building-block website (the big one)

**Problem:** Every page is currently a bespoke pile of code. Adding an album, or reusing the homepage marquee somewhere else, means duplicating and hand-wiring things.

**Intended outcome:**

- Every visible feature is a **building block** with one implementation, a clear configuration shape, and a declared set of places it is allowed to appear.
- Blocks are **portable**: a marquee that works on the homepage can be added to a new page in Studio and Just Work™, with no code edits.
- **Templates** are recipes: a small pool of known-good arrangements of blocks (Homepage, Album, Vista Window, Editorial) plus the rules for which blocks each accepts.
- Releasing a new album becomes an **assembly job** in Studio: pick the Album template, fill in the album details, add/remove blocks, publish.
- The block library is the product. HTML is a byproduct.

### Explicit non-goals

- ❌ Making Vista, Early Bird and Editorial look the same.
- ❌ Removing effects wholesale to "fix performance" without evidence.
- ❌ Adding new features for their own sake. This is revitalisation.
- ❌ Rewriting the working content → render → build → deploy pipeline.
- ❌ Deleting files or systems before their dependencies are understood.
- ❌ Two competing authoritative editors for the same content.

---

## 2. Where we actually are (verified 2026-11-21)

This section is evidence, not aspiration.

### 2.1 The building blocks already exist

`src/components/registry.mjs` defines **18 components**, and `src/render/components.mjs` renders all 18 (`RENDERED_COMPONENT_TYPES`):

| # | Block | # | Block |
|---|---|---|---|
| 1 | `site-header` | 10 | `image` |
| 2 | `hero` | 11 | `gallery` |
| 3 | `marquee` | 12 | `quote` |
| 4 | `artist-statement` | 13 | `link-button` |
| 5 | `embed-window` | 14 | `divider` |
| 6 | `bandsintown-events` | 15 | `spacer` |
| 7 | `social-links` | 16 | `album-header` |
| 8 | `featured-release` | 17 | `album-player` |
| 9 | `rich-text` | 18 | `spotify-embed` |

Comment in the registry says "Rendering is added in Stage 3" — this is **stale**, the rendering is present. Do not treat the comment as a to-do.

### 2.2 Templates exist

`src/templates/registry.mjs` defines 4 templates with `allowedComponentTypes`, `requiredComponents` and `maximumComponents`:

- `homepage` — `/`
- `album` — `/albums/{slug}/`
- `vista-window` — `/pages/{slug}/`
- `editorial` — `/pages/{slug}/`

### 2.3 The gap: atmosphere is not a block

The Early Bird aurora canvas is inserted in `src/render/page.mjs`:

```js
const albumAtmosphere = page.template === 'album'
  ? '<canvas id="nebulaCanvas" ...>...'
  : '';
```

It is driven by `src/client/album-atmosphere.js` and has **no configuration flag**. The `backgroundEffects` setting exists but is only read by the homepage script. So the most expensive effect on the site is the one thing that cannot yet be toggled from an editor.

### 2.4 Performance evidence

- Jesse's direct A/B test in Firefox DevTools: **deleting the `<canvas>` on The Early Bird drastically improved performance.** Highest-value evidence we have.
- Firefox profile comparison (real browser, real profile):

| Capture | event delay p50 | p95 | max | long tasks |
|---|---|---|---|---|
| Early Bird | 11.6 ms | 420.8 ms | 616 ms | 19 |
| Both pages open | 110.2 ms | 336.1 ms | 876 ms | 158 |
| Homepage | 0.0 ms | 4.9 ms | 108 ms | 2 |

- The profiler **cannot attribute** the long-task stacks to site JS (Firefox GC/JIT internals, no window ID in sampled frames). The user's A/B test fills that gap.
- Candidate cause, **hypothesis not proven**: per-frame canvas `ctx.filter = 'blur(13px)'` / `blur(4px)` passes. `album-atmosphere.js` draws ~8–14 blurred fills per frame at ~31 fps.
- The existing analysis scripts/reports in `fsfm-main` are untracked drafts and contain at least one unit bug (event durations of `150498830ms`). Verify before citing.

### 2.5 The folder situation

Three local checkouts of the same GitHub repo (`jesseiskewl01/fsfm`):

| Folder | Branch | Role for now |
|---|---|---|
| `fsfm` | `v16-tinacms-prototype` | Studio/Tina prototype. **Has uncommitted content edits — leave alone.** |
| `fsfm-main` | `firefox-recording-chunks` | Evidence + status docs + roadmap/log live here. |
| `fsfm-work` | `website-development` | Clean older checkout, parked. |

This was created by a previous assistant's experiments, not by Jesse. Nothing is lost. Do not consolidate until there is a deliberate reason.

### 2.6 Documentation correction owed

The archived `archive/PROJECT_STATE.md` says "TinaCMS at `/admin/` may remain temporary" and "Studio is the primary editor." **This contradicts Jesse's stated intent** (§1 Goal 1). The correct model is: TinaCMS is the content backend; Studio is its custom client frontend. The archived file is historical and must not be treated as current guidance.

---

## 3. Guiding principles

1. **Measure before changing.** No speculative performance fixes.
2. **Preserve the three identities.** Vista = glass/desktop. Early Bird = amber, album-focused, special player. Editorial = typography-led.
3. **One source of truth per piece of content.**
4. **One implementation per block.** Reuse beats duplication.
5. **Shared definitions** should drive editor controls, validation and rendering where practical, so lists cannot drift apart.
6. **Never discard the real-profile Firefox evidence.** A clean-profile run may be added as a comparison, never as a replacement.
7. **Ask before anything risky** — destructive git operations, deletions, migrations, credential handling, or changes to uncommitted user work.
8. **Keep the public static site separate from the authoring environment**, joined by shared definitions.
9. **Label observations, hypotheses and conclusions separately** in every report.

---

## 4. Phase plan

### Phase 0 — Orientation and continuity ✅ (in progress → complete on writing)

**Purpose:** Make the project understandable without this conversation.

**Deliverables**
- `ROADMAP.md` (this file)
- `WORK_LOG.md` with Finished / Current / Next
- Folder map (§2.5) recorded
- Jesse's two goals recorded as authoritative (§1)

**Acceptance:** A new assistant can read these two files plus the archived state/log and know what to do next.

---

### Phase 1 — Measure the aurora (evidence, not fixes)

**Purpose:** Turn "removing canvas helped" into "we know which draw call costs what."

**Work**
1. Establish a repeatable local preview of the Early Bird page.
2. Instrument `drawAurora()` with `performance.now()` timings per stage (blooms / curtains / horizon / stars).
3. Compare variants **without changing committed files** where possible:
   - current
   - canvas hidden via CSS or removed in DevTools (Jesse's test)
   - no `ctx.filter` blur
   - reduced star count / DPR
4. Re-read the Firefox recordings only to corroborate, using existing scripts as drafts to verify.
5. Record findings as observed / inferred / unknown.

**Acceptance:** A short evidence note naming the dominant cost, with numbers. **No visual changes shipped in this phase.**

---

### Phase 2 — Surgical aurora optimisation

**Purpose:** Make the amber atmosphere cheap while keeping it recognisably itself.

**Candidate approaches** (choose based on Phase 1 evidence):
- Pre-render the soft curtains to a smaller offscreen canvas and scale them up.
- Replace per-frame `ctx.filter` blurs with cached blurred sprites or gradient-only softness.
- Lower the internal resolution / cap DPR more aggressively.
- Reduce redundant gradient creation per frame.

**Guardrails**
- Keep the warm amber palette, drifting light curtains, bloom and stars.
- Respect `prefers-reduced-motion` (already implemented).
- Pause on hidden tab (already implemented).
- Visual comparison before/after must be reviewed by Jesse.

**Acceptance:** Event delay on Early Bird in the same ballpark as homepage; Jesse confirms the look still feels like The Early Bird.

---

### Phase 3 — Promote the atmosphere to a configurable block/feature

**Purpose:** Make the fix an instance of Goal 2, not a one-off patch.

**Work**
- Add a configuration surface for the atmosphere (e.g. `appearance.effects.albumAtmosphere` with mode: full / lite / off).
- Have `page.mjs` render the canvas from that configuration instead of unconditionally by template.
- Add the effect to the shared definition layer so Studio can expose a control.

**Acceptance:** Turning the aurora off/on is a content change in Studio, not a code edit.

---

### Phase 4 — Unify the shared visual foundations

**Purpose:** Address the Stage 1 audit finding: fragmented window systems.

**Work**
- Use homepage Aero windows as the visual source of truth for Vista window chrome.
- Move toward one shared window renderer, stylesheet layer and interaction controller.
- Keep desktop gadgets as their own component family.
- Preserve context-specific behaviour (homepage shutdown vs. page-window restore dock).

**Acceptance:** One window implementation, three uncompromised visual identities.

---

### Phase 5 — Content definitions as the single source of truth

**Purpose:** Stop editor controls, validation, component rules and rendering from drifting apart.

**Work**
- Make the 18 block definitions the authoritative schema source.
- Derive: Tina fields, Studio controls, validator rules, renderer registration and template allowances from those definitions.
- Resolve the current "site-header / album-player / spotify-embed are singleton" rules into one place.

**Acceptance:** Adding a block's field once makes it appear in Studio, validate in the build and render in the page.

---

### Phase 6 — Solidify the CMS authoring path

**Purpose:** Fulfil Goal 1 properly.

**Work**
- Confirm exactly how Studio talks to Tina (custom client on Tina's Git-backed API, or custom fields inside Tina's admin) — **decision required before implementation**.
- Ensure `/studio/` is the friendly default entry point; Tina remains the engine, not a rival editor.
- Improve Studio toward the intended direction: contextual editing, asset management, live preview, direct block selection, responsive preview, undo/recovery, save state, publishing controls.
- Keep the Git → Actions → subdomain chain explicit and observable.

**Acceptance:** Jesse can change any piece of content through Studio alone and see it published, without touching HTML.

---

### Phase 7 — Block library completeness and cross-page reuse

**Purpose:** Make Goal 2 real in day-to-day use.

**Work**
- Audit all 18 blocks: are they genuinely portable across all templates they claim to support?
- Fix template allowance lists where a block is artificially restricted.
- Test the key scenario: add a homepage marquee to a newly created page in Studio.
- Document each block with a plain-English "what it is / what it needs / where it works" entry.

**Acceptance:** A new page can be assembled from existing blocks with zero code changes.

---

### Phase 8 — Integration, QA and production readiness

**Purpose:** Land the work safely.

**Work**
- Validate content, run tests, build with `--require-media`.
- Regression-check all three visual identities on the real domain.
- Re-run the Firefox comparison with the real profile.
- Update `WORK_LOG.md` and this roadmap; append significant milestones to the archive if needed.

**Acceptance:** Public site behaves the same or better; authoring is demonstrably easier; handover docs are current.

---

## 5. Open decisions (need Jesse's call)

| # | Decision | Why it matters | Current leaning |
|---|---|---|---|
| D1 | Studio as custom client on top of Tina's backend vs. custom fields inside Tina's admin | Shapes all of Phase 6 | Custom client, per Jesse — needs technical confirmation |
| D2 | Which checkout becomes the long-term working home | Avoids three-way drift | Leave as-is until Phase 4; do not merge now |
| D3 | Are subtle visual polish changes allowed during optimisation? | Phase 2 guardrails | Preserve identity; no redesign |
| D4 | What counts as "done" for revitalisation | Phase 8 acceptance | agreed in Phase 8 kickoff |

## 6. Definition of done, overall

The project is done when:

1. Jesse can publish any content change through Studio without editing code.
2. A new album can be assembled from existing blocks in an afternoon.
3. The Early Bird page is as responsive as the homepage.
4. Vista, Early Bird and Editorial still look unmistakably themselves.
5. The handover docs are accurate and the next action is obvious.

## 7. Maintenance

- Update `WORK_LOG.md` after every completed objective: Finished / Current / Next.
- Update `WORK_LOG.md` when the current objective or next action changes.
- Append significant discoveries and decisions to this roadmap or the `archive/` log rather than starting a competing status file.

---

## 8. The mud-hut analogy **[Jesse, 2026-11-22 — appended]**

> Imagine the website as a little clearing in the woods.
>
> The homepage and The Early Bird are two incredibly sturdy mud huts. They have been lived in. They hold real history. They work — and nobody is suggesting they be knocked down.
>
> We have just discovered concrete and rebar. That is the pool of eighteen building blocks.
>
> It is not enough to build shiny new buildings out of concrete while the original huts stay mud. That would leave us with two different kinds of building and no way to move a room from one to the other.
>
> The whole point is to **refurbish both mud huts into the same material**. Then — and only then — any room from any building can be lifted out and dropped into another at the press of a button. The huts are not the enemy; they are the reason the material has to be good enough to carry real history.
>
> Studio is the front desk where you choose which rooms go where. It only makes sense once the buildings are made of the same stuff.

**Consequence for this roadmap:** Phases 3–5 (shared foundations, single-source definitions, block portability) are the mud-hut refurbishment. Phase 6 (Studio as a real Tina client) comes **after** them. This is Jesse's explicit ordering correction, dated 2026-11-22, and it overrides any earlier phrasing that implied Studio came first.
- Never let a new assistant guess what we were doing — that is what these files are for.
